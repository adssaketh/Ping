import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Archive,
  ArchiveRestore,
  Ban,
  Check,
  CheckCheck,
  Copy,
  KeyRound,
  Mail,
  Pin,
  PinOff,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { extractOtpCode, getInitials } from '../utils/smsUtils.ts';
import { copyText } from '../utils/clipboard.ts';
import { spring, fadeFast } from '../motion.ts';

interface ConversationActionSheetProps {
  conversationId: string | null;
  onClose: () => void;
}

interface SheetAction {
  key: string;
  icon: React.ElementType;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

/** Bottom sheet with everything you can do to a conversation, opened by long-pressing it. */
export const ConversationActionSheet: React.FC<ConversationActionSheetProps> = ({ conversationId, onClose }) => {
  const {
    conversations,
    messages,
    togglePinConversation,
    toggleArchiveConversation,
    markAsRead,
    markAsUnread,
    toggleBlockConversation,
    deleteConversation,
    isSpamConversation,
    reportSpam,
    markNotSpam,
  } = useSMS();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // keep the content while the sheet slides away
  const lastId = useRef<string | null>(conversationId);
  if (conversationId) lastId.current = conversationId;
  const activeId = conversationId ?? lastId.current;
  const conv = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    if (conversationId) {
      setConfirmDelete(false);
      setCopied(null);
    }
  }, [conversationId]);

  const lastMessage = useMemo(() => {
    let best = null as (typeof messages)[number] | null;
    for (const m of messages) {
      if (m.conversationId !== activeId || m.isScheduled) continue;
      if (!best || m.timestamp > best.timestamp) best = m;
    }
    return best;
  }, [messages, activeId]);

  const otp = lastMessage && lastMessage.sender !== 'me' ? extractOtpCode(lastMessage.text) : null;

  const runAndClose = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const handleCopy = async (kind: 'otp' | 'message') => {
    const text = kind === 'otp' && otp ? otp : lastMessage?.text || '';
    if (!text) return;
    if (await copyText(text)) {
      setCopied(kind);
      setTimeout(onClose, 650);
    }
  };

  const actions: SheetAction[] = [];
  if (conv) {
    const hasUnread = conv.unreadCount > 0;
    const spam = isSpamConversation(conv.id);
    if (otp) {
      actions.push({ key: 'otp', icon: copied === 'otp' ? Check : KeyRound, label: copied === 'otp' ? 'Copied' : `Copy OTP ${otp}`, onClick: () => handleCopy('otp') });
    }
    if (lastMessage) {
      actions.push({ key: 'copy', icon: copied === 'message' ? Check : Copy, label: copied === 'message' ? 'Copied' : 'Copy last message', onClick: () => handleCopy('message') });
    }
    actions.push({
      key: 'read',
      icon: hasUnread ? CheckCheck : Mail,
      label: hasUnread ? 'Mark as read' : 'Mark as unread',
      onClick: runAndClose(() => (hasUnread ? markAsRead(conv.id) : markAsUnread(conv.id))),
    });
    actions.push({
      key: 'pin',
      icon: conv.isPinned ? PinOff : Pin,
      label: conv.isPinned ? 'Unpin' : 'Pin to top',
      onClick: runAndClose(() => togglePinConversation(conv.id)),
    });
    actions.push({
      key: 'archive',
      icon: conv.isArchived ? ArchiveRestore : Archive,
      label: conv.isArchived ? 'Unarchive' : 'Archive',
      onClick: runAndClose(() => toggleArchiveConversation(conv.id)),
    });
    actions.push({
      key: 'spam',
      icon: ShieldAlert,
      label: spam ? 'Not spam' : 'Report spam',
      onClick: runAndClose(() => (spam ? markNotSpam(conv.id) : reportSpam(conv.id))),
    });
    actions.push({
      key: 'block',
      icon: Ban,
      label: conv.isBlocked ? 'Unblock number' : 'Block number',
      onClick: runAndClose(() => toggleBlockConversation(conv.id)),
    });
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {conversationId && conv && (
        <motion.div
          key="conversation-sheet"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeFast}
        >
          <div className="fixed inset-0 bg-black/45" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Conversation options"
            className="will-change-transform relative w-full sm:max-w-sm max-h-[88vh] overflow-y-auto bg-white dark:bg-m3-d2 rounded-t-[32px] sm:rounded-[32px] shadow-2xl pb-3"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={spring}
          >
            <div className="w-10 h-1.5 bg-m3-variant-dk dark:bg-m3-variant rounded-full mx-auto mt-3 mb-2 sm:hidden" />

            {/* Who this is */}
            <div className="px-5 pt-2 pb-3 flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm ${conv.avatarColor} text-white shrink-0`}
              >
                {getInitials(conv.contactName, conv.phoneNumber)}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold truncate text-m3-on-surface dark:text-white">{conv.contactName}</p>
                {conv.phoneNumber && conv.phoneNumber !== conv.contactName && (
                  <p className="text-xs font-mono truncate text-m3-outline dark:text-m3-outline-dk">{conv.phoneNumber}</p>
                )}
              </div>
            </div>
            {lastMessage && (
              <p className="mx-5 mb-2 px-4 py-3 rounded-2xl bg-m3-surface-hi dark:bg-m3-d3 text-xs leading-relaxed text-m3-variant dark:text-m3-variant-dk line-clamp-3">
                {lastMessage.text}
              </p>
            )}

            {/* Actions */}
            <div className="px-2">
              {confirmDelete ? (
                <div className="mx-3 my-2 p-4 rounded-3xl bg-red-50 dark:bg-red-950/30">
                  <p className="text-sm font-semibold text-[#BA1A1A] dark:text-[#FFB4AB]">Delete this conversation?</p>
                  <p className="text-xs mt-1 leading-relaxed text-m3-variant dark:text-m3-variant-dk">
                    All its messages are removed. When Ping is your default SMS app they are also removed from your phone.
                  </p>
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
                      onClick={runAndClose(() => deleteConversation(conv.id))}
                      className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-[#BA1A1A] text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {actions.map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <motion.button
                        key={a.key}
                        type="button"
                        onClick={a.onClick}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...spring, delay: 0.04 + i * 0.025 }}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium text-m3-on-surface dark:text-m3-on-surface-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3"
                      >
                        <Icon className="w-5 h-5 text-m3-variant dark:text-m3-variant-dk" />
                        <span>{a.label}</span>
                      </motion.button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium text-[#BA1A1A] dark:text-[#FFB4AB] hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete conversation</span>
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
