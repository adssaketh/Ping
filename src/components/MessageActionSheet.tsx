import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Info, KeyRound, Star, Trash2 } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { Message } from '../types.ts';
import { calculateSmsCount, extractOtpCode, formatFullDateTime } from '../utils/smsUtils.ts';
import { copyText } from '../utils/clipboard.ts';
import { spring, fadeFast } from '../motion.ts';

interface MessageActionSheetProps {
  message: Message | null;
  onClose: () => void;
  onToast?: (text: string) => void;
}

/** Bottom sheet for a single message, opened by long-pressing its bubble. */
export const MessageActionSheet: React.FC<MessageActionSheetProps> = ({ message, onClose, onToast }) => {
  const { toggleStarMessage, deleteMessage, messages } = useSMS();
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // keep the content while the sheet slides away
  const last = useRef<Message | null>(message);
  if (message) last.current = message;
  const shown = message ?? last.current;
  // use the live copy so the star state updates straight away
  const live = shown ? messages.find((m) => m.id === shown.id) ?? shown : null;

  useEffect(() => {
    if (message) {
      setShowDetails(false);
      setConfirmDelete(false);
    }
  }, [message]);

  if (typeof document === 'undefined') return null;

  const otp = live && live.sender !== 'me' ? extractOtpCode(live.text) : null;
  const sms = live ? calculateSmsCount(live.text) : null;
  const isMe = live?.sender === 'me';

  const copy = async (text: string, toast: string) => {
    if (await copyText(text)) onToast?.(toast);
    onClose();
  };

  const rowClass =
    'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium text-m3-on-surface dark:text-m3-on-surface-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3';

  return createPortal(
    <AnimatePresence>
      {message && live && (
        <motion.div
          key="message-sheet"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeFast}
        >
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Message options"
            className="relative w-full sm:max-w-sm max-h-[88vh] overflow-y-auto bg-white dark:bg-m3-d2 rounded-t-[32px] sm:rounded-[32px] shadow-2xl pb-3"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={spring}
          >
            <div className="w-10 h-1.5 bg-m3-variant-dk dark:bg-m3-variant rounded-full mx-auto mt-3 mb-3 sm:hidden" />

            <p className="mx-5 mb-3 px-4 py-3 rounded-2xl bg-m3-surface-hi dark:bg-m3-d3 text-xs leading-relaxed text-m3-variant dark:text-m3-variant-dk line-clamp-4 break-words">
              {live.text}
            </p>

            <div className="px-2">
              {confirmDelete ? (
                <div className="mx-3 my-2 p-4 rounded-3xl bg-red-50 dark:bg-red-950/30">
                  <p className="text-sm font-semibold text-[#BA1A1A] dark:text-[#FFB4AB]">Delete this message?</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-white dark:bg-m3-d3 text-m3-variant dark:text-m3-variant-dk"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteMessage(live.id);
                        onClose();
                      }}
                      className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-[#BA1A1A] text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {otp && (
                    <button type="button" className={rowClass} onClick={() => copy(otp, `Verification code ${otp} copied!`)}>
                      <KeyRound className="w-5 h-5 text-m3-variant dark:text-m3-variant-dk" />
                      <span>Copy OTP {otp}</span>
                    </button>
                  )}
                  <button type="button" className={rowClass} onClick={() => copy(live.text, 'Copied to clipboard')}>
                    <Copy className="w-5 h-5 text-m3-variant dark:text-m3-variant-dk" />
                    <span>Copy text</span>
                  </button>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => {
                      toggleStarMessage(live.id);
                      onClose();
                    }}
                  >
                    <Star
                      className={`w-5 h-5 ${live.isStarred ? 'text-amber-500 fill-amber-500' : 'text-m3-variant dark:text-m3-variant-dk'}`}
                    />
                    <span>{live.isStarred ? 'Remove star' : 'Star message'}</span>
                  </button>
                  <button type="button" className={rowClass} onClick={() => setShowDetails((v) => !v)}>
                    <Info className="w-5 h-5 text-m3-variant dark:text-m3-variant-dk" />
                    <span>Message details</span>
                  </button>

                  <AnimatePresence initial={false}>
                    {showDetails && sms && (
                      <motion.dl
                        key="details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={spring}
                        className="mx-4 mb-2 px-4 py-3 rounded-2xl bg-m3-surface-hi dark:bg-m3-d3 text-xs overflow-hidden"
                      >
                        <div className="flex justify-between py-1">
                          <dt className="text-m3-outline dark:text-m3-outline-dk">{isMe ? 'Sent' : 'Received'}</dt>
                          <dd className="font-medium text-m3-on-surface dark:text-m3-on-surface-dk text-right">
                            {formatFullDateTime(live.timestamp)}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-m3-outline dark:text-m3-outline-dk">Characters</dt>
                          <dd className="font-medium text-m3-on-surface dark:text-m3-on-surface-dk">{sms.charCount}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-m3-outline dark:text-m3-outline-dk">SMS parts</dt>
                          <dd className="font-medium text-m3-on-surface dark:text-m3-on-surface-dk">
                            {sms.segmentCount} ({sms.isGsm ? 'standard' : 'unicode'})
                          </dd>
                        </div>
                        {isMe && (
                          <div className="flex justify-between py-1">
                            <dt className="text-m3-outline dark:text-m3-outline-dk">Status</dt>
                            <dd className="font-medium text-m3-on-surface dark:text-m3-on-surface-dk capitalize">
                              {live.status}
                            </dd>
                          </div>
                        )}
                      </motion.dl>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium text-[#BA1A1A] dark:text-[#FFB4AB] hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete message</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
