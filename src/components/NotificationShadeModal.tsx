import React, { useState } from 'react';
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Shade Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E2228] rounded-3xl border border-[#E0E2EC] dark:border-[#2D3139] shadow-2xl p-4 sm:p-5 z-50 flex flex-col max-h-[85vh] animate-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E0E2EC] dark:border-[#2D3139]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D3E3FD] dark:bg-[#004A77] flex items-center justify-center text-[#0B57D0] dark:text-[#A8C7FA]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#1F1F1F] dark:text-white">
                Notification Shade & OTP
              </h3>
              <p className="text-[11px] text-[#747775] dark:text-[#8E918F]">
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
                className="p-1.5 text-[#747775] hover:text-[#BA1A1A] rounded-full hover:bg-black/5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white rounded-full hover:bg-black/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Setting Toggles Box */}
        <div className="my-3 p-3 rounded-2xl bg-[#EDF2FA] dark:bg-[#252A32] space-y-2 text-xs">
          {/* Show Copy OTP in Notification Bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#1F1F1F] dark:text-white">
                Show "Copy OTP" in Notification Bar
              </p>
              <p className="text-[11px] text-[#747775] dark:text-[#8E918F]">
                Include one-tap copy button in heads-up banner & shade
              </p>
            </div>
            <button
              type="button"
              onClick={toggleShowOtpInNotifications}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                showOtpInNotifications ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
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
          <div className="flex items-center justify-between pt-2 border-t border-[#E0E2EC] dark:border-[#353A44]">
            <div>
              <p className="font-semibold text-[#1F1F1F] dark:text-white">
                Native Android / System Notifications
              </p>
              <p className="text-[11px] text-[#747775] dark:text-[#8E918F]">
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
                  : 'bg-[#0B57D0] text-white hover:bg-[#0842A0]'
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
              <div className="w-12 h-12 rounded-full bg-[#EDF2FA] dark:bg-[#252A32] flex items-center justify-center text-[#747775] mx-auto mb-2">
                <Bell className="w-6 h-6 stroke-1" />
              </div>
              <p className="text-xs font-semibold text-[#1F1F1F] dark:text-white">
                No active notifications
              </p>
              <p className="text-[11px] text-[#747775] dark:text-[#8E918F] mt-0.5">
                When an SMS arrives with a bank or login code, a Copy OTP button will appear right here.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSimulator();
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#D3E3FD] rounded-full hover:opacity-90"
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
                  className="p-3 bg-[#F8FAFD] dark:bg-[#252A32] rounded-2xl border border-[#E0E2EC] dark:border-[#353A44] hover:border-[#0B57D0]/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#747775] dark:text-[#8E918F] mb-1">
                    <span className="font-bold text-xs text-[#0B57D0] dark:text-[#A8C7FA]">
                      {item.senderName}
                    </span>
                    <span>{formatConversationTime(item.timestamp)}</span>
                  </div>

                  <p className="text-xs text-[#1F1F1F] dark:text-[#E2E2E2] mb-2 leading-relaxed">
                    {item.text}
                  </p>

                  {/* Copy OTP Button in notification */}
                  {item.otpCode && (
                    <div className="flex items-center justify-between pt-1 border-t border-[#E0E2EC] dark:border-[#353A44]">
                      <span className="text-xs font-mono font-bold tracking-wider text-[#0B57D0] dark:text-[#A8C7FA]">
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
                            : 'bg-[#0B57D0] text-white hover:bg-[#0842A0] active:scale-95'
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
      </div>
    </div>
  );
};
