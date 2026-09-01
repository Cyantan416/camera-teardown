'use client';

import MagneticButton from './MagneticButton';
import { scrollToSection } from '@/lib/scroll';

const FACTS: [string, string][] = [
  ['Geometry', 'Procedural BufferGeometry'],
  ['Materials', 'One custom GLSL shader'],
  ['Textures', 'Canvas-drawn at runtime'],
  ['Imported assets', 'None'],
];

export default function Footer() {
  return (
    <footer className="pointer-events-auto relative z-10 bg-[var(--backdrop)]">
      <div className="mx-auto max-w-[1500px] px-6 pt-20 pb-12 sm:px-10 lg:px-16">
        <div className="h-px w-full bg-[#14181C]/12" />

        <div className="flex flex-col gap-12 pt-14 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[38ch]">
            <p className="flex items-center gap-2.5 font-mono text-[0.68rem] tracking-[0.18em] text-[#14181C] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9A6A26]" />
              Aperture Works
            </p>
            <p className="mt-6 font-display text-[1.6rem] leading-[1.2] font-semibold tracking-[-0.01em] text-[#14181C] sm:text-[2rem]">
              Thirty-six parts,
              <br />
              none of them downloaded.
            </p>
            <p className="mt-4 text-[0.95rem] leading-[1.7] text-[#414A53]">
              Every surface here is maths — lathed profiles, extruded shells and a
              single shader doing the light.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[0.6rem] tracking-[0.14em] text-[#6A757E] uppercase">
                  {k}
                </dt>
                <dd className="mt-1 font-mono text-[0.78rem] text-[#1B2026]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-16 flex flex-col items-start gap-8 border-t border-[#14181C]/12 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.62rem] tracking-[0.12em] text-[#6A757E] uppercase">
            Series XI — a scroll-driven teardown
          </p>
          <MagneticButton onClick={() => scrollToSection(0)}>
            Back to the top
          </MagneticButton>
        </div>
      </div>
    </footer>
  );
}
