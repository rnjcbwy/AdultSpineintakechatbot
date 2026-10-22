#!/usr/bin/env node
// ============================================================================
// The patient education catalogue, from the website's own guides.
//
// AaronWeyMD.com keeps every handout as a Markdown guide in five languages
// (src/content/guides/<lang>/<section>/<slug>.md), and each printed handout's
// QR code opens that guide's page. This script reads their titles,
// descriptions and categories into lib/education/guides.json, which the
// intake uses to offer the right guides after a patient submits.
//
// Re-run after adding or renaming guides on the website:
//   node scripts/build-guide-catalog.mjs [--site "<path to aaronweymd-site>"]
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const SITE = args.includes('--site') ? args[args.indexOf('--site') + 1] : 'C:/AWEY PRACTICE BLUEPRINT PLAYBOOK/aaronweymd-site';
const GUIDES = path.join(SITE, 'src', 'content', 'guides');
const LANGS = ['en', 'es', 'pt', 'ko', 'zh'];
const SECTIONS = ['conditions', 'treatments', 'for-patients'];
const OUT = path.join(ROOT, 'lib', 'education', 'guides.json');

/** The few frontmatter fields the catalogue needs (the site's YAML is flat and quoted). */
function frontmatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src);
  if (!m) return {};
  const fm = m[1];
  const field = (re) => {
    const hit = re.exec(fm);
    if (!hit) return '';
    try { return JSON.parse(hit[1]); } catch { return hit[1].replace(/^"|"$/g, ''); }
  };
  return {
    title: field(/^title:\s*(".*")\s*$/m),
    description: field(/^description:\s*(".*")\s*$/m),
    category: field(/^category:\s*\r?\n\s+label:\s*(".*")\s*$/m),
  };
}

const shorten = (s, n = 240) => {
  const raw = String(s || '').replace(/\s+/g, ' ').trim();
  // The website's summaries are often cut short with "..."; keep that visible as "…".
  const cutShort = /(\.\.\.|…)$/.test(raw);
  const clean = raw.replace(/\s*(\.\.\.|…)$/, '').trim();
  if (clean.length <= n) return cutShort ? `${clean}…` : clean;
  const cut = clean.slice(0, n);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 20))}…`;
};

if (!fs.existsSync(GUIDES)) {
  console.error(`No guides at ${GUIDES}. Pass --site "<path to aaronweymd-site>".`);
  process.exit(1);
}

const bySlug = new Map();
for (const lang of LANGS) {
  for (const section of SECTIONS) {
    const dir = path.join(GUIDES, lang, section);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const slug = file.replace(/\.md$/, '');
      const fm = frontmatter(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (!fm.title) continue;
      const id = `${section}/${slug}`;
      if (!bySlug.has(id)) bySlug.set(id, { id, section, slug, category: '', i18n: {} });
      const entry = bySlug.get(id);
      if (lang === 'en') entry.category = fm.category || '';
      entry.i18n[lang] = { title: fm.title, description: shorten(fm.description) };
    }
  }
}

// Only guides the website has in every language, so any match can be offered in the patient's language.
const guides = [...bySlug.values()].filter((g) => LANGS.every((l) => g.i18n[l]));
const missing = [...bySlug.values()].filter((g) => !LANGS.every((l) => g.i18n[l])).map((g) => g.id);

const out = {
  generatedAt: new Date().toISOString(),
  site: 'https://aaronweymd.com',
  languages: LANGS,
  guides,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
const count = (s) => guides.filter((g) => g.section === s).length;
console.log(`${guides.length} guides (${SECTIONS.map((s) => `${s} ${count(s)}`).join(', ')}) -> ${path.relative(ROOT, OUT)}`);
if (missing.length) console.log(`Left out, not in all five languages: ${missing.join(', ')}`);
