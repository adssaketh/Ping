import React from 'react';

/** Placeholder shapes with a soft light sweeping across them while real content loads. */
const Bar: React.FC<{ width: string; tall?: boolean }> = ({ width, tall }) => (
  <div className={`skeleton rounded-full ${tall ? 'h-3.5' : 'h-3'}`} style={{ width }} />
);

export const SkeletonRow: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div className="flex items-center gap-3.5 px-6 py-3.5" aria-hidden="true">
    <div className="skeleton w-12 h-12 rounded-full shrink-0" />
    <div className="flex-1 space-y-2.5">
      <div className="flex items-center justify-between gap-6">
        <Bar width={`${42 + ((index * 13) % 28)}%`} tall />
        <Bar width="11%" />
      </div>
      <Bar width={`${68 + ((index * 7) % 26)}%`} />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number; label?: string }> = ({ count = 6, label = 'Loading' }) => (
  <div role="status" aria-label={label}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonRow key={i} index={i} />
    ))}
  </div>
);

/** Thin bar that slides across the top of a screen while something is loading. */
export const TopProgress: React.FC = () => (
  <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden z-30 pointer-events-none" aria-hidden="true">
    <div className="top-progress-bar h-full w-1/3 rounded-full bg-m3-primary dark:bg-m3-primary-light" />
  </div>
);
