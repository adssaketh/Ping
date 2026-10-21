import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  X,
  Bell,
  ShieldCheck,
  Smartphone,
  Download,
  Upload,
  RotateCcw,
  Moon,
  Sun,
  ShieldAlert,
  Check,
  Layers,
  Clock,
  Sparkles,
  FolderSync,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator?: () => void;
  onOpenNotifications?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenSimulator,
  onOpenNotifications,
}) => {
  const {
    settings,
    updateSettings,
    setThemeMode,
    conversations,
    toggleBlockConversation,
    exportSmsBackup,
    importSmsBackup,
    cleanExpiredOtps,
    resetToDemoData,
    isNativeNotificationEnabled,
    requestNotificationPermission,
    isNativePlatform,
    isDefaultSms,
    currentDefaultPackage,
    permissions,
    isSyncingDevice,
    syncResult,
    requestDefaultSmsApp,
    requestPermissions,
    syncDeviceSmsAndContacts,
    syncDeviceContacts,
  } = useSMS();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [versionClicks, setVersionClicks] = useState(0);
  const [devOptionsUnlocked, setDevOptionsUnlocked] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCleanOtps = () => {
    const deletedCount = cleanExpiredOtps();
    showToast(`Cleaned ${deletedCount} expired OTP messages.`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importSmsBackup(content);
      if (success) {
        showToast('SMS backup successfully restored!');
      } else {
        showToast('Failed to parse SMS backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const blockedList = conversations.filter((c) => c.isBlocked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Settings Dialog / Screen */}
      <div className="relative w-full max-w-2xl h-full sm:h-[90vh] bg-[#F8FAFD] dark:bg-[#111318] sm:rounded-3xl border border-[#E0E2EC] dark:border-[#2D3139] shadow-2xl flex flex-col z-50 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-60 bg-[#1F1F1F] text-white dark:bg-[#E2E2E2] dark:text-[#1F1F1F] px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top App Bar */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E0E2EC] dark:border-[#2D3139] bg-white dark:bg-[#1A1D23] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-[#1F1F1F] dark:text-white">
              Ping settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 0: Default SMS App & Device System Integration */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1A1D23] border border-[#E0E2EC] dark:border-[#2D3139] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E0E2EC] dark:border-[#2D3139]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-xs shrink-0 bg-[#0B57D0]">
                  <img src="/ping-icon.png" alt="Ping" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#1F1F1F] dark:text-white">
                      Default SMS App
                    </h3>
                    {isDefaultSms ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Active Default
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Not Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#747775] dark:text-[#8E918F] mt-0.5">
                    {isDefaultSms
                      ? 'Ping handles all incoming carrier SMS and native messaging.'
                      : 'Set Ping as default to send real SMS and read SIM messages directly.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isDefaultSms && (
                  <button
                    type="button"
                    onClick={async () => {
                      const granted = await requestDefaultSmsApp();
                      if (granted) {
                        showToast('Ping is now your default SMS app!');
                      }
                    }}
                    className="px-4 py-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
                  >
                    Set as default
                  </button>
                )}
                <PWAInstallButton />
              </div>
            </div>

            {/* Permission Badges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#747775] dark:text-[#8E918F]">
                  Device Permissions
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await requestPermissions();
                    showToast('Permissions refreshed');
                  }}
                  className="text-xs text-[#0B57D0] dark:text-[#A8C7FA] hover:underline font-medium"
                >
                  Request Permissions
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-2xl bg-[#F8FAFD] dark:bg-[#252A32] border border-[#E0E2EC] dark:border-[#2D3139] flex items-center justify-between">
                  <span className="text-xs text-[#1F1F1F] dark:text-white">Read & Send SMS</span>
                  {permissions.readSms && permissions.sendSms ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Needed</span>
                  )}
                </div>

                <div className="p-2.5 rounded-2xl bg-[#F8FAFD] dark:bg-[#252A32] border border-[#E0E2EC] dark:border-[#2D3139] flex items-center justify-between">
                  <span className="text-xs text-[#1F1F1F] dark:text-white">Contacts</span>
                  {permissions.contacts ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Needed</span>
                  )}
                </div>

                <div className="p-2.5 rounded-2xl bg-[#F8FAFD] dark:bg-[#252A32] border border-[#E0E2EC] dark:border-[#2D3139] flex items-center justify-between col-span-2 sm:col-span-1">
                  <span className="text-xs text-[#1F1F1F] dark:text-white">Notifications</span>
                  {isNativeNotificationEnabled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Needed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Device Sync Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await syncDeviceSmsAndContacts();
                  showToast(`Synced ${res.smsCount} SMS & ${res.contactCount} contacts!`);
                }}
                disabled={isSyncingDevice}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#EDF2FA] dark:bg-[#252A32] hover:bg-[#D3E3FD]/60 dark:hover:bg-[#2A303C] text-[#0B57D0] dark:text-[#A8C7FA] rounded-full text-xs font-semibold transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDevice ? 'animate-spin' : ''}`} />
                <span>{isSyncingDevice ? 'Syncing Device...' : 'Sync Device SMS & Contacts'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const count = await syncDeviceContacts();
                  showToast(`Synced ${count} phone contacts!`);
                }}
                disabled={isSyncingDevice}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#1A1D23] border border-[#E0E2EC] dark:border-[#2D3139] hover:bg-black/5 dark:hover:bg-white/10 text-[#444746] dark:text-[#C4C7C5] rounded-full text-xs font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Sync Contacts</span>
              </button>
            </div>
          </div>

          {/* Section: Theme */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-4 sm:p-5 border border-[#E0E2EC] dark:border-[#2D3139] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E0E2EC] dark:border-[#2D3139]">
              <Sun className="w-4 h-4 text-[#0B57D0]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8E918F]">
                Theme
              </h3>
            </div>

            <div>
              <p className="text-sm font-medium text-[#1F1F1F] dark:text-white mb-1">
                Choose theme
              </p>
              <p className="text-xs text-[#747775] dark:text-[#8E918F] mb-3">
                Adjust light and dark mode for standard SMS
              </p>

              <div className="grid grid-cols-3 gap-2.5">
                {(['system', 'light', 'dark'] as const).map((mode) => {
                  const isSelected = settings.themeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setThemeMode(mode)}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-medium border flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#D3E3FD] dark:bg-[#004A77] border-[#0B57D0] dark:border-[#A8C7FA] text-[#041E49] dark:text-[#D3E3FD] font-bold shadow-xs'
                          : 'border-[#E0E2EC] dark:border-[#2D3139] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#EDF2FA] dark:hover:bg-[#252A32]'
                      }`}
                    >
                      {mode === 'system' && <Smartphone className="w-4 h-4" />}
                      {mode === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
                      {mode === 'dark' && <Moon className="w-4 h-4 text-[#0B57D0]" />}
                      <span className="capitalize">{mode === 'system' ? 'System' : mode}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 1: Message Organization & Category Tabs */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-4 sm:p-5 border border-[#E0E2EC] dark:border-[#2D3139] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E0E2EC] dark:border-[#2D3139]">
              <Layers className="w-4 h-4 text-[#0B57D0]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8E918F]">
                Message Organization
              </h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  Message Category Tabs
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Organize standard SMS into All, Personal, Transactions, and Promotions tabs
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ showCategoriesTabs: !settings.showCategoriesTabs })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.showCategoriesTabs ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.showCategoriesTabs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 2: Notifications & Copy OTP */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-4 sm:p-5 border border-[#E0E2EC] dark:border-[#2D3139] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E0E2EC] dark:border-[#2D3139]">
              <ShieldCheck className="w-4 h-4 text-[#0B57D0]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8E918F]">
                Notifications & Copy OTP
              </h3>
            </div>

            {/* Copy OTP in Notification Bar */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  Show "Copy OTP" in Notification Bar & Banner
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Provides 1-click clipboard button in Android notifications whenever a bank or login code arrives
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ showOtpInNotifications: !settings.showOtpInNotifications })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.showOtpInNotifications ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.showOtpInNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Heads-up banner */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E0E2EC]/70 dark:border-[#2D3139]/70">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  Heads-up Notification Banner
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Slide down top banner notification on incoming text messages
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ headsUpBannerEnabled: !settings.headsUpBannerEnabled })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.headsUpBannerEnabled ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.headsUpBannerEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E0E2EC]/70 dark:border-[#2D3139]/70">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  SMS Audio Chime
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Play sound when sending and receiving text messages
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ soundEnabled: !settings.soundEnabled })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.soundEnabled ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Native OS permission */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E0E2EC]/70 dark:border-[#2D3139]/70">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  Device System Notifications
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Allow Android OS / system notification bar when app is backgrounded
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  showToast(granted ? 'System notification permission granted!' : 'Permission dismissed.');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  isNativeNotificationEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-[#0B57D0] text-white hover:bg-[#0842A0]'
                }`}
              >
                {isNativeNotificationEnabled ? 'Permission Granted' : 'Enable Device Alerts'}
              </button>
            </div>
          </div>

          {/* Section 3: SMS & Carrier Preferences */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-4 sm:p-5 border border-[#E0E2EC] dark:border-[#2D3139] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E0E2EC] dark:border-[#2D3139]">
              <Clock className="w-4 h-4 text-[#0B57D0]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8E918F]">
                Standard Text & Carrier Preferences
              </h3>
            </div>

            {/* Auto-delete OTPs after 24 hrs */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  Auto-delete OTPs after 24 hours
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Automatically delete one-time verification passwords after 24 hours to keep inbox clean
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ autoDeleteOtps24h: !settings.autoDeleteOtps24h })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.autoDeleteOtps24h ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.autoDeleteOtps24h ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCleanOtps}
                className="px-3 py-1.5 text-xs font-medium text-[#0B57D0] dark:text-[#A8C7FA] hover:bg-[#EDF2FA] dark:hover:bg-[#282C35] rounded-full transition-colors"
              >
                Clean expired OTPs now
              </button>
            </div>

            {/* Delivery reports */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E0E2EC]/70 dark:border-[#2D3139]/70">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  SMS Delivery Reports
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Request delivery confirmation status for each standard text message
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ smsDeliveryReports: !settings.smsDeliveryReports })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.smsDeliveryReports ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.smsDeliveryReports ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Character counter */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E0E2EC]/70 dark:border-[#2D3139]/70">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  Character & SMS Segment Counter
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Display live character count and standard 160-character GSM-7 segment indicator
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    characterCounterEnabled: !settings.characterCounterEnabled,
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.characterCounterEnabled ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.characterCounterEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Emergency alerts */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E0E2EC]/70 dark:border-[#2D3139]/70">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  Wireless Emergency Alerts
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Receive safety notices, amber alerts, and critical weather broadcasts
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ emergencyAlerts: !settings.emergencyAlerts })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.emergencyAlerts ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.emergencyAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 4: Spam Protection & Blocked Numbers */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-4 sm:p-5 border border-[#E0E2EC] dark:border-[#2D3139] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E0E2EC] dark:border-[#2D3139]">
              <ShieldAlert className="w-4 h-4 text-[#0B57D0]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8E918F]">
                Spam & Blocked Numbers
              </h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1F1F1F] dark:text-white">
                  Spam Protection
                </p>
                <p className="text-xs text-[#747775] dark:text-[#8E918F]">
                  Identify and warn about suspected phishing, spam texts, and untrusted senders
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    spamProtectionEnabled: !settings.spamProtectionEnabled,
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.spamProtectionEnabled ? 'bg-[#0B57D0]' : 'bg-[#C4C7C5] dark:bg-[#444746]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.spamProtectionEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Blocked numbers list */}
            <div className="pt-2 border-t border-[#E0E2EC]/70 dark:border-[#2D3139]/70">
              <p className="text-xs font-semibold text-[#444746] dark:text-[#C4C7C5] mb-2">
                Blocked Numbers ({blockedList.length})
              </p>
              {blockedList.length === 0 ? (
                <p className="text-xs text-[#747775] dark:text-[#8E918F] italic">
                  No blocked numbers. Numbers you block will appear here.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {blockedList.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#EDF2FA] dark:bg-[#252A32] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#1F1F1F] dark:text-white block">
                          {b.contactName}
                        </span>
                        <span className="font-mono text-[#747775] dark:text-[#8E918F]">
                          {b.phoneNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBlockConversation(b.id)}
                        className="px-2.5 py-1 text-xs text-[#0B57D0] dark:text-[#A8C7FA] hover:bg-[#D3E3FD] dark:hover:bg-[#004A77] rounded-lg font-medium"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Backup, Restore & Data */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-4 sm:p-5 border border-[#E0E2EC] dark:border-[#2D3139] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E0E2EC] dark:border-[#2D3139]">
              <FolderSync className="w-4 h-4 text-[#0B57D0]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8E918F]">
                SMS Backup & Data
              </h3>
            </div>

            <p className="text-xs text-[#747775] dark:text-[#8E918F]">
              Export and restore all SMS conversations and contacts as standard JSON data.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={exportSmsBackup}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#EDF2FA] dark:bg-[#252A32] hover:bg-[#D3E3FD] dark:hover:bg-[#004A77] text-xs font-semibold text-[#0B57D0] dark:text-[#A8C7FA] rounded-full transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export SMS Backup (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#EDF2FA] dark:bg-[#252A32] hover:bg-[#D3E3FD] dark:hover:bg-[#004A77] text-xs font-semibold text-[#0B57D0] dark:text-[#A8C7FA] rounded-full transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Backup (.json)</span>
              </button>

              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-xs font-semibold text-[#BA1A1A] dark:text-[#FFB4AB] rounded-full transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset demo data</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-1.5 bg-red-50 dark:bg-red-950/30 rounded-2xl">
                  <span className="text-[11px] text-[#BA1A1A] dark:text-[#FFB4AB] font-medium px-2">
                    Reset all messages?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      resetToDemoData();
                      setShowResetConfirm(false);
                      showToast('Demo data restored');
                    }}
                    className="px-2.5 py-1 text-xs bg-[#BA1A1A] text-white rounded-lg hover:bg-[#93000A] font-semibold"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 text-xs text-[#444746] dark:text-[#C4C7C5] hover:bg-black/5 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Hidden Developer & Testing Options (Revealed by tapping version 5 times) */}
          {devOptionsUnlocked && (
            <div className="p-4 rounded-3xl bg-[#EDF2FA] dark:bg-[#1E2228] border border-[#0B57D0]/30 shadow-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0B57D0]" />
                  <span className="text-xs font-bold text-[#1F1F1F] dark:text-white uppercase tracking-wider">
                    Developer & Testing Options
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDevOptionsUnlocked(false)}
                  className="text-[11px] text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white"
                >
                  Hide
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {onOpenSimulator && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSimulator();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B57D0] text-white text-xs font-medium rounded-full shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulate Incoming OTP</span>
                  </button>
                )}

                {onOpenNotifications && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNotifications();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#282C35] text-[#0B57D0] dark:text-[#A8C7FA] text-xs font-medium rounded-full shadow-xs border border-[#E0E2EC] dark:border-[#2D3139]"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Notification Shade</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* About & Version */}
          <div className="text-center py-2 text-xs text-[#747775] dark:text-[#8E918F] space-y-1">
            <p className="font-semibold text-[#1F1F1F] dark:text-white">Ping - SMS Edition</p>
            <p
              onClick={() => {
                const next = versionClicks + 1;
                setVersionClicks(next);
                if (next >= 5) {
                  setDevOptionsUnlocked((prev) => !prev);
                  showToast(!devOptionsUnlocked ? 'Developer options unlocked!' : 'Developer options hidden');
                  setVersionClicks(0);
                }
              }}
              className="text-[11px] cursor-pointer select-none hover:text-[#1F1F1F] dark:hover:text-[#E2E2E2] transition-colors"
              title="Version build"
            >
              Version 2026.10.20-release · Material You Design 3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
