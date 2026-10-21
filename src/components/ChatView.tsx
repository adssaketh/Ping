import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Send,
  Clock,
  Star,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  ShieldAlert,
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
} from '../utils/smsUtils.ts';
import { ScheduleModal } from './ScheduleModal.tsx';

interface ChatViewProps {
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onBack }) => {
  const {
    activeConversation,
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
  } = useSMS();

  const [inputText, setInputText] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const convMessages = useMemo(() => {
    if (!activeConversation) return [];
    return messages
      .filter((m) => m.conversationId === activeConversation.id)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, activeConversation]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center bg-[#F8FAFD] dark:bg-[#111318]">
        <div className="w-16 h-16 rounded-full bg-[#EDF2FA] dark:bg-[#1E2228] flex items-center justify-center text-[#747775] dark:text-[#8E918F] mb-3">
          <ArrowLeft className="w-8 h-8 opacity-40" />
        </div>
        <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-[#E2E2E2]">
          Select a conversation
        </h3>
        <p className="text-xs text-[#747775] dark:text-[#8E918F] mt-1 max-w-xs">
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
  const extractCode = (text: string) => {
    const match = text.match(/\b\d{4,8}\b/);
    return match ? match[0] : null;
  };

  // Quick SMS Smart Chips
  const quickReplies = [
    'On my way!',
    'Sounds good!',
    'Can you call me?',
    'Thanks!',
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#F8FAFD] dark:bg-[#111318] text-[#1F1F1F] dark:text-[#E2E2E2] overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1F1F1F] text-white dark:bg-[#E2E2E2] dark:text-[#1F1F1F] px-4 py-2 rounded-full text-xs font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          {toastMessage}
        </div>
      )}

      {/* Top App Bar */}
      <div className="h-16 px-3 flex items-center justify-between border-b border-[#E0E2EC] dark:border-[#2D3139] bg-[#F8FAFD] dark:bg-[#111318] z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer p-1 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 truncate"
            onClick={() => setInfoModalOpen(true)}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs ${activeConversation.avatarColor} text-white shadow-xs shrink-0`}
            >
              {getInitials(activeConversation.contactName, activeConversation.phoneNumber)}
            </div>
            <div className="truncate text-left">
              <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-white truncate">
                {activeConversation.contactName}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-[#747775] dark:text-[#8E918F]">
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
            className="p-2 text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            title="Call"
            aria-label="Call contact"
          >
            <Phone className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            title="Options"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Thread Overflow Menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 w-56 p-2 bg-white dark:bg-[#1E2228] border border-[#E0E2EC] dark:border-[#2D3139] rounded-2xl shadow-xl z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setInfoModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#282C35] rounded-xl transition-colors"
                >
                  <Info className="w-4 h-4 text-[#0B57D0]" />
                  <span>Conversation details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    togglePinConversation(activeConversation.id);
                    setMenuOpen(false);
                    showToast(activeConversation.isPinned ? 'Conversation unpinned' : 'Conversation pinned');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#282C35] rounded-xl transition-colors"
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
                  className="w-full flex items-center gap-3 px-3 py-2 text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#282C35] rounded-xl transition-colors"
                >
                  {activeConversation.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  <span>{activeConversation.isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleBlockConversation(activeConversation.id);
                    setMenuOpen(false);
                    showToast(activeConversation.isBlocked ? 'Number unblocked' : 'Number blocked');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#282C35] rounded-xl transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>{activeConversation.isBlocked ? 'Unblock number' : 'Block & report spam'}</span>
                </button>

                <div className="h-px bg-[#E0E2EC] dark:bg-[#2D3139] my-1" />

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
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages Scrollable Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Top Info Banner */}
        <div className="text-center py-4">
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center font-bold text-lg ${activeConversation.avatarColor} text-white shadow-sm mb-2`}
          >
            {getInitials(activeConversation.contactName, activeConversation.phoneNumber)}
          </div>
          <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-white">
            {activeConversation.contactName}
          </h3>
          <p className="text-xs text-[#747775] dark:text-[#8E918F] font-mono mt-0.5">
            {activeConversation.phoneNumber}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF2FA] dark:bg-[#1E2228] text-[11px] text-[#444746] dark:text-[#C4C7C5] mt-2">
            <span>Standard SMS</span>
            <span>·</span>
            <span>Carrier messaging</span>
          </div>
        </div>

        {/* Message bubbles stream */}
        {convMessages.map((msg, index) => {
          const isMe = msg.sender === 'me';
          const prevMsg = convMessages[index - 1];
          const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender;
          const isScheduled = msg.isScheduled;
          const otpCode = !isMe ? extractCode(msg.text) : null;

          return (
            <div key={msg.id} className="group/msg flex flex-col">
              {/* Scheduled SMS Card */}
              {isScheduled ? (
                <div className="self-end max-w-[85%] sm:max-w-md p-3.5 rounded-2xl bg-[#EDF2FA] dark:bg-[#1E2228] border-2 border-dashed border-[#0B57D0]/40 dark:border-[#A8C7FA]/40 shadow-xs mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B57D0] dark:text-[#A8C7FA] mb-1">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Scheduled for {msg.scheduledFor ? formatFullDateTime(msg.scheduledFor) : 'Later'}</span>
                  </div>
                  <p className="text-sm text-[#1F1F1F] dark:text-[#E2E2E2] selectable-text leading-relaxed">
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
                      className="px-3 py-1 bg-[#0B57D0] text-white rounded-lg hover:bg-[#0842A0] font-medium"
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
                    className={`relative p-3.5 text-sm leading-relaxed transition-all ${
                      isMe
                        ? 'bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#D3E3FD] rounded-2xl rounded-br-xs shadow-xs'
                        : 'bg-white dark:bg-[#20242C] text-[#1F1F1F] dark:text-[#E2E2E2] rounded-2xl rounded-bl-xs border border-[#E0E2EC] dark:border-[#2D3139] shadow-xs'
                    }`}
                  >
                    <p className="selectable-text break-words whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    {/* OTP / 2FA Quick Action Chip */}
                    {otpCode && (
                      <div className="mt-2.5 pt-2 border-t border-[#E0E2EC] dark:border-[#2D3139] flex items-center justify-between gap-3">
                        <span className="text-xs font-mono font-bold tracking-widest text-[#0B57D0] dark:text-[#A8C7FA]">
                          {otpCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOtp(otpCode)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#0B57D0] text-white rounded-full hover:bg-[#0842A0] active:scale-95 transition-all shadow-xs"
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
                          ? 'text-[#041E49]/70 dark:text-[#D3E3FD]/80'
                          : 'text-[#747775] dark:text-[#8E918F]'
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
                      className="p-1 rounded-full text-[#747775] hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/10"
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
                      className="p-1 rounded-full text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1 rounded-full text-[#747775] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            className="px-3 py-1 text-xs rounded-full bg-[#EDF2FA] dark:bg-[#1E2228] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#D3E3FD] hover:text-[#041E49] dark:hover:bg-[#004A77] dark:hover:text-[#D3E3FD] whitespace-nowrap transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* SMS Composer Bottom Bar */}
      <div className="p-3 bg-[#F8FAFD] dark:bg-[#111318] border-t border-[#E0E2EC] dark:border-[#2D3139] shrink-0">
        <div className="relative flex items-end gap-2 bg-[#EDF2FA] dark:bg-[#1E2228] rounded-3xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-[#0B57D0]/30 transition-all">
          {/* Schedule button */}
          <button
            type="button"
            onClick={() => setScheduleModalOpen(true)}
            className="p-2.5 text-[#444746] dark:text-[#C4C7C5] hover:text-[#0B57D0] dark:hover:text-[#A8C7FA] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors shrink-0"
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
              className="w-full bg-transparent text-sm text-[#1F1F1F] dark:text-[#E2E2E2] placeholder-[#747775] dark:placeholder-[#8E918F] outline-none resize-none max-h-28"
            />
          </div>

          {/* Character / Segment Counter Indicator */}
          {inputText.length > 0 && (
            <div className="text-[10px] text-[#747775] dark:text-[#8E918F] font-mono whitespace-nowrap pr-1 self-center tabular-nums">
              {smsCount.charCount}/{smsCount.limitPerSegment}
              {smsCount.segmentCount > 1 && ` · ${smsCount.segmentCount} SMS`}
            </div>
          )}

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-full bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] disabled:opacity-30 disabled:pointer-events-none hover:bg-[#0842A0] active:scale-95 transition-all shadow-xs shrink-0"
            aria-label="Send SMS"
          >
            <Send className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>
      </div>

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSchedule={handleScheduleSubmit}
      />

      {/* Contact Details Modal */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setInfoModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1E2228] rounded-3xl p-6 shadow-2xl border border-[#E0E2EC] dark:border-[#2D3139] z-50 text-center animate-in zoom-in-95 duration-150">
            <div
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center font-bold text-2xl ${activeConversation.avatarColor} text-white shadow-md mb-3`}
            >
              {getInitials(activeConversation.contactName, activeConversation.phoneNumber)}
            </div>
            <h3 className="text-lg font-bold text-[#1F1F1F] dark:text-white">
              {activeConversation.contactName}
            </h3>
            <p className="text-sm text-[#747775] dark:text-[#8E918F] font-mono mt-1">
              {activeConversation.phoneNumber}
            </p>

            <div className="my-5 p-3 rounded-2xl bg-[#EDF2FA] dark:bg-[#252A32] text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[#747775] dark:text-[#8E918F]">Message Type:</span>
                <span className="font-semibold text-[#1F1F1F] dark:text-[#E2E2E2]">Standard SMS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#747775] dark:text-[#8E918F]">Total messages:</span>
                <span className="font-semibold font-mono text-[#1F1F1F] dark:text-[#E2E2E2]">{convMessages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#747775] dark:text-[#8E918F]">Status:</span>
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
                className="flex-1 py-2.5 px-3 text-xs font-semibold bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#D3E3FD] rounded-full hover:opacity-90"
              >
                Send Test Reply
              </button>
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="py-2.5 px-5 text-xs font-semibold bg-[#0B57D0] text-white rounded-full hover:bg-[#0842A0]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
