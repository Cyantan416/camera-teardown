import * as THREE from 'three';
import {
  buildRing,
  buildDisc,
  buildShell,
  buildLens,
  buildKnurled,
  buildBand,
  mergeAll,
} from './geometry';

export type AssemblyGroup = 'optics' | 'barrel' | 'mechanism' | 'body';
export type Finish = 'glass' | 'metal' | 'matte' | 'panel' | 'blade' | 'accent';

export interface PartDef {
  id: string;
  label: string;
  group: AssemblyGroup;
  finish: Finish;
  build: () => THREE.BufferGeometry;
  position: [number, number, number];
  rotation?: [number, number, number];
  explode: [number, number, number];
  delay: number;
  // 拆解时绕自身轴顺时针自转的角速度（rad/s），只有齿状零件有
  spin?: number;
  // 运行时用 Canvas 画出来的刻度/字样
  decal?: 'aperture' | 'distance' | 'name';
}

export const GROUPS: AssemblyGroup[] = ['optics', 'barrel', 'mechanism', 'body'];

export const GROUP_LABEL: Record<AssemblyGroup, string> = {
  optics: '光学',
  barrel: '镜筒',
  mechanism: '机构',
  body: '机身',
};

// 场景单位：1 = 100mm。机身按 X100 比例 128 × 75 × 53mm。
const BODY_W = 1.28;
const BODY_H = 0.75;
const BODY_D = 0.53;
const FRONT = BODY_D / 2;

function radialRepeat(count: number, radius: number, make: (i: number) => THREE.BufferGeometry) {
  return mergeAll(
    Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      const g = make(i);
      g.translate(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      return g;
    })
  );
}

