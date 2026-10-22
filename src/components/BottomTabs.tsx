import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  const { filter, setFilter, unreadCounts, settings } = useSMS();
  const [typing, setTyping] = useState(false);

  // Tuck the bar away while the keyboard is up so it does not eat the screen
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
    const onIn = (e: FocusEvent) => {
      if (isField(e.target)) setTyping(true);
    };
    const onOut = () => setTyping(false);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);

  if (!settings.showCategoriesTabs) return null;

  return (
    <AnimatePresence initial={false}>
      {!typing && (
        <motion.nav
          key="bottom-tabs"
          aria-label="Message categories"
          className="shrink-0 px-2 pt-2 pb-2 bg-m3-surface-hi dark:bg-m3-d1 border-t border-m3-line/60 dark:border-m3-d4"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={spring}
        >
          <div className="flex items-stretch justify-between gap-1 max-w-xl mx-auto">
            {TABS.map((tab) => {
              const active = filter === (tab.id as FilterCategory);
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
    </AnimatePresence>
  );
};
