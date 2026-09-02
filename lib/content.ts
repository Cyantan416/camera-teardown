import type { Lang } from './i18n';
export type Layout = 'left' | 'right' | 'flank';

export interface Section {
  id: string;
  // rail 刻度和 Nav 读数用的短名。英文版沿用 id，中文版另给
  nav: string;
  eyebrow: string;
  // 展示型标题：每个元素一行，换行由设计决定，不交给浏览器自动折
  title: string[];
  body: string;
  note?: string;
  stats?: [string, string][];
  layout: Layout;
}

const EN: Section[] = [
  {
    id: 'hero',
    nav: 'hero',
    eyebrow: 'Aperture Works — Series XI',
    title: ['A camera made', 'of light itself.'],
    body: 'Thirty-six components, every one of them drawn in code. No imported model, no texture map. What you see is the mechanism.',
    note: 'Scroll to pull it apart. Keep scrolling and it puts itself back together, one subsystem at a time.',
    layout: 'left',
  },
  {
    id: 'teardown',
    nav: 'teardown',
    eyebrow: 'Teardown',
    title: ['Everything,', 'at once.'],
    body: 'Four subsystems come apart along a single optical axis. Every part travels its own distance, and returns in its own time.',
    stats: [
      ['36', 'Components'],
      ['4', 'Subsystems'],
      ['5', 'Elements'],
      ['0', 'Imported models'],
    ],
    layout: 'right',
  },
  {
    id: 'optics',
    nav: 'optics',
    eyebrow: '01 — Optics',
    title: ['Five elements.', 'One path.'],
    body: 'Bi-convex, meniscus, bi-concave, a cemented doublet, and the rear element. Every surface coated, so only the light that matters gets through.',
    layout: 'left',
  },
  {
    id: 'barrel',
    nav: 'barrel',
    eyebrow: '02 — Barrel',
    title: ['Machined to', 'hold it still.'],
    body: 'Knurled focus and aperture rings, a distance scale running from 0.3 metres to infinity. Every ridge cut for a thumb that already knows where it is going.',
    layout: 'right',
  },
  {
    id: 'mechanism',
    nav: 'mechanism',
    eyebrow: '03 — Mechanism',
    title: ['Nine blades.', 'One decision.'],
    body: 'Shutter, mount, aperture. The parts that decide how much of the world reaches the sensor, and for how long.',
    layout: 'left',
  },
  {
    id: 'chassis',
    nav: 'chassis',
    eyebrow: '04 — Chassis',
    title: ['Six panels,', 'one enclosure.'],
    body: 'Top plate, base plate, four walls and a leatherette wrap. The shell exists so that nothing inside it ever has to move.',
    layout: 'right',
  },
  {
    id: 'reassembly',
    nav: 'reassembly',
    eyebrow: 'Reassembly',
    title: ['Back to', 'one object.'],
    body: 'Thirty-six parts, one camera.',
    note: 'Drag anywhere to look around it.',
    layout: 'flank',
  },
];

const ZH: Section[] = [
  {
    id: 'hero',
    nav: '首屏',
    eyebrow: 'Aperture Works · 第十一代',
    title: ['一台相机，', '由光写成。'],
    body: '三十六个零件，每一个都是代码画出来的。没有导入任何模型，没有贴图。你看到的就是结构本身。',
    note: '往下滚，它会散开。继续滚，它会一个系统一个系统地装回去。',
    layout: 'left',
  },
  {
    id: 'teardown',
    nav: '拆解',
    eyebrow: '拆解',
    title: ['全部零件，', '同时散开。'],
    body: '四个子系统沿同一条光轴分开。每个零件走自己的距离，也在自己的节奏里归位。',
    stats: [
      ['36', '零件'],
      ['4', '子系统'],
      ['5', '镜片'],
      ['0', '外部模型'],
    ],
    layout: 'right',
  },
  {
    id: 'optics',
    nav: '光学',
    eyebrow: '01 — 光学',
    title: ['五片镜片，', '一条光路。'],
    body: '双凸、弯月、双凹、一组胶合镜，再加后组。每一面都镀了膜，只让该进来的光进来。',
    layout: 'left',
  },
  {
    id: 'barrel',
    nav: '镜筒',
    eyebrow: '02 — 镜筒',
    title: ['加工到位，', '才握得稳。'],
    body: '滚花的对焦环和光圈环，距离刻度从 0.3 米一路到无限远。每一道纹路，都是为那根早就知道该转到哪的拇指切的。',
    layout: 'right',
  },
  {
    id: 'mechanism',
    nav: '机构',
    eyebrow: '03 — 机构',
    title: ['九片叶片，', '一个决定。'],
    body: '快门、卡口、光圈。决定这个世界有多少光落到传感器上，以及落多久。',
    layout: 'left',
  },
  {
    id: 'chassis',
    nav: '机身',
    eyebrow: '04 — 机身',
    title: ['六块面板，', '一个壳。'],
    body: '顶盖、底板、四面墙，外面包一层蒙皮。壳存在的意义，就是让里面的东西永远不用动。',
    layout: 'right',
  },
  {
    id: 'reassembly',
    nav: '归位',
    eyebrow: '归位',
    title: ['重新变回', '一个整体。'],
    body: '三十六个零件，一台相机。',
    note: '按住任意位置拖动，可以换个角度看。',
    layout: 'flank',
  },
];

// SECTIONS 保留给只关心结构（段数、layout）的地方用
export const SECTIONS = EN;

export function getSections(lang: Lang): Section[] {
  return lang === 'zh' ? ZH : EN;
}
