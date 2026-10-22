import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef, startTransition } from 'react';
import {
  Conversation,
  Message,
  Contact,
  FilterCategory,
  SmsNotificationItem,
  SmsAppSettings,
  ConversationCategory,
} from '../types.ts';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES, INITIAL_CONTACTS } from '../utils/seedData.ts';
import { applyPalette, SystemPalettes } from '../theme/dynamicColor.ts';
import type { BackupSms } from '../services/smsBridge.ts';
import {
  loadSpamModel,
  scoreSms,
  learnSms,
  isSpamScore,
  senderKey,
  SPAM_THRESHOLDS,
  SpamScore,
} from '../spam/classifier.ts';
import { soundFx, getAvatarColorClasses, extractOtpCode, getInitials, categorizeSms } from '../utils/smsUtils.ts';
import {
  smsBridge,
  isNativeAndroid,
  PermissionsStatus,
  NativeSmsMessage,
  NativeContact,
} from '../services/smsBridge.ts';

export const DEFAULT_SETTINGS: SmsAppSettings = {
  showOtpInNotifications: true,
  headsUpBannerEnabled: true,
  soundEnabled: true,
  vibrateEnabled: true,
  autoDeleteOtps24h: false,
  smsDeliveryReports: true,
  characterCounterEnabled: true,
  groupSmsIndividual: true,
  profilePhoto: null,
  profilePhotoSource: null,
  profileName: '',
  spamProtectionEnabled: true,
  spamSensitivity: 'balanced',
  spamAllow: [],
  spamBlock: [],
  spamLearned: {},
  autoReplyEnabled: true,
  emergencyAlerts: true,
  showCategoriesTabs: true,
  themeMode: 'system',
  phoneFrameMode: false,
};

interface SMSContextType {
  conversations: Conversation[];
  messages: Message[];
  contacts: Contact[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  filter: FilterCategory;
  searchQuery: string;
  isDarkMode: boolean;
  phoneFrameMode: boolean;
  soundEnabled: boolean;
  autoReplyEnabled: boolean;

  // Native SMS & Device Integration
  isNativePlatform: boolean;
  isDefaultSms: boolean;
  currentDefaultPackage: string | null;
  permissions: PermissionsStatus;
  isSyncingDevice: boolean;
  syncResult: { smsCount: number; contactCount: number } | null;
  checkDefaultSmsApp: () => Promise<void>;
  requestDefaultSmsApp: () => Promise<boolean>;
  requestPermissions: () => Promise<void>;
  syncDeviceSmsAndContacts: () => Promise<{ smsCount: number; contactCount: number }>;
  syncDeviceContacts: () => Promise<number>;
  importWebContact: () => Promise<Contact | null>;
  
  // Settings & Category
  settings: SmsAppSettings;
  updateSettings: (partial: Partial<SmsAppSettings>) => void;
  categoryCounts: {
    all: number;
    personal: number;
    transactions: number;
    promotions: number;
    services: number;
    unread: number;
    archived: number;
    blocked: number;
    spam: number;
  };
  // Spam protection
  spamConversationIds: Set<string>;
  isSpamConversation: (conversationId: string) => boolean;
  markNotSpam: (conversationId: string) => void;
  reportSpam: (conversationId: string) => void;

  // Notification & OTP State
  showOtpInNotifications: boolean;
  activeBanner: SmsNotificationItem | null;
  notifications: SmsNotificationItem[];
  isNativeNotificationEnabled: boolean;

  toggleDarkMode: () => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  togglePhoneFrameMode: () => void;
  toggleSound: () => void;
  toggleAutoReply: () => void;
  toggleShowOtpInNotifications: () => void;
  dismissBanner: () => void;
  copyOtpFromNotification: (notificationId: string) => Promise<string | null>;
  clearAllNotifications: () => void;
  requestNotificationPermission: () => Promise<boolean>;

  selectConversation: (id: string | null) => void;
  setFilter: (filter: FilterCategory) => void;
  setSearchQuery: (query: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  scheduleMessage: (conversationId: string, text: string, scheduledFor: number) => void;
  sendScheduledNow: (messageId: string) => void;
  cancelScheduled: (messageId: string) => void;
  toggleStarMessage: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  togglePinConversation: (conversationId: string) => void;
  toggleArchiveConversation: (conversationId: string) => void;
  toggleBlockConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  markAsUnread: (conversationId: string) => void;
  startNewConversation: (contactOrNumber: { name?: string; phoneNumber: string; category?: ConversationCategory }) => string;
  simulateIncomingSms: (conversationId: string, text: string) => void;
  resetToDemoData: () => void;
  backupSmsToFile: () => Promise<{ ok: boolean; message: string }>;
  restoreSmsFromJson: (jsonData: string) => Promise<{ ok: boolean; message: string }>;
  pickAndRestoreSms: () => Promise<{ ok: boolean; message: string }>;
  cleanExpiredOtps: () => number;
  starredMessages: (Message & { conversation?: Conversation })[];
}

const SMSContext = createContext<SMSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CONVERSATIONS: 'gm_sms_conversations_v2',
  MESSAGES: 'gm_sms_messages_v2',
  CONTACTS: 'gm_sms_contacts_v2',
  SETTINGS: 'gm_sms_settings_v2',
};

/** Writes `value` to localStorage 400ms after it last changed, and immediately when the app is hidden. */
function useDebouncedPersist(key: string, value: unknown, delayMs = 400) {
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(latest.current));
      } catch {
        /* storage full or unavailable */
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [key, value, delayMs]);

  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(key, JSON.stringify(latest.current));
      } catch {
        /* storage full or unavailable */
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [key]);
}

const DEVICE_ID_PREFIX = 'm-dev-';

/** Removes a message that was imported from the phone's SMS store (only works while Ping is the default SMS app). */
const deleteFromDevice = (m: Message) => {
  if (isNativeAndroid() && m.id.startsWith(DEVICE_ID_PREFIX)) {
    void smsBridge.deleteSms(m.id.slice(DEVICE_ID_PREFIX.length));
  }
};

