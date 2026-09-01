import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type Geo = THREE.BufferGeometry;

function finish(geo: Geo): Geo {
  geo.computeVertexNormals();
  if (!geo.attributes.uv) {
    const count = geo.attributes.position.count;
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  return geo;
}

export function buildRing({
  innerR,
  outerR,
  height,
  segments = 96,
}: {
  innerR: number;
  outerR: number;
  height: number;
  segments?: number;
}): Geo {
  const h = height / 2;
  const profile = [
    new THREE.Vector2(innerR, -h),
    new THREE.Vector2(outerR, -h),
    new THREE.Vector2(outerR, h),
    new THREE.Vector2(innerR, h),
    new THREE.Vector2(innerR, -h),
  ];
  const geo = new THREE.LatheGeometry(profile, segments);
  geo.rotateX(Math.PI / 2);
  return finish(geo);
}

export function buildDisc({
  radius,
  thickness,
  segments = 96,
}: {
  radius: number;
  thickness: number;
  segments?: number;
}): Geo {
  const geo = new THREE.CylinderGeometry(radius, radius, thickness, segments);
  geo.rotateX(Math.PI / 2);
  return finish(geo);
}

export function buildShell({
  width,
  height,
  depth,
  radius = 0.03,
  bevel = 0.006,
  hole,
}: {
  width: number;
  height: number;
  depth: number;
  radius?: number;
  bevel?: number;
  // 挖一个圆孔，例如前壳让镜筒穿过去的那个
  hole?: { radius: number; x?: number; y?: number };
}): Geo {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w * 0.98, h * 0.98);

  const shape = new THREE.Shape();
  shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
  shape.absarc(-(w - r), h - r, r, Math.PI / 2, Math.PI, false);
  shape.absarc(-(w - r), -(h - r), r, Math.PI, Math.PI * 1.5, false);
  shape.absarc(w - r, -(h - r), r, Math.PI * 1.5, Math.PI * 2, false);

  if (hole) {
    const path = new THREE.Path();
    path.absarc(hole.x ?? 0, hole.y ?? 0, hole.radius, 0, Math.PI * 2, true);
    shape.holes.push(path);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, depth - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geo.center();
  return finish(geo);
}

export function buildLens({
  radius,
  frontBulge,
  backBulge,
  edge = 0.012,
  segments = 96,
  arcSteps = 20,
}: {
  radius: number;
  frontBulge: number;
  backBulge: number;
  edge?: number;
  segments?: number;
  arcSteps?: number;
}): Geo {
  const sag = (r: number, bulge: number) =>
    bulge * Math.sqrt(Math.max(0, 1 - (r / radius) ** 2));
  const profile: THREE.Vector2[] = [];

  for (let i = 0; i <= arcSteps; i++) {
    const r = (i / arcSteps) * radius;
    profile.push(new THREE.Vector2(r, edge / 2 + sag(r, frontBulge)));
  }
  for (let i = arcSteps; i >= 0; i--) {
    const r = (i / arcSteps) * radius;
    profile.push(new THREE.Vector2(r, -edge / 2 - sag(r, backBulge)));
  }
  profile.push(profile[0].clone());

  const geo = new THREE.LatheGeometry(profile, segments);
  geo.rotateX(Math.PI / 2);
  return finish(geo);
}

export function buildKnurled({
  innerR,
  outerR,
  height,
  ridges = 56,
  depth = 0.004,
  segments = ridges * 4,
}: {
  innerR: number;
  outerR: number;
  height: number;
  ridges?: number;
  depth?: number;
  segments?: number;
}): Geo {
  const geo = buildRing({ innerR, outerR, height, segments });
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const mid = (innerR + outerR) / 2;

  // 只推外壁顶点：径向凹凸做出滚花，不用贴图
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.hypot(x, y);
    if (r < mid) continue;
    const angle = Math.atan2(y, x);
    const scale = (r + depth * Math.cos(angle * ridges)) / r;
    pos.setXY(i, x * scale, y * scale);
  }
  pos.needsUpdate = true;
  return finish(geo);
}

// 薄圆柱面：UV 正好是展开的矩形，用来贴刻度和字样
export function buildBand({
  radius,
  height,
  segments = 160,
}: {
  radius: number;
  height: number;
  segments?: number;
}): Geo {
  const geo = new THREE.CylinderGeometry(radius, radius, height, segments, 1, true);
  geo.rotateX(Math.PI / 2);
  return finish(geo);
}

export function mergeAll(parts: Geo[]): Geo {
  // lathe/cylinder 是 indexed、extrude 是 non-indexed，混合前先统一
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  const merged = mergeGeometries(flat, false);
  if (!merged) throw new Error('mergeAll: geometries are not compatible');
  new Set([...parts, ...flat]).forEach((g) => g.dispose());
  return finish(merged);
}
