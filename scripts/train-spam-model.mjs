#!/usr/bin/env node
/**
 * Trains Ping's on-device spam model and writes public/spam-model.json.
 *
 * Training data:
 *  - the Indian Telecom SMS Spam Collection (https://github.com/junioralive/india-spam-sms-classification),
 *    downloaded when this script runs (needs internet, e.g. in the GitHub Action), and
 *  - scripts/spam-seed.csv, a small hand-written set covering scams that public datasets lack.
 *
 * Usage:  node scripts/train-spam-model.mjs [--no-download] [--csv=file.csv] [--out=public/spam-model.json]
 *
 * If the download fails the script keeps whatever model is already in public/ and exits with an
 * error code, so the app still ships with the last good (or the seed-trained) model.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize } from '../src/spam/tokenize.js';
import { compileModel, scoreMessage, isSpamResult, SPAM_THRESHOLDS } from '../src/spam/score.js';
import { RULES, SAFE } from './spam-rules.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATASET_URL =
  'https://raw.githubusercontent.com/junioralive/india-spam-sms-classification/main/dataset/spam_ham_india.csv';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);
const outPath = path.resolve(here, '..', args.out || 'public/spam-model.json');

// ---- CSV (RFC 4180: quoted fields, escaped quotes, CRLF) ----
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

/** Returns [{ text, spam }] from CSV text with Msg / Label columns (any order, any case). */
function readLabelled(csvText) {
  const rows = parseCsv(csvText.replace(/^\uFEFF/, ''));
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  let msgIdx = header.findIndex((h) => ['msg', 'message', 'text', 'sms', 'v2'].includes(h));
  let labelIdx = header.findIndex((h) => ['label', 'class', 'category', 'v1'].includes(h));
  if (msgIdx < 0 || labelIdx < 0) {
    msgIdx = 0;
    labelIdx = 1;
  }
  const out = [];
  for (const r of rows.slice(1)) {
    const label = String(r[labelIdx] || '').trim().toLowerCase();
    const text = String(r[msgIdx] || '').trim();
    if (!text || (label !== 'spam' && label !== 'ham')) continue;
    out.push({ text, spam: label === 'spam' });
  }
  return out;
}

const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

async function main() {
  const seed = readLabelled(fs.readFileSync(path.join(here, 'spam-seed.csv'), 'utf8'));
  let dataset = [];
  if (args.csv) {
    dataset = readLabelled(fs.readFileSync(path.resolve(args.csv), 'utf8'));
  } else if (!args['no-download']) {
    const res = await fetch(DATASET_URL);
    if (!res.ok) throw new Error(`Dataset download failed: HTTP ${res.status}`);
    dataset = readLabelled(await res.text());
    if (dataset.length < 200) throw new Error(`Dataset looks wrong: only ${dataset.length} usable rows`);
  }

  // de-duplicate, then hold out ~15% of the dataset (never the seed) to measure quality
  const seen = new Set();
  const train = [];
  const test = [];
  for (const row of dataset) {
    const key = row.text.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    (hash(key) % 100 < 15 ? test : train).push(row);
  }
  const SEED_REPEAT = 3; // seed examples count three times: they cover scams the dataset barely has
  for (const row of seed) for (let i = 0; i < SEED_REPEAT; i++) train.push(row);

  // ---- train: per-token presence log-ratio (Bernoulli-style naive Bayes) ----
  const df = new Map();
  let nSpam = 0;
  let nHam = 0;
  for (const row of train) {
    if (row.spam) nSpam++;
    else nHam++;
    for (const tok of tokenize(row.text)) {
      const e = df.get(tok) || [0, 0];
      e[row.spam ? 0 : 1]++;
      df.set(tok, e);
    }
  }
  const ALPHA = 1;
  const SHRINK = 0.6; // naive Bayes is over-confident; shrink so long messages do not saturate
  const entries = [];
  for (const [tok, [s, h]] of df) {
    if (s + h < 3) continue;
    let w = Math.log((s + ALPHA) / (nSpam + 2 * ALPHA)) - Math.log((h + ALPHA) / (nHam + 2 * ALPHA));
    w = Math.max(-3, Math.min(3, w)) * SHRINK;
    entries.push([tok, Math.round(w * 1000) / 1000, Math.abs(w) * Math.sqrt(s + h)]);
  }
  entries.sort((a, b) => b[2] - a[2]);
  const weights = {};
  for (const [tok, w] of entries.slice(0, 5000)) weights[tok] = w;

  // An inbox is mostly legitimate, so start from "25% of messages are spam", not the dataset's mix.
  const bias = Math.log(0.25 / 0.75);

  const model = {
    version: 1,
    trainedAt: new Date().toISOString(),
    source: {
      dataset: dataset.length ? DATASET_URL : null,
      datasetRows: dataset.length,
      seedRows: seed.length,
    },
    bias,
    weights,
    rules: RULES,
    safe: SAFE,
    metrics: null,
  };

  // ---- evaluate on the held-out rows exactly the way the app decides ----
  if (test.length) {
    const compiled = compileModel(model);
    const t = SPAM_THRESHOLDS.balanced;
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;
    const falsePositives = [];
    for (const row of test) {
      const r = scoreMessage(compiled, row.text);
      const predicted = isSpamResult(r, '', t);
      if (predicted && row.spam) tp++;
      else if (predicted && !row.spam) {
        fp++;
        if (falsePositives.length < 5) falsePositives.push(row.text.slice(0, 100));
      } else if (!predicted && !row.spam) tn++;
      else fn++;
    }
    const round = (x) => Math.round(x * 1000) / 1000;
    model.metrics = {
      heldOut: test.length,
      threshold: t,
      accuracy: round((tp + tn) / test.length),
      precision: round(tp / Math.max(1, tp + fp)),
      recall: round(tp / Math.max(1, tp + fn)),
      falsePositives: fp,
    };
    console.log('Held-out check:', JSON.stringify(model.metrics));
    if (falsePositives.length) console.log('Sample false positives:\n - ' + falsePositives.join('\n - '));
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(model));
  console.log(
    `Spam model written to ${path.relative(process.cwd(), outPath)}: ` +
      `${Object.keys(weights).length} words, trained on ${train.length} messages ` +
      `(${dataset.length} dataset rows, ${seed.length} seed rows).`
  );
}

main().catch((err) => {
  console.error('Spam model training failed:', err.message);
  process.exit(1);
});
