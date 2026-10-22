import React, { useLayoutEffect, useRef, useState } from 'react';
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
import { spring, springBouncy } from '../motion.ts';
import { ProfileAvatar } from './ProfileAvatar.tsx';
import { profilePhotoEditor } from '../utils/profilePhotoEditor.ts';
import { useBackHandler } from '../backStack.ts';
import { smsBridge } from '../services/smsBridge.ts';
import { barCollapse, useBarCollapsed } from '../utils/barCollapse.ts';

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

  // Scrolling collapses the bar: the search field becomes an icon at the left, "Ping" moves to the middle and your
  // picture stays at the right. Searching, typing or an open menu keep it expanded.
  const scrolledDown = useBarCollapsed();
  const [searchFocused, setSearchFocused] = useState(false);
  const collapsed = scrolledDown && !searchFocused && searchQuery.trim() === '' && !menuOpen;
  const rowRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [rowWidth, setRowWidth] = useState(360);
  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const measure = () => setRowWidth(el.clientWidth);
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
  const EXPANDED_SHAPE = 'inset(-10px -10px -14px -10px round 38px)';
  const collapsedShape = `inset(4px ${Math.max(0, rowWidth - 48)}px 4px 0px round 24px)`;
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
    <div className="px-4 pt-3 pb-2 shrink-0 pointer-events-none">
      <motion.div ref={rowRef} className="relative h-14" animate={{ y: collapsed ? -6 : 0 }} transition={spring}>
        {/* Material 3 Search Bar: a full-width pill that is clipped down to a circle when collapsed */}
        <motion.div
          className={`pointer-events-auto absolute inset-0 flex items-center rounded-full ${
            settings.barStyle === 'glass' ? 'bg-m3-surface-hi/60 dark:bg-m3-d2/60 backdrop-blur-xl' : 'bg-m3-surface-hi dark:bg-m3-d2'
          } text-m3-on-surface dark:text-m3-on-surface-dk shadow-sm transition ${settings.barStyle === 'glass' ? '' : 'focus-within:bg-white dark:focus-within:bg-m3-d3'} focus-within:ring-2 focus-within:ring-m3-primary/30 dark:focus-within:ring-m3-primary-light/30 focus-within:shadow-md`}
          initial={{ opacity: 0, y: -12, clipPath: EXPANDED_SHAPE }}
          animate={{ opacity: 1, y: 0, clipPath: collapsed ? collapsedShape : EXPANDED_SHAPE }}
          transition={{ ...spring, opacity: { duration: 0.2 } }}
          onClick={() => {
            if (collapsed) expandAndFocus();
          }}
        >
          <div className="flex-1 flex items-center pl-[14px] gap-2 min-w-0">
            <Search className="w-5 h-5 text-m3-outline dark:text-m3-outline-dk shrink-0" />
            <motion.div
              className="flex-1 flex items-center gap-2 min-w-0"
              animate={{ opacity: collapsed ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              style={{ pointerEvents: collapsed ? 'none' : 'auto' }}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                tabIndex={collapsed ? -1 : 0}
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
            </motion.div>
            <div className="w-12 shrink-0" />
          </div>
        </motion.div>

        {/* "Ping" slides in to the middle while the bar is collapsed */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: collapsed ? 1 : 0, x: collapsed ? 0 : -80, scale: collapsed ? 1 : 0.9 }}
          transition={springBouncy}
        >
          <div role="img" aria-label="Ping" className="ping-wordmark" />
        </motion.div>

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
      </motion.div>

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
