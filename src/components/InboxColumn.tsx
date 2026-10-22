import React, { useLayoutEffect, useRef, useState } from 'react';
import { useSMS } from '../context/SMSContext.tsx';

interface BlurStripProps {
  edge: 'top' | 'bottom';
  /** messages are fully hidden up to here (px from the screen edge) */
  hide: number;
  /** ...and fully visible again from here */
  full: number;
  blurPx: number;
}

/**
 * The blur part of "Fade + blur". It only sits inside the zone where messages are fading out, and it is strongest
 * next to the bar and gone by the time the messages are fully visible (two layers: soft, then strong).
 */
const BlurStrip: React.FC<BlurStripProps> = ({ edge, hide, full, blurPx }) => {
  const toward = edge === 'top' ? 'to bottom' : 'to top';
  const span = Math.max(1, full - hide);
  const strong = `linear-gradient(${toward}, black 0, black ${hide}px, transparent ${hide + span * 0.7}px)`;
  const soft = `linear-gradient(${toward}, black 0, black ${hide + span * 0.15}px, transparent ${full}px)`;
  const softPx = Math.max(2, Math.round(blurPx * 0.45));
  const layer = (px: number, mask: string): React.CSSProperties => ({
    backdropFilter: `blur(${px}px)`,
    WebkitBackdropFilter: `blur(${px}px)`,
    maskImage: mask,
    WebkitMaskImage: mask,
  });
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 z-10 pointer-events-none ${edge === 'top' ? 'top-0 fade-top' : 'bottom-0'}`}
      style={{ height: full + (edge === 'top' ? 16 : 0) }}
    >
      <div className="absolute inset-0" style={layer(softPx, soft)} />
      <div className="absolute inset-0" style={layer(blurPx, strong)} />
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
 * underneath them. The list learns how tall the bars are through --bar-top / --bar-bottom, and fades its own
 * edges with a mask (.edge-mask in index.css) so messages vanish cleanly whatever colour they are.
 */
export const InboxColumn: React.FC<InboxColumnProps> = ({ top, list, bottom }) => {
  const { settings } = useSMS();
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState({ top: 68, bottom: 76 });

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

  const effect = settings.edgeEffect ?? 'fade';
  const glass = settings.barStyle === 'glass';
  const fadeExtra = { short: 12, medium: 24, tall: 44 }[settings.edgeFade ?? 'medium'];
  const blurPx = { off: 10, light: 6, medium: 10, strong: 16 }[settings.edgeBlurLevel ?? 'medium'];

  // Solid bars hide what is behind them, so messages are gone by the middle of the bar and are back in full a bit
  // below it. Glass bars show messages through them, so the fade starts at the very edge of the screen.
  const topHide = glass ? 0 : Math.round(heights.top * 0.5);
  const topFull = glass ? Math.round(heights.top * 0.8 + fadeExtra * 0.6) : heights.top + fadeExtra;
  const botHide = glass ? 0 : Math.round(heights.bottom * 0.45);
  const botFull = glass ? Math.round(heights.bottom * 0.8 + fadeExtra * 0.6) : heights.bottom + fadeExtra;

  return (
    <div
      data-edge={effect}
      className="relative flex-1 min-h-0 h-full overflow-hidden"
      style={
        {
          '--bar-top': `${heights.top}px`,
          '--bar-bottom': `${heights.bottom}px`,
          '--edge-top-hide': `${topHide}px`,
          '--edge-top-full': `${topFull}px`,
          '--edge-bot-hide': `${botHide}px`,
          '--edge-bot-full': `${botFull}px`,
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 flex flex-col">{list}</div>

      {effect === 'blur' && <BlurStrip edge="top" hide={topHide} full={topFull} blurPx={blurPx} />}
      <div ref={topRef} className="absolute top-0 inset-x-0 z-20 pointer-events-none">
        {top}
      </div>

      {effect === 'blur' && heights.bottom > 0 && (
        <BlurStrip edge="bottom" hide={botHide} full={botFull} blurPx={blurPx} />
      )}
      <div ref={bottomRef} className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
        {bottom}
      </div>
    </div>
  );
};
