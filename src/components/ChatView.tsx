import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring, springBouncy } from '../motion.ts';
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Send,
  Clock,
  Star,
  Trash2,
  Camera,
  Copy,
  Check,
  CheckCheck,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  ShieldAlert,
  UserPlus,
  Info,
  Calendar,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { Message, Conversation } from '../types.ts';
import {
  calculateSmsCount,
  formatMessageDetailTime,
  formatFullDateTime,
  formatConversationTime,
  getInitials,
  extractOtpCode,
} from '../utils/smsUtils.ts';
import { ScheduleModal } from './ScheduleModal.tsx';
import { MessageActionSheet } from './MessageActionSheet.tsx';
import { useLongPress } from '../utils/useLongPress.ts';
import { useBackHandler } from '../backStack.ts';
import { businessKey, isPhoneNumber } from '../utils/phone.ts';
import { profilePhotoEditor } from '../utils/profilePhotoEditor.ts';
import { AvatarCircle } from './AvatarCircle.tsx';

interface ChatViewProps {
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onBack }) => {
  const {
    activeConversation: liveConversation,
    messages,
    sendMessage,
    scheduleMessage,
    sendScheduledNow,
    cancelScheduled,
    toggleStarMessage,
    deleteMessage,
    togglePinConversation,
    toggleArchiveConversation,
    toggleBlockConversation,
    deleteConversation,
    simulateIncomingSms,
    isSpamConversation,
    markNotSpam,
    reportSpam,
    isNativePlatform,
    isContactNumber,
    addNumberToContacts,
    getContactPhoto,
    jumpToMessageId,
    setJumpToMessageId,
    setBusinessPhoto,
  } = useSMS();

  // Keep showing the last conversation while the chat pane slides out
  const lastConversation = useRef<Conversation | null>(liveConversation);
  if (liveConversation) lastConversation.current = liveConversation;
  const activeConversation = liveConversation ?? lastConversation.current;

  const [inputText, setInputText] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<Message | null>(null);
  const { bind: bindBubblePress } = useLongPress<Message>(setSelectedMessageForAction);

  // Android back button closes the open sheet / menu / dialog first
  useBackHandler(!!selectedMessageForAction, () => setSelectedMessageForAction(null));
  useBackHandler(menuOpen, () => setMenuOpen(false));
  useBackHandler(infoModalOpen, () => setInfoModalOpen(false));
  useBackHandler(scheduleModalOpen, () => setScheduleModalOpen(false));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const convMessages = useMemo(() => {
    if (!activeConversation) return [];
    return messages
      .filter((m) => m.conversationId === activeConversation.id)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, activeConversation]);

  // Long conversations: draw the newest 80 messages first (opening stays smooth), older ones on request
  const [visibleCount, setVisibleCount] = useState(80);
  const feedRef = useRef<HTMLDivElement>(null);
  const scrollAnchor = useRef<number | null>(null);
  const didInitialScroll = useRef(false);
  const useSMSJumpRef = useRef<string | null>(null);
  useSMSJumpRef.current = jumpToMessageId;
  const shownMessages = useMemo(
    () => (convMessages.length > visibleCount ? convMessages.slice(-visibleCount) : convMessages),
    [convMessages, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(80);
    didInitialScroll.current = false;
  }, [activeConversation?.id]);

  const showEarlier = () => {
    scrollAnchor.current = feedRef.current ? feedRef.current.scrollHeight : null;
    setVisibleCount((c) => c + 100);
  };

  // keep the same message under your thumb after older ones are added above it
  useLayoutEffect(() => {
    if (scrollAnchor.current !== null && feedRef.current) {
      feedRef.current.scrollTop += feedRef.current.scrollHeight - scrollAnchor.current;
      scrollAnchor.current = null;
    }
  }, [visibleCount]);

  // Opened from a search result: show that message in the middle of the screen and flash it
  useEffect(() => {
    if (!jumpToMessageId || !activeConversation) return;
    const index = convMessages.findIndex((m) => m.id === jumpToMessageId);
    if (index < 0) return;
    const fromEnd = convMessages.length - index;
    if (fromEnd > visibleCount) setVisibleCount(fromEnd + 20);
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`msg-${jumpToMessageId}`);
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.classList.add('ping-flash');
        window.setTimeout(() => el.classList.remove('ping-flash'), 1700);
      }
      setJumpToMessageId(null);
    }, 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpToMessageId, activeConversation?.id]);

  // Scroll to the newest message: instantly when a chat opens, smoothly for new messages
  useEffect(() => {
    const firstTime = !didInitialScroll.current;
    didInitialScroll.current = true;
    if (useSMSJumpRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: firstTime ? 'auto' : 'smooth' });
  }, [convMessages.length, activeConversation?.id]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center bg-m3-surface dark:bg-m3-d0">
        <div className="w-16 h-16 rounded-full bg-m3-surface-hi dark:bg-m3-d2 flex items-center justify-center text-m3-outline dark:text-m3-outline-dk mb-3">
          <ArrowLeft className="w-8 h-8 opacity-40" />
        </div>
        <h3 className="text-base font-semibold text-m3-on-surface dark:text-m3-on-surface-dk">
          Select a conversation
        </h3>
        <p className="text-xs text-m3-outline dark:text-m3-outline-dk mt-1 max-w-xs">
          Choose a text message thread from the list or start a new SMS.
        </p>
      </div>
    );
  }

  const smsCount = calculateSmsCount(inputText);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(activeConversation.id, inputText);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScheduleSubmit = (timestamp: number) => {
    if (!inputText.trim()) {
      showToast('Type an SMS text first to schedule it');
      return;
    }
    scheduleMessage(activeConversation.id, inputText, timestamp);
    setInputText('');
    showToast(`Scheduled SMS for ${formatFullDateTime(timestamp)}`);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  };

  const handleCopyOtp = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Verification code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Helper to extract 4-8 digit codes in bank/service SMS
  const extractCode = (text: string) => extractOtpCode(text);

  // Quick SMS Smart Chips
  const quickReplies = [
    'On my way!',
    'Sounds good!',
    'Can you call me?',
    'Thanks!',
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-m3-surface dark:bg-m3-d0 text-m3-on-surface dark:text-m3-on-surface-dk overflow-hidden relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="toast"
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-m3-on-surface text-white dark:bg-m3-on-surface-dk dark:text-m3-on-surface px-4 py-2 rounded-full text-xs font-medium shadow-lg"
            initial={{ opacity: 0, y: -14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={springBouncy}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top App Bar */}
      <div className="h-16 px-3 flex items-center justify-between border-b border-m3-line dark:border-m3-d4 bg-m3-surface dark:bg-m3-d0 z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-m3-variant dark:text-m3-variant-dk hover:text-m3-on-surface dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer p-1 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 truncate"
            onClick={() => setInfoModalOpen(true)}
          >
            <AvatarCircle
              photo={getContactPhoto(activeConversation.phoneNumber)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs ${activeConversation.avatarColor} text-white shadow-xs shrink-0`}
            >
              {getInitials(activeConversation.contactName, activeConversation.phoneNumber)}
            </AvatarCircle>
            <div className="truncate text-left">
              <h2 className="text-sm font-semibold text-m3-on-surface dark:text-white truncate">
                {activeConversation.contactName}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-m3-outline dark:text-m3-outline-dk">
                <span>SMS</span>
                <span>·</span>
                <span className="font-mono">{activeConversation.phoneNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            type="button"
            onClick={() => showToast(`Calling ${activeConversation.phoneNumber}...`)}
            className="p-2 text-m3-variant dark:text-m3-variant-dk hover:text-m3-on-surface dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
            title="Call"
            aria-label="Call contact"
          >
            <Phone className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 text-m3-variant dark:text-m3-variant-dk hover:text-m3-on-surface dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
            title="Options"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Thread Overflow Menu */}
          <AnimatePresence>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                style={{ transformOrigin: 'top right' }}
                initial={{ opacity: 0, scale: 0.85, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={springBouncy}
                className="absolute right-0 top-12 w-56 p-2 bg-white dark:bg-m3-d2 border border-m3-line dark:border-m3-d4 rounded-2xl shadow-xl z-40 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setInfoModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl transition-colors"
                >
                  <Info className="w-4 h-4 text-m3-primary" />
                  <span>Conversation details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    togglePinConversation(activeConversation.id);
                    setMenuOpen(false);
                    showToast(activeConversation.isPinned ? 'Conversation unpinned' : 'Conversation pinned');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl transition-colors"
                >
                  {activeConversation.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  <span>{activeConversation.isPinned ? 'Unpin' : 'Pin to top'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleArchiveConversation(activeConversation.id);
                    setMenuOpen(false);
                    showToast(activeConversation.isArchived ? 'Conversation unarchived' : 'Conversation archived');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl transition-colors"
                >
                  {activeConversation.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  <span>{activeConversation.isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>

                {businessKey(activeConversation.phoneNumber) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        const key = businessKey(activeConversation.phoneNumber) as string;
                        profilePhotoEditor.choose({ type: 'business', key, name: key });
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>
                        {getContactPhoto(activeConversation.phoneNumber) ? 'Change business picture' : 'Add business picture'}
                      </span>
                    </button>
                    {getContactPhoto(activeConversation.phoneNumber) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setBusinessPhoto(businessKey(activeConversation.phoneNumber) as string, null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove business picture</span>
                      </button>
                    )}
                  </>
                )}

                {isNativePlatform &&
                  isPhoneNumber(activeConversation.phoneNumber) &&
                  !isContactNumber(activeConversation.phoneNumber) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        addNumberToContacts(activeConversation.phoneNumber);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add to contacts</span>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => {
                    if (isSpamConversation(activeConversation.id)) {
                      markNotSpam(activeConversation.id);
                      showToast('Marked as not spam');
                    } else {
                      reportSpam(activeConversation.id);
                      showToast('Reported as spam. Moved to the Spam folder');
                    }
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-[#BA1A1A]" />
                  <span>{isSpamConversation(activeConversation.id) ? 'Not spam' : 'Report spam'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleBlockConversation(activeConversation.id);
                    setMenuOpen(false);
                    showToast(activeConversation.isBlocked ? 'Number unblocked' : 'Number blocked');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>{activeConversation.isBlocked ? 'Unblock number' : 'Block number'}</span>
                </button>

                <div className="h-px bg-m3-line dark:bg-m3-d4 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    deleteConversation(activeConversation.id);
                    setMenuOpen(false);
                    onBack();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[#BA1A1A] dark:text-[#FFB4AB] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete conversation</span>
                </button>
              </motion.div>
            </>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Scrollable Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-4 md:px-8 2xl:px-[10%] py-3 space-y-3">
        {/* Spam warning */}
        {isSpamConversation(activeConversation.id) && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={springBouncy}
            className="p-4 rounded-[28px] bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/40"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#BA1A1A] text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#BA1A1A] dark:text-[#FFB4AB]">Suspected spam</p>
                <p className="text-xs mt-0.5 leading-relaxed text-m3-variant dark:text-m3-variant-dk">
                  Ping thinks this sender is sending spam or a scam. Do not tap links or share codes or bank details.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      markNotSpam(activeConversation.id);
                      showToast('Marked as not spam');
                    }}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep"
                  >
                    Not spam
                  </button>
                  {!activeConversation.isBlocked && (
                    <button
                      type="button"
                      onClick={() => {
                        toggleBlockConversation(activeConversation.id);
                        showToast('Number blocked');
                      }}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-m3-d3 text-[#BA1A1A] dark:text-[#FFB4AB]"
                    >
                      Block number
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Info Banner */}
        <div className="text-center py-4">
          <AvatarCircle
            photo={getContactPhoto(activeConversation.phoneNumber)}
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center font-bold text-lg ${activeConversation.avatarColor} text-white shadow-sm mb-2`}
          >
            {getInitials(activeConversation.contactName, activeConversation.phoneNumber)}
          </AvatarCircle>
          <h3 className="text-base font-semibold text-m3-on-surface dark:text-white">
            {activeConversation.contactName}
          </h3>
          <p className="text-xs text-m3-outline dark:text-m3-outline-dk font-mono mt-0.5">
            {activeConversation.phoneNumber}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-m3-surface-hi dark:bg-m3-d2 text-[11px] text-m3-variant dark:text-m3-variant-dk mt-2">
            <span>Standard SMS</span>
            <span>·</span>
            <span>Carrier messaging</span>
          </div>
        </div>

        {/* Message bubbles stream */}
        {convMessages.length > shownMessages.length && (
          <button
            type="button"
            onClick={showEarlier}
            className="mx-auto block px-5 py-2.5 rounded-full text-xs font-semibold bg-m3-surface-hi dark:bg-m3-d2 text-m3-primary dark:text-m3-primary-light"
          >
            Show earlier messages ({convMessages.length - shownMessages.length})
          </button>
        )}
        {shownMessages.map((msg, index) => {
          const isMe = msg.sender === 'me';
          const prevMsg = shownMessages[index - 1];
          const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender;
          const isScheduled = msg.isScheduled;
          const otpCode = !isMe ? extractCode(msg.text) : null;

          return (
            <motion.div
              key={msg.id}
              id={`msg-${msg.id}`}
              className="group/msg flex flex-col"
              initial={index >= shownMessages.length - 12 ? { opacity: 0, y: 14, scale: 0.94 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={spring}
              style={{ transformOrigin: isMe ? 'bottom right' : 'bottom left' }}
            >
              {/* Scheduled SMS Card */}
              {isScheduled ? (
                <div className="self-end max-w-[85%] sm:max-w-md p-3.5 rounded-2xl bg-m3-surface-hi dark:bg-m3-d2 border-2 border-dashed border-m3-primary/40 dark:border-m3-primary-light/40 shadow-xs mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-m3-primary dark:text-m3-primary-light mb-1">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Scheduled for {msg.scheduledFor ? formatFullDateTime(msg.scheduledFor) : 'Later'}</span>
                  </div>
                  <p className="text-sm text-m3-on-surface dark:text-m3-on-surface-dk selectable-text leading-relaxed">
                    {msg.text}
                  </p>
                  <div className="mt-2.5 flex items-center justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => cancelScheduled(msg.id)}
                      className="px-2.5 py-1 text-[#BA1A1A] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-medium"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => sendScheduledNow(msg.id)}
                      className="px-3 py-1 bg-m3-primary text-white rounded-lg hover:bg-m3-primary-hover font-medium"
                    >
                      Send now
                    </button>
                  </div>
                </div>
              ) : (
                /* Regular Sent / Received Message */
                <div
                  className={`flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%] ${
                    isMe ? 'self-end flex-row-reverse' : 'self-start'
                  }`}
                >
                  {/* Bubble */}
                  <div
                    {...bindBubblePress(msg)}
                    className={`relative p-3.5 text-sm leading-relaxed transition ${
                      isMe
                        ? 'bg-m3-primary-container dark:bg-m3-primary-deep text-m3-on-primary-deep dark:text-m3-primary-container rounded-2xl rounded-br-xs shadow-xs'
                        : 'bg-white dark:bg-m3-d2 text-m3-on-surface dark:text-m3-on-surface-dk rounded-2xl rounded-bl-xs border border-m3-line dark:border-m3-d4 shadow-xs'
                    }`}
                  >
                    <p className="selectable-text break-words whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    {/* OTP / 2FA Quick Action Chip */}
                    {otpCode && (
                      <div className="mt-2.5 pt-2 border-t border-m3-line dark:border-m3-d4 flex items-center justify-between gap-3">
                        <span className="text-xs font-mono font-bold tracking-widest text-m3-primary dark:text-m3-primary-light">
                          {otpCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOtp(otpCode)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-m3-primary text-white rounded-full hover:bg-m3-primary-hover active:scale-95 transition shadow-xs"
                        >
                          {copiedCode === otpCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCode === otpCode ? 'Copied' : 'Copy code'}</span>
                        </button>
                      </div>
                    )}

                    {/* Metadata line: Time, delivery status, and star */}
                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] tabular-nums select-none ${
                        isMe
                          ? 'text-m3-on-primary-deep/70 dark:text-m3-primary-container/80'
                          : 'text-m3-outline dark:text-m3-outline-dk'
                      }`}
                    >
                      {msg.isStarred && (
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                      )}
                      <span>{formatMessageDetailTime(msg.timestamp)}</span>
                      {isMe && (
                        <span>
                          {msg.status === 'delivered' ? (
                            <CheckCheck className="w-3 h-3 inline" />
                          ) : msg.status === 'sent' ? (
                            <Check className="w-3 h-3 inline" />
                          ) : (
                            <Clock className="w-2.5 h-2.5 inline animate-pulse" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Micro action triggers (visible on hover) */}
                  <div className="opacity-0 group-hover/msg:opacity-100 flex items-center gap-0.5 transition-opacity self-center">
                    <button
                      type="button"
                      title={msg.isStarred ? 'Unstar' : 'Star'}
                      onClick={() => toggleStarMessage(msg.id)}
                      className="p-1 rounded-full text-m3-outline hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          msg.isStarred ? 'text-amber-500 fill-amber-500' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      title="Copy text"
                      onClick={() => handleCopyText(msg.text)}
                      className="p-1 rounded-full text-m3-outline hover:text-m3-on-surface dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1 rounded-full text-m3-outline hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies Carousel */}
      <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {quickReplies.map((reply, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInputText(reply)}
            className="px-3 py-1 text-xs rounded-full bg-m3-surface-hi dark:bg-m3-d2 text-m3-variant dark:text-m3-variant-dk hover:bg-m3-primary-container hover:text-m3-on-primary-deep dark:hover:bg-m3-primary-deep dark:hover:text-m3-primary-container whitespace-nowrap transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* SMS Composer Bottom Bar */}
      <div className="p-3 md:px-6 2xl:px-[10%] bg-m3-surface dark:bg-m3-d0 border-t border-m3-line dark:border-m3-d4 shrink-0">
        <div className="relative flex items-end gap-2 bg-m3-surface-hi dark:bg-m3-d2 rounded-3xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-m3-primary/30 transition">
          {/* Schedule button */}
          <button
            type="button"
            onClick={() => setScheduleModalOpen(true)}
            className="p-2.5 text-m3-variant dark:text-m3-variant-dk hover:text-m3-primary dark:hover:text-m3-primary-light hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors shrink-0"
            title="Schedule SMS send"
            aria-label="Schedule SMS send"
          >
            <Clock className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 py-1.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                // auto-expand
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Text message (SMS)"
              className="w-full bg-transparent text-sm text-m3-on-surface dark:text-m3-on-surface-dk placeholder-m3-outline dark:placeholder-m3-outline-dk outline-none resize-none max-h-28"
            />
          </div>

          {/* Character / Segment Counter Indicator */}
          {inputText.length > 0 && (
            <div className="text-[10px] text-m3-outline dark:text-m3-outline-dk font-mono whitespace-nowrap pr-1 self-center tabular-nums">
              {smsCount.charCount}/{smsCount.limitPerSegment}
              {smsCount.segmentCount > 1 && ` · ${smsCount.segmentCount} SMS`}
            </div>
          )}

          {/* Send Button */}
          <motion.button
            type="button"
            onClick={handleSend}
            whileTap={{ scale: 0.86 }}
            animate={{ scale: inputText.trim() ? 1 : 0.92 }}
            transition={springBouncy}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-full bg-m3-primary dark:bg-m3-primary-light text-white dark:text-m3-on-primary-deep disabled:opacity-30 disabled:pointer-events-none hover:bg-m3-primary-hover active:scale-95 transition shadow-xs shrink-0"
            aria-label="Send SMS"
          >
            <Send className="w-4 h-4 fill-current ml-0.5" />
          </motion.button>
        </div>
      </div>

      <MessageActionSheet
        message={selectedMessageForAction}
        onClose={() => setSelectedMessageForAction(null)}
        onToast={showToast}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSchedule={handleScheduleSubmit}
      />

      {/* Contact Details Modal */}
      <AnimatePresence>
      {infoModalOpen && (
        <motion.div
          key="info-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setInfoModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={springBouncy}
            className="relative w-full max-w-sm bg-white dark:bg-m3-d2 rounded-3xl p-6 shadow-2xl border border-m3-line dark:border-m3-d4 z-50 text-center">
            <AvatarCircle
              photo={getContactPhoto(activeConversation.phoneNumber)}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center font-bold text-2xl ${activeConversation.avatarColor} text-white shadow-md mb-3`}
            >
              {getInitials(activeConversation.contactName, activeConversation.phoneNumber)}
            </AvatarCircle>
            <h3 className="text-lg font-bold text-m3-on-surface dark:text-white">
              {activeConversation.contactName}
            </h3>
            <p className="text-sm text-m3-outline dark:text-m3-outline-dk font-mono mt-1">
              {activeConversation.phoneNumber}
            </p>

            <div className="my-5 p-3 rounded-2xl bg-m3-surface-hi dark:bg-m3-d3 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-m3-outline dark:text-m3-outline-dk">Message Type:</span>
                <span className="font-semibold text-m3-on-surface dark:text-m3-on-surface-dk">Standard SMS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-m3-outline dark:text-m3-outline-dk">Total messages:</span>
                <span className="font-semibold font-mono text-m3-on-surface dark:text-m3-on-surface-dk">{convMessages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-m3-outline dark:text-m3-outline-dk">Status:</span>
                <span className="font-semibold text-[#1E8E3E]">Active Cellular</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  simulateIncomingSms(activeConversation.id, `Simulated reply from ${activeConversation.contactName} at ${new Date().toLocaleTimeString()}`);
                  setInfoModalOpen(false);
                }}
                className="flex-1 py-2.5 px-3 text-xs font-semibold bg-m3-primary-container dark:bg-m3-primary-deep text-m3-on-primary-deep dark:text-m3-primary-container rounded-full hover:opacity-90"
              >
                Send Test Reply
              </button>
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="py-2.5 px-5 text-xs font-semibold bg-m3-primary text-white rounded-full hover:bg-m3-primary-hover"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
