import React, { useState } from 'react';
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

  if (!activeBanner) return null;

  const handleCopyOtp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeBanner.otpCode) return;
    const copied = await copyOtpFromNotification(activeBanner.id);
    if (copied) {
      setToastMessage(`OTP ${copied} copied to clipboard!`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(activeBanner.conversationId);
    dismissBanner();
  };

  const handleOpenChat = () => {
    selectConversation(activeBanner.conversationId);
    dismissBanner();
  };

  return (
    <>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-60 bg-[#1F1F1F] text-white dark:bg-[#E2E2E2] dark:text-[#1F1F1F] px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Android 14/15 Heads-up Notification Banner */}
      <div className="absolute top-2 left-3 right-3 sm:left-4 sm:right-4 z-50 pointer-events-auto animate-in slide-in-from-top-4 duration-200">
        <div
          onClick={handleOpenChat}
          className="w-full bg-white/95 dark:bg-[#1E2228]/95 backdrop-blur-md rounded-3xl p-3.5 shadow-xl border border-[#E0E2EC] dark:border-[#2D3139] cursor-pointer hover:shadow-2xl transition-all"
        >
          {/* Notification Header */}
          <div className="flex items-center justify-between text-xs text-[#747775] dark:text-[#8E918F] mb-1.5">
            <div className="flex items-center gap-1.5">
              <img src="/ping-icon.png" alt="Ping" className="w-4 h-4 rounded-md object-cover" />
              <span className="font-semibold text-[#1F1F1F] dark:text-white">Ping</span>
              <span>·</span>
              <span>now</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissBanner();
              }}
              className="p-1 -mr-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#747775] dark:text-[#8E918F]"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contact & Message Preview */}
          <div className="mb-2.5">
            <h4 className="text-sm font-bold text-[#1F1F1F] dark:text-white truncate">
              {activeBanner.senderName}
            </h4>
            <p className="text-xs text-[#444746] dark:text-[#C4C7C5] line-clamp-2 mt-0.5 leading-relaxed">
              {activeBanner.text}
            </p>
          </div>

          {/* Android Action Buttons Row */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#E0E2EC]/70 dark:border-[#2D3139]/70">
            {activeBanner.otpCode ? (
              /* High-Priority COPY OTP Action */
              <button
                type="button"
                onClick={handleCopyOtp}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 ${
                  activeBanner.isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0B57D0] text-white hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:text-[#041E49]'
                }`}
              >
                {activeBanner.isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied {activeBanner.otpCode}!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy OTP: {activeBanner.otpCode}</span>
                  </>
                )}
              </button>
            ) : null}

            {/* Mark as read */}
            <button
              type="button"
              onClick={handleMarkRead}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#282C35] transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark as read</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
