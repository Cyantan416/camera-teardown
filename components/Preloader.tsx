'use client';

import { useEffect, useRef, useState } from 'react';
import { UI } from '@/lib/i18n';
import { useLang } from './LangProvider';

// 首屏要等两件事：字体加载完（拆字动画要靠它算位置）和 Canvas 画出第一帧。
// 计数条是这两件事的真实闸门，不是纯装饰的假进度
const MIN_MS = 900;

export default function Preloader() {
  const { lang } = useLang();
  const [gone, setGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let ready = false;
    let value = 0;
    const started = performance.now();

    const onScene = () => {
      ready = true;
    };
    window.addEventListener('scene-ready', onScene, { once: true });

    let fonts = false;
    document.fonts.ready.then(() => {
      fonts = true;
    });

    const loop = () => {
      const done = ready && fonts && performance.now() - started > MIN_MS;
      // 没就绪前最多爬到 92，避免出现"100% 了还卡着"
      const target = done ? 100 : 92;
      // 就绪后加快收尾，否则渐近逼近 100 会白等半秒多
      value += reduced ? target - value : (target - value) * (done ? 0.18 : 0.09);

      if (barRef.current) barRef.current.style.transform = `scaleX(${value / 100})`;
      if (numRef.current) numRef.current.textContent = String(Math.round(value)).padStart(3, '0');

      if (done && value > 99.3) {
        if (numRef.current) numRef.current.textContent = '100';
        if (barRef.current) barRef.current.style.transform = 'scaleX(1)';
        const el = rootRef.current;
        if (el) {
          if (reduced) {
            el.style.transition = 'opacity 0.2s linear';
            el.style.opacity = '0';
          } else {
            el.style.transition =
              'transform 0.85s cubic-bezier(0.76,0,0.24,1), opacity 0.5s ease 0.35s';
            el.style.transform = 'translateY(-100%)';
            el.style.opacity = '0';
          }
        }
        window.setTimeout(() => setGone(true), reduced ? 240 : 950);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scene-ready', onScene);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[70] flex flex-col justify-between bg-[var(--backdrop)] px-6 py-10 sm:px-10 lg:px-16"
    >
      <p className="flex items-center gap-2.5 font-mono text-[0.68rem] tracking-[0.18em] text-[#14181C] uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-[#9A6A26]" />
        {UI[lang].wordmark}
      </p>

      <div className="flex items-end justify-between gap-8">
        <p className="max-w-[24ch] font-display text-[1.5rem] leading-[1.15] font-semibold tracking-[-0.01em] text-[#14181C] sm:text-[2.2rem]">
          {UI[lang].loading}
        </p>
        <span
          ref={numRef}
          className="font-mono text-[2rem] tabular-nums text-[#14181C] sm:text-[3rem]"
        >
          000
        </span>
      </div>

      <div className="h-px w-full bg-[#14181C]/12">
        <div
          ref={barRef}
          className="h-px w-full origin-left bg-[#9A6A26]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </div>
  );
}
