import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring, springBouncy, fadeFast } from '../motion.ts';
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
    <AnimatePresence>
      {isOpen && (
    <motion.div
      key="overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fadeFast}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-md bg-white dark:bg-m3-d2 rounded-3xl border border-m3-line dark:border-m3-d4 shadow-2xl p-6 z-50"
        initial={{ opacity: 0, scale: 0.88, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={springBouncy}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-m3-primary-container dark:bg-m3-primary-deep flex items-center justify-center text-m3-primary dark:text-m3-primary-light">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-m3-on-surface dark:text-white">
                Simulate Incoming SMS & OTP
              </h3>
              <p className="text-[11px] text-m3-outline dark:text-m3-outline-dk">
                Test the "Copy OTP" banner notification bar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-m3-outline hover:text-m3-on-surface dark:hover:text-white rounded-full hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Tap OTP Simulation Presets */}
        <div className="mb-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-m3-primary dark:text-m3-primary-light mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Instant 1-Tap OTP Test (Shows Notification Banner)</span>
          </label>
          <div className="space-y-1.5">
            {otpPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSimulatePreset(p)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-m3-surface-hi dark:bg-m3-d3 hover:bg-m3-primary-container dark:hover:bg-m3-primary-deep text-left transition-colors text-xs font-medium text-m3-on-surface dark:text-white group"
              >
                <span>{p.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-m3-primary text-white group-hover:bg-m3-primary-hover font-semibold">
                  Trigger Banner
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-m3-line dark:border-m3-d4">
          {/* Sender selection */}
          <div>
            <label className="block text-xs font-semibold text-m3-variant dark:text-m3-variant-dk mb-1">
              Custom Sender
            </label>
            <select
              value={selectedConvId}
              onChange={(e) => setSelectedConvId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-m3-variant-dk dark:border-m3-variant bg-transparent text-sm text-m3-on-surface dark:text-m3-on-surface-dk outline-none"
            >
              {conversations.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-m3-d2">
                  {c.contactName} ({c.phoneNumber})
                </option>
              ))}
              <option value="new" className="bg-white dark:bg-m3-d2">
                + New Contact / Number
              </option>
            </select>
          </div>

          {selectedConvId === 'new' && (
            <div>
              <label className="block text-xs font-semibold text-m3-variant dark:text-m3-variant-dk mb-1">
                Sender Name or Number
              </label>
              <input
                type="text"
                value={customSender}
                onChange={(e) => setCustomSender(e.target.value)}
                placeholder="e.g. PayPal Security or +1 555 999 8888"
                className="w-full px-3 py-2 rounded-xl border border-m3-variant-dk dark:border-m3-variant bg-transparent text-sm text-m3-on-surface dark:text-m3-on-surface-dk outline-none"
              />
            </div>
          )}

          {/* Quick general template chips */}
          <div>
            <label className="block text-xs font-semibold text-m3-variant dark:text-m3-variant-dk mb-1.5">
              General SMS Templates
            </label>
            <div className="flex flex-wrap gap-1.5">
              {standardTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessageText(t)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-m3-surface-hi dark:bg-m3-d3 hover:bg-m3-primary-container dark:hover:bg-m3-primary-deep text-m3-variant dark:text-m3-variant-dk text-left transition-colors"
                >
                  {t.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Message content */}
          <div>
            <label className="block text-xs font-semibold text-m3-variant dark:text-m3-variant-dk mb-1">
              Custom SMS Text Body
            </label>
            <textarea
              rows={2}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="e.g. Your login code is 782910"
              className="w-full px-3 py-2 rounded-xl border border-m3-variant-dk dark:border-m3-variant bg-transparent text-sm text-m3-on-surface dark:text-m3-on-surface-dk outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-m3-variant dark:text-m3-variant-dk hover:bg-black/5 rounded-full"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={!messageText.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-m3-primary text-white rounded-full hover:bg-m3-primary-hover disabled:opacity-40 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 fill-current" />
              <span>Simulate</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};
