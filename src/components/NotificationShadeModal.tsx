import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring, springBouncy, fadeFast } from '../motion.ts';
import {
  Bell,
  Copy,
  Check,
  X,
  Trash2,
  ShieldCheck,
  CheckCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { formatConversationTime } from '../utils/smsUtils.ts';

interface NotificationShadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator: () => void;
}

export const NotificationShadeModal: React.FC<NotificationShadeModalProps> = ({
  isOpen,
  onClose,
  onOpenSimulator,
}) => {
  const {
    notifications,
    copyOtpFromNotification,
    selectConversation,
    clearAllNotifications,
    showOtpInNotifications,
    toggleShowOtpInNotifications,
    isNativeNotificationEnabled,
    requestNotificationPermission,
  } = useSMS();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  const handleCopy = async (id: string, code: string) => {
    const res = await copyOtpFromNotification(id);
    if (res) {
      setCopiedId(id);
      setToastMessage(`OTP ${res} copied to clipboard!`);
      setTimeout(() => {
        setCopiedId(null);
        setToastMessage(null);
      }, 2000);
    }
  };

  const handleOpenThread = (conversationId: string) => {
    selectConversation(conversationId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      key="overlay"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fadeFast}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Shade Container */}
      <motion.div
        className="relative w-full max-w-md bg-white dark:bg-m3-d2 rounded-3xl border border-m3-line dark:border-m3-d4 shadow-2xl p-4 sm:p-5 z-50 flex flex-col max-h-[85vh]"
        initial={{ opacity: 0, y: -48 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -32 }} transition={springBouncy}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-m3-line dark:border-m3-d4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-m3-primary-container dark:bg-m3-primary-deep flex items-center justify-center text-m3-primary dark:text-m3-primary-light">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-m3-on-surface dark:text-white">
                Notification Shade & OTP
              </h3>
              <p className="text-[11px] text-m3-outline dark:text-m3-outline-dk">
                Quick OTP copy from notification bar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                title="Clear all notifications"
                className="p-1.5 text-m3-outline hover:text-[#BA1A1A] rounded-full hover:bg-black/5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-m3-outline hover:text-m3-on-surface dark:hover:text-white rounded-full hover:bg-black/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Setting Toggles Box */}
        <div className="my-3 p-3 rounded-2xl bg-m3-surface-hi dark:bg-m3-d3 space-y-2 text-xs">
          {/* Show Copy OTP in Notification Bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-m3-on-surface dark:text-white">
                Show "Copy OTP" in Notification Bar
              </p>
              <p className="text-[11px] text-m3-outline dark:text-m3-outline-dk">
                Include one-tap copy button in heads-up banner & shade
              </p>
            </div>
            <button
              type="button"
              onClick={toggleShowOtpInNotifications}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                showOtpInNotifications ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  showOtpInNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Android System Notifications */}
          <div className="flex items-center justify-between pt-2 border-t border-m3-line dark:border-m3-d5">
            <div>
              <p className="font-semibold text-m3-on-surface dark:text-white">
                Native Android / System Notifications
              </p>
              <p className="text-[11px] text-m3-outline dark:text-m3-outline-dk">
                Show notifications outside browser when app is in background
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const granted = await requestNotificationPermission();
                if (granted) {
                  setToastMessage('System notification permission granted!');
                  setTimeout(() => setToastMessage(null), 2000);
                }
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                isNativeNotificationEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-m3-primary text-white hover:bg-m3-primary-hover'
              }`}
            >
              {isNativeNotificationEnabled ? 'Enabled' : 'Allow'}
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          {toastMessage && (
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center">
              {toastMessage}
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 rounded-full bg-m3-surface-hi dark:bg-m3-d3 flex items-center justify-center text-m3-outline mx-auto mb-2">
                <Bell className="w-6 h-6 stroke-1" />
              </div>
              <p className="text-xs font-semibold text-m3-on-surface dark:text-white">
                No active notifications
              </p>
              <p className="text-[11px] text-m3-outline dark:text-m3-outline-dk mt-0.5">
                When an SMS arrives with a bank or login code, a Copy OTP button will appear right here.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSimulator();
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-m3-primary-container dark:bg-m3-primary-deep text-m3-on-primary-deep dark:text-m3-primary-container rounded-full hover:opacity-90"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate OTP SMS</span>
              </button>
            </div>
          ) : (
            notifications.map((item) => {
              const isCopied = copiedId === item.id || item.isCopied;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenThread(item.conversationId)}
                  className="p-3 bg-m3-surface dark:bg-m3-d3 rounded-2xl border border-m3-line dark:border-m3-d5 hover:border-m3-primary/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] text-m3-outline dark:text-m3-outline-dk mb-1">
                    <span className="font-bold text-xs text-m3-primary dark:text-m3-primary-light">
                      {item.senderName}
                    </span>
                    <span>{formatConversationTime(item.timestamp)}</span>
                  </div>

                  <p className="text-xs text-m3-on-surface dark:text-m3-on-surface-dk mb-2 leading-relaxed">
                    {item.text}
                  </p>

                  {/* Copy OTP Button in notification */}
                  {item.otpCode && (
                    <div className="flex items-center justify-between pt-1 border-t border-m3-line dark:border-m3-d5">
                      <span className="text-xs font-mono font-bold tracking-wider text-m3-primary dark:text-m3-primary-light">
                        OTP: {item.otpCode}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item.id, item.otpCode!);
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-xs transition-all ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-m3-primary text-white hover:bg-m3-primary-hover active:scale-95'
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied!' : 'Copy OTP'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};
