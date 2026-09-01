'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { view, clamp, smoothstep, damp, lerp, SECTION_COUNT } from '@/lib/state';
import { SECTIONS } from '@/lib/content';

interface Frame {
  position: [number, number, number];
  // 看向哪里 —— 用物体自己的局部坐标，"看向镜片组"就直接写镜片组的坐标
  focus: [number, number, number];
  roll: number;
  // 聚焦段用长焦：退到零件云外面，靠窄视角把主体拉大，而不是把相机怼进去
  fov?: number;
}

export const FRAMES: Frame[] = [
  // 0 hero：整机 3/4 视角
  { position: [1.45, 0.82, 2.7], focus: [0, 0, 0.12], roll: 0 },
  // 1 拆解总览：零件沿光轴排开 3.6 个单位，只有侧看才展得开
  { position: [4.95, 1.15, 0.62], focus: [0, 0.03, 0.61], roll: -0.02 },
  // 2 光学：贴近镜片组，从右后方切入避开前方散着的镜筒件
  { position: [2.79, 0.36, -1.13], focus: [0, 0, 0.38], roll: 0.035, fov: 17 },
  // 3 镜筒：镜头已成形，右前方近距离看滚花与刻度
  { position: [2.71, 0.57, 2.22], focus: [0, 0, 0.42], roll: -0.025, fov: 18 },
  // 4 机构：低角度仰看机身内部
  { position: [2.51, -1.37, 1.74], focus: [0, -0.05, 0.05], roll: 0.03 },
  // 5 机身：左上方俯看，机身壳正在归位
  { position: [-2.05, 1.38, 2.3], focus: [0, 0.03, 0.15], roll: -0.035 },
  // 6 收尾：回正略远，整机
  { position: [0.5, 0.46, 3.15], focus: [0, 0.02, 0.16], roll: 0 },
];

// 每段前 15% 镜头保持不动，让文字先落定再运镜
const HOLD = 0.15;

// 文字在左就把物体推到右，反之亦然 —— 两者绝不重叠
const SHIFT = SECTIONS.map((s) => (s.layout === 'left' ? 1 : s.layout === 'right' ? -1 : 0));
const UP = new THREE.Vector3(0, 1, 0);

