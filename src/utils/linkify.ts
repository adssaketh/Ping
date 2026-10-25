/**
 * Finds web links inside message text, so they can be tapped.
 * Recognised: https:// and http:// links, links starting with www., and bare domains with a common ending
 * (hdfcbk.io/xyz, bit.ly/abc, axis.bank.in/...). Email addresses, amounts like "Rs.500.00" and abbreviations
 * like "a.m." are not links. Only web links are ever returned; nothing else (javascript:, tel:, file: ...) can match.
 */
export interface TextPart {
  text: string;
  /** Full address to open (always http or https); present only for links */
  href?: string;
}

const ENDINGS =
  'com|in|net|org|io|me|ly|bank|app|link|to|gl|page|info|biz|xyz|online|site|co|gov|edu|ai|dev|store|shop|click|top|live';

const LINK_RE = new RegExp(
  // not glued to a word, an email address or a path
  '(?<![\\w@./-])' +
    '(?:' +
    'https?:\\/\\/[^\\s<>"\']+' +
    '|www\\.[^\\s<>"\']+' +
    '|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+(?:' +
    ENDINGS +
    ')(?![a-z0-9-])(?::\\d{1,5})?(?:[/?#][^\\s<>"\']*)?' +
    ')',
  'gi'
);

/** Punctuation that belongs to the sentence, not to the link */
function trimTrail(raw: string): string {
  let s = raw;
  for (;;) {
    const last = s[s.length - 1];
    if (last && '.,;:!?\'"]}>*'.includes(last)) {
      s = s.slice(0, -1);
    } else if (last === ')' && (s.match(/\)/g) ?? []).length > (s.match(/\(/g) ?? []).length) {
      s = s.slice(0, -1);
    } else {
      return s;
    }
  }
}

export function toHref(link: string): string {
  return /^https?:\/\//i.test(link) ? link : `https://${link}`;
}

/** Only ordinary web addresses may be opened */
export function isWebUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export function splitLinks(text: string): TextPart[] {
  if (!text || !/[./]/.test(text)) return [{ text }];
  const parts: TextPart[] = [];
  let last = 0;
  LINK_RE.lastIndex = 0;
  for (let m = LINK_RE.exec(text); m; m = LINK_RE.exec(text)) {
    const link = trimTrail(m[0]);
    if (!link) continue;
    const href = toHref(link);
    if (!isWebUrl(href)) continue;
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: link, href });
    last = m.index + link.length;
    LINK_RE.lastIndex = last; // the trimmed punctuation stays as normal text
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts.length ? parts : [{ text }];
}

/** "1.hdfc.bank.in" for https://1.hdfc.bank.in/HDFCBK/s/abc */
export function hostOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./i, '');
  } catch {
    return href;
  }
}
