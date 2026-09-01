import { SECTION_VH } from './state';

// Lenis 活在 ScrollEngine 的 effect 里，Nav 和 rail 拿不到它。
// 让 ScrollEngine 把跳转函数注册进来，比往 window 上挂全局干净
type Jump = (target: number) => void;

let jump: Jump | null = null;

export function registerJump(fn: Jump | null) {
  jump = fn;
}

export function sectionOffset(i: number) {
  // 落在 i + 0.15：面板在 local 0–0.5 之间才完整可见，留点余量
  return i === 0 ? 0 : (i + 0.15) * window.innerHeight * SECTION_VH;
}

export function scrollToSection(i: number) {
  const target = sectionOffset(i);
  if (jump) jump(target);
  else window.scrollTo({ top: target, behavior: 'smooth' });
}
