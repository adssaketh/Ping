import { tokenize } from './tokenize.js';

/**
 * Turns the raw JSON model into one with its regular expressions compiled.
 * @param {any} raw
 */
export function compileModel(raw) {
  const compile = (list) =>
    (list || []).map((r) => ({ re: new RegExp(r.re, 'i'), w: Number(r.w) || 0, strong: !!r.strong }));
  return {
    version: raw.version,
    bias: Number(raw.bias) || 0,
    weights: raw.weights || {},
    rules: compile(raw.rules),
    safe: (raw.safe || []).map((s) => new RegExp(s, 'i')),
  };
}

/**
 * Scores one message. `p` is the spam probability from the language model plus scam rules;
 * `safe` means it looks like an OTP, bank alert or delivery update and must never be filtered.
 * @param {ReturnType<typeof compileModel>} model
 * @param {string} text
 * @param {Record<string, number>} [learned] small per-word adjustments learned from the user's own taps
 * @returns {{ p: number, logOdds: number, safe: boolean, strong: boolean }}
 */
export function scoreMessage(model, text, learned) {
  const body = String(text || '');
  let logOdds = model.bias;
  for (const tok of tokenize(body)) {
    const w = model.weights[tok];
    if (w !== undefined) logOdds += w;
    const l = learned ? learned[tok] : undefined;
    if (typeof l === 'number') logOdds += l;
  }
  let strong = false;
  for (const rule of model.rules) {
    if (rule.re.test(body)) {
      logOdds += rule.w;
      if (rule.strong) strong = true;
    }
  }
  const safe = !strong && model.safe.some((re) => re.test(body));
  const clamped = Math.max(-30, Math.min(30, logOdds));
  return { p: 1 / (1 + Math.exp(-clamped)), logOdds, safe, strong };
}

/** Same thresholds the Settings screen offers. */
export const SPAM_THRESHOLDS = { relaxed: 0.95, balanced: 0.85, strict: 0.65 };

/** Senders registered with Indian telecom regulation look like "AX-EPFOHO-S" or "JD-AXISBK-S". */
const REGISTERED_SENDER_RE = /^[a-z]{2}-[a-z0-9]{3,10}(?:-[a-z])?$/i;

/**
 * Final yes/no. Rules:
 *  - OTP / bank / delivery style messages are never spam.
 *  - Messages from registered sender IDs are ordinary marketing (they belong in Promotions) and are
 *    only treated as spam when they also trip a strong scam pattern (KYC threat, lottery, ...).
 *  - Everything else (phone numbers, unknown senders) is spam when its score reaches the threshold.
 * @param {{ p: number, safe: boolean, strong: boolean }} result
 * @param {string} sender
 * @param {number} threshold
 */
export function isSpamResult(result, sender, threshold) {
  if (result.safe) return false;
  if (REGISTERED_SENDER_RE.test(String(sender || '').trim()) && !result.strong) return false;
  return result.p >= threshold;
}

// ---- Learning from the user's "Not spam" / "Report spam" taps (stays on the phone) ----
const LEARN_RATE = 2.0; // how strongly one tap moves the words of that message
const LEARN_MIN_ERROR = 0.25; // even a message the model already got right is reinforced a little
const LEARN_MAX = 2.0; // no single word can be pushed further than this
const LEARN_CAP = 2000; // most words remembered
const NEUTRAL_WEIGHT = 0.15; // common words (the, your, is ...) carry no signal and are never learned

/**
 * Returns an updated copy of `learned` after the user said this message is (or is not) spam.
 * Only distinctive words are adjusted, so everyday words never turn into spam signals.
 * @param {ReturnType<typeof compileModel>} model
 * @param {Record<string, number>} learned
 * @param {string} text
 * @param {boolean} isSpam
 * @returns {Record<string, number>}
 */
export function learnStep(model, learned, text, isSpam) {
  const current = learned || {};
  const tokens = tokenize(text).filter((tok) => {
    if (tok.startsWith('__')) return false; // link / number markers
    const base = model.weights[tok];
    return base === undefined || Math.abs(base) >= NEUTRAL_WEIGHT;
  });
  if (tokens.length === 0) return current;

  const p = scoreMessage(model, text, current).p;
  const error = (isSpam ? 1 : 0) - p;
  const magnitude = Math.max(Math.abs(error), LEARN_MIN_ERROR);
  const step = ((isSpam ? 1 : -1) * LEARN_RATE * magnitude) / Math.sqrt(tokens.length);

  const next = { ...current };
  for (const tok of tokens) {
    const w = Math.max(-LEARN_MAX, Math.min(LEARN_MAX, (next[tok] || 0) + step));
    next[tok] = Math.round(w * 1000) / 1000;
  }

  const keys = Object.keys(next);
  if (keys.length > LEARN_CAP) {
    keys.sort((a, b) => Math.abs(next[b]) - Math.abs(next[a]));
    const kept = {};
    for (const k of keys.slice(0, LEARN_CAP)) kept[k] = next[k];
    return kept;
  }
  return next;
}
