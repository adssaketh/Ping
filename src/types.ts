export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export type ConversationCategory = 'personal' | 'transactions' | 'services' | 'promotions';

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
  /** id of this contact on the phone (used to fetch its picture) */
  deviceContactId?: string;
  photoFileId?: string;
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
  | 'services'
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
  /** The larger original used for re-editing the picture (also stored on this phone only) */
  profilePhotoSource: string | null;
  profileName: string;
  /** Years of older messages you loaded with "Show more" (they are loaded again on every launch) */
  loadedYears: number[];
  /** What happens to messages as they slide under the search bar and bottom bar: nothing, a clean fade, or fade + blur */
  edgeEffect: 'off' | 'fade' | 'blur';
  /** How strongly messages blur there (only used when edgeEffect is 'blur') */
  edgeBlurLevel: 'off' | 'light' | 'medium' | 'strong';
  /** How tall the fade zone under the search bar / above the bottom bar is */
  edgeFade: 'short' | 'medium' | 'tall';
  /** Search bar and bottom bar: solid colour, or frosted glass that shows the messages through it */
  barStyle: 'solid' | 'glass';
  /** Glass bars: how much of the bar's colour is kept (the rest is see-through), 20 to 95 */
  glassOpacity: number;
  /** Glass bars: how strongly the messages behind are blurred */
  glassBlur: 'soft' | 'medium' | 'strong';
  /** Glass bars: a thin light edge, like the rim of real glass */
  glassBorder: boolean;
  spamProtectionEnabled: boolean;
  /** How aggressively unknown senders are filtered into the Spam folder */
  spamSensitivity: 'relaxed' | 'balanced' | 'strict';
  /** Senders the user marked "Not spam" (sender keys, see senderKey()) */
  spamAllow: string[];
  /** Senders the user reported as spam */
  spamBlock: string[];
  /** Small per-word score adjustments learned from the user's Not spam / Report spam taps (on this phone only) */
  spamLearned: Record<string, number>;
  emergencyAlerts: boolean;

  // Display & UI
  showCategoriesTabs: boolean;
  themeMode: 'system' | 'light' | 'dark';
}
