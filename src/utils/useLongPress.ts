import { useCallback, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

export interface PressHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (e: ReactMouseEvent) => void;
}

/**
 * Long-press detection for list rows and message bubbles. `bind(item)` returns the event handlers
 * to spread on an element; moving the finger more than 10px (scrolling or swiping) cancels it.
 * Call `consumeClick()` at the start of the element's onClick: it returns true once when the click
 * is only the release of a long press and should be ignored.
 */
export function useLongPress<T>(onLongPress: (item: T) => void, delayMs = 450) {
  const timer = useRef<number | undefined>(undefined);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    start.current = null;
  }, []);

  const bind = useCallback(
    (item: T): PressHandlers => ({
      onPointerDown: (e: ReactPointerEvent) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        fired.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          fired.current = true;
          try {
            navigator.vibrate?.(18);
          } catch {
            /* vibration is optional */
          }
          window.getSelection?.()?.removeAllRanges();
          onLongPress(item);
        }, delayMs);
      },
      onPointerMove: (e: ReactPointerEvent) => {
        const s = start.current;
        if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) clear();
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onContextMenu: (e: ReactMouseEvent) => {
        e.preventDefault();
      },
    }),
    [onLongPress, delayMs, clear]
  );

  const consumeClick = useCallback(() => {
    if (fired.current) {
      fired.current = false;
      return true;
    }
    return false;
  }, []);

  return { bind, consumeClick };
}
