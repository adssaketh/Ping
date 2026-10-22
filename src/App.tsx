import React, { startTransition, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  MessageSquare,
  Moon,
  Sun,
  Plus,
  Settings,
} from 'lucide-react';
import { SMSProvider, useSMS } from './context/SMSContext.tsx';
import { TopSearchBar } from './components/TopSearchBar.tsx';
import { ConversationList } from './components/ConversationList.tsx';
import { ChatView } from './components/ChatView.tsx';
import { IncomingSimulatorModal } from './components/IncomingSimulatorModal.tsx';
import { PhoneFrameWrapper } from './components/PhoneFrameWrapper.tsx';
import { NotificationBanner } from './components/NotificationBanner.tsx';
import { NotificationShadeModal } from './components/NotificationShadeModal.tsx';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';
import { BottomTabs } from './components/BottomTabs.tsx';
import { InboxColumn } from './components/InboxColumn.tsx';
import { spring, useIsDesktop } from './motion.ts';
import { handleBackPress, useBackHandler } from './backStack.ts';
import { smsBridge } from './services/smsBridge.ts';

// Big screens that are not needed to show the inbox are loaded the first time they open
// (and fetched in the background shortly after launch), which makes the app start faster.
function lazyScreen<T extends React.ComponentType<any>>(load: () => Promise<{ default: T }>): T {
  const Screen = React.lazy(load);
  const LazyWrapper = ((props: any) => (
    <React.Suspense fallback={null}>
      <Screen {...props} />
    </React.Suspense>
  )) as unknown as T;
  return LazyWrapper;
}
const NewChatModal = lazyScreen(() => import('./components/NewChatModal.tsx').then((m) => ({ default: m.NewChatModal })));
const SettingsModal = lazyScreen(() => import('./components/SettingsModal.tsx').then((m) => ({ default: m.SettingsModal })));
const PrivacyPolicyModal = lazyScreen(() =>
  import('./components/PrivacyPolicyModal.tsx').then((m) => ({ default: m.PrivacyPolicyModal }))
);
const CreditsModal = lazyScreen(() => import('./components/CreditsModal.tsx').then((m) => ({ default: m.CreditsModal })));
const ProfilePhotoEditor = lazyScreen(() =>
  import('./components/ProfilePhotoEditor.tsx').then((m) => ({ default: m.ProfilePhotoEditor }))
);

// Heavy screens only re-render when their own data changes, not when a menu opens or closes
const ConversationListMemo = React.memo(ConversationList);
const TopSearchBarMemo = React.memo(TopSearchBar);
const BottomTabsMemo = React.memo(BottomTabs);
const ChatViewMemo = React.memo(ChatView);

