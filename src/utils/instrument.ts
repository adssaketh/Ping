import { businessKey } from './phone.ts';

/**
 * Works out which bank account, credit card, debit card or wallet a transaction SMS is about, so the
 * same money source always gets the same key (e.g. "icici:account:2090" or "axis:credit_card:1896").
 * The same rules are meant to be ported 1:1 to Paddhu Pusthakam so both apps agree on the keys.
 */
export type InstrumentKind = 'account' | 'credit_card' | 'debit_card' | 'card' | 'wallet' | 'unknown';

export interface InstrumentRef {
  issuer: string; // normalised, lower case: "icici", "axis", "sbi", "zepto"...
  kind: InstrumentKind;
  /** Last digits shown in the SMS (3 or 4), or '' when the SMS does not say. */
  last: string;
}

// Sender-ID business (after the "AX-" prefix) -> issuer. Anything not listed falls back to the lower-cased ID.
const ISSUER_BY_SENDER: Array<[RegExp, string]> = [
  [/^(SBIUPI|SBIINB|SBIPSG|SBMSG|SBIBNK)$/, 'sbi'],
  [/^(SBICRD|SBICARD)$/, 'sbi_card'],
  [/^ICICI/, 'icici'],
  [/^AXIS/, 'axis'],
  [/^(FEDBNK|FEDERL|FEDRAL)$/, 'federal'],
  [/^HDFC/, 'hdfc'],
  [/^AUBANK$/, 'au'],
  [/^YESBNK$/, 'yes'],
  [/^(JIOPAY|JIOINF|JIOFIN)$/, 'jiopay'],
  [/^ZEPTON$/, 'zepto'],
  [/^(PAYTM|PYTM)/, 'paytm'],
  [/^(PHONEPE|PHONPE)$/, 'phonepe'],
];

const ISSUER_BY_BODY: Array<[RegExp, string]> = [
  [/\bICICI\b/i, 'icici'],
  [/\bAxis\b/i, 'axis'],
  [/\bFederal Bank\b/i, 'federal'],
  [/\bHDFC\b/i, 'hdfc'],
  [/\bAU Small|AU Bank\b/i, 'au'],
  [/\bYes Bank\b/i, 'yes'],
  [/-\s?SBI\b|\bSBI\b/, 'sbi'],
];

const WALLET_RE =
  /(zepto cash|amazon pay(?: balance)?|paytm wallet|phonepe wallet|mobikwik|freecharge|jio ?pay wallet|airtel money|mi pay|simpl|lazypay|slice)/i;

/** Digits after "A/c", "Acct", "ending", "XX", "card" ... as printed in the SMS. */
const ACCOUNT_RE = /(?:a\/?c(?:count)?|acct)\.?\s*(?:no\.?)?\s*(?:ending|ending with)?\s*[:\-]?\s*(?:[Xx*]+|\.{2,})?\s*(\d{3,})/i;
const CARD_RE = /(?:card|\bcc\b)\s*(?:no\.?)?\s*(?:ending(?: with)?|xx+|x+|\*+)?\s*[:\-]?\s*(?:[Xx*]+)?\s*(\d{4})\b/i;
const MASK_RE = /[Xx*]{2,}(\d{3,4})\b/;

/** "AX-AXISBK-S" -> "AXISBK"; also "JAJIOPAY" (prefix without a dash) -> "JIOPAY" when the rest is a known sender. */
function senderName(sender: string): string {
  const raw = (sender || '').trim().toUpperCase();
  const dashed = (businessKey(raw) || raw).toUpperCase();
  if (dashed !== raw || /-/.test(raw)) return dashed;
  const known = (n: string) => ISSUER_BY_SENDER.some(([re]) => re.test(n));
  if (!known(raw) && raw.length > 5 && known(raw.slice(2))) return raw.slice(2);
  return raw;
}

function issuerOf(sender: string, body: string): string {
  const biz = senderName(sender);
  for (const [re, name] of ISSUER_BY_SENDER) if (re.test(biz)) return name;
  for (const [re, name] of ISSUER_BY_BODY) if (re.test(body)) return name;
  return biz.toLowerCase();
}

const tail = (digits: string) => (digits.length > 4 ? digits.slice(-4) : digits);

