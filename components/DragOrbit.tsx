'use client';

import { useEffect } from 'react';
import { view, clamp } from '@/lib/state';

// 拖动叠加在滚动镜头之上：滚动决定机位，拖动让人自己转着看
export default function DragOrbit() {
  useEffect(() => {
    let last: { x: number; y: number } | null = null;

    const el = document.querySelector<HTMLElement>('[data-orbit]') ?? document.body;

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      last = { x: e.clientX, y: e.clientY };
      view.drag.active = true;
      el.style.cursor = 'grabbing';
    };

    const move = (e: PointerEvent) => {
      if (!last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      // 横向拖过半个屏幕 ≈ 转 180 度
      view.drag.yaw -= (dx / window.innerWidth) * Math.PI * 2;
      view.drag.pitch = clamp(view.drag.pitch - (dy / window.innerHeight) * Math.PI, -1.1, 1.1);
    };

    const up = () => {
      last = null;
      view.drag.active = false;
      el.style.cursor = '';
    };

    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);

    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  return null;
}
