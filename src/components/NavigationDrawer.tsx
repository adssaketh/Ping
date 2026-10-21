import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring, springBouncy, fadeFast } from '../motion.ts';
import {
  MessageSquare,
  Star,
  Archive,
  ShieldAlert,
  Ban,
  CheckCheck,
  X,
  Settings,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { FilterCategory } from '../types.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings: () => void;
  /** Always-visible sidebar for large tablets: no overlay, no close button */
  permanent?: boolean;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  permanent = false,
}) => {
  const {
    filter,
    setFilter,
    conversations,
    markAsRead,
    isDarkMode,
    toggleDarkMode,
    starredMessages,
    notifications,
    categoryCounts,
  } = useSMS();


  const unreadCount = conversations.filter((c) => c.unreadCount > 0 && !c.isArchived && !c.isBlocked).length;
  const archivedCount = conversations.filter((c) => c.isArchived).length;
  const blockedCount = conversations.filter((c) => c.isBlocked).length;
  const spamCount = categoryCounts.spam;
  const otpCount = notifications.filter((n) => n.otpCode).length;

  const handleSelectFilter = (category: FilterCategory) => {
    setFilter(category);
    onClose();
  };

  const handleMarkAllRead = () => {
    conversations.forEach((c) => {
      if (c.unreadCount > 0) {
        markAsRead(c.id);
      }
    });
    onClose();
  };

  const panelContent = (
    <>
        {/* Drawer Header */}
        <div className="p-4 flex items-center justify-between border-b border-m3-line dark:border-m3-d4">
          <div className="flex items-center gap-2.5">
            <img
              src="/ping-icon.png"
              alt="Ping"
              className="w-8 h-8 rounded-xl shadow-xs object-cover"
            />
            <span className="font-semibold text-base tracking-tight text-m3-on-surface dark:text-m3-on-surface-dk">
              Ping
            </span>
          </div>
          {!permanent && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-m3-variant dark:text-m3-variant-dk hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
          )}
        </div>

        {/* Navigation Destination Items */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          {/* All Messages */}
          <button
            type="button"
            onClick={() => handleSelectFilter('all')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container font-semibold'
                : 'text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d2'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-m3-primary text-white rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Starred */}
          <button
            type="button"
            onClick={() => handleSelectFilter('starred')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
              filter === 'starred'
                ? 'bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container font-semibold'
                : 'text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d2'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Star className="w-5 h-5" />
              <span>Starred</span>
            </div>
            {starredMessages.length > 0 && (
              <span className="text-xs text-m3-outline dark:text-m3-outline-dk font-mono">
                {starredMessages.length}
              </span>
            )}
          </button>

          {/* Archived */}
          <button
            type="button"
            onClick={() => handleSelectFilter('archived')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
              filter === 'archived'
                ? 'bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container font-semibold'
                : 'text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d2'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Archive className="w-5 h-5" />
              <span>Archived</span>
            </div>
            {archivedCount > 0 && (
              <span className="text-xs text-m3-outline dark:text-m3-outline-dk font-mono">
                {archivedCount}
              </span>
            )}
          </button>

          {/* Spam */}
          <button
            type="button"
            onClick={() => handleSelectFilter('spam')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
              filter === 'spam'
                ? 'bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container font-semibold'
                : 'text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d2'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <ShieldAlert className="w-5 h-5" />
              <span>Spam</span>
            </div>
            {spamCount > 0 && (
              <span className="text-xs text-m3-outline dark:text-m3-outline-dk font-mono">
                {spamCount}
              </span>
            )}
          </button>

          {/* Blocked */}
          <button
            type="button"
            onClick={() => handleSelectFilter('blocked')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
              filter === 'blocked'
                ? 'bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container font-semibold'
                : 'text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d2'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Ban className="w-5 h-5" />
              <span>Blocked</span>
            </div>
            {blockedCount > 0 && (
              <span className="text-xs text-m3-outline dark:text-m3-outline-dk font-mono">
                {blockedCount}
              </span>
            )}
          </button>

          <div className="pt-3 pb-2">
            <div className="h-px bg-m3-line dark:border-m3-d4" />
          </div>

          {/* Full Settings Screen Trigger */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium text-m3-on-surface dark:text-m3-on-surface-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d2 transition-colors"
          >
            <Settings className="w-5 h-5 text-m3-variant dark:text-m3-variant-dk" />
            <span>Messages settings</span>
          </button>

          {/* Mark all as read */}
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm text-m3-variant dark:text-m3-variant-dk hover:bg-m3-surface-hi dark:hover:bg-m3-d2 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <CheckCheck className="w-5 h-5" />
            <span>Mark all as read</span>
          </button>

          {/* In-app install action if available */}
          <div className="px-1 py-1">
            <PWAInstallButton />
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-m3-line dark:border-m3-d4 text-xs text-m3-outline dark:text-m3-outline-dk">
          <p className="font-semibold text-m3-on-surface dark:text-m3-on-surface-dk">Ping</p>
        </div>
    </>
  );

  if (permanent) {
    return (
      <aside className="w-72 shrink-0 h-full bg-m3-surface dark:bg-m3-d0 border-r border-m3-line dark:border-m3-d4 flex flex-col">
        {panelContent}
      </aside>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      key="overlay"
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fadeFast}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer content */}
      <motion.div
        className="relative w-72 max-w-[80vw] h-full bg-m3-surface dark:bg-m3-d0 border-r border-m3-line dark:border-m3-d4 flex flex-col shadow-2xl z-50"
        initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={spring}
      >
        {panelContent}
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};
