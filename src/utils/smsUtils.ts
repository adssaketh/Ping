/**
 * Utilities for SMS counting, formatting, Material 3 colors, and audio feedback.
 */

// Basic GSM-7 regex check
const GSM_7_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà^{}\\[~\]|€]*$/;

export interface SmsCountInfo {
  charCount: number;
  segmentCount: number;
  remainingInSegment: number;
  isGsm: boolean;
  limitPerSegment: number;
}

export function calculateSmsCount(text: string): SmsCountInfo {
  if (!text) {
    return {
      charCount: 0,
      segmentCount: 1,
      remainingInSegment: 160,
      isGsm: true,
      limitPerSegment: 160,
    };
  }

  const isGsm = GSM_7_REGEX.test(text);
  const charCount = text.length;

  if (isGsm) {
    if (charCount <= 160) {
      return {
        charCount,
        segmentCount: 1,
        remainingInSegment: 160 - charCount,
        isGsm,
        limitPerSegment: 160,
      };
    } else {
      const segmentCount = Math.ceil(charCount / 153);
      const remainingInSegment = segmentCount * 153 - charCount;
      return {
        charCount,
        segmentCount,
        remainingInSegment,
        isGsm,
        limitPerSegment: 153,
      };
    }
  } else {
    // UCS-2 (Unicode / Emojis)
    if (charCount <= 70) {
      return {
        charCount,
        segmentCount: 1,
        remainingInSegment: 70 - charCount,
        isGsm,
        limitPerSegment: 70,
      };
    } else {
      const segmentCount = Math.ceil(charCount / 67);
      const remainingInSegment = segmentCount * 67 - charCount;
      return {
        charCount,
        segmentCount,
        remainingInSegment,
        isGsm,
        limitPerSegment: 67,
      };
    }
  }
}

/**
 * Format relative timestamps in Google Messages style
 */
export function formatConversationTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);

  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isToday =
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getDate() === date.getDate() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getFullYear() === date.getFullYear();

  if (isYesterday) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  if (now.getFullYear() === date.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

export function formatMessageDetailTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatFullDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Material Design 3 Tonal Avatar Palettes
 */
export const M3_AVATAR_PALETTES = [
  { bg: 'bg-[#0B57D0] text-white', darkBg: 'dark:bg-[#A8C7FA] dark:text-[#041E49]' },
  { bg: 'bg-[#1E8E3E] text-white', darkBg: 'dark:bg-[#6DD58C] dark:text-[#0A3818]' },
  { bg: 'bg-[#9333EA] text-white', darkBg: 'dark:bg-[#D8B4FE] dark:text-[#3B0764]' },
  { bg: 'bg-[#E37400] text-white', darkBg: 'dark:bg-[#FFB74D] dark:text-[#4E2700]' },
  { bg: 'bg-[#C2185B] text-white', darkBg: 'dark:bg-[#F48FB1] dark:text-[#4A001F]' },
  { bg: 'bg-[#007B83] text-white', darkBg: 'dark:bg-[#4DD0E1] dark:text-[#00363A]' },
  { bg: 'bg-[#5C6BC0] text-white', darkBg: 'dark:bg-[#9FA8DA] dark:text-[#1A237E]' },
  { bg: 'bg-[#795548] text-white', darkBg: 'dark:bg-[#BCAAA4] dark:text-[#3E2723]' },
];

export function getAvatarColorClasses(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % M3_AVATAR_PALETTES.length;
  const p = M3_AVATAR_PALETTES[index];
  return `${p.bg} ${p.darkBg}`;
}

export function getInitials(name: string, fallbackPhone: string): string {
  if (!name || name.trim() === '') {
    return fallbackPhone ? fallbackPhone.slice(-2) : '??';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

/**
 * Web Audio synthetic haptic sounds for Google Messages
 */
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playSent() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // AudioContext policy suppression fallback
    }
  }

  playReceived() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.setValueAtTime(1040, now + 0.06);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // AudioContext policy suppression fallback
    }
  }
}

export const soundFx = new SoundEffects();

/**
 * Intelligent OTP / Verification code extractor for standard SMS
 */
export function extractOtpCode(text: string): string | null {
  if (!text) return null;
  // Specific patterns like "code is 123456", "OTP: 987654", "G-123456"
  const prefixMatch = text.match(/(?:code|otp|passcode|secret|pin|verification|auth|g-)\s*(?:is|:)?\s*([0-9]{4,8})\b/i);
  if (prefixMatch && prefixMatch[1]) {
    return prefixMatch[1];
  }
  // Fallback: standalone 4-8 digit number
  const numbers = text.match(/\b\d{4,8}\b/g);
  if (numbers && numbers.length > 0) {
    return numbers[0];
  }
  return null;
}

/**
 * Intelligent categorization of SMS into Personal, Transactions, or Promotions
 */
export function categorizeSms(
  address: string,
  text: string
): 'personal' | 'transactions' | 'promotions' {
  const addr = (address || '').toLowerCase();
  const body = (text || '').toLowerCase();

  // Transaction keywords & alphanumeric sender IDs (e.g. AD-HDFCBK, AX-CHASE)
  const isAlphaNumericSender = /^[a-z]{2}-[a-z0-9]{4,10}$/i.test(address.trim());
  const isBankOrFinancial =
    /bank|chase|wells|citi|hdfc|sbi|icici|axis|paypal|venmo|stripe|paytm|wallet|alert|otp|verify|auth/i.test(
      addr
    );
  const isTransactionBody =
    /(?:otp|verification code|one time password|debited|credited|transferred|acct\s*#?|account\s*#?|balance|stmt|txn|withdrawn|deposited|charged|spent|atm|pos|card\s*ending|payment of)\b/i.test(
      body
    );

  if (isAlphaNumericSender || isBankOrFinancial || isTransactionBody) {
    return 'transactions';
  }

  // Promotional keywords & marketing offers
  const isPromoBody =
    /(?:off\b|discount|deal|promo|coupon|voucher|sale\b|save\s*\$|save\s*\d+%|limited time|free shipping|buy\s*1\s*get|cashback|cash\s*back|offer\s*expires|hurry|shop now|click here to claim|exclusive deal)\b/i.test(
      body
    );
  if (isPromoBody) {
    return 'promotions';
  }

  return 'personal';
}

