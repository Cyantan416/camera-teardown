export type Lang = 'en' | 'zh';

// ScrollEngine 和标注投影器每帧都要读语言，它们不在 React 树里，
// 拿不到 context，所以这里放一份可变镜像，由 LangProvider 同步
export const i18n = { lang: 'en' as Lang };

export const LANG_EVENT = 'lang-change';

export const UI = {
  en: {
    wordmark: 'Aperture Works',
    loading: 'Drawing thirty-six parts.',
    dragHint: 'Drag to orbit',
    backToTop: 'Back to the top',
    tagline: 'Series XI — a scroll-driven teardown',
    footTitle: ['Thirty-six parts,', 'none of them downloaded.'],
    footBody:
      'Every surface here is maths — lathed profiles, extruded shells and a single shader doing the light.',
    facts: [
      ['Geometry', 'Procedural BufferGeometry'],
      ['Materials', 'One custom GLSL shader'],
      ['Textures', 'Canvas-drawn at runtime'],
      ['Imported assets', 'None'],
    ] as [string, string][],
  },
  zh: {
    wordmark: 'Aperture Works',
    loading: '正在画三十六个零件。',
    dragHint: '拖动可旋转',
    backToTop: '回到顶部',
    tagline: '第十一代 — 滚动驱动的拆解',
    footTitle: ['三十六个零件，', '没有一个是下载来的。'],
    footBody:
      '这里每一个表面都是数学 —— 旋转成型的轮廓、挤出成型的壳体，和一个负责所有光照的着色器。',
    facts: [
      ['几何体', '程序化生成'],
      ['材质', '单个自写 GLSL 着色器'],
      ['贴图', '运行时 Canvas 绘制'],
      ['外部资源', '无'],
    ] as [string, string][],
  },
} as const;

export function readLangFromUrl(): Lang | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('lang');
  return v === 'zh' || v === 'en' ? v : null;
}
