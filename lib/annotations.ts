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
}

// 每个聚焦章节只标 3 个：36 个全标会糊成一片，看不清任何一个
export const ANNOTATIONS: Record<number, Anno[]> = {
  2: [
    { id: 'lens-3', spec: 'bi-concave · ED' },
    { id: 'lens-4', spec: 'cemented doublet' },
    { id: 'sensor', spec: '26.1 MP · APS-C' },
  ],
  3: [
    { id: 'hood', spec: 'Ø49 filter thread' },
    { id: 'focus-ring', spec: '0.3 m – ∞' },
    { id: 'aperture-ring', spec: 'f/2 – f/22' },
  ],
  4: [
    { id: 'aperture-blades', spec: '9 blades' },
    { id: 'shutter-unit', spec: '1 s – 1/4000 s' },
    { id: 'gear-train', spec: 'single-stroke wind' },
  ],
  5: [
    { id: 'top-plate', spec: 'milled brass' },
    { id: 'shutter-dial', spec: ' 1 s – 1/4000 s' },
    { id: 'base-plate', spec: '1/4-20 tripod' },
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
