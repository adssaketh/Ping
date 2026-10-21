export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export type ConversationCategory = 'personal' | 'transactions' | 'promotions';

export interface Message {
  id: string;
  conversationId: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: number;
  status: DeliveryStatus;
  isStarred?: boolean;
  isScheduled?: boolean;
  scheduledFor?: number; // timestamp when it should be delivered
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatarColor: string;
  initials: string;
}

export interface Conversation {
  id: string;
  contactId?: string;
  contactName: string;
  phoneNumber: string;
  avatarColor: string;
  category: ConversationCategory;
  isPinned: boolean;
  isArchived: boolean;
  isBlocked: boolean;
  unreadCount: number;
  draftText?: string;
  lastMessageText?: string;
  lastMessageTimestamp: number;
  /** SIM subscription the last incoming message arrived on (native Android only) */
  subscriptionId?: number;
}

export type FilterCategory =
  | 'all'
  | 'personal'
  | 'transactions'
  | 'promotions'
  | 'unread'
  | 'starred'
  | 'archived'
  | 'blocked'
  | 'spam';

export interface SchedulePresetOption {
  id: 'later_today' | 'tonight' | 'tomorrow_morning' | 'custom';
  label: string;
  timeLabel: string;
  timestamp: number;
}

export interface SmsNotificationItem {
  id: string;
  conversationId: string;
  senderName: string;
  phoneNumber: string;
  text: string;
  timestamp: number;
  otpCode: string | null;
  isCopied?: boolean;
}

export interface SmsAppSettings {
  // OTP & Notifications
  showOtpInNotifications: boolean;
  headsUpBannerEnabled: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  autoDeleteOtps24h: boolean;

  // SMS & Messaging
  smsDeliveryReports: boolean;
  characterCounterEnabled: boolean;
  groupSmsIndividual: boolean;
  /** Profile picture, stored on this phone only (a small square JPEG as a data URL) */
  profilePhoto: string | null;
  profileName: string;
  spamProtectionEnabled: boolean;
  /** How aggressively unknown senders are filtered into the Spam folder */
  spamSensitivity: 'relaxed' | 'balanced' | 'strict';
  /** Senders the user marked "Not spam" (sender keys, see senderKey()) */
  spamAllow: string[];
  /** Senders the user reported as spam */
  spamBlock: string[];
  /** Small per-word score adjustments learned from the user's Not spam / Report spam taps (on this phone only) */
  spamLearned: Record<string, number>;
  autoReplyEnabled: boolean;
  emergencyAlerts: boolean;

  // Display & UI
  showCategoriesTabs: boolean;
  themeMode: 'system' | 'light' | 'dark';
  phoneFrameMode: boolean;
}
