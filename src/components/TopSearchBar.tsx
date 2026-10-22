import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  X,
  Settings,
  ShieldCheck,
  FileText,
  Camera,
  Code,
  Star,
  Archive,
  Ban,
  ShieldAlert,
  CheckCheck,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { FilterCategory } from '../types.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { springBouncy } from '../motion.ts';
import { ProfileAvatar } from './ProfileAvatar.tsx';
import { profilePhotoEditor } from '../utils/profilePhotoEditor.ts';
import { useBackHandler } from '../backStack.ts';
import { smsBridge } from '../services/smsBridge.ts';
import { barCollapse } from '../utils/barCollapse.ts';

interface TopSearchBarProps {
  onOpenSimulator?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy?: () => void;
  onOpenCredits?: () => void;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  onOpenSettings,
  onOpenPrivacy,
  onOpenCredits,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    categoryCounts,
    settings,
    updateSettings,
    conversations,
    markAsRead,
    starredMessages,
  } = useSMS();

  const [menuOpen, setMenuOpen] = useState(false);

  // Scrolling collapses the bar: the search field becomes an icon at the left, the Ping logo moves to the middle and
  // your picture stays at the right. Searching, typing or an open menu keep it expanded.
  // All the motion is plain CSS (see .topbar in index.css) switched by a data attribute, so collapsing never
  // re-renders React while the list is scrolling; that is what keeps it smooth.
  const [searchFocused, setSearchFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const holdOpen = useRef(false);
  holdOpen.current = searchFocused || searchQuery.trim() !== '' || menuOpen;
  const applyCollapsed = useCallback(() => {
    const value = barCollapse.get() && !holdOpen.current ? '1' : '0';
    rootRef.current?.setAttribute('data-collapsed', value);
    document.documentElement.setAttribute('data-bar-collapsed', value); // the blur strip follows
  }, []);
  useEffect(() => barCollapse.subscribe(applyCollapsed), [applyCollapsed]);
  useEffect(() => {
    applyCollapsed();
  }, [searchFocused, searchQuery, menuOpen, applyCollapsed]);
  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const measure = () => rootRef.current?.style.setProperty('--clip-right', `${Math.max(0, el.clientWidth - 48)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const expandAndFocus = () => {
    barCollapse.set(false);
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      smsBridge.showKeyboard();
    }, 170);
  };
  useBackHandler(menuOpen, () => setMenuOpen(false));

  const FOLDER_LABELS: Partial<Record<FilterCategory, string>> = {
    starred: 'Starred',
    archived: 'Archived',
    spam: 'Spam',
    blocked: 'Blocked',
  };
  const unreadTotal = conversations.filter((c) => c.unreadCount > 0 && !c.isArchived && !c.isBlocked).length;
  const archivedCount = conversations.filter((c) => c.isArchived).length;
  const blockedCount = conversations.filter((c) => c.isBlocked).length;

  const openFolder = (folder: FilterCategory) => {
    setMenuOpen(false);
    setFilter(folder);
  };

  const markAllRead = () => {
    conversations.forEach((c) => {
      if (c.unreadCount > 0) markAsRead(c.id);
    });
    setMenuOpen(false);
  };

  const folders: { id: FilterCategory; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'starred', label: 'Starred', icon: Star, count: starredMessages.length },
    { id: 'archived', label: 'Archived', icon: Archive, count: archivedCount },
    { id: 'spam', label: 'Spam', icon: ShieldAlert, count: categoryCounts.spam },
    { id: 'blocked', label: 'Blocked', icon: Ban, count: blockedCount },
  ];

  return (
    <div ref={rootRef} data-collapsed="0" className="topbar px-4 pt-3 pb-2 shrink-0 pointer-events-none">
      <div ref={rowRef} className="topbar-row relative h-14">
        {/* Material 3 Search Bar: a full-width pill that is clipped down to a circle when collapsed */}
        <div
          className={`topbar-pill pointer-events-auto absolute inset-0 flex items-center rounded-full ${
            settings.barStyle === 'glass' ? 'bar-glass' : 'bg-m3-surface-hi dark:bg-m3-d2 shadow-sm'
          } text-m3-on-surface dark:text-m3-on-surface-dk transition-shadow ${settings.barStyle === 'glass' ? '' : 'focus-within:bg-white dark:focus-within:bg-m3-d3'} focus-within:ring-2 focus-within:ring-m3-primary/30 dark:focus-within:ring-m3-primary-light/30`}
          onClick={() => {
            if (rootRef.current?.dataset.collapsed === '1') expandAndFocus();
          }}
        >
          <div className="flex-1 flex items-center pl-[14px] gap-2 min-w-0">
            <Search className="w-5 h-5 text-m3-outline dark:text-m3-outline-dk shrink-0" />
            <div className="topbar-input flex-1 flex items-center gap-2 min-w-0">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                id="ping-search-input"
                placeholder="Search in Ping"
                className="w-full bg-transparent text-sm font-normal text-m3-on-surface dark:text-m3-on-surface-dk placeholder-m3-outline dark:placeholder-m3-outline-dk outline-none truncate"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-m3-outline hover:text-m3-on-surface dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Clear search"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={springBouncy}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <div className="w-12 shrink-0" />
          </div>
        </div>

        {/* The Ping logo slides in to the middle while the bar is collapsed */}
        <div className="topbar-logo absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <div role="img" aria-label="Ping" className="ping-logo" />
        </div>

        {/* Profile picture + menu: stays put at the right while the search field collapses */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-auto z-10">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-0.5 -mr-1 rounded-full hover:ring-2 hover:ring-m3-primary/30"
            aria-label="Profile and options"
            aria-expanded={menuOpen}
          >
            <ProfileAvatar photo={settings.profilePhoto} name={settings.profileName} size={40} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div
                  className="absolute right-0 top-12 w-72 max-h-[78vh] overflow-y-auto p-2 bg-white dark:bg-m3-d2 border border-m3-line dark:border-m3-d4 rounded-[28px] shadow-2xl z-50 text-sm"
                  style={{ transformOrigin: 'top right' }}
                  initial={{ opacity: 0, scale: 0.85, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.1 } }}
                  transition={springBouncy}
                >
                  <div className="flex items-center gap-3 px-3 pt-2 pb-3">
                    <button
                      type="button"
                      onClick={() => (settings.profilePhoto ? profilePhotoEditor.edit() : profilePhotoEditor.choose())}
                      className="relative shrink-0"
                      aria-label="Change profile picture"
                    >
                      <ProfileAvatar photo={settings.profilePhoto} name={settings.profileName} size={52} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep flex items-center justify-center border-2 border-white dark:border-m3-d2">
                        <Camera className="w-3 h-3" />
                      </span>
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-m3-on-surface dark:text-white">
                        {settings.profileName || 'Your profile'}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => (settings.profilePhoto ? profilePhotoEditor.edit() : profilePhotoEditor.choose())}
                          className="text-xs font-medium text-m3-primary dark:text-m3-primary-light"
                        >
                          {settings.profilePhoto ? 'Edit' : 'Add profile picture'}
                        </button>
                        {settings.profilePhoto && (
                          <button
                            type="button"
                            onClick={() => profilePhotoEditor.choose()}
                            className="text-xs font-medium text-m3-primary dark:text-m3-primary-light"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="h-px mx-2 mb-1 bg-m3-line dark:bg-m3-d4" />

                  {folders.map((f) => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => openFolder(f.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-m3-on-surface dark:text-m3-on-surface-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-2xl"
                      >
                        <Icon className="w-4 h-4 text-m3-variant dark:text-m3-variant-dk" />
                        <span className="flex-1 text-left">{f.label}</span>
                        {f.count > 0 && (
                          <span className="text-[11px] text-m3-outline dark:text-m3-outline-dk">{f.count}</span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={unreadTotal === 0}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-m3-on-surface dark:text-m3-on-surface-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-2xl disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <CheckCheck className="w-4 h-4 text-m3-variant dark:text-m3-variant-dk" />
                    <span className="flex-1 text-left">Mark all as read</span>
                    {unreadTotal > 0 && (
                      <span className="text-[11px] text-m3-outline dark:text-m3-outline-dk">{unreadTotal}</span>
                    )}
                  </button>
                  <div className="h-px mx-2 my-1 bg-m3-line dark:bg-m3-d4" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      window.setTimeout(() => onOpenSettings(), 110);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-m3-on-surface dark:text-m3-on-surface-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-2xl"
                  >
                    <Settings className="w-4 h-4 text-m3-variant dark:text-m3-variant-dk" />
                    <span>Settings</span>
                  </button>

                  {/* PWA Install Action if available */}
                  <PWAInstallButton />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      window.setTimeout(() => onOpenPrivacy?.(), 110);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-m3-on-surface dark:text-m3-on-surface-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-2xl"
                  >
                    <FileText className="w-4 h-4 text-m3-variant dark:text-m3-variant-dk" />
                    <span>Privacy Policy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      window.setTimeout(() => onOpenCredits?.(), 110);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-m3-on-surface dark:text-m3-on-surface-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-2xl"
                  >
                    <Code className="w-4 h-4 text-m3-variant dark:text-m3-variant-dk" />
                    <span>Open source &amp; credits</span>
                  </button>

                  <div className="mt-1 flex items-center gap-3 px-4 py-3 text-xs text-m3-variant dark:text-m3-variant-dk">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-m3-primary dark:text-m3-primary-light" />
                    <span>Your data is protected on-device</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {FOLDER_LABELS[filter] && (
        <div className="pt-2 flex pointer-events-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-full bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container text-xs font-semibold shadow-sm"
            aria-label="Back to all messages"
          >
            <span>{FOLDER_LABELS[filter]}</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
