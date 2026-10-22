import React, { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, PanInfo } from 'motion/react';
import { spring, springBouncy, springSoft } from '../motion.ts';
import { LatestMessageCard } from './LatestMessageCard.tsx';
import { AvatarCircle } from './AvatarCircle.tsx';
import { ConversationActionSheet } from './ConversationActionSheet.tsx';
import { SearchResults } from './SearchResults.tsx';
import { HistorySheet } from './HistorySheet.tsx';
import { SkeletonList, TopProgress } from './Skeleton.tsx';
import { useLongPress } from '../utils/useLongPress.ts';
import { barCollapse } from '../utils/barCollapse.ts';
import { useBackHandler } from '../backStack.ts';
import type { PressHandlers } from '../utils/useLongPress.ts';
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
  MessageSquarePlus,
  X,
  Tag,
  Wrench,
  History,
  RefreshCw,
  CreditCard,
  User,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { Conversation, Message, FilterCategory } from '../types.ts';
import { formatConversationTime, getInitials } from '../utils/smsUtils.ts';

interface ConversationListProps {
  onStartChat: () => void;
}

interface ConversationRowProps {
  conv: Conversation;
  index: number;
  isSelected: boolean;
  isSpam: boolean;
  photo?: string;
  introDone: boolean;
  onOpen: (id: string) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
  onToggleRead: (conv: Conversation) => void;
  bindPress: (id: string) => PressHandlers;
  consumeClick: () => boolean;
}

