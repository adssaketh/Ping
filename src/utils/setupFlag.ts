/**
 * Remembers (on this phone only) whether the first-launch setup has been shown, and whether the user said they
 * allowed "restricted settings". Both are plain localStorage flags; nothing leaves the device.
 */
const DONE_KEY = 'ping_setup_done_v1';
const RESTRICTED_KEY = 'ping_restricted_ack_v1';

export const isSetupDone = (): boolean => {
  try {
    return localStorage.getItem(DONE_KEY) === '1';
  } catch {
    // storage unavailable: do not trap the user in a setup that can never be remembered as finished
    return true;
  }
};

export const markSetupDone = (): void => {
  try {
    localStorage.setItem(DONE_KEY, '1');
  } catch {}
};

export const getRestrictedAck = (): boolean => {
  try {
    return localStorage.getItem(RESTRICTED_KEY) === '1';
  } catch {
    return false;
  }
};

export const setRestrictedAck = (value: boolean): void => {
  try {
    if (value) localStorage.setItem(RESTRICTED_KEY, '1');
    else localStorage.removeItem(RESTRICTED_KEY);
  } catch {}
};
