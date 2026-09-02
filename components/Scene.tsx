'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import dynamic from 'next/dynamic';
import { BACKDROP } from '@/lib/theme';
import { EXPOSURE, PRESETS } from '@/lib/material';
import { view } from '@/lib/state';
import CameraModel from './CameraModel';
import CameraRig from './camera/CameraRig';
import DragOrbit from './DragOrbit';
import Backdrop from './Backdrop';

const PostChain = dynamic(() => import('./PostChain'), { ssr: false });
import AnnotationProjector from './AnnotationProjector';

// 第一帧画完就通知 Preloader —— 它等的是真实的可见状态，不是定时器
function Ready() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    window.dispatchEvent(new Event('scene-ready'));
  });
  return null;
}

// ?exp=1.9 调曝光。所有 shader 共享这个 uniform，改一处全部生效
function Exposure() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const e = parseFloat(q.get('exp') ?? '');
    if (e > 0) EXPOSURE.value = e;

    // ?lite=1 一键诊断：把最贵的都关掉，用来确认闪烁是不是性能造成的
    if (q.get('lite') === '1') {
      for (const m of Object.values(PRESETS)) {
        m.uniforms.uMicroStrength.value = 0;
      }
    }

    // ?micro=0 关掉程序化颗粒，用来对比质感和帧率代价
    const mi = q.get('micro');
    if (mi !== null) {
      const k = parseFloat(mi) || 0;
      for (const m of Object.values(PRESETS)) {
        m.uniforms.uMicroStrength.value *= k;
      }
    }
  }, []);
  return null;
}

// 掉帧就自动卸掉最贵的两项：像素比和程序化颗粒。
// 集显机器扛不住时会吐出没画完的空帧，那就是画面闪烁的来源。
function AutoQuality() {
  const setDpr = useThree((s) => s.setDpr);
  const samples = useRef<number[]>([]);
  const stage = useRef(0);

  // 起步档位：弱机不用等掉帧被测出来才降，省掉开头那几秒的卡顿
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (cores > 4 && !coarse) return;
    stage.current = 2;
    view.tier = 2;
    setDpr(1);
    for (const m of Object.values(PRESETS)) {
      m.uniforms.uMicroStrength.value = 0;
    }
  }, [setDpr]);

  useFrame((state, dt) => {
    view.dpr = state.gl.getPixelRatio();
    // 帧率必须在渲染循环里量。放在 ScrollEngine 的 update 里会出错：
    // reduced-motion 下那个函数由滚动事件驱动，量到的是事件频率不是帧率
    if (dt > 0 && dt < 0.5) {
      view.fps = view.fps ? view.fps + (1 / dt - view.fps) * 0.05 : 1 / dt;
    }
    if (stage.current >= 3 || dt > 0.5) return;
    samples.current.push(dt);
    if (samples.current.length < 90) return;

    const avg = samples.current.reduce((a, b) => a + b, 0) / samples.current.length;
    samples.current.length = 0;

    if (avg > 0.026) {
      stage.current += 1;
      view.tier = stage.current;
      if (stage.current === 1) {
        setDpr(1);
      } else if (stage.current === 2) {
        for (const m of Object.values(PRESETS)) {
          m.uniforms.uMicroStrength.value = 0;
        }
      } else {
        setDpr(0.8);
      }
    }
  });

  return null;
}

export default function Scene() {
  // 后期链的 Bloom 在 HDR 缓冲里遇到玻璃的极端高光会溢出成 NaN，整帧变黑。
  // 默认走无后期链的路径；?post=1 可以开回来做对比。
  const noPost =
    typeof window === 'undefined' ||
    new URLSearchParams(window.location.search).get('post') !== '1';

  return (
    <div
      data-orbit
      // touch-pan-y 而不是 touch-none：画布铺满视口，设成 none 的话
      // 手机上竖向滑动会被拖拽吃掉，页面根本滚不动。
      // 竖向交还浏览器滚动，横向留给转相机。鼠标不受 touch-action 影响
      className="scene-in fixed inset-0 z-0 cursor-grab touch-pan-y select-none" 
    >
      <Canvas
        dpr={[1, 1.2]}
        // 颜色管理整个交给 EffectComposer，renderer 自己不做 tone mapping
        // 用了 EffectComposer 后 renderer 自己的抗锯齿不生效，开着只是白占显存
        gl={{
          antialias: noPost,
          // 关掉后期链时得让 renderer 自己 tone map，否则画面颜色是错的
          toneMapping: noPost ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping,
        }}
        camera={{ fov: 35, position: [1.5, 0.95, 2.9], near: 0.1, far: 100 }}
      >
        <color attach="background" args={[BACKDROP]} />
        <Exposure />
        <AutoQuality />
        <DragOrbit />
        <Backdrop />
        <CameraRig />
        <CameraModel />
        <AnnotationProjector />
        <Ready />

        {!noPost && <PostChain />}
      </Canvas>
    </div>
  );
}
