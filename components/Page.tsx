'use client';

import AnnotationLayer from '@/components/AnnotationLayer';
import Cursor from '@/components/Cursor';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import Preloader from '@/components/Preloader';
import ProgressRail from '@/components/ProgressRail';
import Scene from '@/components/Scene';
import ScrollEngine from '@/components/ScrollEngine';
import SectionBlock from '@/components/SectionBlock';
import { getSections } from '@/lib/content';
import { UI } from '@/lib/i18n';
import { useLang } from '@/components/LangProvider';

export default function Page() {
  const { lang } = useLang();

  return (
    <>
      <Scene />
      <ScrollEngine />

      <Preloader />
      <Cursor />
      <Nav />
      <ProgressRail />
      <AnnotationLayer />

      <div
        data-progress
        className="fixed top-0 left-0 z-30 h-px w-full origin-left bg-black/30"
        style={{ transform: 'scaleX(0)' }}
      />

      <div className="grain pointer-events-none fixed inset-0 z-20" aria-hidden />

      <p
        data-hint
        className="pointer-events-none fixed bottom-6 left-6 z-40 font-mono text-[0.6rem] tracking-[0.14em] text-[#6A757E] uppercase sm:left-10 lg:left-16"
      >
        {UI[lang].dragHint}
      </p>

      <main className="pointer-events-none relative z-10">
        {getSections(lang).map((section, i) => (
          <SectionBlock key={section.id} section={section} index={i} />
        ))}
      </main>

      <Footer />
    </>
  );
}
