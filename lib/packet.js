// ============================================================================
// Prior-authorization packet builder.
//
// Produces ONE download: a ZIP containing
//   Authorization_Packet_Combined.pdf   cover + checklist + every document,
//                                       separated by chapter pages and
//                                       navigable via real PDF bookmarks
//   01_Physical_Therapy/ ... 07_Other/  the source files in subfolders
//   MANIFEST.txt                        contents + readiness summary
//
// Everything runs in the browser; files are read back out of IndexedDB.
// ============================================================================

'use client';

import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { DOCUMENT_CATEGORIES, getDocumentBlob, formatBytes } from './documents';
import { addOutline } from './pdfOutline';

const LETTER = [612, 792];
const MARGIN = 54;
const NAVY = rgb(0.06, 0.17, 0.27);
const TEAL = rgb(0.16, 0.54, 0.54);
const GRAY = rgb(0.42, 0.45, 0.5);
const AMBER = rgb(0.72, 0.45, 0.05);
const BLACK = rgb(0.1, 0.1, 0.12);

/** Sequential page writer that adds pages as content overflows. */
class Writer {
  constructor(doc, font, bold) {
    this.doc = doc; this.font = font; this.bold = bold;
    this.page = null; this.y = 0;
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage(LETTER);
    this.y = LETTER[1] - MARGIN;
    return this.page;
  }
  ensure(space) {
    if (this.y - space < MARGIN) this.newPage();
  }
  gap(n = 10) { this.y -= n; }
  /** Word-wrapped text. Returns the page the text started on. */
  text(str, { size = 10, bold = false, color = BLACK, indent = 0, lineHeight = 1.35 } = {}) {
    const font = bold ? this.bold : this.font;
    const maxWidth = LETTER[0] - MARGIN * 2 - indent;
    const words = String(str ?? '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    if (!lines.length) lines.push('');
    const startPage = this.page;
    for (const l of lines) {
      this.ensure(size * lineHeight);
      this.page.drawText(l, { x: MARGIN + indent, y: this.y, size, font, color });
      this.y -= size * lineHeight;
    }
    return startPage;
  }
  rule(color = rgb(0.85, 0.87, 0.9)) {
    this.ensure(12);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y }, end: { x: LETTER[0] - MARGIN, y: this.y },
      thickness: 0.75, color,
    });
    this.y -= 12;
  }
}

function patientName(intake) {
  const d = intake?.demographics || {};
  const n = [d.lastName, d.firstName].filter(Boolean).join(', ');
  return n || 'Unnamed patient';
}

function safeName(s) {
  return String(s || 'file').replace(/[^\w.\- ]+/g, '_').slice(0, 120);
}

function extFor(type, name) {
  if (/\.[a-z0-9]{2,5}$/i.test(name)) return '';
  if (type === 'application/pdf') return '.pdf';
  if (type === 'image/jpeg') return '.jpg';
  if (type === 'image/png') return '.png';
  return '';
}

/**
 * Build the combined, chaptered PDF.
 * Returns { bytes, chapters, skipped }.
 */
