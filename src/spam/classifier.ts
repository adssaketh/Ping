import { compileModel, scoreMessage, isSpamResult, learnStep, SPAM_THRESHOLDS } from './score.js';

export type SpamSensitivity = 'relaxed' | 'balanced' | 'strict';

type CompiledModel = ReturnType<typeof compileModel>;
export interface SpamScore {
  p: number;
  safe: boolean;
  strong: boolean;
}

let model: CompiledModel | null = null;
let loading: Promise<CompiledModel | null> | null = null;

/**
 * Loads the spam model that ships inside the app (public/spam-model.json, trained from the Indian
 * Telecom SMS Spam Collection). Everything runs on the phone: nothing is sent anywhere.
 */
export function loadSpamModel(): Promise<CompiledModel | null> {
  if (model) return Promise.resolve(model);
  if (!loading) {
    loading = fetch('/spam-model.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((raw) => {
        model = compileModel(raw);
        return model;
      })
      .catch((err) => {
        console.warn('Spam model unavailable:', err);
        loading = null;
        return null;
      });
  }
  return loading;
}

export type LearnedWeights = Record<string, number>;

/** Raw score for one message, or null while the model is still loading. */
export function scoreSms(text: string, learned?: LearnedWeights): SpamScore | null {
  if (!model) return null;
  const r = scoreMessage(model, text, learned);
  return { p: r.p, safe: r.safe, strong: r.strong };
}

export function isSpamScore(score: SpamScore, sender: string, sensitivity: SpamSensitivity): boolean {
  return isSpamResult(score, sender, SPAM_THRESHOLDS[sensitivity]);
}

export { SPAM_THRESHOLDS };

/**
 * Stable key for a sender: for phone numbers the last 10 digits (so +91 94942 02618 and 9494202618 are the
 * same sender), otherwise the lower-cased sender ID.
 */
export function senderKey(phoneNumberOrSender: string): string {
  const raw = (phoneNumberOrSender || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits.length >= 7 ? digits : raw.toLowerCase();
}

/** Learns from the user's tap on one message (Not spam / Report spam). Everything stays on the phone. */
export function learnSms(text: string, spam: boolean, learned: LearnedWeights): LearnedWeights {
  if (!model) return learned;
  return learnStep(model, learned, text, spam);
}