export function parseInstrument(sender: string, body: string): InstrumentRef {
  const issuer = issuerOf(sender, body);
  const text = body || '';

  const isCredit = /credit\s*card|\bcc\b\s*(?:no|ending|xx|x+|\*+|\d)|sbi card/i.test(text) || issuer === 'sbi_card';
  const isDebit = /debit\s*card/i.test(text);
  const wallet = WALLET_RE.exec(text);

  const acct = ACCOUNT_RE.exec(text);
  const cardWord = /\bcard\b|credit\s*card|debit\s*card/i.exec(text);
  // "Axis Bank A/c XX6372 ... CreditCard Payment": the money left the account, so whichever comes first wins
  const accountFirst = !!acct && (!cardWord || acct.index < cardWord.index);
  if (!accountFirst && (isCredit || isDebit || cardWord)) {
    const m = CARD_RE.exec(text) || (isCredit || isDebit ? MASK_RE.exec(text) : null);
    if (m) return { issuer, kind: isCredit ? 'credit_card' : isDebit ? 'debit_card' : 'card', last: tail(m[1]) };
  }
  if (wallet && !ACCOUNT_RE.test(text)) {
    return { issuer: wallet[1].toLowerCase().replace(/\s+/g, '_'), kind: 'wallet', last: '' };
  }
  const a = acct || MASK_RE.exec(text);
  if (a) return { issuer, kind: 'account', last: tail(a[1]) };
  if (isCredit) return { issuer, kind: 'credit_card', last: '' };
  return { issuer, kind: 'unknown', last: '' };
}

export const instrumentKey = (r: InstrumentRef) => `${r.issuer}:${r.kind}:${r.last}`;

/**
 * Looks at every parsed SMS together and tidies the result:
 *  - "XX090" and "XX2090" are the same account (3 vs 4 printed digits);
 *  - "Card 1000" and "Credit Card 1000" from the same bank are the same credit card;
 *  - an SMS with no digits (e.g. a UPI debit) goes to that bank's only account, if there is exactly one.
 * Returns a function that gives the final key for each parsed SMS.
 */
const BANKS = new Set(['sbi', 'icici', 'axis', 'federal', 'au', 'yes', 'hdfc', 'idfc', 'idfcfb']);

export function buildInstrumentResolver(refs: InstrumentRef[]) {
  const withDigits = refs.filter((r) => r.last);
  const canon = (r: InstrumentRef): InstrumentRef => {
    if (!r.last) return r;
    let out = r;
    if (r.kind === 'card') {
      const cc = withDigits.find((x) => x.issuer === r.issuer && x.kind === 'credit_card' && x.last.endsWith(r.last.slice(-3)));
      if (cc) out = { ...out, kind: 'credit_card', last: cc.last.length >= out.last.length ? cc.last : out.last };
    }
    // third-party senders (EPFO, a shop refund...) that name one of your accounts by its last digits belong to that bank
    if (out.kind === 'account' && !BANKS.has(out.issuer)) {
      const owner = [...new Set(withDigits.filter((x) => x.kind === 'account' && BANKS.has(x.issuer) && x.last === out.last).map((x) => x.issuer))];
      if (owner.length === 1) out = { ...out, issuer: owner[0] };
    }
    const longer = withDigits.find(
      (x) => x.issuer === out.issuer && x.kind === out.kind && x.last.length > out.last.length && x.last.endsWith(out.last)
    );
    return longer ? { ...out, last: longer.last } : out;
  };
  const known = new Map<string, InstrumentRef>();
  for (const r of withDigits) {
    const c = canon(r);
    known.set(`${c.issuer}:${c.kind}:${c.last}`, c);
  }
  const accountsOf = (issuer: string) => [...known.values()].filter((x) => x.issuer === issuer && x.kind === 'account');
  return (r: InstrumentRef): string => {
    if (r.last) return instrumentKey(canon(r));
    if (r.kind === 'unknown') {
      const only = accountsOf(r.issuer);
      if (only.length === 1) return instrumentKey(only[0]);
    }
    return instrumentKey(r);
  };
}

const ISSUER_LABEL: Record<string, string> = {
  sbi: 'SBI', sbi_card: 'SBI Card', icici: 'ICICI', axis: 'Axis', federal: 'Federal', hdfc: 'HDFC', au: 'AU',
  yes: 'Yes Bank', idfc: 'IDFC First', idfcfb: 'IDFC First', jiopay: 'Jio Pay', zepto: 'Zepto', zepto_cash: 'Zepto Cash',
  phonepe: 'PhonePe', phonepe_wallet: 'PhonePe wallet', mi_pay: 'Mi Pay', amazon_pay_balance: 'Amazon Pay', paytm: 'Paytm',
};

/** Short name shown on a message: "SBI ••6919", "ICICI card ••1000", "Zepto Cash". null when the SMS does not say. */
export function instrumentLabel(key: string): string | null {
  const [issuer, kind, last] = key.split(':');
  const name = ISSUER_LABEL[issuer] ?? issuer.toUpperCase();
  if (kind === 'wallet') return name;
  if (!last) return null;
  const tag = kind === 'credit_card' || kind === 'card' ? ' card' : kind === 'debit_card' ? ' debit' : '';
  return `${name}${tag} \u2022\u2022${last}`;
}