async function buildCombinedPdf({ intake, readiness, docs, loadDocument }) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(pdf, font, bold);

  const d = intake?.demographics || {};
  const chapters = [];
  const skipped = [];

  // ---------------- Cover ----------------
  chapters.push({ title: 'Cover Sheet', pageIndex: pdf.getPageCount() - 1 });
  w.text('PRIOR AUTHORIZATION PACKET', { size: 20, bold: true, color: NAVY });
  w.gap(4);
  w.text('Comprehensive Spine & Scoliosis Center · Aaron Wey, MD, FAAOS, FACS', { size: 10, color: TEAL });
  w.gap(6);
  w.rule();

  w.text(patientName(intake), { size: 15, bold: true, color: NAVY });
  const idLine = [d.dob && `DOB ${d.dob}`, d.age && `${d.age} y/o`, d.sex].filter(Boolean).join(' · ');
  if (idLine) w.text(idLine, { size: 10, color: GRAY });
  const insLine = [d.insuranceProvider && `Insurer: ${d.insuranceProvider}`, d.memberId && `Member ID: ${d.memberId}`].filter(Boolean).join(' · ');
  if (insLine) w.text(insLine, { size: 10, color: GRAY });
  w.gap(10);

  if (readiness) {
    w.text('REQUESTED PROCEDURE', { size: 9, bold: true, color: GRAY });
    w.text(readiness.procedure || '—', { size: 11, bold: true });
    if (readiness.indication) w.text(`Indication: ${readiness.indication}`, { size: 10, color: GRAY });
    w.gap(8);
    w.text('REVIEWED AGAINST', { size: 9, bold: true, color: GRAY });
    w.text(`${readiness.payer.name}${readiness.payer.umVendor ? ` — ${readiness.payer.umVendor}` : ''}`, { size: 11, bold: true });
    if (readiness.policy) {
      w.text(
        [readiness.policy.policyId, readiness.policy.title].filter(Boolean).join(' · ') +
        (readiness.policy.effectiveDate ? ` (effective ${readiness.policy.effectiveDate})` : ''),
        { size: 9, color: GRAY }
      );
      if (readiness.policy.sourceUrl) w.text(readiness.policy.sourceUrl, { size: 8, color: GRAY });
    }
    w.gap(10);
  }

  w.text(`Packet generated ${new Date().toLocaleString()}`, { size: 9, color: GRAY });
  w.gap(8);
  w.rule();

  // ---------------- Contents ----------------
  w.text('CONTENTS', { size: 11, bold: true, color: NAVY });
  w.gap(4);
  const withDocs = DOCUMENT_CATEGORIES.filter((c) => docs.some((x) => x.category === c.id));
  if (!withDocs.length) w.text('No documents attached.', { size: 10, color: AMBER });
  withDocs.forEach((c, i) => {
    const n = docs.filter((x) => x.category === c.id).length;
    w.text(`${i + 1}.  ${c.label}  —  ${n} file${n === 1 ? '' : 's'}`, { size: 10, indent: 8 });
  });

  // ---------------- Readiness checklist ----------------
  if (readiness) {
    w.gap(12);
    w.rule();
    w.text('DOCUMENTATION CHECKLIST', { size: 11, bold: true, color: NAVY });
    w.text(
      readiness.percent != null
        ? `${readiness.percent}% of gating requirements evidenced (${readiness.satisfied.length} met, ${readiness.partial.length} partial, ${readiness.missing.length} missing)`
        : 'No scorable criteria published for this payer.',
      { size: 10, color: GRAY }
    );
    w.gap(8);

    const section = (title, rows, color, showGaps) => {
      if (!rows.length) return;
      w.ensure(30);
      w.text(title, { size: 10, bold: true, color });
      for (const r of rows) {
        w.ensure(26);
        w.text(`• ${r.label}${r.durationRequired ? ` (${r.durationRequired})` : ''} — ${r.summary}`, { size: 9, indent: 8 });
        if (showGaps) for (const g of r.gaps || []) w.text(`– ${g}`, { size: 8, indent: 20, color: AMBER });
      }
      w.gap(6);
    };
    section('MISSING', readiness.missing, rgb(0.75, 0.15, 0.15), true);
    section('PARTIAL — needs detail', readiness.partial, AMBER, true);
    section('SATISFIED', readiness.satisfied, rgb(0.1, 0.5, 0.25), false);
    section('SURGEON TO SUPPLY AT BOOKING', readiness.clinician, NAVY, false);
    section('ADVISORY (worded as recommendation, not a gate)', readiness.advisory, GRAY, false);

    w.gap(6);
    w.text(
      'This checklist reflects documentation completeness only. It is not a coverage determination. ' +
      'Payer criteria change frequently — verify against the current published policy before submission.',
      { size: 8, color: GRAY }
    );
  }

  // ---------------- Document chapters ----------------
  for (const cat of withDocs) {
    const catDocs = docs.filter((x) => x.category === cat.id);

    // Chapter divider
    const divider = pdf.addPage(LETTER);
    chapters.push({ title: cat.label, pageIndex: pdf.getPageCount() - 1 });
    divider.drawRectangle({ x: 0, y: LETTER[1] - 150, width: LETTER[0], height: 150, color: NAVY });
    divider.drawText(cat.folder.replace(/^\d+_/, '').replace(/_/g, ' ').toUpperCase(), {
      x: MARGIN, y: LETTER[1] - 78, size: 11, font: bold, color: rgb(1, 1, 1),
    });
    divider.drawText(cat.label, { x: MARGIN, y: LETTER[1] - 108, size: 20, font: bold, color: rgb(1, 1, 1) });
    let dy = LETTER[1] - 200;
    for (const doc of catDocs) {
      divider.drawText(`•  ${doc.name}   (${formatBytes(doc.size)})`, {
        x: MARGIN + 8, y: dy, size: 10, font, color: BLACK,
      });
      dy -= 18;
    }

    // Merge each document
    for (const doc of catDocs) {
      let blob;
      try { blob = await loadDocument(doc); } catch { blob = null; }
      if (!blob) { skipped.push({ name: doc.name, reason: 'file could not be read' }); continue; }
      const bytes = new Uint8Array(await blob.arrayBuffer());

      try {
        if (doc.type === 'application/pdf') {
          const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const pages = await pdf.copyPages(src, src.getPageIndices());
          pages.forEach((p) => pdf.addPage(p));
        } else if (doc.type === 'image/jpeg' || doc.type === 'image/png') {
          const img = doc.type === 'image/jpeg' ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
          const page = pdf.addPage(LETTER);
          const maxW = LETTER[0] - MARGIN * 2;
          const maxH = LETTER[1] - MARGIN * 2 - 20;
          const scale = Math.min(maxW / img.width, maxH / img.height, 1);
          const dw = img.width * scale, dh = img.height * scale;
          page.drawImage(img, { x: (LETTER[0] - dw) / 2, y: (LETTER[1] - dh) / 2 - 10, width: dw, height: dh });
          page.drawText(doc.name, { x: MARGIN, y: LETTER[1] - MARGIN + 6, size: 8, font, color: GRAY });
        } else {
          skipped.push({ name: doc.name, reason: `${doc.type || 'unknown type'} cannot be merged into PDF — included in the ZIP folders` });
        }
      } catch (err) {
        skipped.push({ name: doc.name, reason: `could not be merged (${err?.message || 'unreadable'}) — included in the ZIP folders` });
      }
    }
  }

  // ---------------- Skipped notice ----------------
  if (skipped.length) {
    const w2 = new Writer(pdf, font, bold);
    chapters.push({ title: 'Files not merged', pageIndex: pdf.getPageCount() - 1 });
    w2.text('FILES NOT MERGED INTO THIS PDF', { size: 13, bold: true, color: AMBER });
    w2.gap(6);
    w2.text('These files are present in the ZIP subfolders but could not be converted into PDF pages:', { size: 10, color: GRAY });
    w2.gap(6);
    for (const s of skipped) w2.text(`• ${s.name} — ${s.reason}`, { size: 9, indent: 8 });
  }

  try { addOutline(pdf, chapters); } catch { /* bookmarks are a nicety; never fail the packet over them */ }

  const bytes = await pdf.save();
  return { bytes, chapters, skipped };
}

