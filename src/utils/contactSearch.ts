import { Contact } from '../types.ts';
import { isPhoneNumber, normalizeText, phoneDigits, phoneKey } from './phone.ts';

/** Removes repeated entries (same person and number saved twice) and sorts by name. */
export function dedupeContacts(contacts: Contact[]): Contact[] {
  const seen = new Set<string>();
  const out: Contact[] = [];
  for (const c of contacts) {
    const key = `${phoneKey(c.phoneNumber)}|${normalizeText(c.name)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out.sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name)));
}

/**
 * Finds contacts by name (any word, start of word first) or by number (any way it is written).
 * Every word you type has to match, so "ram kri" finds "Ramesh Krishna".
 */
export function searchContacts(contacts: Contact[], rawQuery: string): Contact[] {
  const query = rawQuery.trim();
  const all = dedupeContacts(contacts);
  if (!query) return all;

  const typedNumber = isPhoneNumber(query) || /^[\d\s+\-().]{3,}$/.test(query);
  const queryDigits = phoneDigits(query);
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);

  const scored: { contact: Contact; score: number }[] = [];
  for (const contact of all) {
    const name = normalizeText(contact.name);
    const digits = phoneDigits(contact.phoneNumber);
    let score = 0;

    if (typedNumber && queryDigits.length >= 3) {
      if (queryDigits.length >= 10 && phoneKey(contact.phoneNumber) === phoneKey(query)) score = 5; // same number, any format
      else if (digits.endsWith(queryDigits) || phoneKey(contact.phoneNumber).endsWith(queryDigits)) score = 4;
      else if (digits.includes(queryDigits)) score = 2;
    } else {
      const words = name.split(/\s+/);
      let total = 0;
      let allMatch = true;
      for (const token of tokens) {
        if (words.some((w) => w.startsWith(token))) total += 3;
        else if (name.includes(token)) total += 1;
        else if (/^\d+$/.test(token) && digits.includes(token)) total += 1;
        else {
          allMatch = false;
          break;
        }
      }
      if (allMatch) score = total;
    }
    if (score > 0) scored.push({ contact, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || normalizeText(a.contact.name).localeCompare(normalizeText(b.contact.name)))
    .map((s) => s.contact);
}
