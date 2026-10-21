import React from 'react';
import {
  MessageSquare,
  Star,
  Archive,
  ShieldAlert,
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
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
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
  } = useSMS();

  if (!isOpen) return null;

  const unreadCount = conversations.filter((c) => c.unreadCount > 0 && !c.isArchived && !c.isBlocked).length;
  const archivedCount = conversations.filter((c) => c.isArchived).length;
  const blockedCount = conversations.filter((c) => c.isBlocked).length;
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

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-72 max-w-[80vw] h-full bg-[#F8FAFD] dark:bg-[#111318] border-r border-[#E0E2EC] dark:border-[#2D3139] flex flex-col shadow-2xl z-50 animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#E0E2EC] dark:border-[#2D3139]">
          <div className="flex items-center gap-2.5">
            <img
              src="/ping-icon.png"
              alt="Ping"
              className="w-8 h-8 rounded-xl shadow-xs object-cover"
            />
            <span className="font-semibold text-base tracking-tight text-[#1F1F1F] dark:text-[#E2E2E2]">
              Ping
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#444746] dark:text-[#C4C7C5] hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Destination Items */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          {/* All Messages */}
          <button
            type="button"
            onClick={() => handleSelectFilter('all')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#004A77] dark:text-[#D3E3FD] font-semibold'
                : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-[#0B57D0] text-white rounded-full font-bold">
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
                ? 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#004A77] dark:text-[#D3E3FD] font-semibold'
                : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Star className="w-5 h-5" />
              <span>Starred</span>
            </div>
            {starredMessages.length > 0 && (
              <span className="text-xs text-[#747775] dark:text-[#8E918F] font-mono">
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
                ? 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#004A77] dark:text-[#D3E3FD] font-semibold'
                : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Archive className="w-5 h-5" />
              <span>Archived</span>
            </div>
            {archivedCount > 0 && (
              <span className="text-xs text-[#747775] dark:text-[#8E918F] font-mono">
                {archivedCount}
              </span>
            )}
          </button>

          {/* Spam & Blocked */}
          <button
            type="button"
            onClick={() => handleSelectFilter('blocked')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-colors ${
              filter === 'blocked'
                ? 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#004A77] dark:text-[#D3E3FD] font-semibold'
                : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <ShieldAlert className="w-5 h-5" />
              <span>Spam & Blocked</span>
            </div>
            {blockedCount > 0 && (
              <span className="text-xs text-[#747775] dark:text-[#8E918F] font-mono">
                {blockedCount}
              </span>
            )}
          </button>

          <div className="pt-3 pb-2">
            <div className="h-px bg-[#E0E2EC] dark:border-[#2D3139]" />
          </div>

          {/* Full Settings Screen Trigger */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2] hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228] transition-colors"
          >
            <Settings className="w-5 h-5 text-[#444746] dark:text-[#C4C7C5]" />
            <span>Messages settings</span>
          </button>

          {/* Mark all as read */}
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228] disabled:opacity-40 disabled:pointer-events-none transition-colors"
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
        <div className="p-4 border-t border-[#E0E2EC] dark:border-[#2D3139] text-xs text-[#747775] dark:text-[#8E918F]">
          <p className="font-semibold text-[#1F1F1F] dark:text-[#E2E2E2]">Ping</p>
          <p className="text-[11px] mt-0.5">Standard SMS · Android Native Ready</p>
        </div>
      </div>
    </div>
  );
};