function buildManifest({ intake, readiness, docs, skipped }) {
  const lines = [];
  lines.push('PRIOR AUTHORIZATION PACKET — MANIFEST');
  lines.push('Comprehensive Spine & Scoliosis Center');
  lines.push('');
  lines.push(`Patient:    ${patientName(intake)}`);
  if (intake?.demographics?.dob) lines.push(`DOB:        ${intake.demographics.dob}`);
  if (intake?.demographics?.insuranceProvider) lines.push(`Insurer:    ${intake.demographics.insuranceProvider}`);
  lines.push(`Generated:  ${new Date().toISOString()}`);
  lines.push('');
  if (readiness) {
    lines.push(`Procedure:  ${readiness.procedure || '—'}`);
    lines.push(`Indication: ${readiness.indication || '—'}`);
    lines.push(`Reviewed against: ${readiness.payer.name}${readiness.payer.umVendor ? ` (${readiness.payer.umVendor})` : ''}`);
    if (readiness.policy) {
      lines.push(`Policy:     ${[readiness.policy.policyId, readiness.policy.effectiveDate && `effective ${readiness.policy.effectiveDate}`].filter(Boolean).join(' · ')}`);
      if (readiness.policy.sourceUrl) lines.push(`Source:     ${readiness.policy.sourceUrl}`);
    }
    lines.push('');
    lines.push(`Readiness:  ${readiness.percent != null ? readiness.percent + '%' : 'not scorable'}  (${readiness.satisfied.length} met / ${readiness.partial.length} partial / ${readiness.missing.length} missing)`);
    if (readiness.missing.length) {
      lines.push('');
      lines.push('MISSING:');
      readiness.missing.forEach((m) => lines.push(`  - ${m.label}: ${m.summary}`));
    }
    if (readiness.partial.length) {
      lines.push('');
      lines.push('PARTIAL (needs more detail):');
      readiness.partial.forEach((m) => {
        lines.push(`  - ${m.label}: ${m.summary}`);
        (m.gaps || []).forEach((g) => lines.push(`      * ${g}`));
      });
    }
  }
  lines.push('');
  lines.push('CONTENTS');
  for (const cat of DOCUMENT_CATEGORIES) {
    const list = docs.filter((x) => x.category === cat.id);
    if (!list.length) continue;
    lines.push(`  ${cat.folder}/`);
    list.forEach((f) => lines.push(`      ${f.name}  (${formatBytes(f.size)})`));
  }
  if (skipped?.length) {
    lines.push('');
    lines.push('NOT MERGED INTO THE COMBINED PDF (present in folders):');
    skipped.forEach((s) => lines.push(`  - ${s.name}: ${s.reason}`));
  }
  lines.push('');
  lines.push('This packet reports documentation completeness only and is not a coverage determination.');
  lines.push('Payer criteria change frequently; verify against the current published policy before submission.');
  return lines.join('\n');
}

