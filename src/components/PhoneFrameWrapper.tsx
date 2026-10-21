import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Signal,
  Battery,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Sparkles,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';

interface PhoneFrameWrapperProps {
  children: React.ReactNode;
  onOpenSimulator: () => void;
  onOpenNotifications: () => void;
}

export const PhoneFrameWrapper: React.FC<PhoneFrameWrapperProps> = ({
  children,
  onOpenSimulator,
  onOpenNotifications,
}) => {
  const { phoneFrameMode, togglePhoneFrameMode, isDarkMode, toggleDarkMode, notifications } = useSMS();

  // Dynamic live clock for phone status bar
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const otpNotifs = notifications.filter((n) => n.otpCode);

  if (!phoneFrameMode) {
    // Normal responsive layout
    return <div className="h-full w-full">{children}</div>;
  }

  // Pixel Phone Frame Mockup on Desktop
  return (
    <div className="h-full w-full bg-[#E9EEF6] dark:bg-[#0B0D11] flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden select-none transition-colors">
      {/* Top utility bar above phone frame */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-2 px-2 text-xs text-[#444746] dark:text-[#C4C7C5]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1F1F1F] dark:text-white">
            Google Pixel Frame
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#D3E3FD] font-mono">
            Native PWA
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenNotifications}
            title="Open Notification Shade with Copy OTP"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E2228] shadow-xs hover:bg-[#EDF2FA] text-[11px] font-medium"
          >
            <Bell className="w-3 h-3 text-[#0B57D0]" />
            <span>Notifs {otpNotifs.length > 0 && `(${otpNotifs.length})`}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSimulator}
            title="Simulate SMS"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E2228] shadow-xs hover:bg-[#EDF2FA] text-[11px] font-medium"
          >
            <Sparkles className="w-3 h-3 text-[#0B57D0]" />
            <span>Simulate</span>
          </button>

          <button
            type="button"
            onClick={toggleDarkMode}
            title="Toggle theme"
            className="p-1.5 rounded-full bg-white dark:bg-[#1E2228] shadow-xs hover:bg-[#EDF2FA]"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-[#0B57D0]" />}
          </button>

          <button
            type="button"
            onClick={togglePhoneFrameMode}
            title="Switch to full-screen responsive view"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B57D0] text-white shadow-xs hover:bg-[#0842A0] text-[11px] font-medium"
          >
            <Monitor className="w-3 h-3" />
            <span>Full view</span>
          </button>
        </div>
      </div>

      {/* Phone Hardware Chassis */}
      <div className="relative w-full max-w-[420px] h-[96vh] max-h-[860px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-[#30333A] dark:border-[#22252A] flex flex-col overflow-hidden">
        {/* Screen Display Container */}
        <div className="relative flex-1 w-full bg-[#F8FAFD] dark:bg-[#111318] rounded-[38px] overflow-hidden flex flex-col">
          {/* Android Status Bar (Clickable to pull down notification shade) */}
          <div
            onClick={onOpenNotifications}
            title="Tap status bar to pull down notification shade"
            className="h-9 px-6 flex items-center justify-between text-[11px] font-semibold text-[#1F1F1F] dark:text-white shrink-0 z-30 select-none bg-transparent cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {/* Clock & Notification icons */}
            <div className="flex items-center gap-2">
              <span className="font-medium tracking-tight tabular-nums">
                {currentTime || '9:41'}
              </span>
              {otpNotifs.length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#0B57D0] text-white text-[9px] font-bold rounded-full animate-pulse">
                  OTP
                </span>
              )}
            </div>

            {/* Front Camera Notch */}
            <div className="w-3.5 h-3.5 rounded-full bg-black ring-2 ring-black/40" />

            {/* Cellular, Wifi, Battery */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-wider">5G</span>
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Actual Application Content */}
          <div className="flex-1 w-full min-h-0 overflow-hidden relative flex flex-col">
            {children}
          </div>

          {/* Android Bottom Navigation Gesture Bar */}
          <div className="h-4 w-full flex items-center justify-center shrink-0 z-30 bg-transparent">
            <div className="w-28 h-1 bg-[#444746]/50 dark:bg-[#C4C7C5]/50 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
