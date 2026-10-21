import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  spamProtectionEnabled: true,
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
    unread: number;
    archived: number;
    blocked: number;
  };

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
  exportSmsBackup: () => void;
  importSmsBackup: (jsonData: string) => boolean;
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

  // Keep Android's status / navigation bar area and icon colours in step with the app theme
  useEffect(() => {
    smsBridge.setSystemBarsTheme(isDarkMode);
  }, [isDarkMode]);

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

  // Save data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    } catch {}
  }, [contacts]);

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

  // Category counts
  const categoryCounts = useMemo(() => {
    const active = conversations.filter((c) => !c.isArchived && !c.isBlocked);
    return {
      all: active.length,
      personal: active.filter((c) => c.category === 'personal').length,
      transactions: active.filter((c) => c.category === 'transactions').length,
      promotions: active.filter((c) => c.category === 'promotions').length,
      unread: active.filter((c) => c.unreadCount > 0).length,
      archived: conversations.filter((c) => c.isArchived).length,
      blocked: conversations.filter((c) => c.isBlocked).length,
    };
  }, [conversations]);

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

      if (!existing) {
        convId = `conv-${Date.now()}`;
        const avatarColor = getAvatarColorClasses(cleanSender);
        const category: ConversationCategory = categorizeSms(cleanSender, cleanBody);

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

      // Blocked senders are still stored, but never make a sound or show a banner.
      if (!isBlocked) {
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

  // Export SMS Backup as JSON
  const exportSmsBackup = useCallback(() => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      conversations,
      messages,
      contacts,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ping-sms-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [conversations, messages, contacts]);

  // Import SMS Backup from JSON
  const importSmsBackup = useCallback((jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.conversations) && Array.isArray(data.messages)) {
        setConversations(data.conversations);
        setMessages(data.messages);
        if (Array.isArray(data.contacts)) {
          setContacts(data.contacts);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

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
      setIsDefaultSms(res.isDefault);
      return res.isDefault;
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

        setContacts((prev) => {
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
        });
      }

      // 2. Read device SMS messages from Telephony provider
      const rawSms = await smsBridge.readDeviceSms(1000);
      if (!rawSms || rawSms.length === 0) {
        const result = { smsCount: 0, contactCount: contactList.length };
        setSyncResult(result);
        return result;
      }

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

      threadGroups.forEach((groupMsgs, key) => {
        // Sort group messages chronologically ascending
        groupMsgs.sort((a, b) => a.date - b.date);

        const firstMsg = groupMsgs[0];
        const lastMsg = groupMsgs[groupMsgs.length - 1];
        const rawAddress = firstMsg.address || 'Unknown';
        const cleanDigits = rawAddress.replace(/\D/g, '');
        const matchedName = contactNameMap.get(cleanDigits) || rawAddress;

        const convId = `conv-dev-${key}`;
        const category = categorizeSms(rawAddress, lastMsg.body);

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
        const existing = previousConversations.find(
          (c) => c.phoneNumber.replace(/\D/g, '') === cleanDigits && cleanDigits.length >= 7
        );

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
      keepLocal.forEach((m) => {
        const oldConv = previousConversations.find((c) => c.id === m.conversationId);
        if (!oldConv) return;
        const digits = oldConv.phoneNumber.replace(/\D/g, '');
        const found = newConversationsList.find(
          (c) => c.id === oldConv.id || (digits.length >= 7 && c.phoneNumber.replace(/\D/g, '') === digits)
        );
        const target: Conversation = found ?? { ...oldConv };
        if (!found) newConversationsList.push(target);
        if (m.timestamp > target.lastMessageTimestamp && !m.isScheduled) {
          target.lastMessageText = m.text;
          target.lastMessageTimestamp = m.timestamp;
        }
        newMessagesList.push({ ...m, conversationId: target.id });
      });

      newMessagesList.sort((a, b) => a.timestamp - b.timestamp);
      newConversationsList.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

      setMessages(newMessagesList);
      setConversations(newConversationsList);
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
    const autoSync = async () => {
      if (isSyncingRef.current) return;
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
    return () => document.removeEventListener('visibilitychange', onVisible);
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
    exportSmsBackup,
    importSmsBackup,
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
