import React, { useLayoutEffect, useRef, useState } from 'react';
import { useSMS } from '../context/SMSContext.tsx';
import { useBarCollapsed } from '../utils/barCollapse.ts';

interface FadeEdgeProps {
  edge: 'top' | 'bottom';
  height: number;
  blurPx: number;
}

/**
 * The strip where messages disappear under a bar: they blur a little more the closer they get to the bar
 * and fade into the page colour, so nothing is cut off with a hard edge.
 */
const FadeEdge: React.FC<FadeEdgeProps> = ({ edge, height, blurPx }) => {
  const toward = edge === 'top' ? 'to bottom' : 'to top';
  const mask = `linear-gradient(${toward}, black 0%, black 35%, transparent 100%)`;
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 z-10 pointer-events-none ${edge === 'top' ? 'top-0' : 'bottom-0'}`}
      style={{ height, transition: 'height 320ms var(--ease-emphasized)' }}
    >
      {blurPx > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blurPx}px)`,
            WebkitBackdropFilter: `blur(${blurPx}px)`,
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(${toward}, var(--fade-solid) 0%, var(--fade-mid) 55%, transparent 100%)` }}
      />
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
  const barCollapsed = useBarCollapsed();
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

      {/* A collapsed bar is smaller, so its blur zone is shorter and a little softer too */}
      <FadeEdge
        edge="top"
        height={(barCollapsed ? Math.max(48, heights.top - 16) : heights.top) + fadeExtra * (barCollapsed ? 0.75 : 1)}
        blurPx={barCollapsed ? Math.round(blurPx * 0.8) : blurPx}
      />
      <div ref={topRef} className="absolute top-0 inset-x-0 z-20 pointer-events-none">
        {top}
      </div>

      {heights.bottom > 0 && <FadeEdge edge="bottom" height={heights.bottom + fadeExtra} blurPx={blurPx} />}
      <div ref={bottomRef} className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
        {bottom}
      </div>
    </div>
  );
};
