import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Moon, Smartphone, Sun } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { springBouncy } from '../motion.ts';

type Mode = 'system' | 'light' | 'dark';

// The previews use fixed colours (not the app's tokens) so the Light card always looks light and the Dark card
// always looks dark, whichever theme is active right now.
const PALETTE = {
  light: { bg: '#F8FAFD', bar: '#E0E2EC', card: '#D3E3FD', line: '#C4C7C5', text: '#1F1F1F', accent: '#0B57D0' },
  dark: { bg: '#111318', bar: '#2D3139', card: '#004A77', line: '#444746', text: '#E2E2E2', accent: '#A8C7FA' },
} as const;

/** A tiny inbox: search bar, "Latest" card and a few rows. Fills its (relative) parent. */
const Mock: React.FC<{ variant: 'light' | 'dark'; rows?: number }> = ({ variant, rows = 2 }) => {
  const c = PALETTE[variant];
  return (
    <div className="absolute inset-0 flex flex-col gap-1.5 p-2.5" style={{ background: c.bg }} aria-hidden="true">
      <div className="h-3.5 rounded-full shrink-0" style={{ background: c.bar }} />
      <div className="h-7 rounded-xl shrink-0 flex items-center gap-1.5 px-2" style={{ background: c.card }}>
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.accent }} />
        <div className="h-1.5 rounded-full flex-1" style={{ background: c.text, opacity: 0.7 }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.line }} />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 rounded-full" style={{ background: c.text, opacity: 0.55, width: i % 2 ? '55%' : '75%' }} />
            <div className="h-1 rounded-full w-1/2" style={{ background: c.line }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const OPTIONS: { mode: Mode; label: string; Icon: React.ElementType }[] = [
  { mode: 'system', label: 'System default', Icon: Smartphone },
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark', label: 'Dark', Icon: Moon },
];

/**
 * System default / Light / Dark as preview cards, with a larger live preview underneath. Choosing a card changes the
 * whole app straight away (and is saved), so the screen you are looking at is itself the live preview. "System default"
 * keeps following the phone's own light/dark setting.
 */
export const ThemePicker: React.FC = () => {
  const { settings, setThemeMode, isDarkMode } = useSMS();
  const current = settings.themeMode;
  const resolved: 'light' | 'dark' = isDarkMode ? 'dark' : 'light';

  return (
    <div className="w-full">
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2.5">
        {OPTIONS.map(({ mode, label, Icon }) => {
          const selected = current === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setThemeMode(mode)}
              className={`relative rounded-3xl p-1.5 border-2 text-left ${
                selected
                  ? 'border-m3-primary dark:border-m3-primary-light bg-m3-primary-container/60 dark:bg-m3-primary-deep/40'
                  : 'border-m3-line dark:border-m3-d4 bg-white dark:bg-m3-d1'
              }`}
            >
              <div className="relative h-24 rounded-[18px] overflow-hidden">
                {mode === 'system' ? (
                  <>
                    <Mock variant="light" />
                    <div className="absolute inset-0" style={{ clipPath: 'polygon(58% 0, 100% 0, 100% 100%, 38% 100%)' }}>
                      <Mock variant="dark" />
                    </div>
                  </>
                ) : (
                  <Mock variant={mode} />
                )}
              </div>
              <div className="flex items-center gap-1 mt-2 px-1 pb-0.5">
                <Icon className="w-3.5 h-3.5 shrink-0 text-m3-primary dark:text-m3-primary-light" />
                <span className="text-[11px] leading-tight font-semibold text-m3-on-surface dark:text-m3-on-surface-dk">
                  {label}
                </span>
              </div>
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={springBouncy}
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold mb-2 text-m3-variant dark:text-m3-variant-dk">
          Live preview: {resolved === 'dark' ? 'Dark' : 'Light'}
          {current === 'system' ? ' (from your phone)' : ''}
        </p>
        <div className="relative h-36 rounded-3xl overflow-hidden border border-m3-line dark:border-m3-d4">
          <AnimatePresence initial={false}>
            <motion.div
              key={resolved}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Mock variant={resolved} rows={3} />
            </motion.div>
          </AnimatePresence>
        </div>
        {current === 'system' && (
          <p className="text-xs mt-2 text-m3-variant dark:text-m3-variant-dk">
            System default follows your phone and changes by itself when you switch your phone between light and dark.
          </p>
        )}
      </div>
    </div>
  );
};
