'use client';

import { useLang } from './LangProvider';

export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="pointer-events-auto flex items-center gap-1 font-mono text-[0.68rem] tracking-[0.12em]">
      {(['en', 'zh'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-[#14181C]/25">/</span>}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`transition-colors duration-200 ${
              lang === l ? 'text-[#8A5A16]' : 'text-[#6A757E] hover:text-[#14181C]'
            }`}
          >
            {l === 'en' ? 'EN' : '中'}
          </button>
        </span>
      ))}
    </div>
  );
}
