// Build the translation tables for the languages that are not written inline.
//
// Spanish and Chinese live next to most English strings in the components. The
// other languages are served from lib/translations/<lang>.json, keyed by the
// exact English string; Spanish and Chinese get a table too, holding only the
// strings that have no inline entry (the visit-type steps, which keep their
// strings in plain t('...') calls and option arrays). This script finds every
// translatable string in the code, asks Claude on Bedrock (under the account's
// BAA; the strings are UI text, never patient data) for the missing
// translations, checks that placeholders survived, and writes the tables.
// Re-run after adding strings: only missing keys are translated, so existing
// translations are never overwritten (edit the JSON by hand to correct one).
//
//   node scripts/translate-ui.mjs                 translate everything missing
//   node scripts/translate-ui.mjs --extract-only  list the strings and exit
//   node scripts/translate-ui.mjs --lang ru       one language
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'lib', 'translations');
const LANGUAGES = {
  es: 'Spanish (neutral Latin American, as used on US patient forms)',
  zh: 'Simplified Chinese (Mandarin)',
  ar: 'Arabic (Modern Standard, as used on patient forms)',
  he: 'Hebrew',
  ru: 'Russian',
  ko: 'Korean',
  pl: 'Polish',
  pt: 'Portuguese (Brazilian, understood by European readers)',
  ja: 'Japanese',
  hi: 'Hindi (Devanagari; plain register used on Indian hospital forms)',
  ne: 'Nepali (Devanagari)',
};
const args = process.argv.slice(2);
const extractOnly = args.includes('--extract-only');
const onlyLang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;

// ---------------------------------------------------------------------------
// 1. Find every English string the UI can show
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.(js|mjs)$/.test(ent.name)) out.push(full);
  }
  return out;
}

