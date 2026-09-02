'use client';

import { ANNO_LIST, LEADER, SVG_H } from '@/lib/annotations';
import { useLang } from './LangProvider';

// 只出 DOM 骨架。位置、折线形状、入场进度全部由 AnnotationProjector 每帧写。
// 竖向偏移不能在这里定死 —— 锚点会动，固定偏移挡不住标签互相压
export default function AnnotationLayer() {
  const { lang } = useLang();
  const zh = lang === 'zh';

  return (
    <div className="pointer-events-none fixed inset-0 z-30 hidden overflow-hidden lg:block">
      {ANNO_LIST.map((a) => (
        <div
          key={a.id}
          data-anno={a.id}
          className="absolute top-0 left-0 will-change-transform"
          style={{ opacity: 0, transform: 'translate3d(-9999px,-9999px,0)' }}
        >
          <span
            data-anno-dot
            className="absolute block h-[7px] w-[7px] rounded-full bg-[#9A6A26] ring-2 ring-[#E6E9EC]/70"
            style={{ transform: 'translate(-50%,-50%) scale(0)' }}
          />

          <svg
            width={LEADER}
            height={SVG_H}
            viewBox={`0 0 ${LEADER} ${SVG_H}`}
            className="absolute overflow-visible"
            style={{ top: -SVG_H / 2, left: a.right ? 0 : -LEADER }}
            aria-hidden
          >
            <polyline
              data-anno-line
              fill="none"
              stroke="#9A6A26"
              strokeWidth={1.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div
            data-anno-text
            className={`absolute -translate-y-1/2 rounded-[2px] bg-[#E6E9EC]/85 px-1.5 py-1 ${
              a.right ? 'text-left' : 'text-right'
            }`}
            style={{ top: 0, [a.right ? 'left' : 'right']: LEADER + 4 }}
          >
            <span className="block font-mono text-[0.66rem] leading-tight font-medium tracking-[0.1em] whitespace-nowrap text-[#0E1216] uppercase">
              {zh ? a.zhLabel : a.label}
            </span>
            <span className="block font-mono text-[0.6rem] leading-tight tracking-[0.06em] whitespace-nowrap text-[#55606A]">
              {zh ? a.zhSpec : a.spec}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
