import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring, springBouncy } from '../motion.ts';
import { Copy, Check, X, CheckCheck, MessageSquare, ShieldCheck } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';

export const NotificationBanner: React.FC = () => {
  const {
    activeBanner,
    dismissBanner,
    copyOtpFromNotification,
    selectConversation,
    markAsRead,
  } = useSMS();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep the last banner around so it can slide out smoothly after it is dismissed
  const lastBanner = useRef(activeBanner);
  if (activeBanner) lastBanner.current = activeBanner;
  const banner = activeBanner ?? lastBanner.current;

  if (!banner) return null;

  const handleCopyOtp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!banner.otpCode) return;
    const copied = await copyOtpFromNotification(banner.id);
    if (copied) {
      setToastMessage(`OTP ${copied} copied to clipboard!`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(banner.conversationId);
    dismissBanner();
  };

  const handleOpenChat = () => {
    selectConversation(banner.conversationId);
    dismissBanner();
  };

  return (
    <>
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="otp-toast"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-60 bg-m3-on-surface text-white dark:bg-m3-on-surface-dk dark:text-m3-on-surface px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2"
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={springBouncy}
          >
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Android 14/15 Heads-up Notification Banner */}
      <AnimatePresence>
        {activeBanner && (
      <motion.div
        key={activeBanner.id}
        className="absolute top-2 left-3 right-3 sm:left-4 sm:right-4 z-50 pointer-events-auto"
        initial={{ opacity: 0, y: -90, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -70, scale: 0.96 }}
        transition={spring}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.6, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -24) dismissBanner();
        }}
      >
        <div
          onClick={handleOpenChat}
          className="w-full bg-white/95 dark:bg-m3-d2/95 rounded-3xl p-3.5 shadow-xl border border-m3-line dark:border-m3-d4 cursor-pointer hover:shadow-2xl transition-all"
        >
          {/* Notification Header */}
          <div className="flex items-center justify-between text-xs text-m3-outline dark:text-m3-outline-dk mb-1.5">
            <div className="flex items-center gap-1.5">
              <img src="/ping-icon.png" alt="Ping" className="w-4 h-4 rounded-md object-cover" />
              <span className="font-semibold text-m3-on-surface dark:text-white">Ping</span>
              <span>·</span>
              <span>now</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissBanner();
              }}
              className="p-1 -mr-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-m3-outline dark:text-m3-outline-dk"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contact & Message Preview */}
          <div className="mb-2.5">
            <h4 className="text-sm font-bold text-m3-on-surface dark:text-white truncate">
              {banner.senderName}
            </h4>
            <p className="text-xs text-m3-variant dark:text-m3-variant-dk line-clamp-2 mt-0.5 leading-relaxed">
              {banner.text}
            </p>
          </div>

          {/* Android Action Buttons Row */}
          <div className="flex items-center gap-2 pt-1 border-t border-m3-line/70 dark:border-m3-d4/70">
            {banner.otpCode ? (
              /* High-Priority COPY OTP Action */
              <button
                type="button"
                onClick={handleCopyOtp}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 ${
                  banner.isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-m3-primary text-white hover:bg-m3-primary-hover dark:bg-m3-primary-light dark:text-m3-on-primary-deep'
                }`}
              >
                {banner.isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied {banner.otpCode}!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy OTP: {banner.otpCode}</span>
                  </>
                )}
              </button>
            ) : null}

            {/* Mark as read */}
            <button
              type="button"
              onClick={handleMarkRead}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark as read</span>
            </button>
          </div>
        </div>
      </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
