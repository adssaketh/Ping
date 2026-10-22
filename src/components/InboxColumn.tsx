import React, { useLayoutEffect, useRef, useState } from 'react';
import { useSMS } from '../context/SMSContext.tsx';

interface FadeEdgeProps {
  edge: 'top' | 'bottom';
  /** height of the bar this strip sits behind */
  bar: number;
  /** how far past the bar the fade reaches */
  fade: number;
  blurPx: number;
}

/**
 * Where messages disappear under a bar. Right behind the bar they are fully covered (so nothing smudges through
 * it), and just past the bar they come back gradually: two blur layers (soft, then strong nearer the bar) and a
 * tint that eases out, so there is never a visible edge.
 */
const FadeEdge: React.FC<FadeEdgeProps> = ({ edge, bar, fade, blurPx }) => {
  const toward = edge === 'top' ? 'to bottom' : 'to top';
  const total = bar + fade;
  const at = (k: number) => `${(((bar + fade * k) / total) * 100).toFixed(1)}%`;
  const mix = (p: number) => `color-mix(in oklab, var(--fade-base) ${p}%, transparent)`;
  const tint = `linear-gradient(${toward}, ${mix(97)} 0%, ${mix(97)} ${at(0)}, ${mix(86)} ${at(0.18)}, ${mix(62)} ${at(0.38)}, ${mix(34)} ${at(0.6)}, ${mix(12)} ${at(0.82)}, transparent 100%)`;
  const maskStrong = `linear-gradient(${toward}, black 0%, black ${at(0.05)}, transparent ${at(0.55)})`;
  const maskSoft = `linear-gradient(${toward}, black 0%, black ${at(0.3)}, transparent 100%)`;
  const soft = Math.max(2, Math.round(blurPx * 0.45));
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 z-10 pointer-events-none ${edge === 'top' ? 'top-0 fade-top' : 'bottom-0'}`}
      style={{ height: total }}
    >
      {blurPx > 0 && (
        <>
          <div
            className="absolute inset-0"
            style={{ backdropFilter: `blur(${soft}px)`, WebkitBackdropFilter: `blur(${soft}px)`, maskImage: maskSoft, WebkitMaskImage: maskSoft }}
          />
          <div
            className="absolute inset-0"
            style={{ backdropFilter: `blur(${blurPx}px)`, WebkitBackdropFilter: `blur(${blurPx}px)`, maskImage: maskStrong, WebkitMaskImage: maskStrong }}
          />
        </>
      )}
      <div className="absolute inset-0" style={{ background: tint }} />
    </div>
  );
};

interface InboxColumnProps {
  top: React.ReactNode;
  list: React.ReactNode;
  bottom: React.ReactNode;
}

/**
 * The search bar and the bottom bar float over the list instead of sitting beside it, so messages scroll
 * underneath them. The list learns how tall the bars are through --bar-top / --bar-bottom.
 */
export const InboxColumn: React.FC<InboxColumnProps> = ({ top, list, bottom }) => {
  const { settings } = useSMS();
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState({ top: 76, bottom: 84 });

  useLayoutEffect(() => {
    const measure = () =>
      setHeights((prev) => {
        const t = Math.round(topRef.current?.getBoundingClientRect().height ?? prev.top);
        const b = Math.round(bottomRef.current?.getBoundingClientRect().height ?? prev.bottom);
        return t === prev.top && b === prev.bottom ? prev : { top: t, bottom: b };
      });
    measure();
    const observer = new ResizeObserver(measure);
    if (topRef.current) observer.observe(topRef.current);
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, []);

  // blur: Off / Light / Medium / Strong. Older saved settings only had an on/off switch.
  const level = settings.edgeBlurLevel ?? (settings.edgeBlur === false ? 'off' : 'medium');
  const blurPx = { off: 0, light: 6, medium: 10, strong: 16 }[level];
  const fadeExtra = { short: 14, medium: 28, tall: 52 }[settings.edgeFade ?? 'medium'];

  return (
    <div
      className="relative flex-1 min-h-0 h-full overflow-hidden"
      style={{ '--bar-top': `${heights.top}px`, '--bar-bottom': `${heights.bottom}px` } as React.CSSProperties}
    >
      <div className="absolute inset-0 flex flex-col">{list}</div>

      {/* 16px extra: when the bar collapses this strip slides up by that much (CSS, see .fade-top) */}
      <FadeEdge edge="top" bar={heights.top} fade={fadeExtra + 16} blurPx={blurPx} />
      <div ref={topRef} className="absolute top-0 inset-x-0 z-20 pointer-events-none">
        {top}
      </div>

      {heights.bottom > 0 && <FadeEdge edge="bottom" bar={heights.bottom} fade={fadeExtra} blurPx={blurPx} />}
      <div ref={bottomRef} className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
        {bottom}
      </div>
    </div>
  );
};
