'use client';

import { getSections } from '@/lib/content';
import { scrollToSection } from '@/lib/scroll';
import { useLang } from './LangProvider';

// 竖轴刻度：当前那格变长变铜色并显示章节名，右侧细轴填充表示总进度。
// 手机和 iPad 竖屏收起，改用顶部那条 1px 线
export default function ProgressRail() {
  const { lang } = useLang();
  const sections = getSections(lang);

  return (
    <nav
      data-rail
      aria-label="Sections"
      className="pointer-events-none fixed top-1/2 right-6 z-40 hidden -translate-y-1/2 lg:block"
    >
      <div className="relative pr-4">
        <div className="absolute top-0 right-0 bottom-0 w-px bg-[#14181C]/12">
          <div
            data-rail-fill
            className="absolute inset-x-0 top-0 h-full origin-top bg-[#9A6A26]"
            style={{ transform: 'scaleY(0)' }}
          />
        </div>

        <div className="flex flex-col items-end gap-3.5">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              data-rail-tick
              data-on={i === 0 ? '1' : '0'}
              onClick={() => scrollToSection(i)}
              aria-label={s.nav}
              className="group pointer-events-auto flex items-center gap-2.5 py-1"
            >
              <span className="font-mono text-[0.6rem] tracking-[0.14em] text-[#14181C] uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-data-[on=1]:opacity-100">
                {s.nav}
              </span>
              <span className="h-px w-3.5 bg-[#14181C]/30 transition-all duration-300 group-hover:w-6 group-data-[on=1]:w-7 group-data-[on=1]:bg-[#9A6A26]" />
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
