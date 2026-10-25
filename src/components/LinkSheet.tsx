import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Copy, ExternalLink, ShieldAlert } from 'lucide-react';
import { hostOf } from '../utils/linkify.ts';
import { copyText } from '../utils/clipboard.ts';
import { useBackHandler } from '../backStack.ts';
import { spring, fadeFast } from '../motion.ts';

interface LinkSheetProps {
  /** Address to open, or null when closed */
  url: string | null;
  /** The chat looks like spam: say so, in red */
  warn: boolean;
  onClose: () => void;
  onToast?: (text: string) => void;
}

/** "Open this link?" bottom sheet. Links in text messages are the usual way scams reach people, so ask first. */
export const LinkSheet: React.FC<LinkSheetProps> = ({ url, warn, onClose, onToast }) => {
  useBackHandler(!!url, onClose);

  // keep the content while the sheet slides away
  const last = useRef<string | null>(url);
  if (url) last.current = url;
  const shown = url ?? last.current;

  if (typeof document === 'undefined') return null;

  const host = shown ? hostOf(shown) : '';
  const numericHost = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const risky = warn || numericHost;

  const open = () => {
    if (shown) window.open(shown, '_blank');
    onClose();
  };
  const copy = async () => {
    if (shown && (await copyText(shown))) onToast?.('Link copied');
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {url && shown && (
        <motion.div
          key="link-sheet"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeFast}
        >
          <div className="fixed inset-0 bg-black/45" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Open link"
            className="will-change-transform relative w-full sm:max-w-sm max-h-[88vh] overflow-y-auto bg-white dark:bg-m3-d2 rounded-t-[32px] sm:rounded-[32px] shadow-2xl pb-5"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={spring}
          >
            <div className="w-10 h-1.5 bg-m3-variant-dk dark:bg-m3-variant rounded-full mx-auto mt-3 mb-3 sm:hidden" />

            <div className="px-6 pt-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    risky
                      ? 'bg-red-50 dark:bg-red-950/40 text-[#BA1A1A] dark:text-[#FFB4AB]'
                      : 'bg-m3-primary-container dark:bg-m3-primary-deep text-m3-primary dark:text-m3-primary-light'
                  }`}
                >
                  {risky ? <ShieldAlert className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-m3-on-surface dark:text-m3-on-surface-dk">Open this link?</h2>
                  <p className="text-xs text-m3-variant dark:text-m3-variant-dk">It opens in your browser, outside Ping.</p>
                </div>
              </div>

              <div className="mt-4 px-4 py-3 rounded-2xl bg-m3-surface-hi dark:bg-m3-d3">
                <p className="text-sm font-semibold text-m3-on-surface dark:text-m3-on-surface-dk break-all">{host}</p>
                <p className="mt-1 text-xs text-m3-variant dark:text-m3-variant-dk break-all selectable-text line-clamp-4">
                  {shown}
                </p>
              </div>

              <p
                className={`mt-3 text-xs leading-relaxed ${
                  risky ? 'text-[#BA1A1A] dark:text-[#FFB4AB] font-medium' : 'text-m3-variant dark:text-m3-variant-dk'
                }`}
              >
                {warn
                  ? 'This chat looks like spam. Do not open links or enter personal details or OTPs.'
                  : numericHost
                    ? 'This link goes to a number address, which real services rarely use. Be careful.'
                    : 'Links in text messages can be fake. Only open ones you expected, from senders you trust.'}
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-full text-sm font-semibold bg-m3-surface-hi dark:bg-m3-d3 text-m3-variant dark:text-m3-variant-dk active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={copy}
                  className="flex-1 py-3 rounded-full text-sm font-semibold bg-m3-surface-hi dark:bg-m3-d3 text-m3-on-surface dark:text-m3-on-surface-dk flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  type="button"
                  onClick={open}
                  className={`flex-[1.3] py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform ${
                    risky
                      ? 'bg-[#BA1A1A] text-white'
                      : 'bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" /> Open
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
