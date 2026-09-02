'use client';

import { SECTIONS, getSections } from '@/lib/content';
import { scrollToSection } from '@/lib/scroll';
import { UI } from '@/lib/i18n';
import { useLang } from './LangProvider';
import LangToggle from './LangToggle';

// 容器一律 pointer-events-none，只有真正能点的元素放行 —— 否则顶部这条
// 会挡住拖拽，鼠标在那一带按下去转不动相机
export default function Nav() {
  const { lang } = useLang();
  const t = UI[lang];

  return (
    <header className="pointer-events-none fixed top-0 left-0 z-40 w-full">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-6 sm:px-10 lg:px-16">
        <button
          type="button"
          onClick={() => scrollToSection(0)}
          className="pointer-events-auto flex items-center gap-2.5 font-mono text-[0.68rem] tracking-[0.18em] text-[#14181C] uppercase transition-opacity hover:opacity-60"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#9A6A26]" />
          {t.wordmark}
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          <p className="font-mono text-[0.68rem] tracking-[0.16em] text-[#6A757E] uppercase tabular-nums">
            <span data-nav-index>01 / {String(SECTIONS.length).padStart(2, '0')}</span>
            <span className="hidden sm:inline"> · </span>
            <span data-nav-label className="hidden text-[#14181C] sm:inline">
              {getSections(lang)[0].nav}
            </span>
          </p>
          <LangToggle />
        </div>
      </div>
      <div className="h-px w-full bg-[#14181C]/10" />
    </header>
  );
}
