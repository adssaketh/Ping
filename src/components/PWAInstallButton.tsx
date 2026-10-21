import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { isNativeAndroid } from '../services/smsBridge.ts';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Already running as the real Android app: nothing to install
  if (isNativeAndroid()) return null;

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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-m3-primary text-white hover:bg-m3-primary-hover text-xs font-semibold shadow-xs active:scale-95 transition-all shrink-0"
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
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-m3-primary dark:text-m3-primary-light hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Download className="w-4 h-4" />
          <span>Install Android App</span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-m3-primary-container dark:bg-m3-primary-deep font-semibold">
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
              ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light text-xs font-semibold'
              : 'w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-m3-primary dark:text-m3-primary-light hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-xl'
          }
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install on Home Screen</span>
          </div>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-m3-d2 p-6 shadow-2xl border border-m3-line dark:border-m3-d4 text-left">
              <h3 className="text-base font-semibold text-m3-on-surface dark:text-white mb-2">
                Install Ping on iOS
              </h3>
              <p className="text-xs text-m3-variant dark:text-m3-variant-dk space-y-1.5 leading-relaxed">
                <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span><br />
                <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-full bg-m3-primary py-2 text-xs font-semibold text-white hover:bg-m3-primary-hover"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Nothing to show until the browser offers installation
  return null;
};
