/**
 * Validates the hand-built PDF outline (bookmark) dictionaries by writing a
 * PDF, reading it back, and asserting the outline tree is well formed.
 *
 * Run: node scripts/test-outline.mjs
 */

import { PDFDocument, PDFName, PDFDict, StandardFonts } from 'pdf-lib';
import { addOutline } from '../lib/pdfOutline.js';

const CHAPTERS = [
  { title: 'Cover Sheet', pageIndex: 0 },
  { title: 'Physical therapy notes', pageIndex: 1 },
  { title: 'Imaging reports (MRI, CT, X-ray)', pageIndex: 2 },
  { title: 'Prior operative reports', pageIndex: 3 },
];

let failures = 0;
const check = (name, cond, detail = '') => {
  if (cond) console.log(`  PASS  ${name}`);
  else { console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); failures++; }
};

const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 4; i++) {
  const p = pdf.addPage([612, 792]);
  p.drawText(`Page ${i + 1}`, { x: 54, y: 700, size: 24, font });
}

addOutline(pdf, CHAPTERS, 792);
const bytes = await pdf.save();

console.log(`Built ${bytes.length} byte PDF with ${CHAPTERS.length} outline entries.\n`);

// --- Read it back exactly as a PDF viewer would ---------------------------
const reloaded = await PDFDocument.load(bytes);
const catalog = reloaded.catalog;

const outlinesRef = catalog.get(PDFName.of('Outlines'));
check('catalog has /Outlines', !!outlinesRef);

const outlines = outlinesRef ? reloaded.context.lookup(outlinesRef, PDFDict) : null;
check('/Outlines resolves to a dictionary', !!outlines);

if (outlines) {
  const type = outlines.get(PDFName.of('Type'));
  check('/Outlines Type is /Outlines', type?.toString() === '/Outlines', type?.toString());

  const count = outlines.get(PDFName.of('Count'));
  check(`/Count is ${CHAPTERS.length}`, Number(count?.asNumber?.()) === CHAPTERS.length, String(count));

  // Walk the linked list from First through Next and collect titles.
  const titles = [];
  const pageRefs = [];
  let ref = outlines.get(PDFName.of('First'));
  let guard = 0;
  while (ref && guard++ < 50) {
    const item = reloaded.context.lookup(ref, PDFDict);
    if (!item) break;
    titles.push(item.get(PDFName.of('Title'))?.decodeText?.() ?? '<undecodable>');
    const dest = reloaded.context.lookup(item.get(PDFName.of('Dest')));
    pageRefs.push(dest?.get?.(0)?.toString?.() ?? null);
    ref = item.get(PDFName.of('Next'));
  }

  check(
    'every chapter reachable via First/Next chain',
    titles.length === CHAPTERS.length,
    `walked ${titles.length}`
  );
  check(
    'titles round-trip intact',
    JSON.stringify(titles) === JSON.stringify(CHAPTERS.map((c) => c.title)),
    JSON.stringify(titles)
  );

  // Each destination must point at the right page object.
  const expected = CHAPTERS.map((c) => reloaded.getPage(c.pageIndex).ref.toString());
  check('destinations point at the correct pages', JSON.stringify(pageRefs) === JSON.stringify(expected),
    `got ${JSON.stringify(pageRefs)}`);

  const pageMode = catalog.get(PDFName.of('PageMode'));
  check('/PageMode is /UseOutlines (bookmarks pane opens)', pageMode?.toString() === '/UseOutlines', pageMode?.toString());
}

// --- Guard: empty input must be a no-op, not a crash ----------------------
const empty = await PDFDocument.create();
empty.addPage([612, 792]);
addOutline(empty, [], 792);
check('empty entries is a safe no-op', !empty.catalog.get(PDFName.of('Outlines')));

console.log(failures === 0 ? '\nAll outline checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
