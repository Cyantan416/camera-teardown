'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ANNO_LIST, MARKS, LEADER, SVG_H, LABEL_GAP } from '@/lib/annotations';
import { view, clamp, damp, smoothstep } from '@/lib/state';

interface Slot {
  el: HTMLElement | null;
  dot: HTMLElement | null;
  line: SVGPolylineElement | null;
  text: HTMLElement | null;
  t: number; // 停留在「该显示」状态的秒数，入场进度由它推算
  ly: number; // 平滑后的标签纵坐标
  live: boolean; // 上一帧是否已经在场，用来决定新出现时该不该直接就位
}

const MID = SVG_H / 2;
// 单个标签走完一轮的秒数
const DUR = 1;
// 同一段里三个标签依次起跑，顺序更明显
const STAGGER = 0.14;
// 排开后的纵坐标追随速度。相机一转，标签之间的上下顺序可能整个对调，
// 直接写就是硬跳，这里让它滑过去
const FOLLOW = 8;
// 三段动作首尾相接、留一点间隙 —— 叠在一起跑就看不出先后了
const DOT: [number, number] = [0, 0.26];
const LINE: [number, number] = [0.3, 0.72];
const TEXT: [number, number] = [0.76, 1];

export default function AnnotationProjector() {
  const { size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const slots = useRef<Record<string, Slot> | null>(null);
  const panelBox = useRef<DOMRect | null>(null);
  const boxKey = useRef('');
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  // 每帧复用，避免在渲染循环里反复分配
  const live = useMemo(
    () => ANNO_LIST.map((a) => ({ a, x: 0, y: 0, ly: 0, gate: 0 })),
    []
  );

  useFrame((state, delta) => {
    // 标注层在 lg 以下是 display:none。投影、排开、写 DOM 全都白做，
    // 而手机和平板恰恰是最吃不消这份开销的
    if (size.width < 1024) return;

    if (!slots.current) {
      slots.current = Object.fromEntries(
        ANNO_LIST.map((a) => {
          const el = document.querySelector<HTMLElement>(`[data-anno="${a.id}"]`);
          return [
            a.id,
            {
              el,
              dot: el?.querySelector<HTMLElement>('[data-anno-dot]') ?? null,
              line: el?.querySelector<SVGPolylineElement>('[data-anno-line]') ?? null,
              text: el?.querySelector<HTMLElement>('[data-anno-text]') ?? null,
              t: 0,
              ly: 0,
              live: false,
            },
          ];
        })
      );
    }

    const key = `${view.section}:${size.width}:${size.height}`;
    if (key !== boxKey.current) {
      boxKey.current = key;
      const p = document.querySelector<HTMLElement>(`[data-panel="${view.section}"]`);
      panelBox.current = p ? p.getBoundingClientRect() : null;
    }

    // 1) 先算每个标签的锚点和可见度
    for (const it of live) {
      const a = it.a;
      const local = view.raw - a.section;
      let gate = smoothstep(0.02, 0.15, local) * (1 - smoothstep(0.7, 0.95, local));

      if (gate > 0.001) {
        v.copy(MARKS[a.id]).project(state.camera);
        if (v.z > 1) {
          gate = 0;
        } else {
          it.x = (v.x * 0.5 + 0.5) * size.width;
          it.y = (-v.y * 0.5 + 0.5) * size.height;
          gate *= clamp(Math.min(it.x, size.width - it.x) / 80, 0, 1);
          gate *= clamp(Math.min(it.y, size.height - it.y) / 50, 0, 1);
        }
      }
      it.gate = gate;
      it.ly = it.y;
    }

    // 2) 同侧的标签按 y 排开，强制最小间距。
    // 固定槽位不行：偏移是相对各自锚点的，锚点一拉开就又叠上了
    for (const side of [true, false]) {
      const row = live
        .filter((it) => it.gate > 0.001 && it.a.right === side)
        .sort((m, n) => m.y - n.y);
      for (let i = 1; i < row.length; i++) {
        const gap = row[i].ly - row[i - 1].ly;
        if (gap < LABEL_GAP) row[i].ly = row[i - 1].ly + LABEL_GAP;
      }
      // 整组推下去后可能顶出屏幕，再整体抬回来
      const last = row[row.length - 1];
      if (last && last.ly > size.height - 40) {
        const shift = last.ly - (size.height - 40);
        for (const it of row) it.ly -= shift;
      }
    }

    // 3) 写 DOM
    for (const it of live) {
      const s = slots.current[it.a.id];
      if (!s.el) continue;
      let gate = it.gate;

      // 刚出现的直接就位，否则会从上一次的旧位置横穿半个屏幕滑过来
      if (!s.live || reduced) s.ly = it.ly;
      else s.ly = damp(s.ly, it.ly, FOLLOW, delta);
      const dy = s.ly - it.y;

      // 压到文字面板上就让路 —— 用文字的最终落点判断，不是圆点
      const r = panelBox.current;
      if (gate > 0.001 && r) {
        const tx = it.x + it.a.dx;
        const into = Math.min(
          tx - (r.left - 30),
          r.right + 30 - tx,
          s.ly - (r.top - 16),
          r.bottom + 16 - s.ly
        );
        if (into > 0) gate *= 1 - clamp(into / 50, 0, 1);
      }

      // 入场：圆点缩放 → 引线沿路径画出 → 文字浮现。
      // 用「停留秒数」推进度，滚回去会原路倒放
      const shown = gate > 0.35;
      s.t = clamp(s.t + (shown ? delta : -delta), 0, DUR + STAGGER * 3);
      // 关掉动效时标签照常显示，只是不演那三段
      const p = reduced ? (shown ? 1 : 0) : clamp((s.t - it.a.order * STAGGER) / DUR, 0, 1);

      const op = gate.toFixed(3);
      if (s.el.style.opacity !== op) s.el.style.opacity = op;
      if (gate < 0.001 && s.t <= 0) {
        s.live = false;
        continue;
      }
      s.live = true;

      s.el.style.transform = `translate3d(${it.x.toFixed(1)}px,${it.y.toFixed(1)}px,0)`;

      if (s.dot) {
        const k = smoothstep(DOT[0], DOT[1], p);
        s.dot.style.transform = `translate(-50%,-50%) scale(${(k * (1.35 - 0.35 * k)).toFixed(3)})`;
      }

      if (s.line) {
        const el = LEADER * 0.62;
        const pts = it.a.right
          ? `0,${MID} ${el},${MID + dy} ${LEADER},${MID + dy}`
          : `${LEADER},${MID} ${LEADER - el},${MID + dy} 0,${MID + dy}`;
        s.line.setAttribute('points', pts);
        const len = Math.hypot(el, dy) + (LEADER - el);
        const draw = smoothstep(LINE[0], LINE[1], p);
        s.line.style.strokeDasharray = `${len}`;
        s.line.style.strokeDashoffset = `${(len * (1 - draw)).toFixed(1)}`;
      }

      if (s.text) {
        const t = smoothstep(TEXT[0], TEXT[1], p);
        s.text.style.top = `${dy.toFixed(1)}px`;
        s.text.style.opacity = t.toFixed(3);
        const slide = (1 - t) * 10 * (it.a.right ? -1 : 1);
        s.text.style.transform = `translate(${slide.toFixed(1)}px,-50%)`;
      }
    }
  });

  return null;
}
