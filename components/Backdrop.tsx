'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { view } from '@/lib/state';
import { EXPOSURE } from '@/lib/material';

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  // 直接当裁剪空间坐标用，铺满屏幕并钉在远平面
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uResolution;
uniform float uObjectX;
uniform float uScroll;
uniform float uIntensity;
uniform vec3  uBase;
uniform vec3  uBase2;
uniform vec3  uCool;
uniform vec3  uMid;
uniform vec3  uViolet;
uniform vec3  uWarm;
uniform float uExposure;
uniform float uLite;
uniform float uDarkBg;

varying vec2 vUv;

// 不用 sin —— 三角函数在集显上极慢，而这个函数每像素要跑几十次
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 2; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

// 域扭曲：先用噪声去扰动采样坐标，出来的流动比普通噪声像真实烟雾
float warped(vec2 p, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.05)), fbm(p + vec2(5.2, 1.3 - t * 0.04)));
  return fbm(p + 2.8 * q);
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  float t = uTime;

  // 大尺度对角渐变：左上偏冷、右下偏暖，先给整幅画一个色温走向
  float diag = smoothstep(-1.0, 1.0, p.x * 0.62 + p.y * 0.78);
  vec3 col = mix(uBase, uBase2, diag);

  // 浅色影棚背景：柔和的冷暖分层 + 中心略亮，像产品摄影的无缝背景纸
  if (uDarkBg < 0.5) {
    float f = warped(p * 0.85 + vec2(0.0, t * 0.010), t);
    float g = fbm(p * 0.5 + vec2(6.1, -t * 0.007));

    vec3 lc = mix(vec3(0.792, 0.812, 0.835), vec3(0.925, 0.933, 0.941),
                  smoothstep(0.22, 0.88, f));
    // 左冷右暖，很轻，只为让大面积浅色不至于死板
    lc = mix(lc, lc * vec3(0.975, 0.988, 1.012), smoothstep(0.9, -0.9, p.x));
    lc = mix(lc, lc * vec3(1.015, 0.995, 0.968), smoothstep(0.35, 0.95, g));

    // 中心略亮，四周收暗 —— 主体自然被托出来
    float rad2 = 1.0 - smoothstep(0.18, 1.30, length(p));
    lc *= 0.86 + rad2 * 0.14;

    lc = min(max(lc, vec3(0.0)), vec3(1.6));
    gl_FragColor = vec4(lc, 1.0);
    return;
  }

  // ?lite=1 诊断模式：整块噪声都跳过，只留渐变
  if (uLite > 0.5) {
    float rad = 1.0 - smoothstep(0.08, 1.20, length(p));
    col += mix(uCool, uViolet, 0.5) * 0.55 + uWarm * 0.25;
    col *= 0.72 + rad * 0.28;
    gl_FragColor = vec4(col * uIntensity * uExposure, 1.0);
    return;
  }

  // 三团色块各自在域扭曲噪声里漂移，速度和尺度都不同才有层次
  float f1 = warped(p * 1.10 + vec2(0.0, t * 0.011), t);
  float f2 = fbm(p * 0.68 + vec2(4.3, -t * 0.008));

  col += uCool * smoothstep(0.32, 0.74, f1) * 1.05;
  col += uMid * smoothstep(0.44, 0.84, 1.0 - f2) * 0.9;
  col += uWarm * smoothstep(0.46, 0.96, f2) * (0.45 + uScroll * 0.75);

  // 第四层：尺度更大、流得更慢的紫，负责整幅画的纵深
  float f3 = fbm(p * 0.42 + vec2(8.1, t * 0.006));
  col += uViolet * smoothstep(0.34, 0.86, f3) * 0.85;

  // 顶部略亮的垂直分层，让画面不是一整片同亮度
  col += mix(vec3(0.0), uCool * 0.35, smoothstep(-0.15, 0.75, p.y));

  // 一小片光晕跟着物体在屏幕上的水平位置走
  vec2 glowP = p - vec2(uObjectX * (uResolution.x / uResolution.y) * 0.5, -0.04);
  float glow = exp(-dot(glowP, glowP) * 1.9);
  col += mix(uCool, uWarm, 0.32 + uScroll * 0.5) * glow * 0.6;

  // 中心稍亮四周渐暗 —— 但保留底子，四角不能掉成纯黑
  float radial = 1.0 - smoothstep(0.08, 1.20, length(p));
  col *= 0.72 + radial * 0.28;

  col = min(max(col, vec3(0.0)), vec3(42.0));
  gl_FragColor = vec4(col * uIntensity * uExposure, 1.0);
}
`;

export default function Backdrop() {
  const { camera, size } = useThree();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const origin = useMemo(() => new THREE.Vector3(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uObjectX: { value: 0 },
      uScroll: { value: 0 },
      // 峰值亮度压在 0.05–0.08：背景一亮就会把前面 alpha 混合的玻璃糊掉
      uIntensity: { value: 0.235 },
      uBase: { value: new THREE.Color('#101922') },
      uBase2: { value: new THREE.Color('#1B1418') },
      uCool: { value: new THREE.Color('#33587A') },
      uMid: { value: new THREE.Color('#2C6157') },
      uViolet: { value: new THREE.Color('#3E3160') },
      uWarm: { value: new THREE.Color('#7C5027') },
      uExposure: EXPOSURE,
      uDarkBg: {
        value:
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('bg') === 'dark'
            ? 1
            : 0,
      },
      uLite: {
        value:
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('lite') === '1'
            ? 1
            : 0,
      },
    }),
    []
  );

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useFrame((state) => {
    const u = matRef.current?.uniforms;
    if (!u) return;

    u.uTime.value = reduced ? 0 : state.clock.elapsedTime;
    u.uResolution.value.set(size.width, size.height);
    u.uScroll.value = view.progress;

    origin.set(0, 0, 0).project(camera);
    u.uObjectX.value = origin.x;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