export default function CameraRig() {
  const { camera, size } = useThree();

  const frames = useMemo(
    () =>
      FRAMES.map((f) => ({
        position: new THREE.Vector3(...f.position),
        focus: new THREE.Vector3(...f.focus),
        fov: f.fov ?? 35,
        roll: f.roll,
      })),
    []
  );

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // 起手略远，靠 damp 推近，配合淡入形成入场
  const pos = useRef(new THREE.Vector3().copy(frames[0].position).multiplyScalar(1.28));
  const focus = useRef(new THREE.Vector3().copy(frames[0].focus));
  const roll = useRef(0);
  const target = useRef(new THREE.Vector3());
  const targetFocus = useRef(new THREE.Vector3());
  const orbit = useRef(new THREE.Vector3());
  const sph = useRef(new THREE.Spherical());
  const fwd = useRef(new THREE.Vector3());
  const side = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    if (typeof window !== 'undefined' && new URLSearchParams(location.search).get('debug') === '1') {
      (window as unknown as { __cam?: THREE.Camera }).__cam = camera;
    }
    const dragging = view.drag.yaw !== 0 || view.drag.pitch !== 0;

    const raw = clamp(view.raw, 0, SECTION_COUNT - 1);
    const i = Math.min(Math.floor(raw), frames.length - 1);
    const next = frames[Math.min(i + 1, frames.length - 1)];
    const cur = frames[i];

    const t = smoothstep(HOLD, 1, raw - Math.floor(raw));

    target.current.lerpVectors(cur.position, next.position, t);
    targetFocus.current.lerpVectors(cur.focus, next.focus, t);
    const targetRoll = cur.roll + (next.roll - cur.roll) * t;
    const targetFov = dragging ? 35 : cur.fov + (next.fov - cur.fov) * t;

    // 机位是按 16:9 的视野算的：窗口比它窄，横向就装不下，按比例退开
    const aspect = size.width / Math.max(size.height, 1);
    // 封顶 1.9：竖屏时这个比值能到 3.8 倍，物体会退到几乎看不见。
    // 手机上本来就不该强求把整条零件链塞进画面，允许两端出框。
    const aspectFit = Math.min(1.9, Math.max(1, 16 / 9 / aspect));
    // 平板横向还要给侧栏文字留位置；手机文字在下方，由 focus 下移处理
    const narrowFit = size.width < 1024 ? 1 : size.width < 1320 ? 1.08 : 1;
    target.current.multiplyScalar(aspectFit * narrowFit * view.fit);

    // 拖动时对准整个零件群，而不是原本那个可能落在空隙里的焦点
    if (dragging) {
      targetFocus.current.set(view.bounds.x, view.bounds.y, view.bounds.z);
    }

    // 单栏布局（手机与 iPad 竖屏）文字排在下方，焦点下移让物体落到上半部
    if (size.width < 1024) {
      targetFocus.current.y -= 0.34;
    } else {
      // 桌面与平板：文字占一侧，把物体整体平移到另一侧
      const amount =
        lerp(SHIFT[i], SHIFT[Math.min(i + 1, SHIFT.length - 1)], t) *
        (size.width < 1320 ? 0.34 : 0.46);
      if (amount !== 0) {
        fwd.current.copy(targetFocus.current).sub(target.current).normalize();
        side.current.crossVectors(fwd.current, UP).normalize();
        target.current.addScaledVector(side.current, -amount);
        targetFocus.current.addScaledVector(side.current, -amount);
      }
    }

    if (!reduced) {
      const time = state.clock.elapsedTime;
      // 很小的持续摇曳：别让画面完全死住
      target.current.x += Math.sin(time * 0.34) * 0.035;
      target.current.y += Math.cos(time * 0.27) * 0.028;
      // 指针视差：小到看不出是在跟鼠标。拖动时关掉，否则和轨道旋转打架
      if (!view.drag.active) {
        target.current.x += view.pointer.ex * 0.11;
        target.current.y += view.pointer.ey * 0.085;
      }
    }

    const k = reduced ? 1e6 : 7;
    pos.current.x = damp(pos.current.x, target.current.x, k, dt);
    pos.current.y = damp(pos.current.y, target.current.y, k, dt);
    pos.current.z = damp(pos.current.z, target.current.z, k, dt);
    focus.current.x = damp(focus.current.x, targetFocus.current.x, k, dt);
    focus.current.y = damp(focus.current.y, targetFocus.current.y, k, dt);
    focus.current.z = damp(focus.current.z, targetFocus.current.z, k, dt);
    roll.current = damp(roll.current, targetRoll, k, dt);

    const nextFov = damp(cam.fov, targetFov, k, dt);
    if (Math.abs(nextFov - cam.fov) > 0.01) {
      cam.fov = nextFov;
      cam.updateProjectionMatrix();
    }

    orbit.current.copy(pos.current).sub(focus.current);
    sph.current.setFromVector3(orbit.current);
    sph.current.theta += view.drag.yaw;
    sph.current.phi = clamp(sph.current.phi - view.drag.pitch, 0.12, Math.PI - 0.12);

    // 距离取「无论转到哪个角度都刚好装得下包围盒」：
    // 绕 Y 轴转一圈，水平投影的最大半宽是 √(hw² + hd²)，垂直方向恒为 hh。
    // 这样既看得到完整零件群、也不可能穿进零件里。
    if (dragging) {
      const b = view.bounds;
      const halfV = (cam.fov * Math.PI) / 360;
      const halfH = Math.atan(Math.tan(halfV) * (size.width / Math.max(size.height, 1)));
      const need =
        Math.max(
          (Math.hypot(b.hw, b.hd) + 0.42) / Math.tan(halfH),
          (b.hh + 0.42) / Math.tan(halfV)
        ) * 1.06;
      if (sph.current.radius < need) sph.current.radius = need;
    }

    orbit.current.setFromSpherical(sph.current);

    camera.position.copy(focus.current).add(orbit.current);
    camera.lookAt(focus.current);
    camera.rotateZ(roll.current);
  });

  return null;
}
