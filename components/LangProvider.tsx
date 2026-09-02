'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { i18n, readLangFromUrl, LANG_EVENT, type Lang } from '@/lib/i18n';

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'en',
  setLang: () => {},
});

export const useLang = () => useContext(Ctx);

const KEY = 'camera-teardown-lang';

export default function LangProvider({ children }: { children: ReactNode }) {
  // 服务端渲染时必须是 en，否则首屏 HTML 和客户端对不上会报 hydration 错
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    let next = readLangFromUrl();
    if (!next) {
      const saved = localStorage.getItem(KEY);
      if (saved === 'zh' || saved === 'en') next = saved;
    }
    if (next && next !== 'en') apply(next);
  }, []);

  const apply = (l: Lang) => {
    setLangState(l);
    // 命令式那边（ScrollEngine / 投影器）读的是这份镜像
    i18n.lang = l;
    document.documentElement.lang = l === 'zh' ? 'zh-Hans' : 'en';
    window.dispatchEvent(new Event(LANG_EVENT));
  };

  const setLang = (l: Lang) => {
    if (l === lang) return;
    apply(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // 无痕模式下写不了，忽略
    }
    const url = new URL(window.location.href);
    if (l === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', l);
    window.history.replaceState(null, '', url);
  };

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}
