import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Copy, Download, RefreshCw, Trash2 } from 'lucide-react';
import { spring, fadeFast } from '../motion.ts';
import { copyText } from '../utils/clipboard.ts';
import { clearAppLog, getAppLog } from '../utils/appLog.ts';
import { smsBridge } from '../services/smsBridge.ts';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

async function buildReport(): Promise<string> {
  const info = await smsBridge.getAppInfo();
  let native = { crash: '', exits: '', logcat: '' };
  try {
    native = await smsBridge.getNativeLogs();
  } catch (err) {
    native.logcat = `(could not read native logs: ${err instanceof Error ? err.message : String(err)})`;
  }
  return [
    '===== PING LOG =====',
    `Created: ${new Date().toString()}`,
    `App: ${info ? `${info.versionName} (build ${info.versionCode})` : 'web preview'}`,
    `Device: ${navigator.userAgent}`,
    '',
    '===== CRASH REPORTS (saved when the app crashed) =====',
    native.crash.trim() || '(none)',
    '',
    '===== WHY ANDROID ENDED EARLIER RUNS (newest first) =====',
    native.exits.trim() || '(none)',
    '',
    '===== APP LOG (recent activity and errors) =====',
    getAppLog() || '(empty)',
    '',
    '===== ANDROID SYSTEM LOG (this app only, recent) =====',
    native.logcat.trim() || '(empty)',
  ].join('\n');
}

/** Settings > Logs: shows recent activity and crash reports, with Copy and Save to file. */
export const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      setText(await buildReport());
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setNote('');
      void refresh();
    }
  }, [isOpen, refresh]);

  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(''), 2200);
  };

  const handleCopy = async () => flash((await copyText(text)) ? 'Copied' : 'Could not copy');

  const handleSave = async () => {
    try {
      const name = `ping-log-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
      if (smsBridge.isNative()) {
        const res = await smsBridge.saveTextFile(name, text);
        flash(res.saved ? 'Saved' : 'Cancelled');
      } else {
        const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
        flash('Saved');
      }
    } catch (err) {
      flash(`Could not save: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  };

  const handleClear = async () => {
    clearAppLog();
    try {
      await smsBridge.clearNativeLogs();
    } catch {
      /* ignore */
    }
    await refresh();
    flash('Cleared');
  };

  const btn =
    'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light disabled:opacity-50';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="logs-overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeFast}
        >
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Logs"
            className="will-change-transform relative w-full max-w-2xl h-full sm:h-[90vh] bg-m3-surface dark:bg-m3-d0 sm:rounded-[32px] border border-m3-line dark:border-m3-d4 shadow-2xl flex flex-col overflow-hidden"
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
              <h2 className="text-base font-semibold text-m3-on-surface dark:text-white">Logs</h2>
              {note && <span className="ml-auto mr-2 text-xs text-m3-outline dark:text-m3-outline-dk">{note}</span>}
            </div>

            <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
              <button type="button" className={btn} onClick={handleCopy} disabled={busy || !text}>
                {note === 'Copied' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy all</span>
              </button>
              <button type="button" className={btn} onClick={handleSave} disabled={busy || !text}>
                <Download className="w-3.5 h-3.5" />
                <span>Save to file</span>
              </button>
              <button type="button" className={btn} onClick={refresh} disabled={busy}>
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button type="button" className={btn} onClick={handleClear} disabled={busy}>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto px-4 pb-6">
              <pre className="selectable-text text-[11px] leading-snug font-mono whitespace-pre-wrap break-words text-m3-on-surface dark:text-m3-on-surface-dk p-3 rounded-2xl bg-m3-surface-hi dark:bg-m3-d2">
                {busy && !text ? 'Loading…' : text}
              </pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
