import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, KeyRound, MessageSquareText } from 'lucide-react';
import { Conversation, Message } from '../types.ts';
import { extractOtpCode, formatFullDateTime, getInitials } from '../utils/smsUtils.ts';
import { springBouncy } from '../motion.ts';
import { copyText } from '../utils/clipboard.ts';
import { AvatarCircle } from './AvatarCircle.tsx';
import type { PressHandlers } from '../utils/useLongPress.ts';

interface LatestMessageCardProps {
  conversation: Conversation;
  message: Message;
  photo?: string;
  onOpen: () => void;
  /** Long-press handlers from the list, spread onto the card */
  pressProps?: PressHandlers;
}

const CATEGORY_LABEL: Record<string, string> = {
  personal: 'Personal',
  transactions: 'Bank / Alert',
  services: 'Service',
  promotions: 'Promo',
};

/**
 * The newest message that arrived, shown larger than the rest of the list with its full text,
 * sender details and, for one-time codes, Copy OTP / Copy message buttons.
 */
export const LatestMessageCard: React.FC<LatestMessageCardProps> = ({ conversation, message, photo, onOpen, pressProps }) => {
  const [copied, setCopied] = useState<'otp' | 'message' | null>(null);
  const otp = extractOtpCode(message.text);
  const isFresh = Date.now() - message.timestamp < 8000; // only animate a message that just arrived
  const initials = getInitials(conversation.contactName, conversation.phoneNumber);
  const showNumber = conversation.phoneNumber && conversation.phoneNumber !== conversation.contactName;

  const handleCopy = async (kind: 'otp' | 'message') => {
    const ok = await copyText(kind === 'otp' && otp ? otp : message.text);
    if (ok) {
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <motion.div
      initial={isFresh ? { opacity: 0, y: -18, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springBouncy}
      onClick={onOpen}
      {...pressProps}
      className="mx-4 mb-3 p-5 rounded-[32px] bg-m3-primary-container/70 dark:bg-m3-primary-deep/40 border border-m3-primary/15 shadow-sm cursor-pointer"
    >
      {/* Who and when */}
      <div className="flex items-center gap-3.5">
        <AvatarCircle
          photo={photo}
          className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base ${conversation.avatarColor} text-white shadow-xs shrink-0`}
        >
          {initials}
        </AvatarCircle>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold truncate text-m3-on-surface dark:text-white">
              {conversation.contactName}
            </h3>
            {conversation.unreadCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-m3-primary dark:bg-m3-primary-light shrink-0" />
            )}
          </div>
          {showNumber && (
            <p className="text-[11px] font-mono truncate text-m3-variant dark:text-m3-variant-dk">
              {conversation.phoneNumber}
            </p>
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep shrink-0">
          Latest
        </span>
      </div>

      {/* Details line */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-m3-variant dark:text-m3-variant-dk">
        <span>{formatFullDateTime(message.timestamp)}</span>
        {CATEGORY_LABEL[conversation.category] && <span>· {CATEGORY_LABEL[conversation.category]}</span>}
        <span>· {message.text.length} characters</span>
      </div>

      {/* Full text */}
      <p className="mt-3 text-[15px] leading-relaxed text-m3-on-surface dark:text-m3-on-surface-dk line-clamp-6 selectable-text break-words whitespace-pre-wrap">
        {message.text}
      </p>

      {/* One-time code */}
      {otp && (
        <div className="mt-4 p-4 rounded-3xl bg-white/80 dark:bg-m3-d1/80" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-m3-variant dark:text-m3-variant-dk">
            <KeyRound className="w-3.5 h-3.5" />
            <span>One-time code</span>
          </div>
          <p className="mt-1 text-3xl font-bold font-mono tracking-[0.22em] text-m3-primary dark:text-m3-primary-light selectable-text">
            {otp}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCopy('otp')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep"
            >
              {copied === 'otp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied === 'otp' ? 'Copied' : 'Copy OTP'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy('message')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container"
            >
              {copied === 'message' ? <Check className="w-4 h-4" /> : <MessageSquareText className="w-4 h-4" />}
              <span>{copied === 'message' ? 'Copied' : 'Copy message'}</span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
