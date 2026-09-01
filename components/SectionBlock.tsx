'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { Section } from '@/lib/content';
import { SECTION_VH, view } from '@/lib/state';

gsap.registerPlugin(SplitText);

const JUSTIFY: Record<Section['layout'], string> = {
  left: 'justify-start',
  right: 'lg:justify-end',
  flank: 'lg:justify-center',
};

// 文字后面用径向渐变把背景压暗，而不是盖一整块黑板
const SCRIM =
  'before:pointer-events-none before:absolute before:-inset-x-8 before:-inset-y-10 before:-z-10 ' +
  'before:bg-[radial-gradient(120%_100%_at_50%_100%,rgba(230,233,236,0.94),rgba(230,233,236,0.68)_45%,transparent_78%)] ' +
  'lg:before:bg-[radial-gradient(100%_120%_at_20%_50%,rgba(230,233,236,0.92),rgba(230,233,236,0.6)_48%,transparent_80%)]';

export default function SectionBlock({ section, index }: { section: Section; index: number }) {
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const restRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // hero 首屏必须一开始就完整可见，所以它不参与入场
    if (index === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let split: SplitText | null = null;
    let cancelled = false;
    // 上一次进场留下的动画必须先杀掉。否则来回滚动时新旧两条 tween
    // 会同时往同一个 <dt> 写数字，旧的抢先写完就看不到计数过程了
    let tl: gsap.core.Timeline | null = null;
    let counts: gsap.core.Tween[] = [];

    const counters = () =>
      Array.from(restRef.current?.querySelectorAll<HTMLElement>('[data-count]') ?? []);

    const hide = () => {
      if (!split) return;
      tl?.kill();
      counts.forEach((t) => t.kill());
      counts = [];
      gsap.set(split.chars, { opacity: 0, yPercent: 70, rotateX: -55, filter: 'blur(5px)' });
      if (eyebrowRef.current) gsap.set(eyebrowRef.current, { opacity: 0, y: 10 });
      if (restRef.current) gsap.set(restRef.current.children, { opacity: 0, y: 20 });
      counters().forEach((el) => {
        el.textContent = '0';
      });
    };

    const countUp = () => {
      counters().forEach((el, i) => {
        const target = Number(el.dataset.count);
        if (!Number.isFinite(target)) return;
        const box = { v: 0 };
        counts.push(
          gsap.to(box, {
            v: target,
            duration: 1.55,
            delay: 0.6 + i * 0.12,
            ease: 'power2.out',
            overwrite: true,
            onUpdate: () => {
              el.textContent = String(Math.round(box.v));
            },
          })
        );
      });
    };

    const play = () => {
      if (!split) return;
      // 每次进入都从头演一遍，上下滚都能看到
      hide();

      tl = gsap
        .timeline()
        .to(eyebrowRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power2.out',
        })
        .to(
          split.chars,
          {
            opacity: 1,
            yPercent: 0,
            rotateX: 0,
            filter: 'blur(0px)',
            duration: 0.9,
            stagger: 0.022,
            ease: 'power3.out',
          },
          '-=0.32'
        )
        .to(
          restRef.current?.children ?? [],
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.09,
            ease: 'power2.out',
          },
          '-=0.6'
        );

      countUp();
    };

    const onActive = (e: Event) => {
      const detail = (e as CustomEvent<{ index: number }>).detail;
      if (detail.index === index) play();
    };

    const setup = async () => {
      // 字体没加载完就拆字，字符位置会算错
      await document.fonts.ready;
      if (cancelled || !titleRef.current) return;

      split = new SplitText(titleRef.current, { type: 'chars' });

      // 先藏好再等进场 —— 用 gsap.from 会先闪一下完整文字
      hide();

      // 拆好时若已经停在这一段，立刻补播
      if (view.section === index) play();
    };

    setup();
    window.addEventListener('section-active', onActive);

    return () => {
      cancelled = true;
      window.removeEventListener('section-active', onActive);
      tl?.kill();
      counts.forEach((t) => t.kill());
      // 还原文本节点，屏幕阅读器才读得到完整句子
      split?.revert();
    };
  }, [index]);

  const centered = section.layout === 'flank';

  return (
    <section id={section.id} className="relative" style={{ height: `${SECTION_VH * 100}vh` }}>
      <div className="pointer-events-none sticky top-0 h-[100svh] w-full">
        <div
          className={`mx-auto flex h-full max-w-[1500px] items-end px-6 pb-24 sm:px-10 sm:pb-28 lg:items-center lg:px-16 lg:pb-0 ${JUSTIFY[section.layout]}`}
        >
          <div
            data-panel={index}
            className={`relative w-full lg:w-[47%] xl:w-[42%] ${SCRIM} ${
              centered ? 'lg:text-center' : ''
            }`}
          >
            <p
              ref={eyebrowRef}
              className="font-mono text-[0.68rem] tracking-[0.2em] text-[#8A5A16] uppercase sm:text-xs"
            >
              {section.eyebrow}
            </p>

            <h2
              ref={titleRef}
              className="mt-4 font-display text-[2.1rem] leading-[1.06] font-semibold tracking-[-0.02em] text-[#14181C] [perspective:700px] sm:text-[2.8rem] lg:text-[3.4rem]"
            >
              {section.title.map((line, li) => (
                <span key={li} className="block">
                  {line}
                </span>
              ))}
            </h2>

            <div ref={restRef}>
              <p
                className={`mt-5 max-w-[46ch] text-[0.95rem] leading-[1.75] text-[#414A53] sm:text-base ${
                  centered ? 'lg:mx-auto' : ''
                }`}
              >
                {section.body}
              </p>

              {section.note && (
                <p
                  className={`mt-3 max-w-[42ch] text-sm leading-[1.7] text-[#6A757E] ${
                    centered ? 'lg:mx-auto' : ''
                  }`}
                >
                  {section.note}
                </p>
              )}

              {section.stats && (
                <dl
                  className={`mt-8 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4 sm:gap-x-4 ${
                    centered ? 'lg:justify-items-center' : ''
                  }`}
                >
                  {section.stats.map(([value, label]) => (
                    <div key={label}>
                      <dt
                        data-count={value}
                        className="font-display text-2xl font-semibold tabular-nums text-[#1B2026] sm:text-[1.7rem]"
                      >
                        {value}
                      </dt>
                      <dd className="mt-1 font-mono text-[0.62rem] tracking-[0.14em] text-[#6A757E] uppercase">
                        {label}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
