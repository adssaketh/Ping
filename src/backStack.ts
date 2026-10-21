import { useEffect, useRef } from 'react';
import { smsBridge } from './services/smsBridge.ts';

/**
 * The back button closes the top-most thing first: a menu, a dialog, a chat, a tab ... and only when
 * nothing is left does Android take over (and leave the app). Every "layer" registers itself here while
 * it is open; the newest layer is closed first.
 */
interface Layer {
  id: number;
  run: () => void;
}

const layers: Layer[] = [];
let nextId = 1;

function syncNative() {
  smsBridge.setBackEnabled(layers.length > 0);
}

export function pushBackLayer(run: () => void): () => void {
  const id = nextId++;
  layers.push({ id, run });
  syncNative();
  return () => {
    const index = layers.findIndex((l) => l.id === id);
    if (index >= 0) layers.splice(index, 1);
    syncNative();
  };
}

/** Closes the newest layer. Returns false when there is nothing to close. */
export function handleBackPress(): boolean {
  const top = layers[layers.length - 1];
  if (!top) return false;
  top.run();
  return true;
}

/** Register `onBack` as a back-button layer while `active` is true. */
export function useBackHandler(active: boolean, onBack: () => void) {
  const latest = useRef(onBack);
  latest.current = onBack;
  useEffect(() => {
    if (!active) return;
    return pushBackLayer(() => latest.current());
  }, [active]);
}
