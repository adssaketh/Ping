import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring, springBouncy, fadeFast, useIsDesktop } from '../motion.ts';
import {
  ArrowLeft,
  X,
  ShieldCheck,
  Smartphone,
  Download,
  Upload,
  Moon,
  Sun,
  ShieldAlert,
  Check,
  Layers,
  Clock,
  FolderSync,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Phone,
  FileText,
  Code,
  ChevronRight,
  Camera,
  Trash2,
} from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { ProfileAvatar } from './ProfileAvatar.tsx';
import { profilePhotoEditor } from '../utils/profilePhotoEditor.ts';
import { smsBridge } from '../services/smsBridge.ts';
import { ThemePicker } from './ThemePicker.tsx';

/** A row of pill buttons where exactly one is selected. */
function ChoiceChips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`px-4 py-2.5 rounded-full text-xs font-semibold ${
            value === o.id
              ? 'bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container'
              : 'bg-m3-surface-hi dark:bg-m3-d3 text-m3-variant dark:text-m3-variant-dk'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy?: () => void;
  onOpenCredits?: () => void;
  /** Re-opens the first-launch setup */
  onOpenSetup?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacy,
  onOpenCredits,
  onOpenSetup,
}) => {
  const isDesktop = useIsDesktop();
  const {
    settings,
    updateSettings,
    setThemeMode,
    conversations,
    toggleBlockConversation,
    backupSmsToFile,
    restoreSmsFromJson,
    pickAndRestoreSms,
    cleanExpiredOtps,
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
  const [backupBusy, setBackupBusy] = useState(false);
  // Only the first screen is drawn while the panel slides in; the sections further down follow right after
  const [sectionsReady, setSectionsReady] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setSectionsReady(false);
      return;
    }
    const timer = window.setTimeout(() => setSectionsReady(true), 380);
    return () => window.clearTimeout(timer);
  }, [isOpen]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<{ versionName: string; versionCode: number } | null>(null);
  useEffect(() => {
    if (isOpen) smsBridge.getAppInfo().then(setAppInfo);
  }, [isOpen]);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleCleanOtps = () => {
    const deletedCount = cleanExpiredOtps();
    showToast(`Cleaned ${deletedCount} expired OTP messages.`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setBackupBusy(true);
      const result = await restoreSmsFromJson(content);
      setBackupBusy(false);
      showToast(result.message);
    };
    reader.readAsText(file);
  };

  const handleBackup = async () => {
    setBackupBusy(true);
    showToast('Preparing your backup...');
    const result = await backupSmsToFile();
    setBackupBusy(false);
    showToast(result.message);
  };

  const handleRestore = async () => {
    if (!isNativePlatform) {
      fileInputRef.current?.click();
      return;
    }
    setBackupBusy(true);
    const result = await pickAndRestoreSms();
    setBackupBusy(false);
    if (result.message) showToast(result.message);
  };

  const blockedList = conversations.filter((c) => c.isBlocked);

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      key="overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fadeFast}
      />

      {/* Settings Dialog / Screen */}
      <motion.div
        className="will-change-transform relative w-full max-w-2xl h-full sm:h-[90vh] bg-m3-surface dark:bg-m3-d0 sm:rounded-3xl border border-m3-line dark:border-m3-d4 shadow-2xl flex flex-col z-50 overflow-hidden"
        initial={isDesktop ? { opacity: 0, y: 56, scale: 0.97 } : { y: '100%' }} animate={isDesktop ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }} exit={isDesktop ? { opacity: 0, y: 36, scale: 0.98 } : { y: '100%' }} transition={spring}
      >
        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              key="settings-toast"
              className="absolute top-16 left-1/2 -translate-x-1/2 z-60 bg-m3-on-surface text-white dark:bg-m3-on-surface-dk dark:text-m3-on-surface px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2"
              initial={{ opacity: 0, y: -14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={springBouncy}
            >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top App Bar */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-m3-line dark:border-m3-d4 bg-white dark:bg-m3-d1 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-m3-variant dark:text-m3-variant-dk hover:text-m3-on-surface dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-m3-on-surface dark:text-white">
              Ping settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:block p-2 text-m3-variant dark:text-m3-variant-dk hover:text-m3-on-surface dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Profile */}
          <div className="bg-white dark:bg-m3-d1 rounded-3xl p-4 sm:p-5 border border-m3-line dark:border-m3-d4 shadow-xs">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => (settings.profilePhoto ? profilePhotoEditor.edit() : profilePhotoEditor.choose())}
                className="relative shrink-0"
                aria-label="Change profile picture"
              >
                <ProfileAvatar photo={settings.profilePhoto} name={settings.profileName} size={72} />
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep flex items-center justify-center border-2 border-white dark:border-m3-d1">
                  <Camera className="w-3.5 h-3.5" />
                </span>
              </button>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text"
                  value={settings.profileName}
                  onChange={(e) => updateSettings({ profileName: e.target.value.slice(0, 40) })}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-full bg-m3-surface-hi dark:bg-m3-d3 text-sm text-m3-on-surface dark:text-m3-on-surface-dk placeholder-m3-outline dark:placeholder-m3-outline-dk outline-none focus:ring-2 focus:ring-m3-primary/30"
                />
                <div className="flex flex-wrap gap-2">
                  {settings.profilePhoto && (
                    <button
                      type="button"
                      onClick={() => profilePhotoEditor.edit()}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => profilePhotoEditor.choose()}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container"
                  >
                    {settings.profilePhoto ? 'Change' : 'Add profile picture'}
                  </button>
                  {settings.profilePhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({ profilePhoto: null, profilePhotoSource: null });
                        showToast('Profile picture removed');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#BA1A1A] dark:text-[#FFB4AB] bg-red-50 dark:bg-red-950/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-m3-outline dark:text-m3-outline-dk">
              Your picture and name stay on this phone and are only shown inside Ping.
            </p>
          </div>

          {/* Section 0: Default SMS App & Device System Integration */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-m3-d1 border border-m3-line dark:border-m3-d4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-m3-line dark:border-m3-d4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-xs shrink-0 bg-m3-primary">
                  <img src="/ping-icon.png" alt="Ping" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-m3-on-surface dark:text-white">
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
                  <p className="text-xs text-m3-outline dark:text-m3-outline-dk mt-0.5">
                    {isDefaultSms
                      ? 'Ping handles all incoming carrier SMS and native messaging.'
                      : 'Set Ping as default to send real SMS and read SIM messages directly.'}
                  </p>
                  {!isDefaultSms && currentDefaultPackage && (
                    <p className="text-[11px] text-m3-outline dark:text-m3-outline-dk mt-1 font-mono break-all">
                      Android lists {currentDefaultPackage} as the default.
                    </p>
                  )}
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
                    className="px-4 py-2 bg-m3-primary hover:bg-m3-primary-hover text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </div>

            {/* Permission Badges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-m3-outline dark:text-m3-outline-dk">
                  Device Permissions
                </span>
                <div className="flex items-center gap-3">
                  {onOpenSetup && (
                    <button
                      type="button"
                      onClick={onOpenSetup}
                      className="text-xs text-m3-primary dark:text-m3-primary-light hover:underline font-medium"
                    >
                      Setup guide
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await requestPermissions();
                      showToast('Permissions refreshed');
                    }}
                    className="text-xs text-m3-primary dark:text-m3-primary-light hover:underline font-medium"
                  >
                    Request Permissions
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-2xl bg-m3-surface dark:bg-m3-d3 border border-m3-line dark:border-m3-d4 flex items-center justify-between">
                  <span className="text-xs text-m3-on-surface dark:text-white">Read & Send SMS</span>
                  {permissions.readSms && permissions.sendSms ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Needed</span>
                  )}
                </div>

                <div className="p-2.5 rounded-2xl bg-m3-surface dark:bg-m3-d3 border border-m3-line dark:border-m3-d4 flex items-center justify-between">
                  <span className="text-xs text-m3-on-surface dark:text-white">Contacts</span>
                  {permissions.contacts ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Needed</span>
                  )}
                </div>

                <div className="p-2.5 rounded-2xl bg-m3-surface dark:bg-m3-d3 border border-m3-line dark:border-m3-d4 flex items-center justify-between col-span-2 sm:col-span-1">
                  <span className="text-xs text-m3-on-surface dark:text-white">Notifications</span>
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
                  const res = await syncDeviceSmsAndContacts({ years: settings.loadedYears });
                  showToast(`Synced ${res.smsCount} SMS & ${res.contactCount} contacts!`);
                }}
                disabled={isSyncingDevice}
                className="flex items-center gap-1.5 px-4 py-2 bg-m3-surface-hi dark:bg-m3-d3 hover:bg-m3-primary-container/60 dark:hover:bg-m3-d4 text-m3-primary dark:text-m3-primary-light rounded-full text-xs font-semibold transition-colors"
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-m3-d1 border border-m3-line dark:border-m3-d4 hover:bg-black/5 dark:hover:bg-white/10 text-m3-variant dark:text-m3-variant-dk rounded-full text-xs font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Sync Contacts</span>
              </button>
            </div>
          </div>

          {/* Section: Theme */}
          <div className="bg-white dark:bg-m3-d1 rounded-3xl p-4 sm:p-5 border border-m3-line dark:border-m3-d4 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-m3-line dark:border-m3-d4">
              <Sun className="w-4 h-4 text-m3-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-m3-outline dark:text-m3-outline-dk">
                Theme
              </h3>
            </div>

            <div>
              <p className="text-sm font-medium text-m3-on-surface dark:text-white mb-1">
                Choose theme
              </p>
              <p className="text-xs text-m3-outline dark:text-m3-outline-dk mb-3">
                Adjust light and dark mode for standard SMS
              </p>

              <ThemePicker />
            </div>
          </div>

          {sectionsReady ? (
            <>
          {/* Section 1: Message Organization & Category Tabs */}
          <div className="bg-white dark:bg-m3-d1 rounded-3xl p-4 sm:p-5 border border-m3-line dark:border-m3-d4 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-m3-line dark:border-m3-d4">
              <Layers className="w-4 h-4 text-m3-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-m3-outline dark:text-m3-outline-dk">
                Message Organization
              </h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  Message Category Tabs
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
                  Organize standard SMS into All, Personal, Transactions, and Promotions tabs
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ showCategoriesTabs: !settings.showCategoriesTabs })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.showCategoriesTabs ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.showCategoriesTabs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Bars & scrolling */}
            <div className="space-y-4 pt-3 border-t border-m3-line dark:border-m3-d4">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">Scroll edge effect</p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk mb-2.5">
                  What happens to messages as they slide under the search bar and bottom bar. Fade is clean and light on
                  the phone; Blur adds a soft blur while they fade.
                </p>
                <ChoiceChips
                  value={settings.edgeEffect ?? 'fade'}
                  options={[
                    { id: 'off', label: 'Off' },
                    { id: 'fade', label: 'Fade' },
                    { id: 'blur', label: 'Fade + blur' },
                  ]}
                  onChange={(v) => updateSettings({ edgeEffect: v })}
                />
              </div>

              {settings.edgeEffect === 'blur' && (
                <div>
                  <p className="text-sm font-medium text-m3-on-surface dark:text-white">Blur strength</p>
                  <div className="mt-2.5">
                    <ChoiceChips
                      value={settings.edgeBlurLevel === 'off' || !settings.edgeBlurLevel ? 'medium' : settings.edgeBlurLevel}
                      options={[
                        { id: 'light', label: 'Light' },
                        { id: 'medium', label: 'Medium' },
                        { id: 'strong', label: 'Strong' },
                      ]}
                      onChange={(v) => updateSettings({ edgeBlurLevel: v })}
                    />
                  </div>
                </div>
              )}

              {(settings.edgeEffect ?? 'fade') !== 'off' && (
                <div>
                  <p className="text-sm font-medium text-m3-on-surface dark:text-white">Fade height</p>
                  <p className="text-xs text-m3-outline dark:text-m3-outline-dk mb-2.5">
                    How far from the bars messages start to fade away.
                  </p>
                  <ChoiceChips
                    value={settings.edgeFade ?? 'medium'}
                    options={[
                      { id: 'short', label: 'Short' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'tall', label: 'Tall' },
                    ]}
                    onChange={(v) => updateSettings({ edgeFade: v })}
                  />
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">Bar style</p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk mb-2.5">
                  Solid colour, or frosted glass that lets messages show through (uses a little more battery).
                </p>
                <ChoiceChips
                  value={settings.barStyle ?? 'solid'}
                  options={[
                    { id: 'solid', label: 'Solid' },
                    { id: 'glass', label: 'Glass' },
                  ]}
                  onChange={(v) => updateSettings({ barStyle: v })}
                />
              </div>

              {settings.barStyle === 'glass' && (
                <div className="space-y-4 rounded-[24px] bg-m3-surface-hi dark:bg-m3-d3 p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-m3-on-surface dark:text-white">Glass transparency</p>
                      <span className="text-xs font-semibold text-m3-primary dark:text-m3-primary-light">
                        {100 - (settings.glassOpacity ?? 62)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={80}
                      step={1}
                      value={100 - (settings.glassOpacity ?? 62)}
                      onChange={(e) => updateSettings({ glassOpacity: 100 - Number(e.target.value) })}
                      className="w-full mt-2 accent-m3-primary"
                      aria-label="Glass transparency"
                    />
                    <div className="flex justify-between text-[10px] text-m3-outline dark:text-m3-outline-dk">
                      <span>Frosted</span>
                      <span>Clear</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-m3-on-surface dark:text-white mb-2">Glass blur</p>
                    <ChoiceChips
                      value={settings.glassBlur ?? 'strong'}
                      options={[
                        { id: 'soft', label: 'Soft' },
                        { id: 'medium', label: 'Medium' },
                        { id: 'strong', label: 'Strong' },
                      ]}
                      onChange={(v) => updateSettings({ glassBlur: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-m3-on-surface dark:text-white">Glass edge</p>
                      <p className="text-xs text-m3-outline dark:text-m3-outline-dk">A thin light rim around the bars.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ glassBorder: settings.glassBorder === false })}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                        settings.glassBorder !== false ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
                      }`}
                      aria-pressed={settings.glassBorder !== false}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.glassBorder !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Notifications & Copy OTP */}
          <div className="bg-white dark:bg-m3-d1 rounded-3xl p-4 sm:p-5 border border-m3-line dark:border-m3-d4 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-m3-line dark:border-m3-d4">
              <ShieldCheck className="w-4 h-4 text-m3-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-m3-outline dark:text-m3-outline-dk">
                Notifications & Copy OTP
              </h3>
            </div>

            {/* Copy OTP in Notification Bar */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  Show "Copy OTP" in Notification Bar & Banner
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
                  Provides 1-click clipboard button in Android notifications whenever a bank or login code arrives
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ showOtpInNotifications: !settings.showOtpInNotifications })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.showOtpInNotifications ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
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
            <div className="flex items-center justify-between pt-2 border-t border-m3-line/70 dark:border-m3-d4/70">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  Heads-up Notification Banner
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
                  Slide down top banner notification on incoming text messages
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ headsUpBannerEnabled: !settings.headsUpBannerEnabled })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.headsUpBannerEnabled ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
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
            <div className="flex items-center justify-between pt-2 border-t border-m3-line/70 dark:border-m3-d4/70">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  SMS Audio Chime
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
                  Play sound when sending and receiving text messages
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ soundEnabled: !settings.soundEnabled })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.soundEnabled ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
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
            <div className="flex items-center justify-between pt-2 border-t border-m3-line/70 dark:border-m3-d4/70">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  Device System Notifications
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
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
                    : 'bg-m3-primary text-white hover:bg-m3-primary-hover'
                }`}
              >
                {isNativeNotificationEnabled ? 'Permission Granted' : 'Enable Device Alerts'}
              </button>
            </div>
          </div>

          {/* Section 3: SMS & Carrier Preferences */}
          <div className="bg-white dark:bg-m3-d1 rounded-3xl p-4 sm:p-5 border border-m3-line dark:border-m3-d4 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-m3-line dark:border-m3-d4">
              <Clock className="w-4 h-4 text-m3-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-m3-outline dark:text-m3-outline-dk">
                Standard Text & Carrier Preferences
              </h3>
            </div>

            {/* Auto-delete OTPs after 24 hrs */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  Auto-delete OTPs after 24 hours
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
                  Automatically delete one-time verification passwords after 24 hours to keep inbox clean
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ autoDeleteOtps24h: !settings.autoDeleteOtps24h })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.autoDeleteOtps24h ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
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
                className="px-3 py-1.5 text-xs font-medium text-m3-primary dark:text-m3-primary-light hover:bg-m3-surface-hi dark:hover:bg-m3-d3 rounded-full transition-colors"
              >
                Clean expired OTPs now
              </button>
            </div>

            {/* Delivery reports */}
            <div className="flex items-center justify-between pt-2 border-t border-m3-line/70 dark:border-m3-d4/70">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  SMS Delivery Reports
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
                  Request delivery confirmation status for each standard text message
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ smsDeliveryReports: !settings.smsDeliveryReports })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.smsDeliveryReports ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
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
            <div className="flex items-center justify-between pt-2 border-t border-m3-line/70 dark:border-m3-d4/70">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  Character & SMS Segment Counter
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
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
                  settings.characterCounterEnabled ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
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
            <div className="flex items-center justify-between pt-2 border-t border-m3-line/70 dark:border-m3-d4/70">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  Wireless Emergency Alerts
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
                  Receive safety notices, amber alerts, and critical weather broadcasts
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ emergencyAlerts: !settings.emergencyAlerts })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.emergencyAlerts ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
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
          <div className="bg-white dark:bg-m3-d1 rounded-3xl p-4 sm:p-5 border border-m3-line dark:border-m3-d4 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-m3-line dark:border-m3-d4">
              <ShieldAlert className="w-4 h-4 text-m3-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-m3-outline dark:text-m3-outline-dk">
                Spam & Blocked Numbers
              </h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-m3-on-surface dark:text-white">
                  Spam Protection
                </p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
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
                  settings.spamProtectionEnabled ? 'bg-m3-primary' : 'bg-m3-variant-dk dark:bg-m3-variant'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.spamProtectionEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.spamProtectionEnabled && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-m3-variant dark:text-m3-variant-dk">Spam sensitivity</p>
                <div className="flex gap-2">
                  {([
                    { id: 'relaxed', label: 'Relaxed' },
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'strict', label: 'Strict' },
                  ] as const).map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => updateSettings({ spamSensitivity: level.id })}
                      className={`flex-1 px-3 py-2.5 rounded-full text-xs font-semibold ${
                        settings.spamSensitivity === level.id
                          ? 'bg-m3-primary-container text-m3-on-primary-deep dark:bg-m3-primary-deep dark:text-m3-primary-container'
                          : 'bg-m3-surface-hi dark:bg-m3-d3 text-m3-variant dark:text-m3-variant-dk'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-m3-surface-hi dark:bg-m3-d3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-m3-on-surface dark:text-m3-on-surface-dk">
                      Learned from your taps
                    </p>
                    <p className="text-[11px] text-m3-outline dark:text-m3-outline-dk">
                      {Object.keys(settings.spamLearned || {}).length === 0
                        ? 'Nothing yet. Not spam and Report spam teach Ping on this phone.'
                        : `${Object.keys(settings.spamLearned || {}).length} words adjusted, stored only on this phone`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={Object.keys(settings.spamLearned || {}).length === 0}
                    onClick={() => {
                      updateSettings({ spamLearned: {} });
                      showToast('Learned spam rules reset');
                    }}
                    className="px-4 py-2 rounded-full text-xs font-semibold shrink-0 bg-white dark:bg-m3-d2 text-m3-primary dark:text-m3-primary-light disabled:opacity-40"
                  >
                    Reset
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-m3-outline dark:text-m3-outline-dk">
                  Suspected spam goes to the Spam folder in the menu and is never deleted, and its notifications stay
                  quiet. OTPs, bank alerts, delivery updates, your contacts, senders you have replied to and
                  registered business senders are not filtered unless they look like a scam. Checking and learning
                  happen on your phone. Built from the open-source Indian Telecom SMS Spam Collection by junioralive (github.com/junioralive/india-spam-sms-classification).
                </p>
              </div>
            )}

            {/* Blocked numbers list */}
            <div className="pt-2 border-t border-m3-line/70 dark:border-m3-d4/70">
              <p className="text-xs font-semibold text-m3-variant dark:text-m3-variant-dk mb-2">
                Blocked Numbers ({blockedList.length})
              </p>
              {blockedList.length === 0 ? (
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk italic">
                  No blocked numbers. Numbers you block will appear here.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {blockedList.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-m3-surface-hi dark:bg-m3-d3 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-m3-on-surface dark:text-white block">
                          {b.contactName}
                        </span>
                        <span className="font-mono text-m3-outline dark:text-m3-outline-dk">
                          {b.phoneNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBlockConversation(b.id)}
                        className="px-2.5 py-1 text-xs text-m3-primary dark:text-m3-primary-light hover:bg-m3-primary-container dark:hover:bg-m3-primary-deep rounded-lg font-medium"
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
          <div className="bg-white dark:bg-m3-d1 rounded-3xl p-4 sm:p-5 border border-m3-line dark:border-m3-d4 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-m3-line dark:border-m3-d4">
              <FolderSync className="w-4 h-4 text-m3-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-m3-outline dark:text-m3-outline-dk">
                SMS Backup & Data
              </h3>
            </div>

            <p className="text-xs text-m3-outline dark:text-m3-outline-dk">
              Save all your messages to a file you choose (for example in Downloads) and restore them later. The file is
              not encrypted, so keep it somewhere safe. Putting messages back into your phone needs Ping to be the
              default SMS app.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleBackup}
                disabled={backupBusy}
                className="flex items-center gap-1.5 px-4 py-2 bg-m3-surface-hi dark:bg-m3-d3 hover:bg-m3-primary-container dark:hover:bg-m3-primary-deep text-xs font-semibold text-m3-primary dark:text-m3-primary-light rounded-full transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Back up SMS</span>
              </button>

              <button
                type="button"
                onClick={handleRestore}
                disabled={backupBusy}
                className="flex items-center gap-1.5 px-4 py-2 bg-m3-surface-hi dark:bg-m3-d3 hover:bg-m3-primary-container dark:hover:bg-m3-primary-deep text-xs font-semibold text-m3-primary dark:text-m3-primary-light rounded-full transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore SMS</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>


            </>
          ) : (
            <div className="h-[900px]" aria-hidden="true" />
          )}

          {/* Privacy Policy */}
          {onOpenPrivacy && (
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-[28px] bg-white dark:bg-m3-d1 border border-m3-line dark:border-m3-d4 shadow-xs text-left hover:bg-m3-surface-hi dark:hover:bg-m3-d2"
            >
              <div className="w-11 h-11 rounded-2xl bg-m3-primary-container dark:bg-m3-primary-deep text-m3-primary dark:text-m3-primary-light flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-m3-on-surface dark:text-white">Privacy Policy</p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk mt-0.5">
                  What Ping can access and how your data is handled
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-m3-outline dark:text-m3-outline-dk shrink-0" />
            </button>
          )}

          {/* Open source & credits */}
          {onOpenCredits && (
            <button
              type="button"
              onClick={onOpenCredits}
              className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-[28px] bg-white dark:bg-m3-d1 border border-m3-line dark:border-m3-d4 shadow-xs text-left hover:bg-m3-surface-hi dark:hover:bg-m3-d2"
            >
              <div className="w-11 h-11 rounded-2xl bg-m3-primary-container dark:bg-m3-primary-deep text-m3-primary dark:text-m3-primary-light flex items-center justify-center shrink-0">
                <Code className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-m3-on-surface dark:text-white">Open source &amp; credits</p>
                <p className="text-xs text-m3-outline dark:text-m3-outline-dk mt-0.5">
                  Ping is open source. See the code link and who made the spam dataset.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-m3-outline dark:text-m3-outline-dk shrink-0" />
            </button>
          )}

          {/* About & Version */}
          <div className="text-center py-2 text-xs text-m3-outline dark:text-m3-outline-dk space-y-1">
            <p className="font-semibold text-m3-on-surface dark:text-white">Ping - SMS Edition</p>
            <p className="text-[11px]">Open source · github.com/adssaketh/Ping</p>
            <p className="text-[11px]">
              {appInfo ? `Version ${appInfo.versionName} (build ${appInfo.versionCode})` : 'Version 2.2'} · Material You Design 3
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};
