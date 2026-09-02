export type Layout = 'left' | 'right' | 'flank';

export interface Section {
  id: string;
  eyebrow: string;
  // 展示型标题：每个元素一行，换行由设计决定，不交给浏览器自动折
  title: string[];
  body: string;
  note?: string;
  stats?: [string, string][];
  layout: Layout;
}

export const SECTIONS: Section[] = [
  {
    id: 'hero',
    eyebrow: 'Aperture Works — Series XI',
    title: ['A camera made', 'of light itself.'],
    body: 'Thirty-six components, every one of them drawn in code. No imported model, no texture map. What you see is the mechanism.',
    note: 'Scroll to pull it apart. Keep scrolling and it puts itself back together, one subsystem at a time.',
    layout: 'left',
  },
  {
    id: 'teardown',
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
    eyebrow: '01 — Optics',
    title: ['Five elements.', 'One path.'],
    body: 'Bi-convex, meniscus, bi-concave, a cemented doublet, and the rear element. Every surface coated, so only the light that matters gets through.',
    layout: 'left',
  },
  {
    id: 'barrel',
    eyebrow: '02 — Barrel',
    title: ['Machined to', 'hold it still.'],
    body: 'Knurled focus and aperture rings, a distance scale running from 0.3 metres to infinity. Every ridge cut for a thumb that already knows where it is going.',
    layout: 'right',
  },
  {
    id: 'mechanism',
    eyebrow: '03 — Mechanism',
    title: ['Seven blades.', 'One decision.'],
    body: 'Shutter, mount, aperture. The parts that decide how much of the world reaches the sensor, and for how long.',
    layout: 'left',
  },
  {
    id: 'chassis',
    eyebrow: '04 — Chassis',
    title: ['Six panels,', 'one enclosure.'],
    body: 'Top plate, base plate, four walls and a leatherette wrap. The shell exists so that nothing inside it ever has to move.',
    layout: 'right',
  },
  {
    id: 'reassembly',
    eyebrow: 'Reassembly',
    title: ['Back to', 'one object.'],
    body: 'Thirty-six parts, one camera.',
    note: 'Drag anywhere to look around it.',
    layout: 'flank',
  },
];
