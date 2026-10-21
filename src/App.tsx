import React, { useState } from 'react';
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
import { NavigationDrawer } from './components/NavigationDrawer.tsx';
import { NewChatModal } from './components/NewChatModal.tsx';
import { IncomingSimulatorModal } from './components/IncomingSimulatorModal.tsx';
import { PhoneFrameWrapper } from './components/PhoneFrameWrapper.tsx';
import { NotificationBanner } from './components/NotificationBanner.tsx';
import { NotificationShadeModal } from './components/NotificationShadeModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';

const AppContent: React.FC = () => {
  const {
    activeConversationId,
    selectConversation,
    phoneFrameMode,
    togglePhoneFrameMode,
    isDarkMode,
    toggleDarkMode,
    notifications,
  } = useSMS();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [shadeOpen, setShadeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const otpNotifCount = notifications.filter((n) => n.otpCode).length;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#F8FAFD] dark:bg-[#111318] text-[#1F1F1F] dark:text-[#E2E2E2] relative">
      {/* Heads-up Android Notification Banner with Copy OTP Action */}
      <NotificationBanner />

      {/* Modals and Drawers */}
      <NavigationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenSimulator={() => setSimulatorOpen(true)}
        onOpenNotifications={() => setShadeOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <NotificationShadeModal
        isOpen={shadeOpen}
        onClose={() => setShadeOpen(false)}
        onOpenSimulator={() => setSimulatorOpen(true)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenSimulator={() => setSimulatorOpen(true)}
        onOpenNotifications={() => setShadeOpen(true)}
      />

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
        onOpenSimulator={() => setSimulatorOpen(true)}
        onOpenNotifications={() => setShadeOpen(true)}
      >
        {/* Desktop Split View or Mobile Single View */}
        {phoneFrameMode ? (
          /* Phone Frame Mode (Single screen navigation) */
          <div className="h-full w-full flex flex-col overflow-hidden relative">
            {activeConversationId ? (
              <ChatView onBack={() => selectConversation(null)} />
            ) : (
              <>
                <TopSearchBar
                  onOpenDrawer={() => setDrawerOpen(true)}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
                <ConversationList onStartChat={() => setNewChatOpen(true)} />
              </>
            )}
          </div>
        ) : (
          /* Responsive Adaptive Layout: Mobile Single-Pane | Desktop 2-Pane Split */
          <div className="h-full w-full flex flex-col overflow-hidden">
            {/* Desktop Top Header Bar (Visible on md+ screens) */}
            <header className="hidden md:flex items-center justify-between gap-8 px-6 py-2.5 border-b border-[#E0E2EC] dark:border-[#2D3139] bg-white dark:bg-[#16181D] shrink-0 z-20">
              {/* Zone 1: Brand wordmark */}
              <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
                <img
                  src="/ping-icon.png"
                  alt="Ping"
                  className="w-8 h-8 rounded-xl shadow-xs object-cover"
                />
                <span className="text-base font-semibold tracking-tight text-[#1F1F1F] dark:text-white">
                  Ping
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#D3E3FD]">
                  Standard SMS
                </span>
              </div>

              {/* Zone 2: Navigation categories */}
              <nav className="flex items-center gap-6 text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">
                <span className="whitespace-nowrap shrink-0">Personal · Transactions · Promotions</span>
              </nav>

              {/* Zone 3: Primary Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* PWA Install Button */}
                <PWAInstallButton compact />

                {/* Settings Button */}
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  title="Messages Settings"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={toggleDarkMode}
                  title="Toggle Light / Dark mode"
                  className="p-2 text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228] rounded-full transition-colors shrink-0"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </header>

            {/* Split Screen Area */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Column: Conversation list */}
              <div
                className={`w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-[#E0E2EC] dark:border-[#2D3139] flex flex-col h-full bg-[#F8FAFD] dark:bg-[#111318] ${
                  activeConversationId ? 'hidden md:flex' : 'flex'
                }`}
              >
                <TopSearchBar
                  onOpenDrawer={() => setDrawerOpen(true)}
                  onOpenSimulator={() => setSimulatorOpen(true)}
                  onOpenNotifications={() => setShadeOpen(true)}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
                <ConversationList onStartChat={() => setNewChatOpen(true)} />
              </div>

              {/* Right Column: Chat view or Empty state on desktop */}
              <div
                className={`flex-1 flex flex-col h-full bg-[#F8FAFD] dark:bg-[#111318] min-w-0 ${
                  activeConversationId ? 'flex' : 'hidden md:flex'
                }`}
              >
                {activeConversationId ? (
                  <ChatView onBack={() => selectConversation(null)} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center mb-4 shadow-md bg-white dark:bg-[#1E2228] border border-[#E0E2EC] dark:border-[#2D3139]">
                      <img
                        src="/ping-icon.png"
                        alt="Ping"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h2 className="text-lg font-bold text-[#1F1F1F] dark:text-white">
                      Ping
                    </h2>
                    <p className="text-xs text-[#747775] dark:text-[#8E918F] max-w-sm mt-1.5 leading-relaxed">
                      Standard text SMS messaging with category tabs (Personal, Transactions, Promotions), Copy OTP notifications, and full settings.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setNewChatOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B57D0] text-white hover:bg-[#0842A0] text-xs font-semibold shadow-sm active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Start new chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#EDF2FA] dark:bg-[#252A32] text-[#0B57D0] dark:text-[#A8C7FA] hover:bg-[#D3E3FD] text-xs font-semibold shadow-xs active:scale-95 transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>
                )}
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
    <SMSProvider>
      <AppContent />
    </SMSProvider>
  );
}