export const SMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global Settings state
  const [settings, setSettings] = useState<SmsAppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Dark mode derived from settings or manual
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (settings.themeMode === 'dark') return true;
    if (settings.themeMode === 'light') return false;
    return typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  });

  const updateSettings = useCallback((partial: Partial<SmsAppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Material You: follow the phone's wallpaper colours (Android 12+), refreshed whenever the app is reopened
  const [systemPalette, setSystemPalette] = useState<SystemPalettes | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const palette = await smsBridge.getSystemColors();
      if (cancelled) return;
      setSystemPalette((prev) => (JSON.stringify(prev) === JSON.stringify(palette) ? prev : palette));
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Apply the colours, then tell Android which colour to paint behind the status / navigation bars
  useEffect(() => {
    applyPalette(systemPalette);
    const sendBars = () => {
      const styles = getComputedStyle(document.documentElement);
      const surface = styles.getPropertyValue(isDarkMode ? '--c-d0' : '--c-surface').trim();
      smsBridge.setSystemBarsTheme(isDarkMode, surface || undefined);
    };
    sendBars();

    // Rotating the phone resets the area behind the status bar, so paint it again afterwards
    let timer: number | undefined;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(sendBars, 150);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [systemPalette, isDarkMode]);

  // Sync sound setting
  useEffect(() => {
    soundFx.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Data states
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return saved ? JSON.parse(saved) : isNativeAndroid() ? [] : INITIAL_CONVERSATIONS;
    } catch {
      return isNativeAndroid() ? [] : INITIAL_CONVERSATIONS;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved ? JSON.parse(saved) : isNativeAndroid() ? [] : INITIAL_MESSAGES;
    } catch {
      return isNativeAndroid() ? [] : INITIAL_MESSAGES;
    }
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      return saved ? JSON.parse(saved) : isNativeAndroid() ? [] : INITIAL_CONTACTS;
    } catch {
      return isNativeAndroid() ? [] : INITIAL_CONTACTS;
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const conversationsRef = useRef<Conversation[]>(conversations);
  conversationsRef.current = conversations;
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;
  const dispatchedScheduledRef = useRef<Set<string>>(new Set());
  const [activeBanner, setActiveBanner] = useState<SmsNotificationItem | null>(null);
  const [notifications, setNotifications] = useState<SmsNotificationItem[]>([]);
  const [isNativeNotificationEnabled, setIsNativeNotificationEnabled] = useState<boolean>(false);

  // Native Platform & Device SMS/Contacts Integration States
  const isNativePlatform = useMemo(() => isNativeAndroid(), []);
  const [isDefaultSms, setIsDefaultSms] = useState<boolean>(false);
  const [currentDefaultPackage, setCurrentDefaultPackage] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionsStatus>({
    readSms: true,
    sendSms: true,
    receiveSms: true,
    contacts: true,
    allSmsGranted: true,
  });
  const [isSyncingDevice, setIsSyncingDevice] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ smsCount: number; contactCount: number } | null>(null);

  useEffect(() => {
    if (isNativeAndroid()) {
      smsBridge.checkPermissions().then((p) => setIsNativeNotificationEnabled(p.notifications !== false));
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsNativeNotificationEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Save data to localStorage (a moment after the last change, so taps are never blocked by big writes)
  useDebouncedPersist(STORAGE_KEYS.CONVERSATIONS, conversations);
  useDebouncedPersist(STORAGE_KEYS.MESSAGES, messages);
  useDebouncedPersist(STORAGE_KEYS.CONTACTS, contacts);

  // Auto-dismiss banner after 8s
  useEffect(() => {
    if (!activeBanner) return;
    const timer = setTimeout(() => {
      setActiveBanner(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeBanner]);

  // Hands one outgoing message to the radio (native) or simulates delivery (browser demo).
  const deliverOutgoing = useCallback(
    (messageId: string, conv: Conversation | undefined, text: string) => {
      if (isNativePlatform) {
        if (!conv) {
          setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status: 'failed' } : m)));
          return;
        }
        smsBridge
          .sendSms(conv.phoneNumber, text, { messageId, subscriptionId: conv.subscriptionId })
          .then(() => {
            // Handed to the radio; the carrier result arrives as an smsStatus event.
            setMessages((prev) =>
              prev.map((m) => (m.id === messageId && m.status === 'sending' ? { ...m, status: 'sent' } : m))
            );
          })
          .catch((err) => {
            console.error('Failed to send native SMS via cellular carrier:', err);
            setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status: 'failed' } : m)));
          });
        return;
      }
      setTimeout(() => {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status: 'sent' } : m)));
      }, 450);
      setTimeout(() => {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status: 'delivered' } : m)));
      }, 1100);
    },
    [isNativePlatform]
  );

  // Scheduled message dispatcher ticker (runs every 2 seconds while the app is open)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const due = messagesRef.current.filter(
        (m) =>
          m.isScheduled &&
          m.scheduledFor &&
          m.scheduledFor <= now &&
          !dispatchedScheduledRef.current.has(m.id)
      );
      if (due.length === 0) return;

      const dueIds = new Set(due.map((m) => m.id));
      due.forEach((m) => dispatchedScheduledRef.current.add(m.id));

      setMessages((prev) =>
        prev.map((m) =>
          dueIds.has(m.id)
            ? { ...m, isScheduled: false, scheduledFor: undefined, timestamp: now, status: 'sending' as const }
            : m
        )
      );

      setConversations((prev) =>
        prev.map((conv) => {
          const forConv = due.filter((m) => m.conversationId === conv.id);
          if (forConv.length === 0) return conv;
          const last = forConv[forConv.length - 1];
          return { ...conv, lastMessageText: last.text, lastMessageTimestamp: now };
        })
      );

      soundFx.playSent();
      due.forEach((m) =>
        deliverOutgoing(m.id, conversationsRef.current.find((c) => c.id === m.conversationId), m.text)
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [deliverOutgoing]);

  // Follow the system light/dark setting live when theme mode is "system"
  useEffect(() => {
    if (settings.themeMode !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [settings.themeMode]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    updateSettings({ themeMode: next ? 'dark' : 'light' });
  };

  const setThemeMode = useCallback((mode: 'system' | 'light' | 'dark') => {
    updateSettings({ themeMode: mode });
    if (mode === 'dark') {
      setIsDarkMode(true);
    } else if (mode === 'light') {
      setIsDarkMode(false);
    } else {
      const isSysDark = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
      setIsDarkMode(isSysDark);
    }
  }, [updateSettings]);

  const togglePhoneFrameMode = () => {
    updateSettings({ phoneFrameMode: !settings.phoneFrameMode });
  };

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleAutoReply = () => {
    updateSettings({ autoReplyEnabled: !settings.autoReplyEnabled });
  };

  const toggleShowOtpInNotifications = () => {
    updateSettings({ showOtpInNotifications: !settings.showOtpInNotifications });
  };

  const dismissBanner = () => setActiveBanner(null);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (isNativeAndroid()) {
      const granted = await smsBridge.requestNotificationPermission();
      setIsNativeNotificationEnabled(granted);
      return granted;
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsNativeNotificationEnabled(granted);
      return granted;
    } catch {
      return false;
    }
  };

  const copyOtpFromNotification = async (notificationId: string): Promise<string | null> => {
    const notif =
      notifications.find((n) => n.id === notificationId) ||
      (activeBanner?.id === notificationId ? activeBanner : null);
    if (!notif || !notif.otpCode) return null;

    try {
      await navigator.clipboard.writeText(notif.otpCode);
      soundFx.playSent();

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isCopied: true } : n))
      );
      if (activeBanner?.id === notificationId) {
        setActiveBanner({ ...activeBanner, isCopied: true });
        setTimeout(() => setActiveBanner(null), 1800);
      }
      return notif.otpCode;
    } catch {
      return null;
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setActiveBanner(null);
  };

  // ---------------------------------------------------------------
  // Spam protection (on-device model trained from the Indian Telecom SMS Spam Collection)
  // ---------------------------------------------------------------
  const [spamModelReady, setSpamModelReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadSpamModel().then((m) => {
      if (!cancelled && m) setSpamModelReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Scores never change for a given message, so remember them
  const spamScoreCache = useRef<Map<string, SpamScore | null>>(new Map());
  const spamLearnedSeen = useRef<Record<string, number> | undefined>(undefined);
  const scoreMessageCached = (id: string, text: string): SpamScore | null => {
    const cached = spamScoreCache.current.get(id);
    if (cached !== undefined) return cached;
    const score = scoreSms(text, settings.spamLearned);
    if (score) spamScoreCache.current.set(id, score);
    return score;
  };

  const spamConversationIds = useMemo(() => {
    const spamIds = new Set<string>();
    if (!settings.spamProtectionEnabled || !spamModelReady) return spamIds;

    // learned weights changed: earlier scores are out of date
    if (spamLearnedSeen.current !== settings.spamLearned) {
      spamScoreCache.current.clear();
      spamLearnedSeen.current = settings.spamLearned;
    }

    const contactKeys = new Set(contacts.map((c) => senderKey(c.phoneNumber)));
    const allow = new Set(settings.spamAllow);
    const block = new Set(settings.spamBlock);

    // newest message from them, and whether you ever wrote back, per conversation
    const lastIncoming = new Map<string, Message>();
    const repliedTo = new Set<string>();
    for (const m of messages) {
      if (m.isScheduled) continue;
      if (m.sender === 'me') {
        repliedTo.add(m.conversationId);
        continue;
      }
      const prev = lastIncoming.get(m.conversationId);
      if (!prev || m.timestamp > prev.timestamp) lastIncoming.set(m.conversationId, m);
    }

    for (const conv of conversations) {
      const key = senderKey(conv.phoneNumber);
      if (block.has(key)) {
        spamIds.add(conv.id);
        continue;
      }
      // People you know, people you have written to and senders you cleared are never spam
      if (allow.has(key) || repliedTo.has(conv.id) || contactKeys.has(key)) continue;
      const msg = lastIncoming.get(conv.id);
      if (!msg) continue;
      const score = scoreMessageCached(msg.id, msg.text);
      if (score && isSpamScore(score, conv.phoneNumber, settings.spamSensitivity)) spamIds.add(conv.id);
    }
    return spamIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conversations,
    messages,
    contacts,
    spamModelReady,
    settings.spamProtectionEnabled,
    settings.spamSensitivity,
    settings.spamAllow,
    settings.spamBlock,
    settings.spamLearned,
  ]);

  const isSpamConversation = useCallback(
    (conversationId: string) => spamConversationIds.has(conversationId),
    [spamConversationIds]
  );

  // Learn from the newest few messages a sender has sent you (never uploaded, only word scores are kept)
  const learnFromConversation = (conv: Conversation, spam: boolean): Record<string, number> => {
    const incoming = messagesRef.current
      .filter((m) => m.conversationId === conv.id && m.sender !== 'me' && !m.isScheduled)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
    let learned = settings.spamLearned ?? {};
    for (const m of incoming) learned = learnSms(m.text, spam, learned);
    return learned;
  };

  const markNotSpam = useCallback(
    (conversationId: string) => {
      const conv = conversationsRef.current.find((c) => c.id === conversationId);
      if (!conv) return;
      const key = senderKey(conv.phoneNumber);
      updateSettings({
        spamAllow: Array.from(new Set([...settings.spamAllow, key])),
        spamBlock: settings.spamBlock.filter((k) => k !== key),
        spamLearned: learnFromConversation(conv, false),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.spamAllow, settings.spamBlock, settings.spamLearned, updateSettings]
  );

  const reportSpam = useCallback(
    (conversationId: string) => {
      const conv = conversationsRef.current.find((c) => c.id === conversationId);
      if (!conv) return;
      const key = senderKey(conv.phoneNumber);
      updateSettings({
        spamBlock: Array.from(new Set([...settings.spamBlock, key])),
        spamAllow: settings.spamAllow.filter((k) => k !== key),
        spamLearned: learnFromConversation(conv, true),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.spamAllow, settings.spamBlock, settings.spamLearned, updateSettings]
  );

  // Is this sender one of your contacts?
  const isKnownContact = (sender: string): boolean => {
    const key = senderKey(sender);
    return contacts.some((c) => senderKey(c.phoneNumber) === key);
  };

  // Would this brand-new message be spam? (used to keep its notification quiet)
  const isIncomingSpam = (existing: Conversation | undefined, sender: string, body: string): boolean => {
    if (!settings.spamProtectionEnabled || !spamModelReady) return false;
    const key = senderKey(sender);
    if (settings.spamBlock.includes(key)) return true;
    if (settings.spamAllow.includes(key)) return false;
    if (contacts.some((c) => senderKey(c.phoneNumber) === key)) return false;
    if (existing && messagesRef.current.some((m) => m.conversationId === existing.id && m.sender === 'me')) {
      return false;
    }
    const score = scoreSms(body, settings.spamLearned);
    return !!score && isSpamScore(score, sender, settings.spamSensitivity);
  };

  // Let the Android side know, so spam notifications stay silent even when Ping is closed
  useEffect(() => {
    smsBridge.setSpamConfig({
      enabled: settings.spamProtectionEnabled,
      threshold: SPAM_THRESHOLDS[settings.spamSensitivity as "relaxed" | "balanced" | "strict"],
      allow: settings.spamAllow,
      block: settings.spamBlock,
      learned: settings.spamLearned ?? {},
    });
  }, [
    settings.spamProtectionEnabled,
    settings.spamSensitivity,
    settings.spamAllow,
    settings.spamBlock,
    settings.spamLearned,
  ]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const active = conversations.filter(
      (c) => !c.isArchived && !c.isBlocked && !spamConversationIds.has(c.id)
    );
    return {
      all: active.length,
      personal: active.filter((c) => c.category === 'personal').length,
      transactions: active.filter((c) => c.category === 'transactions').length,
      promotions: active.filter((c) => c.category === 'promotions').length,
      services: active.filter((c) => c.category === 'services').length,
      unread: active.filter((c) => c.unreadCount > 0).length,
      archived: conversations.filter((c) => c.isArchived).length,
      blocked: conversations.filter((c) => c.isBlocked).length,
      spam: conversations.filter(
        (c) => spamConversationIds.has(c.id) && !c.isArchived && !c.isBlocked
      ).length,
    };
  }, [conversations, spamConversationIds]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const selectConversation = useCallback((id: string | null) => {
    setActiveConversationId(id);
    if (id) {
      const target = conversationsRef.current.find((c) => c.id === id);
      if (target) smsBridge.markThreadRead(target.phoneNumber);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
      setActiveBanner((curr) => (curr?.conversationId === id ? null : curr));
    }
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    const target = conversationsRef.current.find((c) => c.id === conversationId);
    if (target) smsBridge.markThreadRead(target.phoneNumber);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const markAsUnread = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 1 } : c))
    );
  }, []);

  const dispatchIncomingNotification = useCallback(
    (conv: Conversation, text: string) => {
      const otpCode = extractOtpCode(text);
      const notifItem: SmsNotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conversationId: conv.id,
        senderName: conv.contactName,
        phoneNumber: conv.phoneNumber,
        text,
        timestamp: Date.now(),
        otpCode,
        isCopied: false,
      };

      if (settings.showOtpInNotifications || settings.headsUpBannerEnabled) {
        setActiveBanner(notifItem);
        setNotifications((prev) => [notifItem, ...prev.slice(0, 24)]);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const title = otpCode
              ? `Messages · Copy OTP ${otpCode}`
              : `Messages · ${conv.contactName}`;
            const body = otpCode
              ? `${conv.contactName}: Verification code is ${otpCode}. Tap to copy code.`
              : `${conv.contactName}: ${text}`;

            const nativeNotif = new Notification(title, {
              body,
              icon: '/pwa-192x192.png',
              badge: '/icon.svg',
              tag: `sms-${conv.id}`,
            });

            nativeNotif.onclick = () => {
              window.focus();
              if (otpCode) {
                navigator.clipboard.writeText(otpCode);
                soundFx.playSent();
              }
              selectConversation(conv.id);
            };
          } catch {}
        }
      }
    },
    [settings.showOtpInNotifications, settings.headsUpBannerEnabled, selectConversation]
  );

  // Handle real incoming device SMS received via Android BroadcastReceiver
  const handleIncomingDeviceSms = useCallback(
    (sender: string, body: string, timestamp: number, subscriptionId?: number) => {
      const subId = subscriptionId !== undefined && subscriptionId >= 0 ? subscriptionId : undefined;
      const cleanSender = (sender || 'Unknown').trim();
      const cleanBody = (body || '').trim();
      const time = timestamp || Date.now();

      // Find existing conversation matching sender phone number
      const existing = conversations.find(
        (c) =>
          c.phoneNumber.replace(/\D/g, '') === cleanSender.replace(/\D/g, '') ||
          c.contactName.toLowerCase() === cleanSender.toLowerCase()
      );

      let convId = existing?.id;
      let targetConv = existing;
      const isBlocked = !!existing?.isBlocked;
      const looksLikeSpam = isIncomingSpam(existing, cleanSender, cleanBody);

      if (!existing) {
        convId = `conv-${Date.now()}`;
        const avatarColor = getAvatarColorClasses(cleanSender);
        const category: ConversationCategory = categorizeSms(cleanSender, cleanBody, isKnownContact(cleanSender));

        targetConv = {
          id: convId,
          contactName: cleanSender,
          phoneNumber: cleanSender,
          avatarColor,
          category,
          isPinned: false,
          isArchived: false,
          isBlocked: false,
          unreadCount: activeConversationId === convId ? 0 : 1,
          lastMessageText: cleanBody,
          lastMessageTimestamp: time,
          subscriptionId: subId,
        };

        setConversations((prev) => [targetConv!, ...prev]);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessageText: cleanBody,
                  lastMessageTimestamp: time,
                  subscriptionId: subId ?? c.subscriptionId,
                  unreadCount: isBlocked ? c.unreadCount : activeConversationId === convId ? 0 : c.unreadCount + 1,
                }
              : c
          )
        );
      }

      const newMsg: Message = {
        id: `m-device-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conversationId: convId!,
        sender: 'them',
        text: cleanBody,
        timestamp: time,
        status: 'delivered',
      };

      setMessages((prev) => [...prev, newMsg]);

      // Blocked and spam senders are still stored, but never make a sound or show a banner.
      if (!isBlocked && !looksLikeSpam) {
        soundFx.playReceived();
        if (targetConv) {
          dispatchIncomingNotification(targetConv, cleanBody);
        }
      }
    },
    [conversations, activeConversationId, dispatchIncomingNotification]
  );

  const sendMessage = useCallback((conversationId: string, text: string) => {
    if (!text.trim()) return;

    const trimmed = text.trim();
    const newMsgId = `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const newMessage: Message = {
      id: newMsgId,
      conversationId,
      sender: 'me',
      text: trimmed,
      timestamp: now,
      status: 'sending',
    };

    setMessages((prev) => [...prev, newMessage]);
    soundFx.playSent();

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessageText: trimmed,
              lastMessageTimestamp: now,
            }
          : c
      )
    );

    deliverOutgoing(newMsgId, conversationsRef.current.find((c) => c.id === conversationId), trimmed);

    // Auto reply simulation
    // Demo-only: never inject fake replies into real conversations on a phone.
    if (settings.autoReplyEnabled && !isNativePlatform) {
      setTimeout(() => {
        const conv = conversationsRef.current.find((c) => c.id === conversationId);
        if (conv && !conv.isBlocked) {
          let replyText = 'Thanks for the text! Got it.';
          const lower = trimmed.toLowerCase();

          if (conv.contactName.includes('Mom')) {
            if (lower.includes('cake') || lower.includes('dinner')) {
              replyText = 'You are the best! See you then, love you! ❤️';
            } else {
              replyText = 'Thanks sweetie, talk soon!';
            }
          } else if (conv.contactName.includes('Chase')) {
            const randomCode = Math.floor(100000 + Math.random() * 900000);
            replyText = `Your Chase verification code is ${randomCode}. Valid for 10 minutes. Do not share.`;
          } else if (conv.category === 'promotions') {
            replyText = 'Promo Alert: Thank you for your inquiry. Deal active through Sunday!';
          } else if (conv.contactName.includes('Alex')) {
            replyText = 'Sounds like a plan! Let me know if anything changes.';
          } else {
            replyText = `Got your text: "${trimmed.slice(0, 30)}${trimmed.length > 30 ? '...' : ''}"`;
          }

          const replyId = `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const replyTime = Date.now();

          const incomingMsg: Message = {
            id: replyId,
            conversationId,
            sender: 'them',
            text: replyText,
            timestamp: replyTime,
            status: 'delivered',
          };

          setMessages((prev) => [...prev, incomingMsg]);
          soundFx.playReceived();

          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessageText: replyText,
                    lastMessageTimestamp: replyTime,
                    unreadCount: activeConversationId === conversationId ? 0 : c.unreadCount + 1,
                  }
                : c
            )
          );

          dispatchIncomingNotification(conv, replyText);
        }
      }, 2200);
    }
  }, [settings.autoReplyEnabled, isNativePlatform, activeConversationId, dispatchIncomingNotification, deliverOutgoing]);

  const scheduleMessage = useCallback((conversationId: string, text: string, scheduledFor: number) => {
    if (!text.trim()) return;
    const newMsgId = `m-sched-${Date.now()}`;

    const scheduledMessage: Message = {
      id: newMsgId,
      conversationId,
      sender: 'me',
      text: text.trim(),
      timestamp: Date.now(),
      status: 'sending',
      isScheduled: true,
      scheduledFor,
    };

    setMessages((prev) => [...prev, scheduledMessage]);
  }, []);

  const sendScheduledNow = useCallback(
    (messageId: string) => {
      const msg = messagesRef.current.find((m) => m.id === messageId && m.isScheduled);
      if (!msg || dispatchedScheduledRef.current.has(messageId)) return;
      dispatchedScheduledRef.current.add(messageId);

      const now = Date.now();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isScheduled: false, scheduledFor: undefined, timestamp: now, status: 'sending' as const }
            : m
        )
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId ? { ...c, lastMessageText: msg.text, lastMessageTimestamp: now } : c
        )
      );
      soundFx.playSent();
      deliverOutgoing(messageId, conversationsRef.current.find((c) => c.id === msg.conversationId), msg.text);
    },
    [deliverOutgoing]
  );

  const cancelScheduled = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const toggleStarMessage = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isStarred: !m.isStarred } : m))
    );
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    const target = messagesRef.current.find((m) => m.id === messageId);
    if (target) deleteFromDevice(target);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const togglePinConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c))
    );
  }, []);

  const toggleArchiveConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isArchived: !c.isArchived } : c))
    );
  }, []);

  const toggleBlockConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isBlocked: !c.isBlocked } : c))
    );
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    messagesRef.current.filter((m) => m.conversationId === conversationId).forEach(deleteFromDevice);
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessages((prev) => prev.filter((m) => m.conversationId !== conversationId));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  const startNewConversation = useCallback(
    (contactOrNumber: { name?: string; phoneNumber: string; category?: ConversationCategory }): string => {
      const cleanPhone = contactOrNumber.phoneNumber.trim();
      const existing = conversations.find(
        (c) => c.phoneNumber.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
      );

      if (existing) {
        if (existing.isArchived) {
          setConversations((prev) =>
            prev.map((c) => (c.id === existing.id ? { ...c, isArchived: false } : c))
          );
        }
        setActiveConversationId(existing.id);
        return existing.id;
      }

      const newId = `conv-${Date.now()}`;
      const name = contactOrNumber.name?.trim() || cleanPhone;
      const avatarColor = getAvatarColorClasses(name);
      const category: ConversationCategory = contactOrNumber.category || 'personal';

      const newConversation: Conversation = {
        id: newId,
        contactName: name,
        phoneNumber: cleanPhone,
        avatarColor,
        category,
        isPinned: false,
        isArchived: false,
        isBlocked: false,
        unreadCount: 0,
        lastMessageText: 'Draft conversation',
        lastMessageTimestamp: Date.now(),
      };

      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newId);
      return newId;
    },
    [conversations]
  );

  const simulateIncomingSms = useCallback((conversationId: string, text: string) => {
    if (!text.trim()) return;
    const now = Date.now();
    const newMsg: Message = {
      id: `m-sim-${now}`,
      conversationId,
      sender: 'them',
      text: text.trim(),
      timestamp: now,
      status: 'delivered',
    };

    setMessages((prev) => [...prev, newMsg]);
    soundFx.playReceived();

    const conv = conversations.find((c) => c.id === conversationId);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessageText: text.trim(),
              lastMessageTimestamp: now,
              unreadCount: activeConversationId === conversationId ? 0 : c.unreadCount + 1,
            }
          : c
      )
    );

    if (conv) {
      dispatchIncomingNotification(conv, text.trim());
    }
  }, [activeConversationId, conversations, dispatchIncomingNotification]);

  const resetToDemoData = useCallback(() => {
    setConversations(INITIAL_CONVERSATIONS);
    setMessages(INITIAL_MESSAGES);
    setContacts(INITIAL_CONTACTS);
    setActiveConversationId(null);
    setFilter('all');
    setSearchQuery('');
    setActiveBanner(null);
    setNotifications([]);
  }, []);

  // ---------------------------------------------------------------
  // Backup & restore (to a file the user chooses)
  // ---------------------------------------------------------------
  const backupSmsToFile = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    try {
      // The phone's own messages (all of them), when Ping may read them
      let deviceSms: BackupSms[] = [];
      if (isNativePlatform) {
        const perms = await smsBridge.checkPermissions();
        if (perms.readSms) {
          const raw = await smsBridge.readDeviceSms(200000);
          deviceSms = raw.map((m) => ({
            address: m.address,
            body: m.body,
            date: m.date,
            isSent: m.isSent,
            isRead: m.isRead,
          }));
        }
      }

      const backup = {
        app: 'Ping',
        version: 3,
        createdAt: new Date().toISOString(),
        sms: deviceSms,
        conversations: conversationsRef.current,
        messages: messagesRef.current,
        contacts,
      };
      const json = JSON.stringify(backup);
      const fileName = `ping-sms-backup-${new Date().toISOString().slice(0, 10)}.json`;

      if (isNativePlatform) {
        const res = await smsBridge.saveBackupFile(fileName, json);
        if (!res.saved) return { ok: false, message: 'Backup cancelled' };
      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
      const count = deviceSms.length || messagesRef.current.length;
      return { ok: true, message: `Backed up ${count} messages` };
    } catch (err) {
      return { ok: false, message: `Backup failed: ${err instanceof Error ? err.message : 'unknown error'}` };
    }
  }, [isNativePlatform, contacts]);

  const restoreSmsFromJson = useCallback(
    async (jsonData: string): Promise<{ ok: boolean; message: string }> => {
      let data: any;
      try {
        data = JSON.parse(jsonData);
      } catch {
        return { ok: false, message: 'That file is not a valid Ping backup.' };
      }
      const hasState = Array.isArray(data?.conversations) && Array.isArray(data?.messages);
      const sms: BackupSms[] = Array.isArray(data?.sms) ? data.sms : [];
      if (!hasState && sms.length === 0) {
        return { ok: false, message: 'That file is not a valid Ping backup.' };
      }

      if (hasState) {
        setConversations(data.conversations);
        setMessages(data.messages);
        if (Array.isArray(data.contacts)) setContacts(data.contacts);
      }
      let note = hasState ? 'Restored your conversations in Ping.' : '';

      if (isNativePlatform && sms.length > 0) {
        if (isDefaultSms) {
          try {
            const res = await smsBridge.restoreDeviceSms(sms);
            note = `Restored ${res.inserted} messages to your phone (${res.skipped} were already there).`;
            await syncRef.current();
          } catch (err) {
            console.warn('restoreDeviceSms failed:', err);
            note += " Could not write the messages into your phone's SMS.";
          }
        } else {
          note += ' To also put the messages back into your phone, make Ping the default SMS app and restore again.';
        }
      }
      return { ok: true, message: note.trim() };
    },
    [isNativePlatform, isDefaultSms]
  );

  const pickAndRestoreSms = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    try {
      const res = await smsBridge.pickBackupFile();
      if (res.cancelled || !res.content) return { ok: false, message: 'No file chosen' };
      return await restoreSmsFromJson(res.content);
    } catch (err) {
      return { ok: false, message: `Restore failed: ${err instanceof Error ? err.message : 'unknown error'}` };
    }
  }, [restoreSmsFromJson]);

  // Clean expired OTPs older than 24 hours
  const cleanExpiredOtps = useCallback((): number => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const expired = messagesRef.current.filter((m) => !!extractOtpCode(m.text) && m.timestamp < oneDayAgo);
    if (expired.length === 0) return 0;
    const ids = new Set(expired.map((m) => m.id));
    expired.forEach(deleteFromDevice);
    setMessages((prev) => prev.filter((m) => !ids.has(m.id)));
    return expired.length;
  }, []);

  // Apply the "auto-delete OTPs after 24h" setting (on open, then hourly)
  useEffect(() => {
    if (!settings.autoDeleteOtps24h) return;
    cleanExpiredOtps();
    const timer = setInterval(cleanExpiredOtps, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, [settings.autoDeleteOtps24h, cleanExpiredOtps]);

  // -------------------------------------------------------------
  // Native Android & Device SMS / Contacts Integration Methods
  // -------------------------------------------------------------

  const checkDefaultSmsApp = useCallback(async () => {
    try {
      const status = await smsBridge.isDefaultSmsApp();
      setIsDefaultSms(status.isDefault);
      setCurrentDefaultPackage(status.currentDefault || null);
      const perms = await smsBridge.checkPermissions();
      setPermissions(perms);
    } catch (err) {
      console.warn('Failed checking default SMS status', err);
    }
  }, []);

  const requestDefaultSmsApp = useCallback(async (): Promise<boolean> => {
    try {
      const res = await smsBridge.requestDefaultSmsApp();
      // Ask Android again for the real answer (the dialog result alone can lag behind)
      await checkDefaultRef.current();
      return !!res.isDefault || !!res.granted;
    } catch (err) {
      console.warn('Failed requesting default SMS', err);
      return false;
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const perms = await smsBridge.requestPermissions();
      setPermissions(perms);
    } catch (err) {
      console.warn('Failed requesting permissions', err);
    }
  }, []);

  const syncDeviceContacts = useCallback(async (): Promise<number> => {
    setIsSyncingDevice(true);
    try {
      const deviceContacts = await smsBridge.readDeviceContacts();
      if (deviceContacts && deviceContacts.length > 0) {
        setContacts((prev) => {
          const map = new Map<string, Contact>();
          prev.forEach((c) => map.set(c.phoneNumber.replace(/\s+/g, ''), c));
          deviceContacts.forEach((dc) => {
            const cleanNum = dc.phoneNumber.replace(/\s+/g, '');
            map.set(cleanNum, {
              id: `contact-${dc.id || cleanNum}`,
              name: dc.name || dc.phoneNumber,
              phoneNumber: dc.phoneNumber,
              avatarColor: getAvatarColorClasses(dc.name || dc.phoneNumber),
              initials: getInitials(dc.name, dc.phoneNumber),
            });
          });
          return Array.from(map.values());
        });
        return deviceContacts.length;
      }
      return 0;
    } catch (err) {
      console.warn('Failed to sync device contacts:', err);
      return 0;
    } finally {
      setIsSyncingDevice(false);
    }
  }, []);

  // What the last sync looked like, so an unchanged inbox costs nothing
  const lastSyncSignature = useRef('');
  const lastContactsSignature = useRef('');
  const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  const syncDeviceSmsAndContacts = useCallback(async () => {
    setIsSyncingDevice(true);
    try {
      // 1. Sync contacts first to match names with numbers
      let contactList: NativeContact[] = [];
      try {
        contactList = await smsBridge.readDeviceContacts();
      } catch (e) {
        console.warn('Could not read contacts during full sync', e);
      }

      const contactNameMap = new Map<string, string>();
      if (contactList && contactList.length > 0) {
        contactList.forEach((c) => {
          const clean = c.phoneNumber.replace(/\D/g, '');
          if (clean) contactNameMap.set(clean, c.name);
        });

        const contactsSignature = `${contactList.length}:${contactList[0]?.id}:${contactList[contactList.length - 1]?.id}`;
        if (contactsSignature !== lastContactsSignature.current) {
          lastContactsSignature.current = contactsSignature;
          startTransition(() => setContacts((prev) => {
          const map = new Map<string, Contact>();
          prev.forEach((c) => map.set(c.phoneNumber.replace(/\s+/g, ''), c));
          contactList.forEach((dc) => {
            const cleanNum = dc.phoneNumber.replace(/\s+/g, '');
            map.set(cleanNum, {
              id: `contact-${dc.id || cleanNum}`,
              name: dc.name || dc.phoneNumber,
              phoneNumber: dc.phoneNumber,
              avatarColor: getAvatarColorClasses(dc.name || dc.phoneNumber),
              initials: getInitials(dc.name, dc.phoneNumber),
            });
          });
          return Array.from(map.values());
          }));
        }
      }

      // Let taps and animations run before the heavy part
      await nextTick();

      // 2. Read device SMS messages from Telephony provider
      const rawSms = await smsBridge.readDeviceSms(1000);
      if (!rawSms || rawSms.length === 0) {
        const result = { smsCount: 0, contactCount: contactList.length };
        setSyncResult(result);
        return result;
      }

      // Nothing new since the last sync: leave everything as it is (no re-render, no storage write)
      let newest = 0;
      let unreadTotal = 0;
      for (const m of rawSms) {
        if (m.date > newest) newest = m.date;
        if (!m.isRead && !m.isSent) unreadTotal++;
      }
      const signature = `${rawSms.length}:${newest}:${unreadTotal}:${lastContactsSignature.current}`;
      if (signature === lastSyncSignature.current) {
        const same = { smsCount: rawSms.length, contactCount: contactList.length };
        setSyncResult(same);
        return same;
      }
      lastSyncSignature.current = signature;
      await nextTick();

      // 3. Group messages into conversations by threadId or cleaned address
      const threadGroups = new Map<string, NativeSmsMessage[]>();
      rawSms.forEach((msg) => {
        const groupKey = msg.threadId || msg.address.replace(/\D/g, '') || msg.address;
        const list = threadGroups.get(groupKey) || [];
        list.push(msg);
        threadGroups.set(groupKey, list);
      });

      const newMessagesList: Message[] = [];
      const newConversationsList: Conversation[] = [];
      const previousMessages = messagesRef.current;
      const previousConversations = conversationsRef.current;
      const starredIds = new Set(previousMessages.filter((m) => m.isStarred).map((m) => m.id));
      // lookups by number / id built once instead of searching the whole list for every thread
      const previousByDigits = new Map<string, Conversation>();
      const previousById = new Map<string, Conversation>();
      for (const c of previousConversations) {
        previousById.set(c.id, c);
        const d = c.phoneNumber.replace(/\D/g, '');
        if (d.length >= 7) previousByDigits.set(d, c);
      }

      threadGroups.forEach((groupMsgs, key) => {
        // Sort group messages chronologically ascending
        groupMsgs.sort((a, b) => a.date - b.date);

        const firstMsg = groupMsgs[0];
        const lastMsg = groupMsgs[groupMsgs.length - 1];
        const rawAddress = firstMsg.address || 'Unknown';
        const cleanDigits = rawAddress.replace(/\D/g, '');
        const matchedName = contactNameMap.get(cleanDigits) || rawAddress;

        const convId = `conv-dev-${key}`;
        const category = categorizeSms(rawAddress, lastMsg.body, contactNameMap.has(cleanDigits));

        let unread = 0;
        groupMsgs.forEach((m) => {
          if (!m.isRead && !m.isSent) unread++;
          newMessagesList.push({
            id: `${DEVICE_ID_PREFIX}${m.id}`,
            conversationId: convId,
            sender: m.isSent ? 'me' : 'them',
            text: m.body,
            timestamp: m.date,
            status: 'delivered',
            ...(starredIds.has(`${DEVICE_ID_PREFIX}${m.id}`) ? { isStarred: true } : {}),
          });
        });

        // Check if existing conv exists to preserve pinned/archived states
        const existing = cleanDigits.length >= 7 ? previousByDigits.get(cleanDigits) : undefined;

        newConversationsList.push({
          id: convId,
          contactName: matchedName,
          phoneNumber: rawAddress,
          avatarColor: getAvatarColorClasses(matchedName),
          category,
          isPinned: existing ? existing.isPinned : false,
          isArchived: existing ? existing.isArchived : false,
          isBlocked: existing ? existing.isBlocked : false,
          unreadCount: unread,
          lastMessageText: lastMsg.body,
          lastMessageTimestamp: lastMsg.date,
          draftText: existing?.draftText,
          subscriptionId: existing?.subscriptionId,
        });
      });

      // Sort conversations by most recent message
      newConversationsList.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

      // Keep messages that only exist inside Ping: scheduled / sending / failed ones, and
      // anything sent from Ping while it is not the default SMS app (Android won't store those).
      const keepLocal = previousMessages.filter(
        (m) =>
          !m.id.startsWith(DEVICE_ID_PREFIX) &&
          (m.isScheduled || m.status === 'sending' || m.status === 'failed' || (m.sender === 'me' && !isDefaultSms))
      );
      const newById = new Map<string, Conversation>();
      const newByDigits = new Map<string, Conversation>();
      for (const c of newConversationsList) {
        newById.set(c.id, c);
        const d = c.phoneNumber.replace(/\D/g, '');
        if (d.length >= 7) newByDigits.set(d, c);
      }
      keepLocal.forEach((m) => {
        const oldConv = previousById.get(m.conversationId);
        if (!oldConv) return;
        const digits = oldConv.phoneNumber.replace(/\D/g, '');
        const found = newById.get(oldConv.id) ?? (digits.length >= 7 ? newByDigits.get(digits) : undefined);
        const target: Conversation = found ?? { ...oldConv };
        if (!found) {
          newConversationsList.push(target);
          newById.set(target.id, target);
        }
        if (m.timestamp > target.lastMessageTimestamp && !m.isScheduled) {
          target.lastMessageText = m.text;
          target.lastMessageTimestamp = m.timestamp;
        }
        newMessagesList.push({ ...m, conversationId: target.id });
      });

      newMessagesList.sort((a, b) => a.timestamp - b.timestamp);
      newConversationsList.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

      // Apply as a low-priority update: React can pause it whenever you tap or an animation needs a frame
      startTransition(() => {
        setMessages(newMessagesList);
        setConversations(newConversationsList);
      });
      const result = { smsCount: rawSms.length, contactCount: contactList.length };
      setSyncResult(result);

      return result;
    } catch (err) {
      console.warn('Failed to sync device SMS & contacts:', err);
      return { smsCount: 0, contactCount: 0 };
    } finally {
      setIsSyncingDevice(false);
    }
  }, [isDefaultSms]);

  const importWebContact = useCallback(async (): Promise<Contact | null> => {
    try {
      const picked = await smsBridge.pickWebContact();
      if (picked) {
        const cleanNum = picked.phoneNumber.trim();
        const name = picked.name.trim() || cleanNum;
        const newContact: Contact = {
          id: `contact-web-${Date.now()}`,
          name,
          phoneNumber: cleanNum,
          avatarColor: getAvatarColorClasses(name),
          initials: getInitials(name, cleanNum),
        };
        setContacts((prev) => [newContact, ...prev]);
        return newContact;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Always call the latest handlers without re-subscribing the native listeners each render
  const incomingHandlerRef = useRef(handleIncomingDeviceSms);
  incomingHandlerRef.current = handleIncomingDeviceSms;
  const syncRef = useRef(syncDeviceSmsAndContacts);
  syncRef.current = syncDeviceSmsAndContacts;
  const isSyncingRef = useRef(false);
  const checkDefaultRef = useRef(checkDefaultSmsApp);
  checkDefaultRef.current = checkDefaultSmsApp;

  // Listen to native incoming SMS & check default status on startup (subscribe once)
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    checkDefaultSmsApp();

    smsBridge
      .listenToIncomingSms((incoming) => {
        incomingHandlerRef.current(incoming.sender, incoming.body, incoming.timestamp, incoming.subscriptionId);
      })
      .then((unsub) => {
        if (cancelled) unsub();
        else cleanup = unsub;
      });

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [checkDefaultSmsApp]);

  // On a real phone, load the device inbox on start and whenever the app comes back to the
  // foreground, so messages received while Ping was closed show up without a manual sync.
  useEffect(() => {
    if (!isNativePlatform) return;
    let lastAutoSync = 0;
    const autoSync = async () => {
      if (isSyncingRef.current) return;
      // coming back to the app within half a minute does not need another full read
      if (Date.now() - lastAutoSync < 30000) return;
      lastAutoSync = Date.now();
      isSyncingRef.current = true;
      try {
        const perms = await smsBridge.checkPermissions();
        if (perms.readSms) await syncRef.current();
      } finally {
        isSyncingRef.current = false;
      }
    };
    autoSync();
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        // The user may have changed the default SMS app / permissions in Android settings meanwhile
        checkDefaultRef.current();
        autoSync();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    // Android tells us directly when the user comes back (e.g. after choosing the default SMS app)
    let cancelled = false;
    let unsubscribeResume: (() => void) | undefined;
    smsBridge
      .listenToAppResume(() => {
        checkDefaultRef.current();
        autoSync();
      })
      .then((unsub) => {
        if (cancelled) unsub();
        else unsubscribeResume = unsub;
      });

    return () => {
      cancelled = true;
      if (unsubscribeResume) unsubscribeResume();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isNativePlatform]);

  // Track real carrier results (sent / delivered / failed) for outgoing SMS
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    smsBridge
      .listenToSmsStatus(({ messageId, status }) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            // Never downgrade: a late "sent" must not overwrite "delivered", and failure is final.
            if (m.status === 'failed' || m.status === 'delivered') return m;
            return { ...m, status };
          })
        );
      })
      .then((unsub) => {
        if (cancelled) unsub();
        else cleanup = unsub;
      });
    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);

  const starredMessages = useMemo(() => {
    return messages
      .filter((m) => m.isStarred)
      .map((m) => ({
        ...m,
        conversation: conversations.find((c) => c.id === m.conversationId),
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [messages, conversations]);

  const value = {
    conversations,
    messages,
    contacts,
    activeConversationId,
    activeConversation,
    filter,
    searchQuery,
    isDarkMode,
    phoneFrameMode: settings.phoneFrameMode,
    soundEnabled: settings.soundEnabled,
    autoReplyEnabled: settings.autoReplyEnabled,
    settings,
    updateSettings,
    categoryCounts,
    spamConversationIds,
    isSpamConversation,
    markNotSpam,
    reportSpam,
    showOtpInNotifications: settings.showOtpInNotifications,
    activeBanner,
    notifications,
    isNativeNotificationEnabled,

    // Native & Device Features
    isNativePlatform,
    isDefaultSms,
    currentDefaultPackage,
    permissions,
    isSyncingDevice,
    syncResult,
    checkDefaultSmsApp,
    requestDefaultSmsApp,
    requestPermissions,
    syncDeviceSmsAndContacts,
    syncDeviceContacts,
    importWebContact,

    toggleDarkMode,
    setThemeMode,
    togglePhoneFrameMode,
    toggleSound,
    toggleAutoReply,
    toggleShowOtpInNotifications,
    dismissBanner,
    copyOtpFromNotification,
    clearAllNotifications,
    requestNotificationPermission,
    selectConversation,
    setFilter,
    setSearchQuery,
    sendMessage,
    scheduleMessage,
    sendScheduledNow,
    cancelScheduled,
    toggleStarMessage,
    deleteMessage,
    togglePinConversation,
    toggleArchiveConversation,
    toggleBlockConversation,
    deleteConversation,
    markAsRead,
    markAsUnread,
    startNewConversation,
    simulateIncomingSms,
    resetToDemoData,
    backupSmsToFile,
    restoreSmsFromJson,
    pickAndRestoreSms,
    cleanExpiredOtps,
    starredMessages,
  };

  return <SMSContext.Provider value={value}>{children}</SMSContext.Provider>;
};

export const useSMS = () => {
  const context = useContext(SMSContext);
  if (!context) {
    throw new Error('useSMS must be used within an SMSProvider');
  }
  return context;
};
