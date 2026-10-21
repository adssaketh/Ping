// Shared by the app (src/spam/classifier.ts), the training script (scripts/train-spam-model.mjs)
// and mirrored line-for-line in SpamFilter.java. Keep all three in step.

const URL_RE =
  /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]{2,}\.(?:com|in|co|ly|link|xyz|top|info|me|net|org|app|cc|tk|page|site|online)\b(?:\/\S*)?/g;
const MONEY_RE = /(?:rs\.?|inr|\u20B9)\s*\d[\d,]*(?:\.\d+)?/g;
const PHONE_RE = /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;
const WORD_RE = /[\p{L}\p{M}_]{2,}/gu;

/**
 * Turns an SMS into a set of unique tokens. Links, amounts, phone numbers and other numbers are
 * replaced by marker tokens so the model learns "has a link" rather than memorising one link.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  const t = String(text || '')
    .toLowerCase()
    .replace(URL_RE, ' __url__ ')
    .replace(MONEY_RE, ' __money__ ')
    .replace(PHONE_RE, ' __phone__ ')
    .replace(/\d+/g, ' __num__ ');
  const found = t.match(WORD_RE) || [];
  return Array.from(new Set(found));
}
