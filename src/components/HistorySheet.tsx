import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, Check, History, RefreshCw } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { useBackHandler } from '../backStack.ts';
import { SkeletonRow, TopProgress } from './Skeleton.tsx';
import { spring, fadeFast } from '../motion.ts';

interface HistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/** "Show more": older messages are offered one year at a time, so loading never floods the app. */
export const HistorySheet: React.FC<HistorySheetProps> = ({ isOpen, onClose }) => {
  const { yearCounts, loadedYears, loadingYear, loadingYearCounts, fetchYearCounts, loadYear } = useSMS();

  useBackHandler(isOpen, onClose);
  useEffect(() => {
    if (isOpen) fetchYearCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="history-sheet"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          <motion.div
            className="fixed inset-0 bg-black/45"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeFast}
          />
          <motion.div
            role="dialog"
            aria-label="Older messages"
            className="will-change-transform relative w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-m3-d2 rounded-t-[32px] sm:rounded-[32px] shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring}
          >
            {loadingYear !== null && <TopProgress />}
            <div className="w-10 h-1.5 bg-m3-variant-dk dark:bg-m3-variant rounded-full mx-auto mt-3 sm:hidden" />

            <div className="px-6 pt-4 pb-3 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-m3-primary-container dark:bg-m3-primary-deep text-m3-primary dark:text-m3-primary-light flex items-center justify-center shrink-0">
                <History className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-m3-on-surface dark:text-white">Older messages</h2>
                <p className="text-xs text-m3-variant dark:text-m3-variant-dk">
                  Pick a year to load. Loaded years come back every time you open Ping.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-5">
              {loadingYearCounts && !yearCounts ? (
                <div role="status" aria-label="Finding your messages">
                  {[0, 1, 2, 3].map((i) => (
                    <SkeletonRow key={i} index={i} />
                  ))}
                </div>
              ) : yearCounts && yearCounts.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-m3-variant dark:text-m3-variant-dk">
                  No messages found on this phone.
                </p>
              ) : (
                (yearCounts || []).map((y, i) => {
                  const loaded = loadedYears.includes(y.year);
                  const loading = loadingYear === y.year;
                  return (
                    <motion.button
                      key={y.year}
                      type="button"
                      disabled={loaded || loadingYear !== null}
                      onClick={() => loadYear(y.year)}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring, delay: 0.05 + Math.min(i, 8) * 0.04 }}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-[24px] text-left hover:bg-m3-surface-hi dark:hover:bg-m3-d3 disabled:opacity-100"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light flex items-center justify-center shrink-0">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-m3-on-surface dark:text-white">{y.year}</p>
                        <p className="text-xs text-m3-variant dark:text-m3-variant-dk">
                          {y.count.toLocaleString()} {y.count === 1 ? 'message' : 'messages'}
                        </p>
                      </div>
                      {loaded ? (
                        <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container">
                          <Check className="w-3.5 h-3.5" />
                          Loaded
                        </span>
                      ) : loading ? (
                        <span className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Loading
                        </span>
                      ) : (
                        <span className="px-4 py-2 rounded-full text-xs font-semibold bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep">
                          Load
                        </span>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
