import AnnotationLayer from '@/components/AnnotationLayer';
import Cursor from '@/components/Cursor';
import Footer from '@/components/Footer';
import Preloader from '@/components/Preloader';
import Nav from '@/components/Nav';
import ProgressRail from '@/components/ProgressRail';
import Scene from '@/components/Scene';
import ScrollEngine from '@/components/ScrollEngine';
import SectionBlock from '@/components/SectionBlock';
import { SECTIONS } from '@/lib/content';

export default function Home() {
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
        Drag to orbit
      </p>

      <main className="pointer-events-none relative z-10">
        {SECTIONS.map((section, i) => (
          <SectionBlock key={section.id} section={section} index={i} />
        ))}
      </main>

      <Footer />
    </>
  );
}
