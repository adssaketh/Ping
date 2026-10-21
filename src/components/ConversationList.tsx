import React, { useState } from 'react';
import {
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  CheckCheck,
  Mail,
  Plus,
  Star,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  Tag,
  CreditCard,
  User,
  Smartphone,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { Conversation, Message } from '../types.ts';
import { formatConversationTime, getInitials } from '../utils/smsUtils.ts';

interface ConversationListProps {
  onStartChat: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ onStartChat }) => {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    filter,
    searchQuery,
    togglePinConversation,
    toggleArchiveConversation,
    markAsRead,
    markAsUnread,
    starredMessages,
    messages,
    isNativePlatform,
    isDefaultSms,
    requestDefaultSmsApp,
    syncDeviceSmsAndContacts,
    isSyncingDevice,
    syncResult,
  } = useSMS();

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = conv.contactName.toLowerCase().includes(q);
      const phoneMatch = conv.phoneNumber.toLowerCase().includes(q);
      const snippetMatch = conv.lastMessageText?.toLowerCase().includes(q);

      const hasMessageMatch = messages.some(
        (m) => m.conversationId === conv.id && m.text.toLowerCase().includes(q)
      );

      if (!nameMatch && !phoneMatch && !snippetMatch && !hasMessageMatch) {
        return false;
      }
    }

    if (filter === 'unread') {
      return conv.unreadCount > 0 && !conv.isArchived && !conv.isBlocked;
    }
    if (filter === 'archived') {
      return conv.isArchived;
    }
    if (filter === 'blocked') {
      return conv.isBlocked;
    }
    if (filter === 'starred') {
      return !conv.isArchived && !conv.isBlocked;
    }

    // Category Tabs: Personal, Transactions, Promotions
    if (filter === 'personal') {
      return conv.category === 'personal' && !conv.isArchived && !conv.isBlocked;
    }
    if (filter === 'transactions') {
      return conv.category === 'transactions' && !conv.isArchived && !conv.isBlocked;
    }
    if (filter === 'promotions') {
      return conv.category === 'promotions' && !conv.isArchived && !conv.isBlocked;
    }

    // Default 'all'
    return !conv.isArchived && !conv.isBlocked;
  });

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const otherConversations = filteredConversations.filter((c) => !c.isPinned);

  // Render individual conversation row
  const renderRow = (conv: Conversation) => {
    const isSelected = activeConversationId === conv.id;
    const hasUnread = conv.unreadCount > 0;
    const initials = getInitials(conv.contactName, conv.phoneNumber);

    return (
      <div
        key={conv.id}
        onClick={() => selectConversation(conv.id)}
        className={`group relative flex items-center px-4 py-3.5 gap-3.5 cursor-pointer transition-all duration-150 rounded-2xl mx-2 ${
          isSelected
            ? 'bg-[#D3E3FD]/60 dark:bg-[#004A77]/40 text-[#041E49] dark:text-[#D3E3FD]'
            : hasUnread
            ? 'bg-white dark:bg-[#1A1D23] hover:bg-[#EDF2FA]/80 dark:hover:bg-[#20242C] shadow-xs'
            : 'hover:bg-[#EDF2FA]/60 dark:hover:bg-[#1E2228]'
        }`}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm ${conv.avatarColor} text-white shadow-xs`}
          >
            {initials}
          </div>
          {conv.isPinned && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-[#1E2228] flex items-center justify-center shadow-xs border border-[#E0E2EC] dark:border-[#2D3139]">
              <Pin className="w-2.5 h-2.5 text-[#0B57D0] dark:text-[#A8C7FA] fill-current" />
            </div>
          )}
        </div>

        {/* Message Content & Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <h3
                className={`text-sm truncate ${
                  hasUnread
                    ? 'font-bold text-[#1F1F1F] dark:text-white'
                    : 'font-medium text-[#1F1F1F] dark:text-[#E2E2E2]'
                }`}
              >
                {conv.contactName}
              </h3>
              {conv.category === 'transactions' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-medium shrink-0">
                  Bank / Alert
                </span>
              )}
              {conv.category === 'promotions' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-medium shrink-0">
                  Promo
                </span>
              )}
            </div>
            <span
              className={`text-[11px] whitespace-nowrap shrink-0 tabular-nums ${
                hasUnread
                  ? 'font-bold text-[#0B57D0] dark:text-[#A8C7FA]'
                  : 'text-[#747775] dark:text-[#8E918F]'
              }`}
            >
              {formatConversationTime(conv.lastMessageTimestamp)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-xs truncate ${
                hasUnread
                  ? 'font-semibold text-[#1F1F1F] dark:text-[#E2E2E2]'
                  : 'text-[#444746] dark:text-[#9EA2A8]'
              }`}
            >
              {conv.lastMessageText || 'No messages yet'}
            </p>
            {hasUnread && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B57D0] dark:bg-[#A8C7FA] shrink-0" />
            )}
          </div>
        </div>

        {/* Hover Quick Actions */}
        <div className="hidden group-hover:flex items-center gap-1 shrink-0 pl-1">
          <button
            type="button"
            title={conv.isPinned ? 'Unpin' : 'Pin'}
            onClick={(e) => {
              e.stopPropagation();
              togglePinConversation(conv.id);
            }}
            className="p-1.5 text-[#444746] dark:text-[#C4C7C5] hover:text-[#0B57D0] hover:bg-[#D3E3FD]/50 dark:hover:bg-[#004A77]/40 rounded-full transition-colors"
          >
            {conv.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>

          <button
            type="button"
            title={conv.isArchived ? 'Unarchive' : 'Archive'}
            onClick={(e) => {
              e.stopPropagation();
              toggleArchiveConversation(conv.id);
            }}
            className="p-1.5 text-[#444746] dark:text-[#C4C7C5] hover:text-[#0B57D0] hover:bg-[#D3E3FD]/50 dark:hover:bg-[#004A77]/40 rounded-full transition-colors"
          >
            {conv.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>

          <button
            type="button"
            title={hasUnread ? 'Mark as read' : 'Mark as unread'}
            onClick={(e) => {
              e.stopPropagation();
              if (hasUnread) {
                markAsRead(conv.id);
              } else {
                markAsUnread(conv.id);
              }
            }}
            className="p-1.5 text-[#444746] dark:text-[#C4C7C5] hover:text-[#0B57D0] hover:bg-[#D3E3FD]/50 dark:hover:bg-[#004A77]/40 rounded-full transition-colors"
          >
            {hasUnread ? <CheckCheck className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#F8FAFD] dark:bg-[#111318]">
      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto pb-24 pt-1">
        {/* Default SMS Banner when running on native Android and not yet default */}
        {isNativePlatform && !isDefaultSms && filter === 'all' && (
          <div className="mx-3.5 mt-2 mb-3 p-4 rounded-3xl bg-[#D3E3FD]/60 dark:bg-[#004A77]/35 border border-[#A8C7FA]/50 dark:border-[#0B57D0]/50 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0B57D0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[#1F1F1F] dark:text-white">
                  Make Ping your default SMS app
                </h4>
                <p className="text-xs text-[#444746] dark:text-[#C4C7C5] mt-0.5 leading-relaxed">
                  Set Ping as your default SMS handler to send carrier texts, read incoming messages, and sync phone contacts.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={requestDefaultSmsApp}
                    className="px-4 py-1.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
                  >
                    Set as default
                  </button>
                  <button
                    type="button"
                    onClick={() => syncDeviceSmsAndContacts()}
                    disabled={isSyncingDevice}
                    className="px-3.5 py-1.5 bg-white dark:bg-[#1A1D23] text-[#0B57D0] dark:text-[#A8C7FA] border border-[#C4C7C5] dark:border-[#444746] hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDevice ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDevice ? 'Syncing...' : 'Sync Device SMS'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Success feedback notice */}
        {syncResult && filter === 'all' && (
          <div className="mx-3.5 mb-2 px-3.5 py-2 rounded-2xl bg-[#E8F5E9] dark:bg-[#1B3520] border border-[#A5D6A7] dark:border-[#2E7D32] flex items-center justify-between text-xs text-[#1E4620] dark:text-[#A5D6A7]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] dark:text-[#81C784]" />
              <span>
                Synced {syncResult.smsCount} messages & {syncResult.contactCount} contacts from device
              </span>
            </div>
          </div>
        )}

        {/* If in STARRED filter view, show starred message cards */}
        {filter === 'starred' ? (
          <div className="px-3 py-2 space-y-2">
            <div className="px-3 py-1 flex items-center justify-between text-xs text-[#747775] dark:text-[#8E918F]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Starred Messages ({starredMessages.length})
              </span>
            </div>

            {starredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[#EDF2FA] dark:bg-[#1E2228] flex items-center justify-center text-[#747775] dark:text-[#8E918F] mb-3">
                  <Star className="w-8 h-8 stroke-1" />
                </div>
                <h4 className="text-sm font-semibold text-[#1F1F1F] dark:text-[#E2E2E2]">
                  No starred messages
                </h4>
                <p className="text-xs text-[#747775] dark:text-[#8E918F] max-w-xs mt-1">
                  Keep important SMS messages handy by tapping the star icon on any message in a conversation.
                </p>
              </div>
            ) : (
              starredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => selectConversation(msg.conversationId)}
                  className="p-3.5 bg-white dark:bg-[#1B1E24] rounded-2xl border border-[#E0E2EC] dark:border-[#2D3139] hover:border-[#0B57D0]/40 cursor-pointer shadow-xs transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#0B57D0] dark:text-[#A8C7FA]">
                      {msg.conversation?.contactName || 'Conversation'}
                    </span>
                    <span className="text-[11px] text-[#747775] dark:text-[#8E918F]">
                      {formatConversationTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-[#1F1F1F] dark:text-[#E2E2E2] selectable-text leading-relaxed">
                    {msg.text}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#747775] dark:text-[#8E918F]">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" />
                      Starred
                    </span>
                    <span className="flex items-center gap-0.5 hover:text-[#0B57D0]">
                      Open chat <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : filteredConversations.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EDF2FA] dark:bg-[#1E2228] flex items-center justify-center text-[#747775] dark:text-[#8E918F] mb-3">
              {filter === 'personal' ? (
                <User className="w-8 h-8 stroke-1" />
              ) : filter === 'transactions' ? (
                <CreditCard className="w-8 h-8 stroke-1" />
              ) : filter === 'promotions' ? (
                <Tag className="w-8 h-8 stroke-1" />
              ) : filter === 'archived' ? (
                <Archive className="w-8 h-8 stroke-1" />
              ) : filter === 'blocked' ? (
                <ShieldAlert className="w-8 h-8 stroke-1" />
              ) : (
                <MessageSquare className="w-8 h-8 stroke-1" />
              )}
            </div>
            <h4 className="text-sm font-semibold text-[#1F1F1F] dark:text-[#E2E2E2]">
              {searchQuery
                ? 'No matching SMS conversations'
                : filter === 'personal'
                ? 'No personal text messages'
                : filter === 'transactions'
                ? 'No transaction or bank alerts'
                : filter === 'promotions'
                ? 'No promotional deals'
                : filter === 'archived'
                ? 'No archived conversations'
                : filter === 'blocked'
                ? 'No spam or blocked numbers'
                : 'No conversations'}
            </h4>
            <p className="text-xs text-[#747775] dark:text-[#8E918F] max-w-xs mt-1">
              {searchQuery
                ? 'Try searching with another name, phone number, or text phrase.'
                : filter === 'personal'
                ? 'Messages from family and friends will appear here.'
                : filter === 'transactions'
                ? 'Bank OTPs, verification codes, and flight updates will appear here.'
                : filter === 'promotions'
                ? 'Deals, coupons, and carrier promotions will appear here.'
                : 'Tap "Start chat" below to send a standard SMS message.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Pinned Section */}
            {pinnedConversations.length > 0 && (
              <div className="mb-2">
                <div className="px-6 py-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#747775] dark:text-[#8E918F] uppercase tracking-wider">
                  <Pin className="w-3 h-3 fill-current text-[#0B57D0] dark:text-[#A8C7FA]" />
                  <span>Pinned</span>
                </div>
                <div className="space-y-0.5">
                  {pinnedConversations.map(renderRow)}
                </div>
              </div>
            )}

            {/* Other / Unpinned Section */}
            {otherConversations.length > 0 && (
              <div>
                {pinnedConversations.length > 0 && (
                  <div className="px-6 py-1 text-[11px] font-semibold text-[#747775] dark:text-[#8E918F] uppercase tracking-wider">
                    <span>Conversations</span>
                  </div>
                )}
                <div className="space-y-0.5">
                  {otherConversations.map(renderRow)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Material 3 Extended Floating Action Button: "Start chat" */}
      <div className="absolute right-5 bottom-6 z-20">
        <button
          type="button"
          onClick={onStartChat}
          className="flex items-center gap-2.5 h-14 px-5 rounded-2xl bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] shadow-lg shadow-[#0B57D0]/25 hover:shadow-xl hover:shadow-[#0B57D0]/35 active:scale-95 transition-all duration-150 font-semibold text-sm"
          aria-label="Start chat"
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          <span>Start chat</span>
        </button>
      </div>
    </div>
  );
};