/**
 * Assemble the full packet.
 *
 * `loadDocument(meta) -> Blob` defaults to reading this browser's IndexedDB.
 * Pass a different loader for records held server-side, so the same builder
 * serves both the local prototype flow and the office file cabinet.
 *
 * Returns { blob, filename, chapters, skipped }.
 */
export async function buildPacket({ intake, readiness, loadDocument }) {
  const docs = intake?.documents || [];
  const load = loadDocument || ((meta) => getDocumentBlob(meta.id));
  const zip = new JSZip();

  const { bytes, chapters, skipped } = await buildCombinedPdf({ intake, readiness, docs, loadDocument: load });
  zip.file('Authorization_Packet_Combined.pdf', bytes);

  for (const cat of DOCUMENT_CATEGORIES) {
    const list = docs.filter((x) => x.category === cat.id);
    if (!list.length) continue;
    const folder = zip.folder(cat.folder);
    for (const doc of list) {
      let blob;
      try { blob = await load(doc); } catch { blob = null; }
      if (!blob) continue;
      folder.file(safeName(doc.name) + extFor(doc.type, doc.name), await blob.arrayBuffer());
    }
  }

  zip.file('MANIFEST.txt', buildManifest({ intake, readiness, docs, skipped }));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const who = safeName(patientName(intake)).replace(/[,\s]+/g, '_');
  const stamp = new Date().toISOString().slice(0, 10);
  return { blob, filename: `PriorAuth_${who}_${stamp}.zip`, chapters, skipped };
}
