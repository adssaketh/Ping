import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, SearchX } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { Message } from '../types.ts';
import { describeDate, matchesDate, parseSearchQuery } from '../utils/dateSearch.ts';
import { phoneDigits } from '../utils/phone.ts';
import { getInitials } from '../utils/smsUtils.ts';
import { AvatarCircle } from './AvatarCircle.tsx';

interface SearchResultsProps {
  query: string;
  onShowOlder?: () => void;
}

const shortDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Words, numbers and dates: "refund", "9494", "2025", "june", "22 oct", "22/10/2026", "hdfc june". */
export const SearchResults: React.FC<SearchResultsProps> = ({ query, onShowOlder }) => {
  const { conversations, messages, selectConversation, setJumpToMessageId, getContactPhoto, olderAvailable, yearCounts, loadedYears } =
    useSMS();
  const moreToLoad = olderAvailable && (!yearCounts || yearCounts.some((y) => !loadedYears.includes(y.year)));
  const olderHint = moreToLoad ? (
    <div className="mx-4 mt-3 mb-2 flex items-center gap-3 px-4 py-3 rounded-[24px] bg-m3-surface-hi dark:bg-m3-d2">
      <p className="flex-1 text-xs text-m3-variant dark:text-m3-variant-dk">
        Search covers the messages Ping has loaded. Load older years to include them.
      </p>
      {onShowOlder && (
        <button
          type="button"
          onClick={onShowOlder}
          className="px-4 py-2 rounded-full text-xs font-semibold shrink-0 bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep"
        >
          Show more
        </button>
      )}
    </div>
  ) : null;
  const [shown, setShown] = useState(80);
  useEffect(() => {
    setShown(80);
  }, [query]);

  const parsed = useMemo(() => parseSearchQuery(query), [query]);

  const { chats, hits } = useMemo(() => {
    const needle = parsed.text; // already lower-case
    const numericNeedle = /^[\d\s+\-()]{3,}$/.test(needle) ? phoneDigits(needle) : '';

    // chats whose name or number matches (not for pure date searches)
    const chatMatches = needle
      ? conversations.filter(
          (c) =>
            !c.isBlocked &&
            (c.contactName.toLowerCase().includes(needle) ||
              c.phoneNumber.toLowerCase().includes(needle) ||
              (numericNeedle !== '' && phoneDigits(c.phoneNumber).includes(numericNeedle)))
        )
      : [];

    // every message that has the words and is from the dates asked for
    const known = new Set(conversations.map((c) => c.id));
    const found: Message[] = [];
    for (const m of messages) {
      if (m.isScheduled || !known.has(m.conversationId)) continue;
      if (parsed.date && !matchesDate(m.timestamp, parsed.date)) continue;
      if (needle && !m.text.toLowerCase().includes(needle)) continue;
      found.push(m);
    }
    found.sort((a, b) => b.timestamp - a.timestamp);
    return { chats: chatMatches, hits: found };
  }, [conversations, messages, parsed]);

  const convById = useMemo(() => new Map(conversations.map((c) => [c.id, c])), [conversations]);

  const snippet = (text: string) => {
    const needle = parsed.text;
    const flat = text.replace(/\s+/g, ' ');
    if (!needle) return <>{flat.slice(0, 160)}</>;
    const index = flat.toLowerCase().indexOf(needle);
    if (index < 0) return <>{flat.slice(0, 160)}</>;
    const start = Math.max(0, index - 40);
    const before = flat.slice(start, index);
    const match = flat.slice(index, index + needle.length);
    const after = flat.slice(index + needle.length, start + 160);
    return (
      <>
        {start > 0 ? '…' : ''}
        {before}
        <mark className="bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container rounded px-0.5">
          {match}
        </mark>
        {after}
      </>
    );
  };

  if (chats.length === 0 && hits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-8 pt-24 text-m3-outline dark:text-m3-outline-dk">
        <SearchX className="w-12 h-12 stroke-1 mb-3" />
        <p className="text-base font-semibold text-m3-on-surface dark:text-white">No results for “{query.trim()}”</p>
        <p className="text-xs mt-2 max-w-xs leading-relaxed">
          Try a word, a number, or a date such as 2025, June 2026, 22 Oct or 22/10/2026.
        </p>
        <div className="w-full mt-6 text-left">{olderHint}</div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      {olderHint}
      {parsed.date && (
        <div className="mx-4 mb-3 mt-1 flex items-center gap-3 px-4 py-3 rounded-[24px] bg-m3-primary-container/70 dark:bg-m3-primary-deep/40">
          <CalendarDays className="w-5 h-5 text-m3-primary dark:text-m3-primary-light shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-m3-on-primary-deep dark:text-m3-primary-container">
              Messages from {describeDate(parsed.date)}
            </p>
            <p className="text-xs text-m3-on-primary-deep/80 dark:text-m3-primary-container/80">
              {hits.length} {hits.length === 1 ? 'message' : 'messages'}
              {parsed.text ? ` containing “${parsed.text}”` : ''}
            </p>
          </div>
        </div>
      )}

      {chats.length > 0 && (
        <>
          <p className="px-6 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-m3-outline dark:text-m3-outline-dk">
            Chats ({chats.length})
          </p>
          {chats.slice(0, 15).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectConversation(c.id)}
              className="w-[calc(100%-1rem)] mx-2 text-left flex items-center gap-3.5 px-4 py-3 rounded-[24px] hover:bg-m3-surface-hi dark:hover:bg-m3-d2"
            >
              <AvatarCircle
                photo={getContactPhoto(c.phoneNumber)}
                className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm ${c.avatarColor} text-white shrink-0`}
              >
                {getInitials(c.contactName, c.phoneNumber)}
              </AvatarCircle>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-m3-on-surface dark:text-white">{c.contactName}</p>
                <p className="text-xs truncate text-m3-variant dark:text-m3-variant-dk">{c.lastMessageText}</p>
              </div>
            </button>
          ))}
        </>
      )}

      {hits.length > 0 && (
        <>
          <p className="px-6 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-m3-outline dark:text-m3-outline-dk">
            Messages ({hits.length})
          </p>
          {hits.slice(0, shown).map((m) => {
            const conv = convById.get(m.conversationId);
            if (!conv) return null;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  selectConversation(conv.id);
                  setJumpToMessageId(m.id);
                }}
                className="w-[calc(100%-1rem)] mx-2 text-left flex items-start gap-3.5 px-4 py-3 rounded-[24px] hover:bg-m3-surface-hi dark:hover:bg-m3-d2"
              >
                <AvatarCircle
                  photo={getContactPhoto(conv.phoneNumber)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm ${conv.avatarColor} text-white shrink-0`}
                >
                  {getInitials(conv.contactName, conv.phoneNumber)}
                </AvatarCircle>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold truncate text-m3-on-surface dark:text-white">
                      {conv.contactName}
                      {m.sender === 'me' ? ' (you)' : ''}
                    </span>
                    <span className="text-[11px] shrink-0 text-m3-outline dark:text-m3-outline-dk">
                      {shortDate(m.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-m3-variant dark:text-m3-variant-dk line-clamp-3 break-words">
                    {snippet(m.text)}
                  </p>
                </div>
              </button>
            );
          })}
          {hits.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + 100)}
              className="mx-auto mt-2 block px-5 py-2.5 rounded-full text-xs font-semibold bg-m3-surface-hi dark:bg-m3-d2 text-m3-primary dark:text-m3-primary-light"
            >
              Show {Math.min(100, hits.length - shown)} more
            </button>
          )}
        </>
      )}
    </div>
  );
};
