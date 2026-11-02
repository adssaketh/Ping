/**
 * Small in-app log. Records console output, uncaught errors and "breadcrumbs" so a problem can be copied out of
 * Settings > Logs. Kept in memory and mirrored to localStorage so it is still there after the app crashes.
 */
const KEY = 'ping_applog_v1';
const MAX_LINES = 600;
const MAX_LINE_LEN = 2000;

let lines: string[] = [];
let started = false;
let saveTimer: number | undefined;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) lines = parsed.filter((x) => typeof x === 'string').slice(-MAX_LINES);
    }
  } catch {
    /* storage may be unavailable */
  }
}

function persistNow() {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
}

function persistSoon() {
  if (saveTimer !== undefined) return;
  saveTimer = window.setTimeout(() => {
    saveTimer = undefined;
    persistNow();
  }, 400);
}

function stamp(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

function fmt(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return `${arg.name}: ${arg.message}${arg.stack ? '\n' + arg.stack : ''}`;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function add(level: string, args: unknown[]) {
  let text = args.map(fmt).join(' ');
  if (text.length > MAX_LINE_LEN) text = text.slice(0, MAX_LINE_LEN) + '…';
  lines.push(`${stamp()} [${level}] ${text}`);
  if (lines.length > MAX_LINES) lines = lines.slice(-MAX_LINES);
  if (level === 'ERROR') persistNow();
  else persistSoon();
}

/** Writes a line to the in-app log (and the console). Use it to mark steps, e.g. appLog('backup: picker opened'). */
export function appLog(...args: unknown[]) {
  console.log(...args);
}

export function getAppLog(): string {
  return lines.join('\n');
}

export function clearAppLog() {
  lines = [];
  persistNow();
}

/** Starts recording. Call once, as early as possible. */
export function startAppLog() {
  if (started) return;
  started = true;
  load();
  lines.push(`${stamp()} [INFO] --- app started ---`);
  const levels: Array<['log' | 'info' | 'warn' | 'error' | 'debug', string]> = [
    ['log', 'LOG'],
    ['info', 'INFO'],
    ['warn', 'WARN'],
    ['error', 'ERROR'],
    ['debug', 'DEBUG'],
  ];
  for (const [method, level] of levels) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      try {
        add(level, args);
      } catch {
        /* never let logging break the app */
      }
      original(...args);
    };
  }
  window.addEventListener('error', (e) => {
    add('ERROR', [`Uncaught: ${e.message} (${e.filename}:${e.lineno}:${e.colno})`, e.error ?? '']);
  });
  window.addEventListener('unhandledrejection', (e) => {
    add('ERROR', ['Unhandled promise rejection:', (e as PromiseRejectionEvent).reason]);
  });
  window.addEventListener('pagehide', persistNow);
  persistSoon();
}
