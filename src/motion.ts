import { useEffect, useState } from 'react';

/**
 * Shared motion language (Material 3 Expressive): springs with a little overshoot for things that
 * move, short emphasized-easing fades for things that appear in place.
 */
export const spring = { type: 'spring', stiffness: 420, damping: 36, mass: 0.9 } as const;
export const springBouncy = { type: 'spring', stiffness: 520, damping: 26, mass: 0.85 } as const;
export const springSoft = { type: 'spring', stiffness: 300, damping: 34, mass: 1 } as const;

const emphasized: [number, number, number, number] = [0.2, 0, 0, 1];
export const fadeFast = { duration: 0.18, ease: emphasized };

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Tablet width and up (768px): conversation list and chat side by side. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/** Large tablet / desktop width (1280px): a permanent navigation sidebar is added as a third pane. */
export function useIsWide(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}
