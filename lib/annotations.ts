import * as THREE from 'three';
import { PARTS, type AssemblyGroup } from './parts';
import { SECTIONS } from './content';

export const LEADER = 64;
// SVG 画布留够高，折线甩到多远都不会被裁
export const SVG_H = 420;
// 同侧标签之间的最小竖向间距，每帧动态排开时用
export const LABEL_GAP = 44;

export interface Anno {
  id: string;
  spec: string;
  // 中文版的零件名和规格。零件名不能直接取 parts.ts 的 label，那边只有英文
  zhLabel: string;
  zhSpec: string;
}

// 每个聚焦章节只标 3 个：36 个全标会糊成一片，看不清任何一个
export const ANNOTATIONS: Record<number, Anno[]> = {
  2: [
    { id: 'lens-3', spec: 'bi-concave · ED', zhLabel: '双凹镜片', zhSpec: '双凹 · ED' },
    { id: 'lens-4', spec: 'cemented doublet', zhLabel: '胶合镜组', zhSpec: '胶合双片' },
    { id: 'sensor', spec: '26.1 MP · APS-C', zhLabel: '图像传感器', zhSpec: '2610 万像素 · APS-C' },
  ],
  3: [
    { id: 'hood', spec: 'Ø49 filter thread', zhLabel: '滤镜环', zhSpec: 'Ø49 滤镜螺纹' },
    { id: 'focus-ring', spec: '0.3 m – ∞', zhLabel: '对焦环', zhSpec: '0.3 米 – ∞' },
    { id: 'aperture-ring', spec: 'f/2 – f/22', zhLabel: '光圈环', zhSpec: 'f/2 – f/22' },
  ],
  4: [
    { id: 'aperture-blades', spec: '9 blades', zhLabel: '光圈叶片', zhSpec: '9 片' },
    { id: 'shutter-unit', spec: '1 s – 1/4000 s', zhLabel: '快门组件', zhSpec: '1 秒 – 1/4000 秒' },
    { id: 'gear-train', spec: 'single-stroke wind', zhLabel: '过片机构', zhSpec: '单次扳动' },
  ],
  5: [
    { id: 'top-plate', spec: 'milled brass', zhLabel: '顶盖', zhSpec: '铣削黄铜' },
    { id: 'shutter-dial', spec: '1 s – 1/4000 s', zhLabel: '快门转盘', zhSpec: '1 秒 – 1/4000 秒' },
    { id: 'base-plate', spec: '1/4-20 tripod', zhLabel: '底板', zhSpec: '1/4-20 脚架孔' },
  ],
};

export const ANNO_LIST = Object.entries(ANNOTATIONS).flatMap(([section, list]) =>
  list.map((a, i) => {
    const part = PARTS.find((p) => p.id === a.id);
    if (!part) throw new Error(`annotation references unknown part: ${a.id}`);
    const s = Number(section);
    // 标签一律站在文字面板的对面
    const right = SECTIONS[s]?.layout === 'left';
    return {
      ...a,
      section: s,
      label: part.label,
      group: part.group as AssemblyGroup,
      right,
      order: i,
      dx: right ? LEADER : -LEADER,
    };
  })
);

// CameraModel 每帧把这些零件的当前位置写进来，投影时直接读，
// 不用去遍历场景图找 mesh
export const MARKS: Record<string, THREE.Vector3> = Object.fromEntries(
  ANNO_LIST.map((a) => [a.id, new THREE.Vector3()])
);
