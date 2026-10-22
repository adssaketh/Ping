import { useSyncExternalStore } from 'react';

/**
 * Whether the top bar is collapsed (search turned into an icon, "Ping" in the middle) because the list is being
 * scrolled. Kept in a tiny store of its own so toggling it never re-renders the whole app.
 */
let collapsed = false;
const listeners = new Set<() => void>();

export const barCollapse = {
  get: () => collapsed,
  set(value: boolean) {
    if (value === collapsed) return;
    collapsed = value;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useBarCollapsed(): boolean {
  return useSyncExternalStore(barCollapse.subscribe, barCollapse.get, barCollapse.get);
}
