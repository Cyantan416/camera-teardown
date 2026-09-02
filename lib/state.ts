import type { AssemblyGroup } from './parts';

export const SECTION_COUNT = 7;

// 每段占 2 屏：段落 sticky 钉住时有足够的滚动行程
export const SECTION_VH = 2;

// 散开幅度：1 时跨度约机身 4 倍，太散；0.75 接近参考图的爆炸图比例
export const EXPLODE_SCALE = 0.75;

export interface ViewState {
  raw: number;
  section: number;
  local: number;
  progress: number;
  velocity: number;
  apart: number;
  explode: Record<AssemblyGroup, number>;
  pointer: { x: number; y: number; ex: number; ey: number };
  // 鼠标拖动叠加的轨道旋转，让人能 360 度转着看
  drag: { yaw: number; pitch: number; active: boolean };
  scale: number;
  // 整体取景远近的手动微调倍数，?fit=1.2 就是全部退远 20%
  fit: number;
  // 真机排查用：帧率、实际像素比、自动降档到第几级
  fps: number;
  dpr: number;
  tier: number;
  // 当前所有零件的包围球。拖动时相机对准它，保证怎么转都看得到东西
  bounds: { x: number; y: number; z: number; hw: number; hh: number; hd: number };
}

// 每帧被改写的可变对象。绝不能进 React state —— 每秒 60 次重渲染会卡死页面。
export const view: ViewState = {
  raw: 0,
  section: 0,
  local: 0,
  progress: 0,
  velocity: 0,
  apart: 0,
  explode: { optics: 0, barrel: 0, mechanism: 0, body: 0 },
  pointer: { x: 0, y: 0, ex: 0, ey: 0 },
  drag: { yaw: 0, pitch: 0, active: false },
  scale: EXPLODE_SCALE,
  fit: 1,
  fps: 0,
  dpr: 0,
  tier: 0,
  bounds: { x: 0, y: 0, z: 0, hw: 0.7, hh: 0.4, hd: 0.4 },
};

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

// 跟帧率无关的指数缓动：60Hz 和 120Hz 屏幕上手感必须一致
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

// 所有组共享的炸开窗口
const APART: readonly [number, number] = [0.55, 1.5];

// 每组各自的归位窗口，互不重叠 —— 炸开是一起的，回来是一个一个的
const HOME: Record<AssemblyGroup, readonly [number, number]> = {
  optics: [1.85, 2.55],
  barrel: [2.65, 3.35],
  mechanism: [3.45, 4.15],
  body: [4.25, 4.95],
};

export function applySectionScroll(raw: number) {
  view.raw = raw;
  // 面板从 raw=N 起才钉在视口中，早于这个点播动画等于播给空气看
  view.section = clamp(Math.floor(raw), 0, SECTION_COUNT - 1);
  view.local = clamp(raw - Math.floor(raw), 0, 1);
  view.progress = clamp(raw / (SECTION_COUNT - 1), 0, 1);

  const apart = smoothstep(APART[0], APART[1], raw);
  view.apart = apart;

  for (const g of Object.keys(HOME) as AssemblyGroup[]) {
    const [a, b] = HOME[g];
    const home = smoothstep(a, b, raw);
    view.explode[g] = apart * (1 - home);
  }
}
