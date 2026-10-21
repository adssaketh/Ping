import React, { useState } from 'react';
import {
  Menu,
  Search,
  X,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { FilterCategory } from '../types.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface TopSearchBarProps {
  onOpenDrawer: () => void;
  onOpenSimulator?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings: () => void;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  onOpenDrawer,
  onOpenSettings,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    categoryCounts,
    settings,
  } = useSMS();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // The 4 Core Tabs explicitly required by user: All, Personal, Transactions, Promotions
  const mainTabs: { id: FilterCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: categoryCounts.all },
    { id: 'personal', label: 'Personal', count: categoryCounts.personal },
    { id: 'transactions', label: 'Transactions', count: categoryCounts.transactions },
    { id: 'promotions', label: 'Promotions', count: categoryCounts.promotions },
  ];

  return (
    <div className="px-4 pt-3 pb-2 shrink-0">
      {/* Material 3 Search Bar */}
      <div className="relative flex items-center h-12 px-3 rounded-full bg-[#EDF2FA] dark:bg-[#1E2228] text-[#1F1F1F] dark:text-[#E2E2E2] shadow-sm transition-all focus-within:bg-white dark:focus-within:bg-[#252A32] focus-within:ring-2 focus-within:ring-[#0B57D0]/30 dark:focus-within:ring-[#A8C7FA]/30 focus-within:shadow-md">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="p-2 -ml-1 text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 flex items-center mx-2 gap-2">
          <Search className="w-4 h-4 text-[#747775] dark:text-[#8E918F] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in Ping"
            className="w-full bg-transparent text-sm font-normal text-[#1F1F1F] dark:text-[#E2E2E2] placeholder-[#747775] dark:placeholder-[#8E918F] outline-none truncate"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Profile / Account Button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-[#0B57D0] text-white flex items-center justify-center text-xs font-semibold shadow-sm hover:ring-2 hover:ring-[#0B57D0]/40 active:scale-95 transition-all"
            aria-label="Account and SMS settings"
          >
            S
          </button>

          {/* Account & Settings Popup (Authentic Google Messages style) */}
          {accountMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setAccountMenuOpen(false)}
              />
              <div className="absolute right-0 top-11 w-76 p-3 bg-white dark:bg-[#1E2228] border border-[#E0E2EC] dark:border-[#2D3139] rounded-3xl shadow-2xl z-50 text-sm animate-in fade-in zoom-in-95 duration-150">
                {/* User info */}
                <div className="flex items-center gap-3 px-2 py-2 border-b border-[#E0E2EC] dark:border-[#2D3139]">
                  <div className="w-9 h-9 rounded-full bg-[#0B57D0] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    S
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-xs text-[#1F1F1F] dark:text-white truncate">
                      saketh.adhikarla@gmail.com
                    </p>
                    <p className="text-[11px] text-[#747775] dark:text-[#8E918F]">
                      Google Account · Ping
                    </p>
                  </div>
                </div>

                {/* Primary Menu Actions */}
                <div className="py-2 space-y-1">
                  {/* Messages Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#1F1F1F] dark:text-[#E2E2E2] hover:bg-[#EDF2FA] dark:hover:bg-[#282C35] rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-[#444746] dark:text-[#C4C7C5]" />
                      <span className="font-medium">Ping settings</span>
                    </div>
                  </button>

                  {/* PWA Install Action if available */}
                  <PWAInstallButton />

                  {/* Your data in Messages */}
                  <div className="flex items-center gap-3 px-3 py-2 text-xs text-[#444746] dark:text-[#C4C7C5]">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#0B57D0]" />
                    <span>Your data is protected on-device</span>
                  </div>
                </div>

                {/* Google Policy & Terms Footer */}
                <div className="pt-2 border-t border-[#E0E2EC] dark:border-[#2D3139]">
                  <div className="px-3 py-1 text-[11px] text-[#747775] dark:text-[#8E918F] flex items-center justify-between">
                    <span>Privacy Policy</span>
                    <span>·</span>
                    <span>Terms of Service</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Primary Category Tabs: All, Personal, Transactions, Promotions */}
      {settings.showCategoriesTabs && (
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
          {mainTabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-full whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#004A77] dark:text-[#D3E3FD] shadow-xs font-bold'
                    : 'bg-transparent text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228] font-medium'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-[#0B57D0] text-white dark:bg-[#A8C7FA] dark:text-[#041E49]'
                        : 'bg-[#E0E2EC] dark:bg-[#2D3139] text-[#444746] dark:text-[#C4C7C5]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