/** One conversation row. Memoised so that unrelated updates never re-render the whole inbox. */
const ConversationRow = React.memo(function ConversationRow({
  conv,
  index,
  isSelected,
  isSpam,
  photo,
  introDone,
  onOpen,
  onPin,
  onArchive,
  onToggleRead,
  bindPress,
  consumeClick,
}: ConversationRowProps) {
  const hasUnread = conv.unreadCount > 0;
  const initials = getInitials(conv.contactName, conv.phoneNumber);

  return (
      <div
        key={conv.id}
        onClick={() => {
          if (consumeClick()) return;
          onOpen(conv.id);
        }}
        {...bindPress(conv.id)}
        style={!introDone && index < 14 ? { animationDelay: `${Math.min(index, 10) * 30}ms` } : undefined}
        className={`row-press ${!introDone && index < 14 ? 'row-enter' : ''} row-cv group relative flex items-center px-4 py-3.5 gap-3.5 cursor-pointer transition-colors duration-200 rounded-[28px] mx-2 ${
          isSelected
            ? 'bg-m3-primary-container/60 dark:bg-m3-primary-deep/40 text-m3-on-primary-deep dark:text-m3-primary-container'
            : hasUnread
            ? 'bg-white dark:bg-m3-d1 hover:bg-m3-surface-hi/80 dark:hover:bg-m3-d2 shadow-xs'
            : 'hover:bg-m3-surface-hi/60 dark:hover:bg-m3-d2'
        }`}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <AvatarCircle
            photo={photo}
            className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm ${conv.avatarColor} text-white shadow-xs`}
          >
            {initials}
          </AvatarCircle>
          {conv.isPinned && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-m3-d2 flex items-center justify-center shadow-xs border border-m3-line dark:border-m3-d4">
              <Pin className="w-2.5 h-2.5 text-m3-primary dark:text-m3-primary-light fill-current" />
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
                    ? 'font-bold text-m3-on-surface dark:text-white'
                    : 'font-medium text-m3-on-surface dark:text-m3-on-surface-dk'
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
              {conv.category === 'services' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-medium shrink-0">
                  Service
                </span>
              )}
              {isSpam && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-medium shrink-0">
                  Spam
                </span>
              )}
            </div>
            <span
              className={`text-[11px] whitespace-nowrap shrink-0 tabular-nums ${
                hasUnread
                  ? 'font-bold text-m3-primary dark:text-m3-primary-light'
                  : 'text-m3-outline dark:text-m3-outline-dk'
              }`}
            >
              {formatConversationTime(conv.lastMessageTimestamp)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-xs truncate ${
                hasUnread
                  ? 'font-semibold text-m3-on-surface dark:text-m3-on-surface-dk'
                  : 'text-m3-variant dark:text-[#9EA2A8]'
              }`}
            >
              {conv.lastMessageText || 'No messages yet'}
            </p>
            {hasUnread && (
              <span className="w-2.5 h-2.5 rounded-full bg-m3-primary dark:bg-m3-primary-light shrink-0" />
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
              onPin(conv.id);
            }}
            className="p-1.5 text-m3-variant dark:text-m3-variant-dk hover:text-m3-primary hover:bg-m3-primary-container/50 dark:hover:bg-m3-primary-deep/40 rounded-full transition-colors"
          >
            {conv.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>

          <button
            type="button"
            title={conv.isArchived ? 'Unarchive' : 'Archive'}
            onClick={(e) => {
              e.stopPropagation();
              onArchive(conv.id);
            }}
            className="p-1.5 text-m3-variant dark:text-m3-variant-dk hover:text-m3-primary hover:bg-m3-primary-container/50 dark:hover:bg-m3-primary-deep/40 rounded-full transition-colors"
          >
            {conv.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>

          <button
            type="button"
            title={hasUnread ? 'Mark as read' : 'Mark as unread'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleRead(conv);
            }}
            className="p-1.5 text-m3-variant dark:text-m3-variant-dk hover:text-m3-primary hover:bg-m3-primary-container/50 dark:hover:bg-m3-primary-deep/40 rounded-full transition-colors"
          >
            {hasUnread ? <CheckCheck className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
          </button>
        </div>
      </div>
  );
});

const FOLDER_TITLES: Partial<Record<FilterCategory, string>> = {
  starred: 'Starred',
  archived: 'Archived',
  spam: 'Spam',
  blocked: 'Blocked',
};

const PAGER_FILTERS: FilterCategory[] = ['all', 'personal', 'transactions', 'services', 'promotions'];

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
    setFilter,
    setTabHint,
    settings,
    spamConversationIds,
    getContactPhoto,
    olderAvailable,
    yearCounts,
    loadedYears,
    loadingYear,
    isSyncingDevice,
    isNativePlatform,
  } = useSMS();

  // The floating button tucks away while you scroll down and returns when you scroll up
  const [fabHidden, setFabHidden] = useState(false);
  const lastScrollTop = useRef(0);
  // Only the first rows are drawn; more are added as you scroll near the bottom (keeps taps instant)
  const [visibleCount, setVisibleCount] = useState(40);
  const paneLength = useRef(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 900) {
      setVisibleCount((c) => (c >= paneLength.current ? c : c + 40));
    }
    const top = e.currentTarget.scrollTop;
    const delta = top - lastScrollTop.current;
    if (Math.abs(delta) > 10) {
      // moving further down the list collapses the top bar; coming back up (or reaching the top) expands it
      if (top < 24 || delta < -6) barCollapse.set(false);
      else if (delta > 6 && top > 64) barCollapse.set(true);
      setFabHidden(delta > 0 && top > 80);
      lastScrollTop.current = top;
    }
  };

  // Newest message from someone else, per conversation (for the "Latest" card at the top)
  const latestIncoming = useMemo(() => {
    const map = new Map<string, Message>();
    for (const m of messages) {
      if (m.sender === 'me' || m.isScheduled) continue;
      const prev = map.get(m.conversationId);
      if (!prev || m.timestamp > prev.timestamp) map.set(m.conversationId, m);
    }
    return map;
  }, [messages]);

  // Long-press a conversation for its options (pin, archive, copy OTP, spam, block, delete ...)
  const [actionConvId, setActionConvId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const hasUnloadedYears = !yearCounts || yearCounts.some((y) => !loadedYears.includes(y.year));
  const { bind: bindPress, consumeClick: consumePressClick } = useLongPress<string>(setActionConvId);
  useBackHandler(actionConvId !== null, () => setActionConvId(null));

  // Entrance animation only on the very first paint, so swiping between tabs never flashes
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setVisibleCount(40);
  }, [searchQuery]);

  // ---- Swipe pager (All / Personal / Transactions / Promotions) ----
  const pagerIndex = PAGER_FILTERS.indexOf(filter);
  const deferredQuery = useDeferredValue(searchQuery);
  const searching = deferredQuery.trim() !== '';
  const searchPending = searchQuery.trim() !== deferredQuery.trim();
  const pagerEnabled = settings.showCategoriesTabs && pagerIndex >= 0 && !searching;
  const pagerRef = useRef<HTMLDivElement>(null);
  const currentPaneRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [neighborsOn, setNeighborsOn] = useState(false);
  useEffect(() => {
    if (!neighborsOn) return;
    const timer = setTimeout(() => setNeighborsOn(false), 2500);
    return () => clearTimeout(timer);
  }, [neighborsOn, filter]);
  const x = useMotionValue(0);
  const swipeCommitted = useRef(false);
  const prevPagerIndex = useRef(pagerIndex);

  useLayoutEffect(() => {
    const el = pagerRef.current;
    if (!el) return;
    const measure = () => setPageWidth(el.clientWidth);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pagerEnabled]);

  // When the tab changes: start the new tab at the top and slide it in. After a finished swipe the
  // panes have just swapped places, so the track is simply put back to the middle.
  useLayoutEffect(() => {
    if (currentPaneRef.current) currentPaneRef.current.scrollTop = 0;
    setVisibleCount(40);
    setTabHint(null);
    barCollapse.set(false);
    const previous = prevPagerIndex.current;
    prevPagerIndex.current = pagerIndex;
    if (swipeCommitted.current) {
      swipeCommitted.current = false;
      x.set(0);
      return;
    }
    if (pagerEnabled && previous >= 0 && pagerIndex >= 0 && previous !== pagerIndex && pageWidth > 0) {
      const dir = pagerIndex > previous ? 1 : -1;
      x.set(dir * pageWidth * 0.3);
      animate(x, 0, springSoft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handlePagerDragEnd = (_: unknown, info: PanInfo) => {
    const w = pageWidth || 1;
    const dx = info.offset.x;
    const vx = info.velocity.x;
    let dir = 0;
    if (dx < -w * 0.25 || vx < -450) dir = 1;
    else if (dx > w * 0.25 || vx > 450) dir = -1;
    const target = PAGER_FILTERS[pagerIndex + dir];
    if (dir === 0 || !target) {
      animate(x, 0, springBouncy);
      return;
    }
    swipeCommitted.current = true;
    setTabHint(target); // the bottom bar moves right now, not after the slide
    animate(x, -dir * w, { ...spring, velocity: vx }).then(() => setFilter(target));
  };

  // Filter conversations
  const matchesFilter = (conv: Conversation, f: FilterCategory): boolean => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = conv.contactName.toLowerCase().includes(q);
      const phoneMatch = conv.phoneNumber.toLowerCase().includes(q);
      const snippetMatch = conv.lastMessageText?.toLowerCase().includes(q);

      if (!nameMatch && !phoneMatch && !snippetMatch) {
        return false;
      }
    }

    // Spam protection: suspected spam only shows in the Spam view (and Archived / Blocked)
    const isSpam = spamConversationIds.has(conv.id);
    if (f === 'spam') {
      return isSpam && !conv.isArchived && !conv.isBlocked;
    }
    if (isSpam && f !== 'archived' && f !== 'blocked') {
      return false;
    }

    if (f === 'unread') {
      return conv.unreadCount > 0 && !conv.isArchived && !conv.isBlocked;
    }
    if (f === 'archived') {
      return conv.isArchived;
    }
    if (f === 'blocked') {
      return conv.isBlocked;
    }
    if (f === 'starred') {
      return !conv.isArchived && !conv.isBlocked;
    }

    // Category Tabs: Personal, Transactions, Promotions
    if (f === 'personal') {
      return conv.category === 'personal' && !conv.isArchived && !conv.isBlocked;
    }
    if (f === 'transactions') {
      return conv.category === 'transactions' && !conv.isArchived && !conv.isBlocked;
    }
    if (f === 'services') {
      return conv.category === 'services' && !conv.isArchived && !conv.isBlocked;
    }
    if (f === 'promotions') {
      return conv.category === 'promotions' && !conv.isArchived && !conv.isBlocked;
    }

    // Default 'all'
    return !conv.isArchived && !conv.isBlocked;
  };

  const filteredConversations = conversations.filter((conv) => matchesFilter(conv, filter));


  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const otherConversations = filteredConversations.filter((c) => !c.isPinned);

  // Render individual conversation row
  // Rows are memoised components; these callbacks stay the same between renders
  const rowActions = useRef({
    selectConversation,
    togglePinConversation,
    toggleArchiveConversation,
    markAsRead,
    markAsUnread,
  });
  rowActions.current = {
    selectConversation,
    togglePinConversation,
    toggleArchiveConversation,
    markAsRead,
    markAsUnread,
  };
  const onOpenRow = useCallback((id: string) => rowActions.current.selectConversation(id), []);
  const onPinRow = useCallback((id: string) => rowActions.current.togglePinConversation(id), []);
  const onArchiveRow = useCallback((id: string) => rowActions.current.toggleArchiveConversation(id), []);
  const onToggleReadRow = useCallback((c: Conversation) => {
    if (c.unreadCount > 0) rowActions.current.markAsRead(c.id);
    else rowActions.current.markAsUnread(c.id);
  }, []);

  const renderRow = (conv: Conversation, index = 0) => (
    <ConversationRow
      key={conv.id}
      conv={conv}
      index={index}
      isSelected={activeConversationId === conv.id}
      isSpam={spamConversationIds.has(conv.id)}
      photo={getContactPhoto(conv.phoneNumber)}
      introDone={introDone}
      onOpen={onOpenRow}
      onPin={onPinRow}
      onArchive={onArchiveRow}
      onToggleRead={onToggleReadRow}
      bindPress={bindPress}
      consumeClick={consumePressClick}
    />
  );

  // One page of the list for a given tab (used by the swipe pager and by the single view)
  const renderContent = (f: FilterCategory, limit = Infinity) => {
    if (conversations.length === 0 && isSyncingDevice) {
      return <SkeletonList count={9} label="Loading your messages" />;
    }
    const list = f === filter ? filteredConversations : conversations.filter((c) => matchesFilter(c, f));
    // The most recently arrived message gets a big card with all its details
    let featured: Conversation | null = null;
    let featuredMessage: Message | null = null;
    if (f !== 'starred' && !searchQuery.trim()) {
      for (const c of list) {
        const m = latestIncoming.get(c.id);
        if (!m || m.timestamp < c.lastMessageTimestamp) continue; // their last message must be the newest
        if (!featuredMessage || m.timestamp > featuredMessage.timestamp) {
          featured = c;
          featuredMessage = m;
        }
      }
    }
    const featuredId = featured ? featured.id : null;
    const pinned = list.filter((c) => c.isPinned && c.id !== featuredId);
    const others = list.filter((c) => !c.isPinned && c.id !== featuredId);
    if (f === filter) paneLength.current = list.length;
    return (
      <>
        {/* If in STARRED filter view, show starred message cards */}
        {f === 'starred' ? (
          <div className="px-3 py-2 space-y-2">
            <div className="px-3 py-1 flex items-center justify-between text-xs text-m3-outline dark:text-m3-outline-dk">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Starred Messages ({starredMessages.length})
              </span>
            </div>

            {starredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-m3-surface-hi dark:bg-m3-d2 flex items-center justify-center text-m3-outline dark:text-m3-outline-dk mb-3">
                  <Star className="w-8 h-8 stroke-1" />
                </div>
                <h4 className="text-sm font-semibold text-m3-on-surface dark:text-m3-on-surface-dk">
                  No starred messages
                </h4>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk max-w-xs mt-1">
                  Keep important SMS messages handy by tapping the star icon on any message in a conversation.
                </p>
              </div>
            ) : (
              starredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => selectConversation(msg.conversationId)}
                  className="p-3.5 bg-white dark:bg-m3-d1 rounded-2xl border border-m3-line dark:border-m3-d4 hover:border-m3-primary/40 cursor-pointer shadow-xs transition hover:shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-m3-primary dark:text-m3-primary-light">
                      {msg.conversation?.contactName || 'Conversation'}
                    </span>
                    <span className="text-[11px] text-m3-outline dark:text-m3-outline-dk">
                      {formatConversationTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-m3-on-surface dark:text-m3-on-surface-dk selectable-text leading-relaxed">
                    {msg.text}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-m3-outline dark:text-m3-outline-dk">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" />
                      Starred
                    </span>
                    <span className="flex items-center gap-0.5 hover:text-m3-primary">
                      Open chat <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : list.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-m3-surface-hi dark:bg-m3-d2 flex items-center justify-center text-m3-outline dark:text-m3-outline-dk mb-3">
              {f === 'personal' ? (
                <User className="w-8 h-8 stroke-1" />
              ) : f === 'transactions' ? (
                <CreditCard className="w-8 h-8 stroke-1" />
              ) : f === 'services' ? (
                <Wrench className="w-8 h-8 stroke-1" />
              ) : f === 'promotions' ? (
                <Tag className="w-8 h-8 stroke-1" />
              ) : f === 'archived' ? (
                <Archive className="w-8 h-8 stroke-1" />
              ) : f === 'blocked' || f === 'spam' ? (
                <ShieldAlert className="w-8 h-8 stroke-1" />
              ) : (
                <MessageSquare className="w-8 h-8 stroke-1" />
              )}
            </div>
            <h4 className="text-sm font-semibold text-m3-on-surface dark:text-m3-on-surface-dk">
              {searchQuery
                ? 'No matching SMS conversations'
                : f === 'personal'
                ? 'No personal text messages'
                : f === 'transactions'
                ? 'No transaction or bank alerts'
                : f === 'services'
                ? 'No service messages'
                : f === 'promotions'
                ? 'No promotional deals'
                : f === 'archived'
                ? 'No archived conversations'
                : f === 'spam'
                ? 'No spam detected'
                : f === 'blocked'
                ? 'No blocked numbers'
                : 'No conversations'}
            </h4>
            <p className="text-xs text-m3-outline dark:text-m3-outline-dk max-w-xs mt-1">
              {searchQuery
                ? 'Try searching with another name, phone number, or text phrase.'
                : f === 'personal'
                ? 'Messages from family and friends will appear here.'
                : f === 'transactions'
                ? 'Bank OTPs, verification codes, and flight updates will appear here.'
                : f === 'services'
                ? 'Account updates, bill reminders, deliveries and government notices will appear here.'
                : f === 'promotions'
                ? 'Deals, coupons, and carrier promotions will appear here.'
                : f === 'spam'
                ? 'Scams and unwanted texts from unknown senders are collected here, never deleted.'
                : 'Tap the chat button below to send a standard SMS message.'}
            </p>
          </div>
        ) : (
          <div>
            {featured && featuredMessage && (
              <LatestMessageCard
                key={featured.id}
                conversation={featured}
                photo={getContactPhoto(featured.phoneNumber)}
                message={featuredMessage}
                onOpen={() => {
                  if (consumePressClick()) return;
                  selectConversation(featured!.id);
                }}
                pressProps={bindPress(featured.id)}
              />
            )}

            {/* Pinned Section */}
            {pinned.length > 0 && (
              <div className="mb-2">
                <div className="px-6 py-1 flex items-center gap-1.5 text-[11px] font-semibold text-m3-outline dark:text-m3-outline-dk uppercase tracking-wider">
                  <Pin className="w-3 h-3 fill-current text-m3-primary dark:text-m3-primary-light" />
                  <span>Pinned</span>
                </div>
                <div className="space-y-0.5">
                  {pinned.slice(0, limit).map((c, i) => renderRow(c, i))}
                </div>
              </div>
            )}

            {/* Other / Unpinned Section */}
            {others.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <div className="px-6 py-1 text-[11px] font-semibold text-m3-outline dark:text-m3-outline-dk uppercase tracking-wider">
                    <span>Conversations</span>
                  </div>
                )}
                <div className="space-y-0.5">
                  {others.slice(0, limit).map((c, i) => renderRow(c, i))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Newest 200 messages first; older years are offered one at a time */}
        {f === filter && isNativePlatform && olderAvailable && (hasUnloadedYears || loadingYear !== null) && (
          <div className="mx-4 mt-2 mb-4 rounded-[28px] bg-m3-surface-hi dark:bg-m3-d2 overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-m3-primary-container dark:bg-m3-primary-deep text-m3-primary dark:text-m3-primary-light flex items-center justify-center shrink-0">
                {loadingYear !== null ? <RefreshCw className="w-5 h-5 animate-spin" /> : <History className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-m3-on-surface dark:text-white">
                  {loadingYear !== null ? `Loading ${loadingYear}…` : 'Showing your latest messages'}
                </p>
                <p className="text-xs text-m3-variant dark:text-m3-variant-dk">
                  {loadingYear !== null ? 'Older messages are on their way.' : 'Older messages are grouped by year.'}
                </p>
              </div>
              {loadingYear === null && (
                <button
                  type="button"
                  onClick={() => setHistoryOpen(true)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep shrink-0"
                >
                  Show more
                </button>
              )}
            </div>
            {loadingYear !== null && <SkeletonList count={3} label={`Loading ${loadingYear}`} />}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-m3-surface dark:bg-m3-d0">
      {pagerEnabled ? (
        /* Swipe left / right to move between All, Personal, Transactions and Promotions */
        <div ref={pagerRef} className="flex-1 min-h-0 overflow-hidden relative">
          <motion.div
            className="flex h-full"
            style={{ x, width: '300%', marginLeft: '-100%', touchAction: 'pan-y' }}
            drag="x"
            dragDirectionLock
            dragMomentum={false}
            dragElastic={0.08}
            dragConstraints={{ left: -pageWidth, right: pageWidth }}
            onDragEnd={handlePagerDragEnd}
            onPointerDown={() => setNeighborsOn(true)}
          >
            {(['prev', 'cur', 'next'] as const).map((slot) => {
              const idx = pagerIndex + (slot === 'prev' ? -1 : slot === 'next' ? 1 : 0);
              const f = PAGER_FILTERS[idx];
              return (
                <div
                  key={slot}
                  ref={slot === 'cur' ? currentPaneRef : undefined}
                  onScroll={slot === 'cur' ? handleScroll : undefined}
                  aria-hidden={slot !== 'cur'}
                  className="edge-mask w-1/3 h-full shrink-0 overflow-y-auto overscroll-x-none touch-pan-y"
                  style={{ paddingTop: 'calc(var(--bar-top, 4px) + 2px)', paddingBottom: 'calc(var(--bar-bottom, 96px) + 14px)' }}
                >
                  {f && (slot === 'cur' || neighborsOn) ? renderContent(f, slot === 'cur' ? visibleCount : 12) : null}
                </div>
              );
            })}
          </motion.div>
        </div>
      ) : (
        <div
          className="edge-mask flex-1 overflow-y-auto"
          style={{ paddingTop: 'calc(var(--bar-top, 4px) + 2px)', paddingBottom: 'calc(var(--bar-bottom, 96px) + 14px)' }}
          onScroll={handleScroll}
        >
          {searching ? (
            searchPending ? (
              <SkeletonList count={6} label="Searching" />
            ) : (
              <SearchResults query={deferredQuery} onShowOlder={() => setHistoryOpen(true)} />
            )
          ) : (
            renderContent(filter, visibleCount)
          )}
        </div>
      )}

      <ConversationActionSheet conversationId={actionConvId} onClose={() => setActionConvId(null)} />
      <HistorySheet isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      {(loadingYear !== null || (isSyncingDevice && conversations.length === 0)) && <TopProgress />}

      {/* Material 3 Expressive floating action button (icon only) */}
      <motion.div
        className="absolute right-5 z-20"
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{
          scale: fabHidden ? 0.5 : 1,
          rotate: 0,
          opacity: fabHidden ? 0 : 1,
          y: fabHidden ? 28 : 0,
        }}
        transition={springBouncy}
        style={{ pointerEvents: fabHidden ? 'none' : 'auto', bottom: 'calc(var(--bar-bottom, 84px) + 16px)' }}
      >
        <motion.button
          type="button"
          onClick={onStartChat}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.9, borderRadius: 36 }}
          style={{ borderRadius: 24 }}
          className="flex items-center justify-center w-16 h-16 bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep shadow-lg shadow-m3-primary/30"
          aria-label="Start chat"
          title="Start chat"
        >
          <MessageSquarePlus className="w-7 h-7" />
        </motion.button>
      </motion.div>
    </div>
  );
};
