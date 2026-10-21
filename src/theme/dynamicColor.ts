/**
 * Material You (dynamic colour) support.
 *
 * On Android 12+ the phone derives tonal palettes from the wallpaper. The native plugin hands those
 * palettes to the web app, and this file turns them into the CSS colour slots declared in index.css.
 * When no palette is available (browser, older Android) the baseline Ping colours stay in place.
 */

/** Tone number ("0" ... "1000") -> "#RRGGBB" */
export type TonalPalette = Record<string, string>;

export interface SystemPalettes {
  supported: boolean;
  accent1?: TonalPalette;
  accent2?: TonalPalette;
  accent3?: TonalPalette;
  neutral1?: TonalPalette;
  neutral2?: TonalPalette;
}

const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const toHex = (rgb: [number, number, number]): string =>
  '#' +
  rgb
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

/** Blend `a` towards `b` by `t` (0 = a, 1 = b). */
const mix = (a: string, b: string, t: number): string => {
  const ra = toRgb(a);
  const rb = toRgb(b);
  return toHex([
    ra[0] + (rb[0] - ra[0]) * t,
    ra[1] + (rb[1] - ra[1]) * t,
    ra[2] + (rb[2] - ra[2]) * t,
  ]);
};

const SLOT_NAMES = [
  '--c-primary',
  '--c-primary-hover',
  '--c-primary-container',
  '--c-primary-light',
  '--c-primary-deep',
  '--c-on-primary-deep',
  '--c-on-surface',
  '--c-on-surface-dk',
  '--c-outline',
  '--c-outline-dk',
  '--c-variant',
  '--c-variant-dk',
  '--c-line',
  '--c-surface',
  '--c-surface-hi',
  '--c-d0',
  '--c-d1',
  '--c-d2',
  '--c-d3',
  '--c-d4',
  '--c-d5',
];

/** Builds the colour slots from the system palettes. Returns null if the palettes are incomplete. */
export function buildSlots(p: SystemPalettes | null): Record<string, string> | null {
  if (!p || !p.supported || !p.accent1 || !p.neutral1 || !p.neutral2) return null;
  const a = p.accent1;
  const n1 = p.neutral1;
  const n2 = p.neutral2;
  const needed = [a['600'], a['700'], a['100'], a['200'], a['900'], n1['10'], n1['50'], n1['800'], n1['900'], n1['1000']];
  if (needed.some((v) => !v)) return null;

  return {
    '--c-primary': a['600'],
    '--c-primary-hover': a['700'],
    '--c-primary-container': a['100'],
    '--c-primary-light': a['200'],
    '--c-primary-deep': a['700'],
    '--c-on-primary-deep': a['900'],

    '--c-on-surface': n1['900'],
    '--c-on-surface-dk': n1['100'] || n1['50'],
    '--c-outline': n2['500'] || n1['500'],
    '--c-outline-dk': n2['400'] || n1['400'],
    '--c-variant': n2['700'] || n1['700'],
    '--c-variant-dk': n2['200'] || n1['200'],
    '--c-line': n2['100'] || n1['100'],
    '--c-surface': n1['10'],
    '--c-surface-hi': n1['50'],

    // Dark surface ladder, darkest to lightest
    '--c-d0': mix(n1['1000'], n1['900'], 0.6),
    '--c-d1': mix(n1['900'], n1['800'], 0.25),
    '--c-d2': mix(n1['900'], n1['800'], 0.5),
    '--c-d3': mix(n1['900'], n1['800'], 0.8),
    '--c-d4': n1['800'],
    '--c-d5': mix(n1['800'], n1['700'] || n1['800'], 0.6),
  };
}

/** Applies (or, with null, clears) the dynamic colours on the page. */
export function applyPalette(p: SystemPalettes | null): void {
  const root = document.documentElement;
  const slots = buildSlots(p);
  if (!slots) {
    SLOT_NAMES.forEach((name) => root.style.removeProperty(name));
    return;
  }
  Object.entries(slots).forEach(([name, value]) => root.style.setProperty(name, value));
}