const unescape = (s) => s.replace(/\\(['"\\])/g, '$1');

/** Keys of dictionary entries shaped `'English': { es: ..., zh: ... }`. */
function dictionaryKeys(src) {
  const keys = [];
  const re = /(['"])((?:\\.|(?!\1).)+?)\1\s*:\s*\{\s*(?:\n\s*)?es\s*:/g;
  let m;
  while ((m = re.exec(src))) keys.push(unescape(m[2]));
  return keys;
}

/** Every string literal inside each `en: { ... }` block of a file (a file may have several). */
function englishBlockStrings(src) {
  const out = [];
  const blockRe = /\n\s*en:\s*\{/g;
  let hit;
  while ((hit = blockRe.exec(src))) {
    const i = src.indexOf('{', hit.index);
    let depth = 0;
    let end = i;
    for (; end < src.length; end++) {
      if (src[end] === '{') depth++;
      else if (src[end] === '}') { depth--; if (depth === 0) break; }
    }
    const block = src.slice(i, end + 1);
    const re = /(['"])((?:\\.|(?!\1).)*?)\1/g;
    let m;
    while ((m = re.exec(block))) {
      const str = unescape(m[2]);
      // Skip object keys ('subtitle', 'banner', ...) and tiny tokens.
      if (/^[a-zA-Z0-9_]+$/.test(str) || str.length < 3) continue;
      out.push(str);
    }
    blockRe.lastIndex = end;
  }
  return out;
}

/** The consent statements (lib/consent.js) carry `text:` plus es/zh fields. */
function consentStrings(src) {
  const out = [];
  const re = /\b(?:label|text):\s*'((?:\\.|[^'\\])*)'/g;
  let m;
  while ((m = re.exec(src))) out.push(unescape(m[1]));
  return out;
}

/**
 * The visit-type steps (and the field kit and flow table they use) keep their
 * strings in plain t('...') calls, label/placeholder props and UPPER_CASE
 * option arrays rather than in an inline dictionary. Harvest those.
 */
const PLAIN_FILES = /(?:Triage|VisitType|WorkInjury|LegalInjury|IntervalHistory|PostOpVisit|Fields|flows|operations|problems)\.js$/;
function plainStrings(src) {
  const out = [];
  const add = (str) => {
    const v = unescape(str);
    if (/^[a-zA-Z0-9_.-]+$/.test(v) || v.length < 3) return;
    out.push(v);
  };
  let m;
  const tCall = /\bt\(\s*(['"])((?:\\.|(?!\1).)+?)\1\s*\)/g;
  while ((m = tCall.exec(src))) add(m[2]);
  const prop = /\b(?:label|placeholder|hint|description|exclusive)\s*[:=]\s*(['"])((?:\\.|(?!\1).)+?)\1/g;
  while ((m = prop.exec(src))) add(m[2]);
  const arr = /const\s+[A-Z][A-Z0-9_]*\s*=\s*\[([^\]]*)\]/g;
  while ((m = arr.exec(src))) {
    const lit = /(['"])((?:\\.|(?!\1).)+?)\1/g;
    let n;
    while ((n = lit.exec(m[1]))) add(n[2]);
  }
  return out;
}

// Strings built at runtime from templates, which no dictionary lists.
const EXTRA_KEYS = ['Step {c} of {n}'];

/** Every string the UI can show, and which of them already have inline es/zh. */
export function extractStrings() {
  const files = [...walk(path.join(ROOT, 'components')), ...walk(path.join(ROOT, 'lib')), ...walk(path.join(ROOT, 'app'))];
  const keys = new Set(EXTRA_KEYS);
  const inline = new Set();
  // Strings the plain-file components show. They read only the shared COMMON
  // dictionary, so an inline es/zh entry elsewhere does not reach them.
  const plain = new Set();
  for (const f of files) {
    if (f.includes(path.join('lib', 'translations'))) continue;
    const src = fs.readFileSync(f, 'utf8');
    for (const k of dictionaryKeys(src)) { keys.add(k); inline.add(k); }
    if (/Welcome\.js$/.test(f)) for (const k of englishBlockStrings(src)) keys.add(k);
    if (/consent\.js$/.test(f)) for (const k of consentStrings(src)) keys.add(k);
    if (PLAIN_FILES.test(f)) for (const k of plainStrings(src)) { keys.add(k); plain.add(k); }
  }
  return { keys: [...keys].sort(), inline, plain };
}

// ---------------------------------------------------------------------------
// 2. Translate what is missing
// ---------------------------------------------------------------------------

const PLACEHOLDER = /\{[a-z]+\}|\*\*/g;

function placeholdersMatch(src, dst) {
  const a = (src.match(PLACEHOLDER) || []).sort().join(',');
  const b = (dst.match(PLACEHOLDER) || []).sort().join(',');
  return a === b;
}

async function translateBatch(client, ConverseCommand, modelId, language, strings) {
  const system = `You translate the user-interface text of an online new-patient intake form for a spine surgery practice into ${language}.
Rules:
- Patient-facing, formal and polite register; plain language a patient understands; medically accurate.
- Translate the MEANING, not word by word; keep sentences natural in ${language}.
- Keep placeholders such as {done} and {total} exactly as they are; keep **double asterisks** around the same words they wrap in English.
- Keep medical abbreviations and instrument names as commonly written in ${language} clinical settings (ODI, NDI, mJOA, SRS-22r, MRI, CT, EMG, PT, ESI, NSAID); keep "911" unchanged. The form never names the surgeon; keep it that way.
- Keep trailing punctuation, ellipses and question marks consistent with the source.
- Output ONLY a JSON object whose keys are the exact source strings and whose values are the translations. No commentary, no code fences.`;
  const user = JSON.stringify(strings);
  const res = await client.send(new ConverseCommand({
    modelId,
    system: [{ text: system }],
    messages: [{ role: 'user', content: [{ text: user }] }],
    inferenceConfig: { maxTokens: 8000, temperature: 0.2 },
  }));
  let text = (res.output?.message?.content || []).map((c) => c.text || '').join('').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return JSON.parse(text.slice(start, end + 1));
}

async function translateLanguage(lang, keys, client, ConverseCommand, modelId) {
  const file = path.join(OUT_DIR, `${lang}.json`);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const missing = keys.filter((k) => !existing[k]);
  console.log(`${lang}: ${keys.length} strings, ${missing.length} to translate`);
  const BATCH = 50;
  let done = 0;
  // A batch whose reply cannot be parsed is split and retried, so one awkward
  // string (a quote the model forgot to escape) cannot block fifty others.
  async function translateResilient(batch, label) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await translateBatch(client, ConverseCommand, modelId, LANGUAGES[lang], batch);
      } catch (err) {
        console.warn(`${lang}: ${label} (${batch.length}) attempt ${attempt} failed (${err.name})`);
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    if (batch.length <= 1) return {};
    const half = Math.ceil(batch.length / 2);
    return { ...(await translateResilient(batch.slice(0, half), `${label}a`)), ...(await translateResilient(batch.slice(half), `${label}b`)) };
  }
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const result = await translateResilient(batch, `batch ${i / BATCH + 1}`);
    for (const k of batch) {
      const v = result[k];
      if (typeof v !== 'string' || !v.trim()) { console.warn(`${lang}: no translation for "${k.slice(0, 60)}"`); continue; }
      if (!placeholdersMatch(k, v)) { console.warn(`${lang}: placeholder mismatch for "${k.slice(0, 60)}"`); continue; }
      existing[k] = v.trim();
      done++;
    }
    // Save as we go so a crash loses nothing.
    const sorted = Object.fromEntries(Object.keys(existing).sort().map((k) => [k, existing[k]]));
    fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
    process.stdout.write(`${lang}: ${Math.min(i + BATCH, missing.length)}/${missing.length}\n`);
  }
  const still = keys.filter((k) => !existing[k]).length;
  console.log(`${lang}: wrote ${done}, ${still} still missing`);
}

const { keys, inline, plain } = extractStrings();
if (extractOnly) {
  console.log(keys.join('\n'));
  console.log(`\n${keys.length} strings (${keys.filter((k) => !inline.has(k)).length} without inline es/zh)`);
  process.exit(0);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const { BedrockRuntimeClient, ConverseCommand } = await import('@aws-sdk/client-bedrock-runtime');
const client = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1' });
const modelId = process.env.BEDROCK_TRANSLATE_MODEL_ID || process.env.BEDROCK_NOTE_MODEL_ID || 'us.anthropic.claude-sonnet-4-6';
const langs = onlyLang ? [onlyLang] : Object.keys(LANGUAGES);
// Spanish and Chinese only need the strings that have no inline entry, plus
// everything the plain-file components show (their dictionary is COMMON only).
const keysFor = (l) => (l === 'es' || l === 'zh' ? keys.filter((k) => !inline.has(k) || plain.has(k)) : keys);
await Promise.all(langs.map((l) => translateLanguage(l, keysFor(l), client, ConverseCommand, modelId)));
console.log('done');