export const PARTS: PartDef[] = [
  // ---------- optics ----------
  {
    id: 'lens-front',
    label: 'Front Element',
    group: 'optics',
    finish: 'glass',
    build: () => buildLens({ radius: 0.235, frontBulge: 0.055, backBulge: 0.018 }),
    position: [0, 0, FRONT + 0.295],
    explode: [0.0, 0.0, 1.66],
    delay: 0,
  },
  {
    id: 'lens-2',
    label: 'Meniscus',
    group: 'optics',
    finish: 'glass',
    build: () => buildLens({ radius: 0.205, frontBulge: 0.022, backBulge: -0.03 }),
    position: [0, 0, FRONT + 0.235],
    explode: [0.0, 0.0, 1.3],
    delay: 0.1,
  },
  {
    id: 'lens-3',
    label: 'Bi-concave',
    group: 'optics',
    finish: 'glass',
    build: () => buildLens({ radius: 0.175, frontBulge: -0.026, backBulge: -0.026 }),
    position: [0, 0, FRONT + 0.175],
    explode: [0.0, 0.0, 0.89],
    delay: 0.2,
  },
  {
    id: 'lens-4',
    label: 'Cemented Doublet',
    group: 'optics',
    finish: 'glass',
    build: () => buildLens({ radius: 0.18, frontBulge: 0.042, backBulge: 0.014 }),
    position: [0, 0, FRONT + 0.115],
    explode: [0.0, 0.0, 0.52],
    delay: 0.3,
  },
  {
    id: 'lens-rear',
    label: 'Rear Element',
    group: 'optics',
    finish: 'glass',
    build: () => buildLens({ radius: 0.152, frontBulge: 0.03, backBulge: 0.01 }),
    position: [0, 0, FRONT + 0.055],
    explode: [0.0, 0.0, 0.02],
    delay: 0.4,
  },
  {
    id: 'spacer-front',
    label: 'Spacer',
    group: 'optics',
    finish: 'matte',
    build: () => buildRing({ innerR: 0.2, outerR: 0.225, height: 0.012 }),
    position: [0, 0, FRONT + 0.265],
    explode: [0.0, 0.0, 1.47],
    delay: 0.15,
  },
  {
    id: 'spacer-rear',
    label: 'Spacer',
    group: 'optics',
    finish: 'matte',
    build: () => buildRing({ innerR: 0.148, outerR: 0.172, height: 0.012 }),
    position: [0, 0, FRONT + 0.145],
    explode: [0.0, 0.0, 0.31],
    delay: 0.35,
  },
  {
    id: 'sensor',
    label: 'Image Sensor',
    group: 'optics',
    finish: 'accent',
    build: () =>
      mergeAll([
        buildShell({ width: 0.24, height: 0.16, depth: 0.012, radius: 0.004 }),
        buildShell({ width: 0.3, height: 0.22, depth: 0.02, radius: 0.008 }).translate(0, 0, -0.016),
      ]),
    position: [0, 0, FRONT - 0.06],
    explode: [0.0, 0.0, -0.725],
    delay: 0.55,
  },

  // ---------- barrel ----------
  {
    id: 'hood',
    label: 'Filter Ring',
    group: 'barrel',
    finish: 'metal',
    build: () => buildRing({ innerR: 0.242, outerR: 0.272, height: 0.055 }),
    position: [0, 0, FRONT + 0.325],
    explode: [0.0, 0.0, 2.41],
    delay: 0,
  },
  {
    id: 'name-ring',
    label: 'Name Ring',
    group: 'barrel',
    finish: 'accent',
    build: () => buildRing({ innerR: 0.238, outerR: 0.266, height: 0.016 }),
    position: [0, 0, FRONT + 0.288],
    explode: [0.0, 0.0, 2.187],
    delay: 0.08,
  },
  {
    id: 'barrel-front',
    label: 'Front Barrel',
    group: 'barrel',
    finish: 'metal',
    build: () => buildRing({ innerR: 0.236, outerR: 0.262, height: 0.09 }),
    position: [0, 0, FRONT + 0.235],
    explode: [0.0, 0.0, 1.98],
    delay: 0.16,
  },
  {
    id: 'focus-ring',
    label: 'Focus Ring',
    group: 'barrel',
    finish: 'metal',
    build: () => buildKnurled({ innerR: 0.232, outerR: 0.268, height: 0.11, ridges: 46, depth: 0.009 }),
    position: [0, 0, FRONT + 0.145],
    explode: [0.0, 0.0, 1.14],
    delay: 0.26,
    spin: -0.3,
  },
  {
    id: 'aperture-ring',
    label: 'Aperture Ring',
    group: 'barrel',
    finish: 'metal',
    build: () => buildKnurled({ innerR: 0.226, outerR: 0.256, height: 0.05, ridges: 40, depth: 0.007 }),
    position: [0, 0, FRONT + 0.075],
    explode: [0.0, 0.0, 0.76],
    delay: 0.36,
    spin: -0.52,
  },
  {
    id: 'barrel-mid',
    label: 'Mid Barrel',
    group: 'barrel',
    finish: 'matte',
    build: () => buildRing({ innerR: 0.19, outerR: 0.222, height: 0.19 }),
    position: [0, 0, FRONT + 0.115],
    explode: [0.0, 0.0, 0.14],
    delay: 0.46,
  },
  {
    id: 'barrel-rear',
    label: 'Rear Barrel',
    group: 'barrel',
    finish: 'metal',
    build: () => buildRing({ innerR: 0.158, outerR: 0.196, height: 0.06 }),
    position: [0, 0, FRONT + 0.02],
    explode: [0.0, 0.0, -0.305],
    delay: 0.58,
  },

  // ---------- mechanism ----------
  {
    id: 'aperture-blades',
    label: 'Aperture Blades',
    group: 'mechanism',
    finish: 'blade',
    build: () =>
      radialRepeat(7, 0.09, () => {
        const g = buildShell({ width: 0.15, height: 0.05, depth: 0.004, radius: 0.012 });
        g.rotateZ(0.5);
        return g;
      }),
    position: [0, 0, FRONT + 0.09],
    explode: [0.0, 0.0, -0.195],
    delay: 0,
    spin: -0.68,
  },
  {
    id: 'mount-ring',
    label: 'Lens Mount',
    group: 'mechanism',
    finish: 'metal',
    build: () =>
      mergeAll([
        buildRing({ innerR: 0.16, outerR: 0.212, height: 0.022 }),
        radialRepeat(3, 0.186, () => buildShell({ width: 0.05, height: 0.03, depth: 0.03, radius: 0.005 })),
      ]),
    position: [0, 0, FRONT - 0.012],
    explode: [0.0, 0.0, -0.493],
    delay: 0.12,
    spin: -0.19,
  },
  {
    id: 'mount-screws',
    label: 'Mount Screws',
    group: 'mechanism',
    finish: 'metal',
    build: () => radialRepeat(6, 0.196, () => buildDisc({ radius: 0.014, thickness: 0.026, segments: 20 })),
    position: [0, 0, FRONT - 0.012],
    explode: [0.05, -0.86, 1.047],
    delay: 0.2,
    spin: -0.24,
  },
  {
    id: 'shutter-unit',
    label: 'Shutter Assembly',
    group: 'mechanism',
    finish: 'matte',
    build: () =>
      mergeAll([
        buildShell({ width: 0.34, height: 0.28, depth: 0.035, radius: 0.01 }),
        buildShell({ width: 0.2, height: 0.15, depth: 0.05, radius: 0.006 }).translate(0, 0, 0.02),
      ]),
    position: [0, 0, FRONT - 0.075],
    explode: [0.32, 0.48, 0.76],
    delay: 0.3,
  },
  {
    id: 'viewfinder',
    label: 'Hybrid Viewfinder',
    group: 'mechanism',
    finish: 'matte',
    build: () =>
      mergeAll([
        buildShell({ width: 0.26, height: 0.17, depth: 0.19, radius: 0.012 }),
        buildShell({ width: 0.11, height: 0.09, depth: 0.02, radius: 0.006 }).translate(0.06, 0, -0.1),
      ]),
    position: [-0.42, 0.16, -0.02],
    explode: [0.47, 0.7, 1.72],
    delay: 0.4,
  },
  {
    id: 'pcb',
    label: 'Main PCB',
    group: 'mechanism',
    finish: 'matte',
    build: () =>
      mergeAll([
        buildShell({ width: 1.02, height: 0.56, depth: 0.014, radius: 0.014 }),
        buildShell({ width: 0.22, height: 0.22, depth: 0.026, radius: 0.004 }).translate(-0.16, 0.04, 0.018),
        buildShell({ width: 0.14, height: 0.1, depth: 0.02, radius: 0.003 }).translate(0.24, -0.1, 0.016),
        buildShell({ width: 0.1, height: 0.14, depth: 0.02, radius: 0.003 }).translate(0.36, 0.12, 0.016),
      ]),
    position: [0, -0.02, -0.12],
    explode: [0.3, -0.52, 0.02],
    delay: 0.5,
  },
  {
    id: 'battery',
    label: 'Battery NP-W126S',
    group: 'mechanism',
    finish: 'matte',
    build: () => buildShell({ width: 0.34, height: 0.2, depth: 0.09, radius: 0.008 }),
    position: [0.4, -0.2, -0.06],
    explode: [-0.32, -0.72, -0.32],
    delay: 0.6,
  },
  {
    id: 'gear-train',
    label: 'Wind Mechanism',
    group: 'mechanism',
    finish: 'metal',
    build: () =>
      mergeAll([
        buildKnurled({ innerR: 0.02, outerR: 0.075, height: 0.02, ridges: 22, depth: 0.008 }),
        buildKnurled({ innerR: 0.015, outerR: 0.05, height: 0.02, ridges: 16, depth: 0.007 }).translate(0.1, -0.05, 0.025),
        buildDisc({ radius: 0.018, thickness: 0.09, segments: 20 }).translate(0, 0, 0.03),
      ]),
    position: [0.46, 0.2, -0.1],
    explode: [-0.52, -1.1, -0.85],
    delay: 0.7,
    spin: -0.95,
  },

  // ---------- body ----------
  {
    id: 'top-plate',
    label: 'Top Plate',
    group: 'body',
    finish: 'panel',
    build: () => buildShell({ width: BODY_W, height: BODY_D, depth: 0.055, radius: 0.035 }),
    position: [0, BODY_H / 2 - 0.028, 0],
    rotation: [Math.PI / 2, 0, 0],
    explode: [0.0, 0.573, 0.8],
    delay: 0,
  },
  {
    id: 'shutter-dial',
    label: 'Shutter Dial',
    group: 'body',
    finish: 'metal',
    build: () => buildKnurled({ innerR: 0.02, outerR: 0.085, height: 0.05, ridges: 40, depth: 0.005 }),
    position: [0.36, BODY_H / 2 + 0.02, -0.02],
    rotation: [Math.PI / 2, 0, 0],
    explode: [-0.26, 0.585, -0.08],
    delay: 0.06,
    spin: -0.44,
  },
  {
    id: 'iso-dial',
    label: 'ISO Dial',
    group: 'body',
    finish: 'metal',
    build: () => buildKnurled({ innerR: 0.018, outerR: 0.07, height: 0.042, ridges: 34, depth: 0.005 }),
    position: [-0.42, BODY_H / 2 + 0.016, -0.02],
    rotation: [Math.PI / 2, 0, 0],
    explode: [0.32, 0.589, -0.6],
    delay: 0.12,
    spin: -0.37,
  },
  {
    id: 'shutter-button',
    label: 'Shutter Release',
    group: 'body',
    finish: 'accent',
    build: () =>
      mergeAll([
        buildDisc({ radius: 0.032, thickness: 0.024, segments: 40 }),
        buildRing({ innerR: 0.032, outerR: 0.046, height: 0.014 }).translate(0, 0, -0.006),
      ]),
    position: [0.19, BODY_H / 2 + 0.01, -0.02],
    rotation: [Math.PI / 2, 0, 0],
    explode: [-0.14, 0.635, -1.03],
    delay: 0.18,
  },
  {
    id: 'side-left',
    label: 'Left Side Panel',
    group: 'body',
    finish: 'panel',
    build: () => buildShell({ width: BODY_D, height: BODY_H, depth: 0.04, radius: 0.03 }),
    position: [-BODY_W / 2 + 0.02, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    explode: [-0.16, 0.54, 1.55],
    delay: 0.33,
  },
  {
    id: 'side-right',
    label: 'Right Side Panel',
    group: 'body',
    finish: 'panel',
    build: () => buildShell({ width: BODY_D, height: BODY_H, depth: 0.04, radius: 0.03 }),
    position: [BODY_W / 2 - 0.02, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    explode: [0.16, -0.56, 1.55],
    delay: 0.43,
  },
  {
    id: 'front-shell',
    label: 'Front Shell',
    group: 'body',
    finish: 'panel',
    build: () =>
      buildShell({
        width: BODY_W,
        height: BODY_H,
        depth: 0.05,
        radius: 0.045,
        hole: { radius: 0.28 },
      }),
    position: [0, 0, FRONT - 0.03],
    // 往左下侧抽出，绝不朝正前方 —— 否则归位时会直接穿过整个镜头
    explode: [-0.3, 0.5, 1.815],
    delay: 0.28,
  },
  {
    id: 'leatherette',
    label: 'Leatherette',
    group: 'body',
    finish: 'panel',
    build: () =>
      mergeAll([
        buildShell({ width: 0.34, height: 0.62, depth: 0.012, radius: 0.03 }).translate(-0.47, 0, 0),
        buildShell({ width: 0.3, height: 0.62, depth: 0.012, radius: 0.03 }).translate(0.46, 0, 0),
      ]),
    position: [0, 0, FRONT + 0.001],
    explode: [-0.34, -0.52, 1.684],
    delay: 0.38,
  },
  {
    id: 'rear-shell',
    label: 'Rear Shell',
    group: 'body',
    finish: 'panel',
    build: () =>
      mergeAll([
        buildShell({ width: BODY_W, height: BODY_H, depth: 0.05, radius: 0.045 }),
        buildShell({ width: 0.72, height: 0.5, depth: 0.014, radius: 0.008 }).translate(-0.1, -0.02, -0.03),
      ]),
    position: [0, 0, -FRONT + 0.03],
    explode: [0.34, 0.5, 0.185],
    delay: 0.48,
  },
  {
    id: 'base-plate',
    label: 'Base Plate',
    group: 'body',
    finish: 'panel',
    build: () =>
      mergeAll([
        buildShell({ width: BODY_W, height: BODY_D, depth: 0.04, radius: 0.03 }),
        buildRing({ innerR: 0.028, outerR: 0.05, height: 0.03 }).translate(0, 0, 0.02),
      ]),
    position: [0, -BODY_H / 2 + 0.02, 0],
    rotation: [Math.PI / 2, 0, 0],
    explode: [0.0, -0.585, 0.45],
    delay: 0.58,
  },
  {
    id: 'body-screws',
    label: 'Body Screws',
    group: 'body',
    finish: 'metal',
    build: () =>
      mergeAll(
        [
          [-0.58, 0.3],
          [0.58, 0.3],
          [-0.58, -0.3],
          [0.58, -0.3],
          [0, -0.33],
          [0, 0.33],
        ].map(([x, y]) =>
          buildDisc({ radius: 0.016, thickness: 0.02, segments: 18 }).translate(x, y, 0)
        )
      ),
    position: [0, 0, -FRONT + 0.05],
    explode: [0.05, -0.88, -1.285],
    delay: 0.68,
  },

  // ---------- 刻度与字样（跟着各自的宿主零件走） ----------
  {
    id: 'distance-scale',
    label: 'Distance Scale',
    group: 'barrel',
    finish: 'metal',
    decal: 'distance',
    build: () => buildBand({ radius: 0.2624, height: 0.076 }),
    position: [0, 0, FRONT + 0.235],
    explode: [0.0, 0.0, 1.98],
    delay: 0.16,
  },
  {
    id: 'name-plate',
    label: 'Name Plate',
    group: 'barrel',
    finish: 'accent',
    decal: 'name',
    build: () => buildBand({ radius: 0.2662, height: 0.0145 }),
    position: [0, 0, FRONT + 0.288],
    explode: [0.0, 0.0, 2.187],
    delay: 0.08,
  },
];
