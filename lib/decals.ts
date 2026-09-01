import * as THREE from 'three';

// 刻度和字样全部在运行时用 Canvas 画出来，不引入任何图片文件
function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  draw(ctx);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

const INK = '#E8EDF1';
const AMBER = '#C08A45';

// 镜筒上的光圈刻度：一圈 f 值配长短刻度线
export function makeApertureScale() {
  return canvasTexture(2048, 256, (c) => {
    const stops = ['2', '2.8', '4', '5.6', '8', '11', '16', '22'];
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    stops.forEach((label, i) => {
      const x = ((i + 0.5) / stops.length) * 2048;

      c.strokeStyle = INK;
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(x, 150);
      c.lineTo(x, 196);
      c.stroke();

      c.fillStyle = i === 0 ? AMBER : INK;
      c.font = '700 76px ui-sans-serif, system-ui, sans-serif';
      c.fillText(label, x, 92);

      // 两个主刻度之间的半档细线
      const xm = x + 2048 / stops.length / 2;
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(216,222,227,0.55)';
      c.beginPath();
      c.moveTo(xm, 162);
      c.lineTo(xm, 190);
      c.stroke();
    });
  });
}

// 对焦距离刻度：从 0.3m 到无限远
export function makeDistanceScale() {
  return canvasTexture(2048, 256, (c) => {
    const stops = ['0.3', '0.5', '0.7', '1', '1.5', '3', '5', '∞'];
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    stops.forEach((label, i) => {
      const x = ((i + 0.5) / stops.length) * 2048;

      c.strokeStyle = INK;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x, 60);
      c.lineTo(x, 104);
      c.stroke();

      c.fillStyle = label === '∞' ? AMBER : INK;
      c.font = '600 68px ui-sans-serif, system-ui, sans-serif';
      c.fillText(label, x, 164);
    });

    // 对焦基准线
    c.fillStyle = AMBER;
    c.fillRect(1020, 24, 8, 34);
  });
}

// 铭牌环：型号与光学参数
export function makeNamePlate() {
  return canvasTexture(2048, 256, (c) => {
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = AMBER;
    c.font = '600 74px ui-sans-serif, system-ui, sans-serif';
    c.fillText('ASPHERICAL  23mm  1:2', 512, 128);

    c.fillStyle = INK;
    c.font = '500 58px ui-sans-serif, system-ui, sans-serif';
    c.fillText('Ø 49  ·  SERIES XI', 1536, 128);
  });
}

export function makeDecalMaterial(map: THREE.Texture) {
  return new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    // 半径几乎贴着宿主表面，靠多边形偏移把刻度压在表面之上，避免闪烁
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    color: new THREE.Color(0.88, 0.88, 0.88),
  });
}
