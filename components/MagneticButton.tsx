'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// 光标进入半径内就被"吸"过去一点。位移每帧直接写 transform，不进 state
const RADIUS = 130;
const PULL = 0.32;

export default function MagneticButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 触屏没有悬停，这个效果没有意义
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < RADIUS) {
        tx = dx * PULL;
        ty = dy * PULL;
      } else {
        tx = 0;
        ty = 0;
      }
    };

    const loop = () => {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      el.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`pointer-events-auto rounded-full border border-[#14181C]/25 px-7 py-3 font-mono text-[0.7rem] tracking-[0.16em] text-[#14181C] uppercase transition-colors duration-300 hover:border-[#9A6A26] hover:text-[#8A5A16] ${className}`}
    >
      {children}
    </button>
  );
}
