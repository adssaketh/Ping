import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
        <Check className="w-3.5 h-3.5" />
        <span>Installed Native App</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
    }
  };

  if (isInstallable) {
    if (compact) {
      return (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Install as native Android app"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B57D0] text-white hover:bg-[#0842A0] text-xs font-semibold shadow-xs active:scale-95 transition-all shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#0B57D0] dark:text-[#A8C7FA] hover:bg-[#EDF2FA] dark:hover:bg-[#282C35] rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Download className="w-4 h-4" />
          <span>Install Android App</span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#D3E3FD] dark:bg-[#004A77] font-semibold">
          Native PWA
        </span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            compact
              ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDF2FA] dark:bg-[#282C35] text-[#0B57D0] dark:text-[#A8C7FA] text-xs font-semibold'
              : 'w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#0B57D0] dark:text-[#A8C7FA] hover:bg-[#EDF2FA] dark:hover:bg-[#282C35] rounded-xl'
          }
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install on Home Screen</span>
          </div>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1E2228] p-6 shadow-2xl border border-[#E0E2EC] dark:border-[#2D3139] text-left">
              <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-white mb-2">
                Install Ping on iOS
              </h3>
              <p className="text-xs text-[#444746] dark:text-[#C4C7C5] space-y-1.5 leading-relaxed">
                <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span><br />
                <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-full bg-[#0B57D0] py-2 text-xs font-semibold text-white hover:bg-[#0842A0]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers before trigger fires
  if (compact) {
    return null;
  }

  return (
    <div className="px-3 py-2 text-[11px] text-[#747775] dark:text-[#8E918F] flex items-center gap-2">
      <Smartphone className="w-3.5 h-3.5 text-[#0B57D0]" />
      <span>Installable as Native Android PWA</span>
    </div>
  );
};
