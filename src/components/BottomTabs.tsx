import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, MessageSquare, Tag, User, Wrench } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { FilterCategory } from '../types.ts';
import { spring, springBouncy } from '../motion.ts';

type TabId = 'all' | 'personal' | 'transactions' | 'services' | 'promotions';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'promotions', label: 'Promotions', icon: Tag },
];

/** Material 3 navigation bar at the bottom of the screen: easy to reach with your thumb. */
export const BottomTabs: React.FC = () => {
  const { filter, setFilter, unreadCounts, settings, tabHint } = useSMS();
  const current = tabHint ?? filter;
  if (!settings.showCategoriesTabs) return null;

  return (
    <>
      {(
        <motion.nav
          key="bottom-tabs"
          aria-label="Message categories"
          className="shrink-0 px-3 pt-1 pb-2"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={spring}
        >
          <div className="flex items-stretch justify-between gap-1 max-w-xl mx-auto rounded-[32px] bg-m3-surface-hi dark:bg-m3-d2 px-2 pt-2 pb-2 shadow-md shadow-black/5 dark:shadow-black/30">
            {TABS.map((tab) => {
              const active = current === (tab.id as FilterCategory);
              const count = unreadCounts[tab.id];
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={count > 0 ? `${tab.label}, ${count} unread` : tab.label}
                  className="flex-1 min-w-0 flex flex-col items-center gap-1 py-1 rounded-2xl"
                >
                  <span className="relative flex items-center justify-center w-14 h-8 rounded-full">
                    {active && (
                      <motion.span
                        layoutId="bottom-tab-pill"
                        className="absolute inset-0 rounded-full bg-m3-primary-container dark:bg-m3-primary-deep"
                        transition={springBouncy}
                      />
                    )}
                    <Icon
                      className={`relative z-10 w-[22px] h-[22px] ${
                        active
                          ? 'text-m3-on-primary-deep dark:text-m3-primary-container'
                          : 'text-m3-variant dark:text-m3-variant-dk'
                      }`}
                    />
                    {count > 0 && (
                      <span className="absolute -top-1 right-0.5 z-10 min-w-[18px] h-[18px] px-1 rounded-full bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep text-[10px] font-bold flex items-center justify-center">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[10.5px] truncate max-w-full ${
                      active
                        ? 'font-bold text-m3-on-surface dark:text-white'
                        : 'font-medium text-m3-variant dark:text-m3-variant-dk'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </>
  );
};
