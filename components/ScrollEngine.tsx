'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { SECTIONS, getSections } from '@/lib/content';
import { i18n, LANG_EVENT } from '@/lib/i18n';
import { registerJump } from '@/lib/scroll';
import {
  view,
  applySectionScroll,
  damp,
  clamp,
  smoothstep,
  SECTION_COUNT,
  SECTION_VH,
  EXPLODE_SCALE,
} from '@/lib/state';

// 没有任何画面输出：每帧读滚动、更新 view、直接写 DOM，全程不碰 React state
export default function ScrollEngine() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    view.scale = parseFloat(q.get('scale') ?? '') || EXPLODE_SCALE;
    view.fit = parseFloat(q.get('fit') ?? '') || 1;
    const debugging = q.get('debug') === '1';
    // ?at=1.5 把滚动进度定格在某一点，页面不动也能看到该状态
    const at = q.get('at');
    const pinned = at !== null && at !== '' ? parseFloat(at) : null;

    const bar = document.querySelector<HTMLElement>('[data-progress]');
    const rail = document.querySelector<HTMLElement>('[data-rail]');
    const footer = document.querySelector<HTMLElement>('footer');
    // footer 在文档里的绝对位置，尺寸变了才重算
    let footerY = 0;
    const measure = () => {
      footerY = footer ? footer.getBoundingClientRect().top + window.scrollY : Infinity;
    };
    measure();
    window.addEventListener('resize', measure);
    const railFill = document.querySelector<HTMLElement>('[data-rail-fill]');
    const ticks = Array.from(document.querySelectorAll<HTMLElement>('[data-rail-tick]'));
    const navIndex = document.querySelector<HTMLElement>('[data-nav-index]');
    const navLabel = document.querySelector<HTMLElement>('[data-nav-label]');
    const hint = document.querySelector<HTMLElement>('[data-hint]');
    const total = String(SECTIONS.length).padStart(2, '0');
    const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-panel]'));
    let lastSection = -1;

    let panel: HTMLPreElement | null = null;
    if (debugging) {
      panel = document.createElement('pre');
      panel.dataset.debug = '';
      panel.style.cssText =
        'position:fixed;left:16px;bottom:16px;z-index:40;margin:0;padding:12px 14px;' +
        'font:11px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;color:#C7D0D6;' +
        'background:rgba(8,11,13,.82);border:1px solid #262E33;border-radius:4px;' +
        'white-space:pre;pointer-events:none';
      document.body.appendChild(panel);
    }

    const writeDom = () => {
      if (bar) bar.style.transform = `scaleX(${view.progress})`;
      if (railFill) railFill.style.transform = `scaleY(${view.progress})`;

      // footer 压上来就收走 rail —— 它会横穿 footer 右侧那两列文字。
      // 不能拿 raw 当判据：页面滚到底 raw 也只到 6.8，按段数算的阈值根本够不着
      if (rail) {
        const vh = window.innerHeight;
        const top = footerY - curScroll;
        const vis = smoothstep(vh * 0.5, vh * 0.85, top);
        rail.style.opacity = vis.toFixed(3);
        rail.style.visibility = vis < 0.02 ? 'hidden' : 'visible';
      }
      // 提示只在首屏有意义，滚过去就淡掉
      if (hint) hint.style.opacity = String(1 - clamp(view.raw / 0.4, 0, 1));

      // 面板绑的是「退场」不是「进场」：首屏在滚动位置 0 就完整可见
      for (let i = 0; i < panels.length; i++) {
        const local = view.raw - i;
        const hide = local < 0 ? clamp(-local / 0.2, 0, 1) : smoothstep(0.5, 1, local);
        const el = panels[i];
        el.style.opacity = String(1 - hide);
        el.style.transform = `translate3d(0,${(-hide * 42).toFixed(1)}px,0)`;
        el.style.filter = hide > 0.01 ? `blur(${(hide * 9).toFixed(1)}px)` : 'none';
        el.style.visibility = hide > 0.995 ? 'hidden' : 'visible';
      }

      if (view.section !== lastSection) {
        lastSection = view.section;
        // 章节没变就不写：textContent 每帧赋值会让浏览器反复重排
        if (navIndex) {
          navIndex.textContent = `${String(view.section + 1).padStart(2, '0')} / ${total}`;
        }
        if (navLabel) navLabel.textContent = getSections(i18n.lang)[view.section]?.nav ?? '';
        for (let i = 0; i < ticks.length; i++) {
          ticks[i].dataset.on = i === view.section ? '1' : '0';
        }
        window.dispatchEvent(
          new CustomEvent('section-active', { detail: { index: view.section } })
        );
      }
      if (panel) {
        const e = view.explode;
        panel.textContent =
          `FPS ${view.fps.toFixed(0)}   dpr ${view.dpr.toFixed(2)}   tier ${view.tier}\n` +
          `raw ${view.raw.toFixed(3)}   section ${view.section}   progress ${view.progress.toFixed(3)}\n` +
          `apart ${view.apart.toFixed(3)}   scale ${view.scale.toFixed(2)}   vel ${view.velocity.toFixed(2)}\n` +
          `optics ${e.optics.toFixed(3)}   barrel ${e.barrel.toFixed(3)}\n` +
          `mechanism ${e.mechanism.toFixed(3)}   body ${e.body.toFixed(3)}`;
      }
    };

    const onPointer = (ev: PointerEvent) => {
      view.pointer.x = (ev.clientX / window.innerWidth) * 2 - 1;
      view.pointer.y = -((ev.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    // 读数只在换段时才写，切语言不换段，得手动逼它重写一次
    const onLang = () => {
      lastSection = -1;
    };
    window.addEventListener(LANG_EVENT, onLang);

    let last = performance.now();
    let prevRaw = 0;
    let curScroll = 0;

    const update = (now: number, scrollY: number) => {
      const dt = clamp((now - last) / 1000, 0.0001, 0.1);
      last = now;

      curScroll = scrollY;
      const raw = pinned ?? scrollY / (window.innerHeight * SECTION_VH);
      view.velocity = (raw - prevRaw) / dt;
      prevRaw = raw;

      applySectionScroll(raw);
      view.pointer.ex = damp(view.pointer.ex, view.pointer.x, 6, dt);
      view.pointer.ey = damp(view.pointer.ey, view.pointer.y, 6, dt);
      writeDom();
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      registerJump((t) => window.scrollTo({ top: t, behavior: 'auto' }));
      const onScroll = () => update(performance.now(), window.scrollY);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => {
        registerJump(null);
        window.removeEventListener(LANG_EVENT, onLang);
        window.removeEventListener('resize', measure);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onPointer);
        panel?.remove();
      };
    }

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    registerJump((t) => lenis.scrollTo(t, { duration: 1.1 }));
    if (debugging) {
      Object.assign(window, { __lenis: lenis, __view: view });
    }
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      update(t, lenis.scroll);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      registerJump(null);
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener(LANG_EVENT, onLang);
      window.removeEventListener('resize', measure);
      panel?.remove();
    };
  }, []);

  return null;
}