const AppContent: React.FC = () => {
  const {
    activeConversationId,
    selectConversation,
    phoneFrameMode,
    togglePhoneFrameMode,
    isDarkMode,
    toggleDarkMode,
    notifications,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
  } = useSMS();

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [shadeOpen, setShadeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const otpNotifCount = notifications.filter((n) => n.otpCode).length;

  // Stable callbacks: new function objects every render would defeat React.memo above
  const openNewChat = useCallback(() => startTransition(() => setNewChatOpen(true)), []);
  const openSimulator = useCallback(() => setSimulatorOpen(true), []);
  const openShade = useCallback(() => setShadeOpen(true), []);
  const openSettings = useCallback(() => startTransition(() => setSettingsOpen(true)), []);
  const openPrivacy = useCallback(() => setPrivacyOpen(true), []);
  const openCredits = useCallback(() => setCreditsOpen(true), []);
  const leaveChat = useCallback(() => selectConversation(null), [selectConversation]);

  // Android back button: close the top-most thing first (menu / dialog / chat / tab / search)
  useBackHandler(newChatOpen, useCallback(() => setNewChatOpen(false), []));
  useBackHandler(simulatorOpen, useCallback(() => setSimulatorOpen(false), []));
  useBackHandler(shadeOpen, useCallback(() => setShadeOpen(false), []));
  useBackHandler(settingsOpen, useCallback(() => setSettingsOpen(false), []));
  useBackHandler(privacyOpen, useCallback(() => setPrivacyOpen(false), []));
  useBackHandler(creditsOpen, useCallback(() => setCreditsOpen(false), []));
  useBackHandler(!!activeConversationId, leaveChat);
  useBackHandler(filter !== 'all', useCallback(() => setFilter('all'), [setFilter]));
  useBackHandler(searchQuery.trim() !== '', useCallback(() => setSearchQuery(''), [setSearchQuery]));

  // Fetch the big screens in the background once the inbox is showing
  useEffect(() => {
    const timer = window.setTimeout(() => {
      import('./components/NewChatModal.tsx');
      import('./components/SettingsModal.tsx');
      import('./components/ProfilePhotoEditor.tsx');
      import('./components/PrivacyPolicyModal.tsx');
      import('./components/CreditsModal.tsx');
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  // App-icon shortcuts (long-press the icon): New message, Search, Personal, Transactions
  const applyShortcut = (target: string) => {
    // leave whatever is open, then go to the requested place
    setNewChatOpen(false);
    setSettingsOpen(false);
    setPrivacyOpen(false);
    setCreditsOpen(false);
    setSimulatorOpen(false);
    setShadeOpen(false);
    selectConversation(null);
    setSearchQuery('');
    switch (target) {
      case 'new_message':
        setFilter('all');
        window.setTimeout(() => startTransition(() => setNewChatOpen(true)), 120);
        break;
      case 'search':
        setFilter('all');
        window.setTimeout(() => {
          const input = document.getElementById('ping-search-input') as HTMLInputElement | null;
          input?.focus();
          smsBridge.showKeyboard();
        }, 350);
        break;
      case 'personal':
        setFilter('personal');
        break;
      case 'transactions':
        setFilter('transactions');
        break;
      default:
        break;
    }
  };
  const applyShortcutRef = React.useRef(applyShortcut);
  applyShortcutRef.current = applyShortcut;

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    // started from a shortcut (app was closed)
    smsBridge.consumeLaunchShortcut().then((target) => {
      if (target && !cancelled) applyShortcutRef.current(target);
    });
    // used while the app is already open
    smsBridge
      .listenToShortcut((target) => {
        applyShortcutRef.current(target);
        smsBridge.consumeLaunchShortcut();
      })
      .then((unsub) => {
        if (cancelled) unsub();
        else unsubscribe = unsub;
      });
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    smsBridge
      .listenToBack(() => {
        // Nothing left to close: behave like a normal back press on the home screen
        if (!handleBackPress()) smsBridge.minimizeApp();
      })
      .then((unsub) => {
        if (cancelled) unsub();
        else unsubscribe = unsub;
      });
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-m3-surface dark:bg-m3-d0 text-m3-on-surface dark:text-m3-on-surface-dk relative">
      {/* Heads-up Android Notification Banner with Copy OTP Action */}
      <NotificationBanner />

      {/* Modals */}
      <NotificationShadeModal
        isOpen={shadeOpen}
        onClose={() => setShadeOpen(false)}
        onOpenSimulator={openSimulator}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenSimulator={openSimulator}
        onOpenNotifications={openShade}
        onOpenPrivacy={openPrivacy}
        onOpenCredits={openCredits}
      />

      <PrivacyPolicyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <CreditsModal isOpen={creditsOpen} onClose={() => setCreditsOpen(false)} />
      <ProfilePhotoEditor />

      <NewChatModal
        isOpen={newChatOpen}
        onClose={() => setNewChatOpen(false)}
      />

      <IncomingSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
      />

      {/* Main Container wrapped in PhoneFrameWrapper */}
      <PhoneFrameWrapper
        onOpenSimulator={openSimulator}
        onOpenNotifications={openShade}
      >
        {/* Desktop Split View or Mobile Single View */}
        {phoneFrameMode ? (
          /* Phone Frame Mode (Single screen navigation) */
          <div className="h-full w-full overflow-hidden relative">
            <motion.div
              className="absolute inset-0 flex flex-col"
              animate={{ x: activeConversationId ? -32 : 0, opacity: activeConversationId ? 0.55 : 1 }}
              transition={spring}
            >
              <InboxColumn
                top={
                  <TopSearchBarMemo
                    onOpenSettings={openSettings}
                    onOpenPrivacy={openPrivacy}
                    onOpenCredits={openCredits}
                  />
                }
                list={<ConversationListMemo onStartChat={openNewChat} />}
                bottom={<BottomTabsMemo />}
              />
            </motion.div>
            <AnimatePresence initial={false}>
              {activeConversationId && (
                <motion.div
                  key="chat-pane"
                  className="absolute inset-0 flex flex-col bg-m3-surface dark:bg-m3-d0"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={spring}
                >
                  <ChatViewMemo onBack={leaveChat} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Responsive Adaptive Layout: Mobile Single-Pane | Desktop 2-Pane Split */
          <div className="h-full w-full flex flex-col overflow-hidden">
            {/* Split Screen Area */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
              {/* Left Column: Conversation list (stays underneath the chat on phones) */}
              <motion.div
                className="w-full md:w-[360px] lg:w-[400px] xl:w-[420px] 2xl:w-[460px] shrink-0 border-r border-m3-line dark:border-m3-d4 flex flex-col h-full bg-m3-surface dark:bg-m3-d0"
                animate={{
                  x: activeConversationId && !isDesktop ? -32 : 0,
                  opacity: activeConversationId && !isDesktop ? 0.55 : 1,
                }}
                transition={spring}
              >
                <InboxColumn
                  top={
                    <TopSearchBarMemo
                      onOpenSimulator={openSimulator}
                      onOpenNotifications={openShade}
                      onOpenSettings={openSettings}
                      onOpenPrivacy={openPrivacy}
                      onOpenCredits={openCredits}
                    />
                  }
                  list={<ConversationListMemo onStartChat={openNewChat} />}
                  bottom={<BottomTabsMemo />}
                />
              </motion.div>

              {/* Right Column: chat slides over the list on phones, sits beside it on larger screens */}
              <div className="absolute inset-0 md:relative md:inset-auto md:flex-1 md:flex min-w-0 pointer-events-none bg-transparent">
                {!activeConversationId && (
                  <div className="pointer-events-auto hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center select-none">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center mb-4 shadow-md bg-white dark:bg-m3-d2 border border-m3-line dark:border-m3-d4">
                      <img
                        src="/ping-icon.png"
                        alt="Ping"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h2 className="text-lg font-bold text-m3-on-surface dark:text-white">
                      Ping
                    </h2>
                    <p className="text-xs text-m3-outline dark:text-m3-outline-dk max-w-sm mt-1.5 leading-relaxed">
                      Standard text SMS messaging with category tabs (Personal, Transactions, Services, Promotions), Copy OTP notifications, and full settings.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setNewChatOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-m3-primary text-white hover:bg-m3-primary-hover text-xs font-semibold shadow-sm active:scale-95 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Start new chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light hover:bg-m3-primary-container text-xs font-semibold shadow-xs active:scale-95 transition"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>

                )}
                <AnimatePresence initial={false}>
                  {activeConversationId && (
                    <motion.div
                      key="chat-pane"
                      className="pointer-events-auto absolute inset-0 flex flex-col bg-m3-surface dark:bg-m3-d0"
                      initial={isDesktop ? { opacity: 0, x: 40 } : { x: '100%' }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={isDesktop ? { opacity: 0, x: 40 } : { x: '100%' }}
                      transition={spring}
                    >
                      <ChatViewMemo onBack={leaveChat} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </PhoneFrameWrapper>
    </div>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SMSProvider>
        <AppContent />
      </SMSProvider>
    </MotionConfig>
  );
}
