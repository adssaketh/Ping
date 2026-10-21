import { registerPlugin, Capacitor } from '@capacitor/core';
import type { SystemPalettes } from '../theme/dynamicColor.ts';

export interface NativeSmsMessage {
  id: string;
  threadId: string;
  address: string;
  body: string;
  date: number;
  isRead: boolean;
  isSent: boolean;
}

export interface BackupSms {
  address: string;
  body: string;
  date: number;
  isSent: boolean;
  isRead?: boolean;
}

export interface NativeContact {
  id: string;
  name: string;
  phoneNumber: string;
  photoUri?: string;
}

export interface PermissionsStatus {
  readSms: boolean;
  sendSms: boolean;
  receiveSms: boolean;
  contacts: boolean;
  notifications?: boolean;
  allSmsGranted: boolean;
}

export interface DefaultSmsStatus {
  isDefault: boolean;
  packageName?: string;
  currentDefault?: string;
}

interface PingSmsPluginInterface {
  isDefaultSmsApp(): Promise<DefaultSmsStatus>;
  requestDefaultSmsApp(): Promise<{ granted: boolean; isDefault: boolean }>;
  checkPermissionsStatus(): Promise<PermissionsStatus>;
  requestAllPermissions(): Promise<PermissionsStatus>;
  readContacts(): Promise<{ contacts: NativeContact[]; count: number }>;
  readSms(options?: { limit?: number }): Promise<{ messages: NativeSmsMessage[]; count: number }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  markThreadRead(options: { address: string }): Promise<{ updated: number }>;
  setSystemBarsTheme(options: { dark: boolean; color?: string }): Promise<void>;
  getSystemColors(): Promise<SystemPalettes>;
  setBackEnabled(options: { enabled: boolean }): Promise<void>;
  exitApp(): Promise<void>;
  saveBackupFile(options: { fileName: string; content: string }): Promise<{ saved: boolean }>;
  pickBackupFile(): Promise<{ content?: string; cancelled?: boolean }>;
  restoreSms(options: { messages: BackupSms[] }): Promise<{ inserted: number; skipped: number }>;
  setSpamConfig(options: { enabled: boolean; threshold: number; allow: string[]; block: string[]; learned: Record<string, number> }): Promise<void>;
  sendSms(options: {
    to: string;
    message: string;
    messageId?: string;
    subscriptionId?: number;
  }): Promise<{ success: boolean; to: string; message: string; timestamp: number; subscriptionId?: number }>;
  deleteSms(options: { id: string }): Promise<{ deleted: boolean }>;
  addListener(
    eventName: 'incomingSms',
    listenerFunc: (data: { sender: string; body: string; timestamp: number; subscriptionId?: number }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'smsStatus',
    listenerFunc: (data: { messageId: string; status: 'sent' | 'delivered' | 'failed'; resultCode: number }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'backPressed',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'appResumed',
    listenerFunc: (data: { isDefault: boolean }) => void
  ): Promise<{ remove: () => void }>;
}

const PingSms = registerPlugin<PingSmsPluginInterface>('PingSms');

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const smsBridge = {
  isNative: isNativeAndroid,

  async isDefaultSmsApp(): Promise<DefaultSmsStatus> {
    if (!isNativeAndroid()) {
      return { isDefault: false, currentDefault: 'web-browser' };
    }
    try {
      return await PingSms.isDefaultSmsApp();
    } catch (err) {
      console.warn('isDefaultSmsApp failed:', err);
      return { isDefault: false };
    }
  },

  async requestDefaultSmsApp(): Promise<{ granted: boolean; isDefault: boolean }> {
    if (!isNativeAndroid()) {
      return { granted: false, isDefault: false };
    }
    try {
      return await PingSms.requestDefaultSmsApp();
    } catch (err) {
      console.warn('requestDefaultSmsApp failed:', err);
      return { granted: false, isDefault: false };
    }
  },

  async checkPermissions(): Promise<PermissionsStatus> {
    if (!isNativeAndroid()) {
      return {
        readSms: true,
        sendSms: true,
        receiveSms: true,
        contacts: 'contacts' in navigator && 'ContactsManager' in window,
        allSmsGranted: true,
      };
    }
    try {
      return await PingSms.checkPermissionsStatus();
    } catch (err) {
      console.warn('checkPermissionsStatus failed:', err);
      return {
        readSms: false,
        sendSms: false,
        receiveSms: false,
        contacts: false,
        allSmsGranted: false,
      };
    }
  },

  async requestPermissions(): Promise<PermissionsStatus> {
    if (!isNativeAndroid()) {
      return this.checkPermissions();
    }
    try {
      return await PingSms.requestAllPermissions();
    } catch (err) {
      console.warn('requestPermissions failed:', err);
      return this.checkPermissions();
    }
  },

  async readDeviceContacts(): Promise<NativeContact[]> {
    if (!isNativeAndroid()) {
      return [];
    }
    try {
      const res = await PingSms.readContacts();
      return res.contacts || [];
    } catch (err) {
      console.warn('readDeviceContacts failed:', err);
      throw err;
    }
  },

  async readDeviceSms(limit = 500): Promise<NativeSmsMessage[]> {
    if (!isNativeAndroid()) {
      return [];
    }
    try {
      const res = await PingSms.readSms({ limit });
      return res.messages || [];
    } catch (err) {
      console.warn('readDeviceSms failed:', err);
      throw err;
    }
  },

  async requestNotificationPermission(): Promise<boolean> {
    if (!isNativeAndroid()) return false;
    try {
      const res = await PingSms.requestNotificationPermission();
      return res.granted;
    } catch (err) {
      console.warn('requestNotificationPermission failed:', err);
      return false;
    }
  },

  async setSystemBarsTheme(dark: boolean, color?: string): Promise<void> {
    if (!isNativeAndroid()) return;
    try {
      await PingSms.setSystemBarsTheme({ dark, color });
    } catch (err) {
      console.warn('setSystemBarsTheme failed:', err);
    }
  },

  /** Opens Android's "save as" picker and writes the backup text to the chosen file. */
  async saveBackupFile(fileName: string, content: string): Promise<{ saved: boolean }> {
    return PingSms.saveBackupFile({ fileName, content });
  },

  /** Opens Android's file picker and returns the text of the chosen backup file. */
  async pickBackupFile(): Promise<{ content?: string; cancelled?: boolean }> {
    return PingSms.pickBackupFile();
  },

  /** Writes backed-up messages into the phone's SMS store (Ping must be the default SMS app). */
  async restoreDeviceSms(messages: BackupSms[]): Promise<{ inserted: number; skipped: number }> {
    return PingSms.restoreSms({ messages });
  },

  /** Tells Android whether the back button has something to close inside the app. */
  async setBackEnabled(enabled: boolean): Promise<void> {
    if (!isNativeAndroid()) return;
    try {
      await PingSms.setBackEnabled({ enabled });
    } catch (err) {
      console.warn('setBackEnabled failed:', err);
    }
  },

  /** Sends the app to the background. */
  async minimizeApp(): Promise<void> {
    if (!isNativeAndroid()) return;
    try {
      await PingSms.exitApp();
    } catch (err) {
      console.warn('exitApp failed:', err);
    }
  },

  async listenToBack(callback: () => void): Promise<() => void> {
    if (!isNativeAndroid()) return () => {};
    try {
      const handle = await PingSms.addListener('backPressed', callback);
      return () => {
        handle.remove();
      };
    } catch (err) {
      console.warn('listenToBack failed:', err);
      return () => {};
    }
  },

  /** Fires whenever the user comes back to Ping (for example after setting the default SMS app). */
  async listenToAppResume(callback: (data: { isDefault: boolean }) => void): Promise<() => void> {
    if (!isNativeAndroid()) return () => {};
    try {
      const handle = await PingSms.addListener('appResumed', callback);
      return () => {
        handle.remove();
      };
    } catch (err) {
      console.warn('listenToAppResume failed:', err);
      return () => {};
    }
  },

  /** Tells the Android side how to treat spam, so spam notifications can be kept quiet. */
  async setSpamConfig(config: {
    enabled: boolean;
    threshold: number;
    allow: string[];
    block: string[];
    learned: Record<string, number>;
  }): Promise<void> {
    if (!isNativeAndroid()) return;
    try {
      await PingSms.setSpamConfig(config);
    } catch (err) {
      console.warn('setSpamConfig failed:', err);
    }
  },

  /** Wallpaper-derived Material You palettes (Android 12+), or null when unavailable. */
  async getSystemColors(): Promise<SystemPalettes | null> {
    if (!isNativeAndroid()) return null;
    try {
      const res = await PingSms.getSystemColors();
      return res && res.supported ? res : null;
    } catch (err) {
      console.warn('getSystemColors failed:', err);
      return null;
    }
  },

  async markThreadRead(address: string): Promise<void> {
    if (!isNativeAndroid() || !address) return;
    try {
      await PingSms.markThreadRead({ address });
    } catch (err) {
      console.warn('markThreadRead failed:', err);
    }
  },

  async sendSms(
    to: string,
    message: string,
    options?: { messageId?: string; subscriptionId?: number }
  ): Promise<{ success: boolean; timestamp?: number }> {
    if (!isNativeAndroid()) {
      // In web browser, simulate successful dispatch
      return { success: true, timestamp: Date.now() };
    }
    try {
      const res = await PingSms.sendSms({
        to,
        message,
        messageId: options?.messageId,
        subscriptionId: options?.subscriptionId,
      });
      return { success: res.success, timestamp: res.timestamp };
    } catch (err) {
      console.warn('sendSms failed:', err);
      throw err;
    }
  },

  async deleteSms(id: string): Promise<boolean> {
    if (!isNativeAndroid()) {
      return true;
    }
    try {
      const res = await PingSms.deleteSms({ id });
      return res.deleted;
    } catch (err) {
      console.warn('deleteSms failed:', err);
      return false;
    }
  },

  async listenToIncomingSms(
    callback: (data: { sender: string; body: string; timestamp: number; subscriptionId?: number }) => void
  ): Promise<() => void> {
    if (!isNativeAndroid()) {
      return () => {};
    }
    try {
      const handle = await PingSms.addListener('incomingSms', callback);
      return () => {
        handle.remove();
      };
    } catch (err) {
      console.warn('listenToIncomingSms failed:', err);
      return () => {};
    }
  },

  async listenToSmsStatus(
    callback: (data: { messageId: string; status: 'sent' | 'delivered' | 'failed' }) => void
  ): Promise<() => void> {
    if (!isNativeAndroid()) {
      return () => {};
    }
    try {
      const handle = await PingSms.addListener('smsStatus', callback);
      return () => {
        handle.remove();
      };
    } catch (err) {
      console.warn('listenToSmsStatus failed:', err);
      return () => {};
    }
  },

  /**
   * Support Chrome/Android Web Contact Picker API when running in browser / PWA
   */
  async pickWebContact(): Promise<{ name: string; phoneNumber: string } | null> {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const name = contact.name && contact.name.length > 0 ? contact.name[0] : '';
          const tel = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';
          if (tel || name) {
            return {
              name: name || tel,
              phoneNumber: tel || name,
            };
          }
        }
      } catch (err) {
        console.info('Contact picker was cancelled or failed:', err);
      }
    }
    return null;
  },
};
