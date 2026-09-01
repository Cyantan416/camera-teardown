'use client';

import { useEffect } from 'react';

// 圆点跟手，外环滞后 —— 两层速度差是这类光标"活"的关键
export default function Cursor() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot = document.querySelector<HTMLElement>('[data-cursor-dot]');
    const ring = document.querySelector<HTMLElement>('[data-cursor-ring]');
    if (!dot || !ring) return;

    document.documentElement.classList.add('has-cursor');

    let x = innerWidth / 2, y = innerHeight / 2;
    let rx = x, ry = y, scale = 1, target = 1;
    let raf = 0;
    let seen = false;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!seen) {
        seen = true;
        rx = x;
        ry = y;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
      // target 不一定是 Element（在 window 上派发的 pointermove 就是 window），
      // 直接调 closest 会每次移动都抛错
      const el = e.target;
      target =
        el instanceof Element && el.closest('button,a,[data-rail-tick]') ? 1.8 : 1;
    };

    const down = () => { target *= 0.72; };
    const up = () => { target = target < 1.3 ? 1 : 1.8; };

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      scale += (target - scale) * 0.14;
      dot.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0) translate(-50%,-50%) scale(${scale.toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    raf = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <span
        data-cursor-dot
        className="pointer-events-none fixed top-0 left-0 z-[60] hidden h-[6px] w-[6px] rounded-full bg-[#9A6A26] opacity-0 lg:block"
      />
      <span
        data-cursor-ring
        className="pointer-events-none fixed top-0 left-0 z-[60] hidden h-8 w-8 rounded-full border border-[#14181C]/35 opacity-0 lg:block"
      />
    </>
  );
}
