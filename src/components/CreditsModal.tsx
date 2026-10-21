import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Code, Copy, Database, Heart, Wrench } from 'lucide-react';
import { spring, fadeFast } from '../motion.ts';
import { copyText } from '../utils/clipboard.ts';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PING_REPO = 'github.com/adssaketh/Ping';
const DATASET_REPO = 'github.com/junioralive/india-spam-sms-classification';

const BUILT_WITH = [
  'React',
  'Vite',
  'Tailwind CSS',
  'Motion',
  'Lucide icons',
  'Capacitor',
  'Roboto and your phone\u2019s own system fonts',
];

const LinkRow: React.FC<{ label: string; url: string }> = ({ label, url }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex items-center gap-3 p-3.5 rounded-2xl bg-m3-surface-hi dark:bg-m3-d3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-m3-outline dark:text-m3-outline-dk">{label}</p>
        <p className="text-xs font-mono truncate text-m3-on-surface dark:text-m3-on-surface-dk selectable-text">{url}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          if (await copyText(`https://${url}`)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }
        }}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 bg-white dark:bg-m3-d2 text-m3-primary dark:text-m3-primary-light"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? 'Copied' : 'Copy link'}</span>
      </button>
    </div>
  );
};

/** "Open source & credits" screen. Links are copied, not opened, because Ping stays offline. */
export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="credits-overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeFast}
        >
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-label="Open source and credits"
            className="relative w-full max-w-2xl h-full sm:h-[90vh] bg-m3-surface dark:bg-m3-d0 sm:rounded-[32px] border border-m3-line dark:border-m3-d4 shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 64, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={spring}
          >
            <div className="h-16 px-3 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 text-m3-variant dark:text-m3-variant-dk rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold text-m3-on-surface dark:text-white">Open source &amp; credits</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-6">
              {/* Open source */}
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.08 }}
                className="p-5 rounded-[28px] bg-m3-primary-container/70 dark:bg-m3-primary-deep/40"
              >
                <div className="w-12 h-12 rounded-2xl bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep flex items-center justify-center mb-3">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-m3-on-primary-deep dark:text-m3-primary-container">
                  Ping is open source
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-m3-on-primary-deep/85 dark:text-m3-primary-container/85">
                  Its complete source code is public, so anyone can read it, check what it does with their messages,
                  report problems and suggest improvements.
                </p>
                <LinkRow label="Ping source code" url={PING_REPO} />
              </motion.section>

              {/* Spam protection credit */}
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.14 }}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-[14px] bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light flex items-center justify-center shrink-0">
                    <Database className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="text-base font-semibold text-m3-on-surface dark:text-white">
                    Spam protection credits
                  </h3>
                </div>
                <div className="pl-12 text-sm leading-relaxed text-m3-variant dark:text-m3-variant-dk selectable-text">
                  <p>
                    Ping&rsquo;s spam protection is built from the <strong>Indian Telecom SMS Spam Collection</strong>
                    , a public dataset of labelled Indian SMS messages created and shared by <strong>junioralive</strong>{' '}
                    on GitHub (also published on Kaggle). Many thanks for making it available.
                  </p>
                  <LinkRow label="Dataset repository" url={DATASET_REPO} />
                  <p className="mt-3">
                    The dataset is used under the terms in that repository&rsquo;s LICENSE file. Only word statistics
                    derived from it are included in Ping; the original messages are not. The model also uses a small
                    set of examples and scam patterns written for Ping, and it keeps learning on your phone from your
                    own Not spam and Report spam choices.
                  </p>
                </div>
              </motion.section>

              {/* Built with */}
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-[14px] bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light flex items-center justify-center shrink-0">
                    <Wrench className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="text-base font-semibold text-m3-on-surface dark:text-white">Built with</h3>
                </div>
                <div className="pl-12 flex flex-wrap gap-2">
                  {BUILT_WITH.map((name) => (
                    <span
                      key={name}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-m3-surface-hi dark:bg-m3-d3 text-m3-variant dark:text-m3-variant-dk"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <p className="pl-12 mt-3 text-xs leading-relaxed text-m3-outline dark:text-m3-outline-dk">
                  Thanks to the people behind these open-source projects. Each is used under its own licence.
                </p>
              </motion.section>

              <div className="flex items-center gap-2 text-xs text-m3-outline dark:text-m3-outline-dk">
                <Heart className="w-4 h-4" />
                <span>Made with care. Ping never sends your messages anywhere.</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