/** Accounts that no longer exist (the two Federal Bank accounts). Their old messages stay, marked "closed". */
export function isClosedInstrument(key: string): boolean {
  return key.startsWith('federal:account:') || key === 'federal:unknown:';
}

const TXN_RE = /debited|credited|spent|paid|payment|received|withdrawn|refund|transfer|balance/i;
const OTP_RE = /\botp\b|one.?time password|verification code/i;

/** Message id -> instrument key for every transaction-looking message in the list. */
export function indexInstruments(msgs: Array<{ id: string; text: string }>, senderOf: (id: string) => string): Map<string, string> {
  const parsed: Array<{ id: string; ref: InstrumentRef }> = [];
  for (const m of msgs) {
    if (OTP_RE.test(m.text) || !TXN_RE.test(m.text)) continue;
    parsed.push({ id: m.id, ref: parseInstrument(senderOf(m.id), m.text) });
  }
  const resolve = buildInstrumentResolver(parsed.map((x) => x.ref));
  const out = new Map<string, string>();
  for (const x of parsed) out.set(x.id, resolve(x.ref));
  return out;
}

/**
 * Your own names for the accounts, cards and wallets detected above. Keys are instrumentKey() values.
 * The same list lives in Paddhu Pusthakam (lib/struct/knownAccounts.dart): change both together.
 */
export interface KnownAccount {
  name: string;
  closed: boolean;
}

const KNOWN_ACCOUNTS: Record<string, KnownAccount> = {
  'sbi:account:6919': { name: 'Mansa - SBI Savings Account', closed: false },
  'axis:account:6372': { name: 'Saketh - Axis Savings Account', closed: false },
  'icici:account:2090': { name: 'Saketh - ICICI Savings Account', closed: true },
  'au:account:1858': { name: 'Saketh - AU Small Finance Bank Savings Account', closed: true },
  'au:account:7280': { name: 'FD Account', closed: true },
  'adipbmsg:account:7716': { name: 'Mansa - Post Office Digital Account (PLI)', closed: false },
  'addopbnk:account:7718': { name: 'Mansa - Post Office Savings Account (APY)', closed: false },
  'btdopbnk:account:7718': { name: 'Mansa - Post Office Savings Account (APY)', closed: false },
  'axdopbnk:account:7718': { name: 'Mansa - Post Office Savings Account (APY)', closed: false },
  'dopbnk:account:7718': { name: 'Mansa - Post Office Savings Account (APY)', closed: false },
  'federal:account:3269': { name: 'Federal Bank Account', closed: true },
  'federal:account:4365': { name: 'Federal Bank Account', closed: true },
  'federal:account:6299': { name: 'Federal Bank Account', closed: true },
  'federal:unknown:': { name: 'Federal Bank Account', closed: true },
  'icici:credit_card:1000': { name: 'ICICI Amazon Pay Credit Card', closed: false },
  'icici:credit_card:8006': { name: 'ICICI Coral Rupay Credit Card', closed: true },
  'federal:credit_card:9368': { name: 'Federal Signet Rupay Card', closed: true },
  'federal:credit_card:': { name: 'Federal Signet Rupay Card', closed: true },
  'yes:credit_card:3689': { name: 'Kiwi Yes Bank Credit Card', closed: false },
  'yes:credit_card:': { name: 'Kiwi Yes Bank Credit Card', closed: false },
  'hdfc:credit_card:1170': { name: 'HDFC Swiggy Credit Card', closed: true },
  'hdfc:credit_card:0886': { name: 'HDFC Indian Oil Credit Card', closed: false },
  'axis:credit_card:1896': { name: 'Axis Indian Oil Credit Card', closed: true },
  'axis:credit_card:2099': { name: 'Axis Myzone Credit Card', closed: true },
  'idfcfb:credit_card:0932': { name: 'IDFC First Bank Millennia Credit Card', closed: true },
  'sbi_card:credit_card:3367': { name: 'SBI Credit Card', closed: true },
  'sbi_card:credit_card:6511': { name: 'SBI Credit Card', closed: true },
  'sbi_card:credit_card:3054': { name: 'SBI Credit Card', closed: true },
  'sbi_card:credit_card:3764': { name: 'SBI IRCTC Platinum Credit Card', closed: false },
  'sbi:debit_card:3811': { name: 'Mansa - SBI Debit Card', closed: true },
  'sbi:debit_card:2617': { name: 'Mansa - SBI Debit Card', closed: false },
};

export function knownAccount(key: string): KnownAccount | null {
  return KNOWN_ACCOUNTS[key] ?? null;
}
