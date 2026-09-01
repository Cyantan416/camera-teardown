'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTS } from '@/lib/parts';
import { PRESETS } from '@/lib/material';
import { view, clamp, lerp, smoothstep } from '@/lib/state';
import { MARKS } from '@/lib/annotations';
import {
  makeApertureScale,
  makeDistanceScale,
  makeNamePlate,
  makeDecalMaterial,
} from '@/lib/decals';

// 半透明面板给固定的绘制次序（后→前）。交给 three 每帧按距离重排的话，
// 相机一动排序就翻转，整片面板会闪。
const PANEL_ORDER: Record<string, number> = {
  'rear-shell': 1,
  'base-plate': 2,
  'top-plate': 3,
  'side-left': 4,
  'side-right': 5,
  leatherette: 6,
  'front-shell': 7,
};

function ease(t: number) {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

export default function CameraModel() {
  const parts = useMemo(
    () =>
      PARTS.map((p, i) => ({
        def: p,
        geometry: p.build(),
        phase: (i * 2.399) % (Math.PI * 2),
        baseRot: p.rotation ?? ([0, 0, 0] as [number, number, number]),
      })),
    []
  );

  // 刻度纹理在客户端运行时用 Canvas 画，SSR 阶段不会执行
  const decals = useMemo(
    () => ({
      aperture: makeDecalMaterial(makeApertureScale()),
      distance: makeDecalMaterial(makeDistanceScale()),
      name: makeDecalMaterial(makeNamePlate()),
    }),
    []
  );

  const refs = useRef<(THREE.Mesh | null)[]>([]);
  // 材质初始是半透明的，这里必须初始化成 false，否则第一帧不会切成实心
  const solid = useRef(false);

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // 用「实际还散着多少」判断，不能用 apart —— 它在滚动后段一直是 1，
    // 会导致零件全部归位了外壳还是透明的
    const e = view.explode;
    const spread = Math.max(e.optics, e.barrel, e.mechanism, e.body);
    // 迟滞：没有这条的话 spread 在阈值附近来回跨越，
    // 每帧都会 needsUpdate 触发 shader 重编译，重编译那几帧画面是空的
    const wantSolid = solid.current ? spread < 0.14 : spread < 0.08;

    const m = PRESETS.panel;
    if (wantSolid !== solid.current) {
      solid.current = wantSolid;
      m.transparent = !wantSolid;
      m.depthWrite = wantSolid;
      m.needsUpdate = true;
    }
    m.uniforms.uOpacity.value = wantSolid ? 1 : lerp(1, 0.42, smoothstep(0.1, 0.5, spread));

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < parts.length; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      const { def, phase, baseRot } = parts[i];

      // 每组的散开量来自 apart × (1 − home)，再按零件自己的 delay 错开
      const spread = clamp((view.explode[def.group] - def.delay * 0.35) / 0.65, 0, 1);
      const t = ease(spread) * view.scale;

      // 漂移幅度跟"当前散开了多少"成正比：装回去的零件完全静止
      const drift = reduced ? 0 : t;
      // 齿状零件在拆解时绕自身轴顺时针转，各自转速不同
      const spin = reduced || !def.spin ? 0 : def.spin * time * spread;

      mesh.position.set(
        def.position[0] + def.explode[0] * t + Math.sin(time * 0.61 + phase) * 0.026 * drift,
        def.position[1] + def.explode[1] * t + Math.cos(time * 0.47 + phase) * 0.022 * drift,
        def.position[2] + def.explode[2] * t + Math.sin(time * 0.39 + phase * 1.7) * 0.018 * drift
      );

      mesh.rotation.set(
        baseRot[0] + Math.sin(time * 0.33 + phase) * 0.06 * drift,
        baseRot[1] + Math.cos(time * 0.29 + phase) * 0.08 * drift,
        baseRot[2] + spin + Math.sin(time * 0.41 + phase * 0.6) * 0.05 * drift
      );

      // 标注只认这十二个零件，其余的 MARKS 里没有键，直接跳过
      MARKS[def.id]?.copy(mesh.position);

      const q = mesh.position;
      if (q.x < minX) minX = q.x;
      if (q.y < minY) minY = q.y;
      if (q.z < minZ) minZ = q.z;
      if (q.x > maxX) maxX = q.x;
      if (q.y > maxY) maxY = q.y;
      if (q.z > maxZ) maxZ = q.z;
    }

    // 零件群的包围盒 —— 用球去框细长的零件链会把大量空白也算进去
    const b = view.bounds;
    b.x = (minX + maxX) / 2;
    b.y = (minY + maxY) / 2;
    b.z = (minZ + maxZ) / 2;
    b.hw = (maxX - minX) / 2;
    b.hh = (maxY - minY) / 2;
    b.hd = (maxZ - minZ) / 2;
  });

  return (
    <group name="cameraRoot">
      {parts.map(({ def, geometry }, i) => (
        <mesh
          key={def.id}
          name={def.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={geometry}
          material={def.decal ? decals[def.decal] : PRESETS[def.finish]}
          renderOrder={
            def.decal
              ? 20
              : def.finish === 'glass'
                ? 30
                : (PANEL_ORDER[def.id] ?? 0)
          }
          position={def.position}
          rotation={def.rotation ?? [0, 0, 0]}
        />
      ))}
    </group>
  );
}
