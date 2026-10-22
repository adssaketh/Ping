/**
 * Understands dates typed into the search bar: "2025", "june", "june 2026", "22 oct", "22 october 2026",
 * "22/10/2026", "22-10-26", "2026-10-22", "22/10". Anything left over ("hdfc june") stays as ordinary text.
 * Numeric dates are read day first, like in India.
 */
export interface DateCriteria {
  year?: number;
  month?: number; // 1-12
  day?: number; // 1-31
}

const MONTH_NAMES: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sept: 9, sep: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_PATTERN = Object.keys(MONTH_NAMES)
  .sort((a, b) => b.length - a.length)
  .join('|');

const validDay = (d: number) => d >= 1 && d <= 31;
const validMonth = (m: number) => m >= 1 && m <= 12;

export function parseSearchQuery(raw: string): { text: string; date: DateCriteria | null } {
  let s = ` ${raw.toLowerCase().trim()} `;
  const date: DateCriteria = {};

  // 2026-10-22  /  2026/10/22
  s = s.replace(/\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/, (whole, y, m, d) => {
    if (validMonth(+m) && validDay(+d)) {
      date.year = +y;
      date.month = +m;
      date.day = +d;
      return ' ';
    }
    return whole;
  });

  // 22/10/2026  /  22-10-26
  if (date.year === undefined) {
    s = s.replace(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/, (whole, d, m, y) => {
      if (validMonth(+m) && validDay(+d) && (y.length === 2 || y.length === 4)) {
        date.day = +d;
        date.month = +m;
        date.year = y.length === 2 ? 2000 + +y : +y;
        return ' ';
      }
      return whole;
    });
  }

  // 22/10  (no year)
  if (date.month === undefined) {
    s = s.replace(/\b(\d{1,2})[/\-.](\d{1,2})\b/, (whole, d, m) => {
      if (validMonth(+m) && validDay(+d)) {
        date.day = +d;
        date.month = +m;
        return ' ';
      }
      return whole;
    });
  }

  // "22 october", "october 22", "22nd oct", "june"
  if (date.month === undefined) {
    const re = new RegExp(
      `\\b(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+)?(${MONTH_PATTERN})\\b(?:\\s+(\\d{1,2})(?:st|nd|rd|th)?(?!\\d))?`
    );
    s = s.replace(re, (whole, dayBefore, name, dayAfter) => {
      date.month = MONTH_NAMES[name];
      const day = dayBefore !== undefined ? +dayBefore : dayAfter !== undefined ? +dayAfter : undefined;
      if (day !== undefined && validDay(day)) date.day = day;
      return ' ';
    });
  }

  // 2025
  if (date.year === undefined) {
    s = s.replace(/\b(19\d{2}|20\d{2})\b/, (_whole, y) => {
      date.year = +y;
      return ' ';
    });
  }

  const hasDate = date.year !== undefined || date.month !== undefined || date.day !== undefined;
  return { text: s.replace(/\s+/g, ' ').trim(), date: hasDate ? date : null };
}

export function matchesDate(timestamp: number, c: DateCriteria): boolean {
  const d = new Date(timestamp);
  if (c.year !== undefined && d.getFullYear() !== c.year) return false;
  if (c.month !== undefined && d.getMonth() + 1 !== c.month) return false;
  if (c.day !== undefined && d.getDate() !== c.day) return false;
  return true;
}

/** "June 2026", "22 October 2026", "2026", "June (every year)" ... for the results heading. */
export function describeDate(c: DateCriteria): string {
  const parts: string[] = [];
  if (c.day !== undefined) parts.push(String(c.day));
  if (c.month !== undefined) parts.push(FULL_MONTHS[c.month - 1]);
  if (c.year !== undefined) parts.push(String(c.year));
  if (c.year === undefined && c.month !== undefined && c.day === undefined) parts.push('(every year)');
  return parts.join(' ');
}
