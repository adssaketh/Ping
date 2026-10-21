import React, { useState } from 'react';
import { Sparkles, X, MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';

interface IncomingSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncomingSimulatorModal: React.FC<IncomingSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { conversations, simulateIncomingSms, startNewConversation } = useSMS();

  const [selectedConvId, setSelectedConvId] = useState<string>(
    conversations[0]?.id || ''
  );
  const [customSender, setCustomSender] = useState('');
  const [messageText, setMessageText] = useState('');

  if (!isOpen) return null;

  const otpPresets = [
    {
      label: 'Chase Bank OTP (849201)',
      senderId: conversations.find((c) => c.contactName.includes('Chase'))?.id,
      text: 'Your Chase verification code is 849201. Do not share this code with anyone. Valid for 10 minutes.',
    },
    {
      label: 'Google Login OTP (492019)',
      senderId: null,
      customName: 'Google',
      text: 'G-492019 is your Google verification code for signing in.',
    },
    {
      label: 'Amazon Sign-In (681320)',
      senderId: null,
      customName: 'Amazon',
      text: '681320 is your Amazon OTP. Do not share it with anyone.',
    },
  ];

  const standardTemplates = [
    'Hey! Are you still free to meet up today?',
    'Flight update: All gates are on schedule.',
    'Sounds like a plan! See you soon.',
  ];

  const handleSimulatePreset = (preset: typeof otpPresets[0]) => {
    let targetId = preset.senderId;
    if (!targetId) {
      targetId = startNewConversation({
        name: preset.customName || 'Verification Service',
        phoneNumber: '22000',
      });
    }
    simulateIncomingSms(targetId, preset.text);
    onClose();
  };

  const handleSimulate = () => {
    if (!messageText.trim()) return;

    let targetId = selectedConvId;
    if (selectedConvId === 'new') {
      const senderName = customSender.trim() || 'Unknown Sender';
      targetId = startNewConversation({
        name: senderName,
        phoneNumber: '+1 (555) 019-2831',
      });
    }

    simulateIncomingSms(targetId, messageText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E2228] rounded-3xl border border-[#E0E2EC] dark:border-[#2D3139] shadow-2xl p-6 z-50 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D3E3FD] dark:bg-[#004A77] flex items-center justify-center text-[#0B57D0] dark:text-[#A8C7FA]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#1F1F1F] dark:text-white">
                Simulate Incoming SMS & OTP
              </h3>
              <p className="text-[11px] text-[#747775] dark:text-[#8E918F]">
                Test the "Copy OTP" banner notification bar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white rounded-full hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Tap OTP Simulation Presets */}
        <div className="mb-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#0B57D0] dark:text-[#A8C7FA] mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Instant 1-Tap OTP Test (Shows Notification Banner)</span>
          </label>
          <div className="space-y-1.5">
            {otpPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSimulatePreset(p)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#EDF2FA] dark:bg-[#252A32] hover:bg-[#D3E3FD] dark:hover:bg-[#004A77] text-left transition-colors text-xs font-medium text-[#1F1F1F] dark:text-white group"
              >
                <span>{p.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0B57D0] text-white group-hover:bg-[#0842A0] font-semibold">
                  Trigger Banner
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-[#E0E2EC] dark:border-[#2D3139]">
          {/* Sender selection */}
          <div>
            <label className="block text-xs font-semibold text-[#444746] dark:text-[#C4C7C5] mb-1">
              Custom Sender
            </label>
            <select
              value={selectedConvId}
              onChange={(e) => setSelectedConvId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#C4C7C5] dark:border-[#444746] bg-transparent text-sm text-[#1F1F1F] dark:text-[#E2E2E2] outline-none"
            >
              {conversations.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#1E2228]">
                  {c.contactName} ({c.phoneNumber})
                </option>
              ))}
              <option value="new" className="bg-white dark:bg-[#1E2228]">
                + New Contact / Number
              </option>
            </select>
          </div>

          {selectedConvId === 'new' && (
            <div>
              <label className="block text-xs font-semibold text-[#444746] dark:text-[#C4C7C5] mb-1">
                Sender Name or Number
              </label>
              <input
                type="text"
                value={customSender}
                onChange={(e) => setCustomSender(e.target.value)}
                placeholder="e.g. PayPal Security or +1 555 999 8888"
                className="w-full px-3 py-2 rounded-xl border border-[#C4C7C5] dark:border-[#444746] bg-transparent text-sm text-[#1F1F1F] dark:text-[#E2E2E2] outline-none"
              />
            </div>
          )}

          {/* Quick general template chips */}
          <div>
            <label className="block text-xs font-semibold text-[#444746] dark:text-[#C4C7C5] mb-1.5">
              General SMS Templates
            </label>
            <div className="flex flex-wrap gap-1.5">
              {standardTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessageText(t)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-[#EDF2FA] dark:bg-[#282C35] hover:bg-[#D3E3FD] dark:hover:bg-[#004A77] text-[#444746] dark:text-[#C4C7C5] text-left transition-colors"
                >
                  {t.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Message content */}
          <div>
            <label className="block text-xs font-semibold text-[#444746] dark:text-[#C4C7C5] mb-1">
              Custom SMS Text Body
            </label>
            <textarea
              rows={2}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="e.g. Your login code is 782910"
              className="w-full px-3 py-2 rounded-xl border border-[#C4C7C5] dark:border-[#444746] bg-transparent text-sm text-[#1F1F1F] dark:text-[#E2E2E2] outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#444746] dark:text-[#C4C7C5] hover:bg-black/5 rounded-full"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={!messageText.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-[#0B57D0] text-white rounded-full hover:bg-[#0842A0] disabled:opacity-40 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 fill-current" />
              <span>Simulate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
