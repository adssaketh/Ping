/** Digits only. */
export function phoneDigits(number: string): string {
  return (number || '').replace(/\D/g, '');
}

/**
 * A key that is the same for every way a number can be written: "9494202618", "+91 94942 02618",
 * "919494202618" and "09494202618" all become "9494202618" (the last 10 digits). Shorter numbers keep
 * all their digits so short codes are compared exactly.
 */
export function phoneKey(number: string): string {
  const digits = phoneDigits(number);
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/** True for things that are phone numbers, as opposed to sender IDs like "AX-HDFCBK-S". */
export function isPhoneNumber(value: string): boolean {
  return /^\+?[\d\s\-()]{7,}$/.test((value || '').trim());
}

/** Lower-case, without accents, for forgiving name matching. */
export function normalizeText(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * The business a sender ID belongs to, so every ID of the same business shares one picture:
 * "AX-AXISBK-S", "VM-AXISBK-S" and "JD-AXISBK-T" are all "AXISBK". Phone numbers have no business key.
 */
export function businessKey(sender: string): string | null {
  const raw = (sender || '').trim();
  if (!raw || isPhoneNumber(raw)) return null;
  const match = /^[a-z0-9]{2}-([a-z0-9]{2,12})(?:-[a-z])?$/i.exec(raw);
  return (match ? match[1] : raw).toUpperCase();
}
