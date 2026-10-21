// ============================================================================
// Intake transcript PDF.
//
// A faithful, printable record of exactly what the patient entered, for the
// chart: the body diagram the patient drew, the interview transcript, every
// questionnaire answer, and the acknowledgments with the printed name and the
// drawn signature. It carries nothing generated or derived: the pre-visit note
// and the red-flag summary live in Practice Hub.
//
// Runs anywhere Node runs (Next.js route, Lambda) with no files on disk: the
// logo and the traced figures are embedded (lib/server/embeddedAssets.js).
// ============================================================================

import {
  PDFDocument, StandardFonts, rgb, PDFOperator, PDFOperatorNames,
  pushGraphicsState, popGraphicsState, concatTransformationMatrix, setFillingColor,
  moveTo, lineTo, appendBezierCurve, closePath,
} from 'pdf-lib';
import { FIGURES } from './embeddedAssets';
import { CONSENT_ITEMS } from '../consent';
import { isExpressLead, SAFETY_SUMMARY } from '../express';
import { LANGUAGE_NAMES } from '../languages';
import { VIEW_BOX, VIEWS, VIEW_LABELS, allTypes, getType, countMarks, summarizePainMap, reportsNoPain } from '../bodyMap';
import { VISIT_LABEL } from '../flows';
import { getService } from '../service';
import { DOCUMENT_CATEGORIES } from '../documentCategories';

// The brand is the surgeon himself: no institution, practice or logo.
const PRACTICE = {
  surgeon: 'Aaron Wey, MD, FAAOS, FACS',
};

// The few labels that read differently for the spine and for a bone or joint.
// The service's own modules (w.service: constants, problems, operations,
// rosSystems, promSummary) supply everything else that differs.
const WORDING = {
  spine: {
    credential: 'Adult and Pediatric Spine Surgeon',
    creator: 'Adult Spine Intake',
    priorTreatment: 'Earlier spine treatment',
    priorSurgery: 'Prior spine surgery',
    limbSymptoms: 'Arm / leg symptoms',
    brace: 'Brace / collar',
    opLevel: 'Level',
  },
  ortho: {
    credential: 'Orthopaedic Surgeon',
    creator: 'Adult Orthopaedic Intake',
    priorTreatment: 'Earlier treatment of the same joint or limb',
    priorSurgery: 'Prior bone or joint surgery',
    limbSymptoms: 'Numbness / tingling from before',
    brace: 'Cast, splint, boot, sling or brace',
    opLevel: 'Side / site',
  },
};

const LETTER = [612, 792];
const M = 48;
const CW = LETTER[0] - M * 2;
const BOTTOM = 56;
const C = {
  navy: rgb(0x12 / 255, 0x35 / 255, 0x59 / 255),
  teal: rgb(0x0e / 255, 0x84 / 255, 0x82 / 255),
  tealSoft: rgb(0x38 / 255, 0xbf / 255, 0xbd / 255),
  ink: rgb(0.13, 0.15, 0.18),
  gray: rgb(0.42, 0.45, 0.5),
  light: rgb(0.85, 0.89, 0.89),
  wash: rgb(0.93, 0.97, 0.97),
  red: rgb(0.72, 0.13, 0.13),
  amber: rgb(0.62, 0.4, 0.05),
  white: rgb(1, 1, 1),
};

// ---------------------------------------------------------------------------
// Text that the standard fonts can encode
// ---------------------------------------------------------------------------

const WINANSI_EXTRA = new Set(['‘', '’', '“', '”', '–', '—', '…', '•', '€', '™', ' ']);
/**
 * Helvetica covers Latin-1, which is enough for English and Spanish. Chinese
 * answers cannot be drawn with the standard fonts; those runs are replaced by
 * a marker, and the full text remains in the structured record Practice Hub
 * stores alongside this PDF.
 */
function enc(s) {
  let out = '';
  let inRun = false;
  for (const ch of String(s ?? '')) {
    const code = ch.codePointAt(0);
    const ok = (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WINANSI_EXTRA.has(ch);
    if (ok || ch === '\n' || ch === '\t') { out += ch === '\t' ? ' ' : ch; inRun = false; continue; }
    // Scripts the standard fonts cannot draw: one marker per run; the text
    // itself is in the structured record Practice Hub keeps.
    if (!inRun) out += '[text in another script; see structured record]';
    inRun = true;
  }
  return out;
}

const str = (v) => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : Array.isArray(v) ? v.filter((x) => x !== '' && x != null).map(str).join(', ') : typeof v === 'object' ? Object.entries(v).filter(([, x]) => x !== '' && x != null && x !== false).map(([k, x]) => `${label(k)}: ${str(x)}`).join('; ') : String(v));

function label(key) {
  return String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function fmtDate(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : String(iso);
}

function fmtDateTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  } catch { return String(iso); }
}

// ---------------------------------------------------------------------------
// Page writer
// ---------------------------------------------------------------------------

class Writer {
  constructor(doc, fonts, running) {
    this.doc = doc;
    this.font = fonts.regular;
    this.bold = fonts.bold;
    this.italic = fonts.italic;
    this.running = running;
    this.page = null;
    this.y = 0;
    this.pages = 0;
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage(LETTER);
    this.pages++;
    this.y = LETTER[1] - M;
    if (this.pages > 1) {
      this.page.drawText(enc(this.running), { x: M, y: LETTER[1] - 30, size: 8, font: this.font, color: C.gray });
      this.page.drawLine({ start: { x: M, y: LETTER[1] - 36 }, end: { x: LETTER[0] - M, y: LETTER[1] - 36 }, thickness: 0.5, color: C.light });
      this.y = LETTER[1] - 52;
    }
  }
  need(h) { if (this.y - h < BOTTOM) this.newPage(); }
  gap(n = 8) { this.y -= n; }

  wrap(text, font, size, maxWidth) {
    const lines = [];
    for (const para of enc(text).split('\n')) {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { lines.push(''); continue; }
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(test, size) > maxWidth && line) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  text(s, { size = 9.5, bold = false, italic = false, color = C.ink, indent = 0, lineHeight = 1.32, width } = {}) {
    const font = bold ? this.bold : italic ? this.italic : this.font;
    const maxWidth = (width || CW) - indent;
    const lines = this.wrap(s, font, size, maxWidth);
    for (const l of lines) {
      this.need(size * lineHeight);
      if (l) this.page.drawText(l, { x: M + indent, y: this.y - size, size, font, color });
      this.y -= size * lineHeight;
    }
  }

  heading(s) {
    this.need(34);
    this.gap(10);
    this.page.drawRectangle({ x: M, y: this.y - 17, width: CW, height: 18, color: C.navy });
    this.page.drawText(enc(s).toUpperCase(), { x: M + 7, y: this.y - 13, size: 9, font: this.bold, color: C.white });
    this.y -= 24;
  }

  subheading(s) {
    this.need(22);
    this.gap(6);
    this.page.drawText(enc(s), { x: M, y: this.y - 9, size: 9.5, font: this.bold, color: C.teal });
    this.y -= 15;
  }

  /** Label/value row. Empty values are skipped so the record stays dense. */
  kv(k, v, { labelW = 150 } = {}) {
    const value = str(v);
    if (!value.trim()) return;
    const size = 9.2;
    const lines = this.wrap(value, this.font, size, CW - labelW);
    const h = lines.length * size * 1.3 + 2;
    this.need(Math.min(h, 60));
    const top = this.y;
    this.page.drawText(enc(k), { x: M, y: top - size, size: 8.6, font: this.bold, color: C.gray, maxWidth: labelW - 6 });
    for (const l of lines) {
      this.need(size * 1.3);
      if (this.y !== top && this.y > top) { /* page turned: continue from top of new page */ }
      this.page.drawText(l, { x: M + labelW, y: this.y - size, size, font: this.font, color: C.ink });
      this.y -= size * 1.3;
    }
    this.y -= 2;
  }

  bullet(s, { indent = 10, size = 9.2 } = {}) {
    const lines = this.wrap(s, this.font, size, CW - indent - 10);
    for (let i = 0; i < lines.length; i++) {
      this.need(size * 1.3);
      if (i === 0) this.page.drawText('•', { x: M + indent, y: this.y - size, size, font: this.font, color: C.teal });
      this.page.drawText(lines[i], { x: M + indent + 10, y: this.y - size, size, font: this.font, color: C.ink });
      this.y -= size * 1.3;
    }
  }

  note(s) {
    this.text(s, { size: 8.5, italic: true, color: C.gray });
  }

  rule() {
    this.need(10);
    this.page.drawLine({ start: { x: M, y: this.y - 3 }, end: { x: LETTER[0] - M, y: this.y - 3 }, thickness: 0.5, color: C.light });
    this.y -= 9;
  }

  /** Simple table; widths are fractions of CW. */
  table(columns, rows) {
    if (!rows.length) return;
    const size = 8.6;
    const widths = columns.map((c) => c.w * CW);
    const xs = widths.reduce((acc, w, i) => { acc.push(i ? acc[i - 1] + widths[i - 1] : M); return acc; }, []);
    const drawHeader = () => {
      this.need(18);
      this.page.drawRectangle({ x: M, y: this.y - 13, width: CW, height: 14, color: C.wash });
      columns.forEach((c, i) => this.page.drawText(enc(c.label), { x: xs[i] + 3, y: this.y - 10, size: 8, font: this.bold, color: C.navy }));
      this.y -= 15;
    };
    drawHeader();
    for (const row of rows) {
      const cells = columns.map((c, i) => this.wrap(str(row[c.key]), this.font, size, widths[i] - 6));
      const h = Math.max(1, ...cells.map((c) => c.length)) * size * 1.28 + 4;
      if (this.y - h < BOTTOM) { this.newPage(); drawHeader(); }
      cells.forEach((lines, i) => {
        lines.forEach((l, j) => this.page.drawText(l, { x: xs[i] + 3, y: this.y - size - j * size * 1.28, size, font: this.font, color: C.ink }));
      });
      this.y -= h;
      this.page.drawLine({ start: { x: M, y: this.y + 1 }, end: { x: LETTER[0] - M, y: this.y + 1 }, thickness: 0.3, color: C.light });
    }
  }
}

// ---------------------------------------------------------------------------
// Body diagram
// ---------------------------------------------------------------------------

/**
 * SVG path data -> pdf-lib operators.
 *
 * pdf-lib has this internally, but importing its private module pulls in a
 * second copy of the library under webpack (ESM build for the app, CJS build
 * for the helper) and the operators then fail the library's instanceof check.
 * The traced figures use only M, L and C, so a small parser built from the
 * public operator helpers is both sufficient and bundler-proof. H, V, S, Q and
 * Z are handled too for completeness; arcs are not needed and are skipped.
 */
function svgPathOps(d) {
  const ops = [];
  const tokens = d.match(/[MmLlHhVvCcSsQqZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let i = 0;
  let cmd = '';
  let x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0;
  const num = () => parseFloat(tokens[i++]);
  const isNum = () => i < tokens.length && !/^[A-Za-z]$/.test(tokens[i]);
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'M': {
        const nx = num(), ny = num();
        x = rel ? x + nx : nx; y = rel ? y + ny : ny;
        sx = x; sy = y; ops.push(moveTo(x, y)); cx = x; cy = y;
        cmd = rel ? 'l' : 'L'; // subsequent pairs are implicit lineTo
        break;
      }
      case 'L': { const nx = num(), ny = num(); x = rel ? x + nx : nx; y = rel ? y + ny : ny; ops.push(lineTo(x, y)); cx = x; cy = y; break; }
      case 'H': { const nx = num(); x = rel ? x + nx : nx; ops.push(lineTo(x, y)); cx = x; cy = y; break; }
      case 'V': { const ny = num(); y = rel ? y + ny : ny; ops.push(lineTo(x, y)); cx = x; cy = y; break; }
      case 'C': {
        const a = num(), b = num(), c = num(), e = num(), f = num(), g = num();
        const x1 = rel ? x + a : a, y1 = rel ? y + b : b, x2 = rel ? x + c : c, y2 = rel ? y + e : e;
        x = rel ? x + f : f; y = rel ? y + g : g;
        ops.push(appendBezierCurve(x1, y1, x2, y2, x, y)); cx = x2; cy = y2;
        break;
      }
      case 'S': {
        const c = num(), e = num(), f = num(), g = num();
        const x1 = 2 * x - cx, y1 = 2 * y - cy;
        const x2 = rel ? x + c : c, y2 = rel ? y + e : e;
        x = rel ? x + f : f; y = rel ? y + g : g;
        ops.push(appendBezierCurve(x1, y1, x2, y2, x, y)); cx = x2; cy = y2;
        break;
      }
      case 'Q': {
        const a = num(), b = num(), f = num(), g = num();
        const qx = rel ? x + a : a, qy = rel ? y + b : b;
        const nx = rel ? x + f : f, ny = rel ? y + g : g;
        // Quadratic -> cubic.
        ops.push(appendBezierCurve(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), nx + (2 / 3) * (qx - nx), ny + (2 / 3) * (qy - ny), nx, ny));
        x = nx; y = ny; cx = qx; cy = qy;
        break;
      }
      case 'Z': ops.push(closePath()); x = sx; y = sy; cx = x; cy = y; if (isNum()) cmd = 'L'; break;
      default: i++; // unsupported command: skip its token
    }
  }
  return ops;
}

function drawFigure(page, view, x0, yTop, widthPt) {
  const fig = FIGURES[view];
  const k = widthPt / VIEW_BOX.width;
  page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(fig.s * k, 0, 0, -fig.s * k, x0 + fig.tx * k, yTop - fig.ty * k),
    setFillingColor(C.ink),
    ...svgPathOps(fig.d),
    PDFOperator.of(PDFOperatorNames.FillEvenOdd),
    popGraphicsState(),
  );
  return widthPt * (VIEW_BOX.height / VIEW_BOX.width);
}

function hexColor(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  return m ? rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255) : C.red;
}

function starPath(cx, cy, outer, inner, points) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)} `;
  }
  return `${d}Z`;
}

/** Marker glyphs mirror components/BodyDiagram.js so print and screen agree. */
function drawMarker(page, type, x, y, scale, types) {
  const t = getType(type, types);
  const s = 6.5 * scale;
  const color = hexColor(t.color);
  const border = { borderColor: C.white, borderWidth: 1 };
  // drawSvgPath treats the path as SVG (y down) hung from the given origin, so
  // with the origin at the top of the page an SVG y of (pageHeight - y) lands
  // exactly at PDF y. `pageY` does that conversion for the shapes below.
  const path = (d) => page.drawSvgPath(d, { x: 0, y: LETTER[1], color, ...border });
  const pageY = (yy) => LETTER[1] - yy;
  switch (t.shape) {
    case 'square':
      page.drawRectangle({ x: x - s, y: y - s, width: s * 2, height: s * 2, color, ...border });
      return;
    case 'diamond':
      path(`M${x},${pageY(y) - s * 1.2} L${x + s * 1.1},${pageY(y)} L${x},${pageY(y) + s * 1.2} L${x - s * 1.1},${pageY(y)} Z`);
      return;
    case 'ring':
      page.drawCircle({ x, y, size: s, color: C.white, borderColor: color, borderWidth: 2.4 });
      return;
    case 'dots':
      page.drawCircle({ x, y, size: s, color: C.white, borderColor: color, borderWidth: 1 });
      for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3], [0, 0]]) page.drawCircle({ x: x + dx * scale, y: y - dy * scale, size: 1.3 * scale, color });
      return;
    case 'star':
      path(starPath(x, pageY(y), s * 1.35, s * 0.5, 4));
      return;
    case 'triangle':
      path(`M${x},${pageY(y) - s * 1.2} L${x + s * 1.1},${pageY(y) + s * 0.85} L${x - s * 1.1},${pageY(y) + s * 0.85} Z`);
      return;
    case 'cross':
      path(`M${x - s * 1.2},${pageY(y) - s * 0.42} h${s * 0.78} v-${s * 0.78} h${s * 0.84} v${s * 0.78} h${s * 0.78} v${s * 0.84} h-${s * 0.78} v${s * 0.78} h-${s * 0.84} v-${s * 0.78} h-${s * 0.78} Z`);
      return;
    case 'hexagon':
      path(starPath(x, pageY(y), s * 1.15, s * 1.15, 3));
      return;
    case 'droplet':
      path(`M${x},${pageY(y) - s * 1.3} C${x + s * 1.15},${pageY(y) - s * 0.1} ${x + s * 0.85},${pageY(y) + s * 1.15} ${x},${pageY(y) + s * 1.15} C${x - s * 0.85},${pageY(y) + s * 1.15} ${x - s * 1.15},${pageY(y) - s * 0.1} ${x},${pageY(y) - s * 1.3} Z`);
      return;
    default:
      page.drawCircle({ x, y, size: s, color, ...border });
  }
}

function painMapSection(w, painMap) {
  w.heading('Body diagram (drawn by the patient)');
  if (!countMarks(painMap)) { w.note(reportsNoPain(painMap) ? 'No pain: the patient chose "No pain" and marked nothing.' : 'No body diagram was completed.'); return; }
  const types = allTypes(painMap);
  const drawable = ['anterior', 'posterior'].filter((v) => (painMap?.[v]?.marks || []).length || (painMap?.[v]?.paths || []).length);
  if (drawable.length) {
    const figW = 150;
    const figH = figW * (VIEW_BOX.height / VIEW_BOX.width);
    w.need(figH + 30);
    const gap = 40;
    const total = drawable.length * figW + (drawable.length - 1) * gap;
    let x = M + (CW - total) / 2;
    const top = w.y - 14;
    for (const view of drawable) {
      const page = w.page;
      page.drawText(enc(VIEW_LABELS[view] || view), { x: x + figW / 2 - 14, y: top + 3, size: 8, font: w.bold, color: C.gray });
      drawFigure(page, view === 'anterior' ? 'front' : 'back', x, top, figW);
      const k = figW / VIEW_BOX.width;
      const data = painMap[view] || {};
      for (const p of data.paths || []) {
        const pts = (p.points || []).map((pt) => ({ x: x + pt.x * VIEW_BOX.width * k, y: top - pt.y * VIEW_BOX.height * k }));
        for (let i = 1; i < pts.length; i++) {
          page.drawLine({ start: pts[i - 1], end: pts[i], thickness: 3, color: hexColor(getType(p.type, types).color), opacity: 0.85 });
        }
      }
      for (const m of data.marks || []) {
        drawMarker(page, m.type, x + m.x * VIEW_BOX.width * k, top - m.y * VIEW_BOX.height * k, 0.7, types);
      }
      x += figW + gap;
    }
    w.y = top - figH - 8;
    // Legend for the marker types actually used.
    const used = new Set();
    for (const v of VIEWS) { for (const m of painMap?.[v]?.marks || []) used.add(m.type); for (const p of painMap?.[v]?.paths || []) used.add(p.type); }
    const legend = types.filter((t) => used.has(t.id));
    let lx = M;
    w.need(16);
    for (const t of legend) {
      drawMarker(w.page, t.id, lx + 6, w.y - 5, 0.6, types);
      const lab = enc(t.label);
      w.page.drawText(lab, { x: lx + 16, y: w.y - 8, size: 8, font: w.font, color: C.ink });
      lx += 22 + w.font.widthOfTextAtSize(lab, 8) + 10;
      if (lx > LETTER[0] - M - 90) { lx = M; w.y -= 13; w.need(16); }
    }
    w.y -= 16;
  }
  w.subheading('In words');
  w.text(summarizePainMap(painMap), { size: 9 });
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function regionLabel(w, id) {
  return w.service.constants.SYMPTOM_REGIONS.find((r) => r.id === id)?.label || id;
}

function header(w, intake, meta) {
  const page = w.page;
  const top = LETTER[1] - M + 8;
  page.drawText(enc(PRACTICE.surgeon), { x: M, y: top - 16, size: 15, font: w.bold, color: C.navy });
  page.drawText(enc(w.wording.credential), { x: M, y: top - 30, size: 9.5, font: w.font, color: C.teal });
  w.y = top - 44;
  page.drawLine({ start: { x: M, y: w.y }, end: { x: LETTER[0] - M, y: w.y }, thickness: 1.2, color: C.tealSoft });
  w.y -= 14;
  page.drawText('PATIENT INTAKE TRANSCRIPT', { x: M, y: w.y - 14, size: 16, font: w.bold, color: C.navy });
  w.y -= 20;
  const d = intake.demographics || {};
  const name = [d.lastName, d.firstName].filter(Boolean).join(', ') || 'Unnamed patient';
  page.drawText(enc(name), { x: M, y: w.y - 14, size: 13, font: w.bold, color: C.ink });
  w.y -= 18;
  const visitLabel = VISIT_LABEL[intake.visit?.type] || d.visitReason;
  const line = [d.dob && `DOB ${fmtDate(d.dob)}`, d.age && `${d.age} y/o`, d.sex, visitLabel, meta.submittedAt && `Submitted ${fmtDateTime(meta.submittedAt)}`].filter(Boolean).join('  ·  ');
  page.drawText(enc(line), { x: M, y: w.y - 10, size: 9, font: w.font, color: C.gray });
  w.y -= 14;
  page.drawText(enc(`Submission ${meta.submissionId || ''}${intake.language && intake.language !== 'en' ? `  ·  completed in ${{ es: 'Spanish', zh: 'Chinese', pt: 'Portuguese', ru: 'Russian', pl: 'Polish', ar: 'Arabic', he: 'Hebrew', ko: 'Korean', ja: 'Japanese', hi: 'Hindi', ne: 'Nepali' }[intake.language] || intake.language}` : ''}`), { x: M, y: w.y - 10, size: 8, font: w.font, color: C.gray });
  w.y -= 16;
}

function redFlagSection(w, flags) {
  const urgent = (flags || []).filter((f) => f.severity === 'urgent');
  const other = (flags || []).filter((f) => f.severity !== 'urgent');
  if (!urgent.length && !other.length) return;
  w.heading('Screening flags (from patient answers; not a diagnosis)');
  for (const f of urgent) w.text(`URGENT: ${f.label}`, { size: 9.5, bold: true, color: C.red });
  for (const f of other) w.text(f.label, { size: 9.2, color: C.amber });
}

function demographicsSection(w, intake) {
  const d = intake.demographics || {};
  w.heading('Patient information');
  w.kv('Name', `${d.firstName || ''} ${d.lastName || ''}`.trim());
  w.kv('Date of birth', fmtDate(d.dob));
  w.kv('Age', d.age);
  w.kv('Sex', d.sex);
  w.kv('Phone', d.phone);
  w.kv('Email', d.email);
  w.kv('Address', [d.address, [d.city, d.state].filter(Boolean).join(', '), d.zip].filter(Boolean).join(' '));
  w.kv('Country', d.country);
  w.kv('Insurance', [d.insuranceProvider, d.memberId && `ID ${d.memberId}`, d.groupNumber && `Group ${d.groupNumber}`, d.insurancePhone && `ph ${d.insurancePhone}`].filter(Boolean).join(' · '));
  w.kv('Policy holder', [d.policyHolderName, d.policyHolderRelationship, d.policyHolderDob && `DOB ${fmtDate(d.policyHolderDob)}`].filter(Boolean).join(' · '));
  w.kv('Secondary insurance', [d.secondaryInsurance, d.secondaryMemberId && `ID ${d.secondaryMemberId}`, d.secondaryGroupNumber && `Group ${d.secondaryGroupNumber}`].filter(Boolean).join(' · '));
  w.kv('Referring physician', [d.referringPhysician, d.referringPhone && `ph ${d.referringPhone}`, d.referringFax && `fax ${d.referringFax}`].filter(Boolean).join(' · '));
  w.kv('Primary care physician', [d.primaryCarePhysician, d.pcpPhone && `ph ${d.pcpPhone}`, d.pcpFax && `fax ${d.pcpFax}`].filter(Boolean).join(' · '));
  w.kv('Emergency contact', [d.emergencyContactName, d.emergencyContactRelation, d.emergencyContactPhone].filter(Boolean).join(' · '));
  w.kv('Reason for visit', VISIT_LABEL[intake.visit?.type] || d.visitReason);
}

/**
 * The answers that belong to this kind of visit: the claim and injury for a
 * work-related case, the interval history for a follow-up, the operation and
 * recovery for a post-operative visit. Nothing for a plain new patient.
 */
function visitSection(w, intake) {
  const v = intake.visit || {};
  const yesNo = (x) => x || '';
  if (v.type === 'workers_comp') {
    const c = v.wc || {};
    w.heading("Workers' compensation claim");
    w.kv('Claim number', c.claimNumber);
    w.kv('Date of injury', fmtDate(c.dateOfInjury));
    w.kv('Employer', c.employer);
    w.kv('Job title', c.jobTitle);
    w.kv('Carrier / administrator', c.carrier);
    w.kv('Adjuster', [c.adjusterName, c.adjusterContact].filter(Boolean).join(' · '));
    w.kv('Nurse case manager', c.caseManager);
    w.kv('Attorney', c.attorney === 'Yes' ? c.attorneyName || 'Yes' : yesNo(c.attorney));
    w.subheading('Injury');
    w.kv('Mechanism (patient\'s words)', c.mechanism);
    w.kv('Reported to employer', [c.reported, c.reportedDate && fmtDate(c.reportedDate)].filter(Boolean).join(' · '));
    w.kv('Other providers seen', c.otherProviders);
    w.kv('Prior claims (back/neck)', c.priorClaims === 'Yes' ? c.priorClaimsDetails || 'Yes' : yesNo(c.priorClaims));
    w.subheading('Work status');
    w.kv('Working now', [c.workStatus, c.workStatusSince && `since ${fmtDate(c.workStatusSince)}`].filter(Boolean).join(' · '));
    w.kv('Restrictions', c.restrictions);
    w.kv('Job demands', c.jobDemands);
    return;
  }
  if (v.type === 'personal_injury') {
    const p = v.pi || {};
    w.heading('Injury with a legal claim');
    w.kv('Date of injury', fmtDate(p.dateOfInjury));
    w.kv('Time', p.timeOfInjury);
    w.kv('Place', p.place);
    w.kv('Type', p.accidentType);
    w.kv('Role', p.role);
    w.kv('Seat belt / airbags', [p.seatBelt && `belt: ${p.seatBelt}`, p.airbags && `airbags: ${p.airbags}`].filter(Boolean).join(' · '));
    w.kv('Impact', p.impact);
    w.kv('Mechanism (patient\'s words)', p.mechanism);
    w.subheading('Right after');
    w.kv('Lost consciousness', p.lostConsciousness);
    w.kv('Care that day', [p.careThatDay, p.careWhere].flat().filter(Boolean).join(' · '));
    w.kv('Imaging soon after', p.imagingSoonAfter);
    w.kv('Symptom onset', p.onsetTiming);
    w.subheading('Before the injury');
    w.kv('Same region before', p.priorSameRegion === 'Yes' ? p.priorSameRegionDetails || 'Yes' : yesNo(p.priorSameRegion));
    w.kv('Earlier claims', p.priorClaims === 'Yes' ? p.priorClaimsDetails || 'Yes' : yesNo(p.priorClaims));
    w.kv(w.wording.priorTreatment, p.priorSpineTreatment === 'Yes' ? p.priorSpineTreatmentDetails || 'Yes' : yesNo(p.priorSpineTreatment));
    w.subheading('Since the injury');
    w.kv('Providers seen', p.providersSince);
    w.kv('Treatment so far', p.treatmentSince);
    w.kv('Work', [p.workStatus, p.workDetails].filter(Boolean).join(' · '));
    w.kv('Activities lost', p.activitiesLost);
    w.subheading('The claim');
    w.kv('Attorney', [p.attorneyName, p.attorneyFirm, p.attorneyContact].filter(Boolean).join(' · '));
    w.kv('Claim / case number', p.claimNumber);
    w.kv('Insurer', p.insurer);
    w.kv('Letter of protection', p.letterOfProtection);
    w.kv('Report requested', p.reportRequested);
    w.kv('Release to attorney / insurer', p.ackRelease ? 'AGREED' : 'not agreed');
    w.kv('Records may be subpoenaed', p.ackRecords ? 'AGREED' : 'not agreed');
    return;
  }
  if (v.type === 'followup') {
    const f = v.followup || {};
    w.heading('Since the last visit');
    w.kv('Last visit', f.lastVisitWhen);
    w.kv('Compared with last visit', f.overallChange);
    w.kv('What changed', f.whatChanged);
    w.kv('Pain today (0-10)', f.painNow);
    w.kv('Pain at last visit (0-10)', f.painThen);
    w.kv('New symptoms', f.newSymptoms === 'Yes' ? f.newSymptomsDetails || 'Yes' : yesNo(f.newSymptoms));
    w.subheading('Tried since the last visit');
    w.kv('Treatments', f.treatments);
    w.kv('Physical therapy', f.ptDetails);
    w.kv('Injection', f.injectionDetails);
    w.kv('Medication change', f.medicationDetails);
    w.kv('New imaging', f.imagingDetails);
    w.kv('Surgery elsewhere', f.surgeryDetails);
    w.kv('Chiropractic / acupuncture', f.otherDetails);
    w.kv('Goals for this visit', f.goals);
    return;
  }
  if (v.type === 'postop') {
    const p = v.postop || {};
    const { sortOperations, mostRecentOperation, fmtOperationDate, levelsText, intervalSince } = w.service.operations;
    w.heading('Surgery and recovery');
    const ops = sortOperations(p.operations || []);
    if (!ops.length) w.note('No operation recorded.');
    else {
      w.table(
        [{ key: 'n', label: '#', w: 0.05 }, { key: 'procedure', label: 'Procedure', w: 0.3 }, { key: 'levels', label: 'Levels', w: 0.15 }, { key: 'date', label: 'When', w: 0.14 }, { key: 'kind', label: 'First / revision', w: 0.18 }, { key: 'where', label: 'Where', w: 0.18 }],
        ops.map((o, i) => ({ n: String(i + 1), procedure: o.procedure || '', levels: levelsText(o), date: fmtOperationDate(o), kind: o.kind || '', where: String(o.surgeon || '').trim() || (o.where === 'With another surgeon' ? 'Another surgeon' : (o.where ? 'This practice' : '')) })),
      );
      const recent = mostRecentOperation(ops);
      w.kv('Most recent operation', `${recent?.procedure || ''} (${fmtOperationDate(recent)})`);
      w.kv('Time since, at submission', intervalSince(recent) || 'unknown');
    }
    w.kv('Reason for this visit', p.reason);
    w.subheading('Postoperative course');
    w.kv('Incision', p.wound);
    w.kv('Events since surgery', p.complications);
    w.kv('Details', p.complicationDetails);
    w.subheading('Symptoms now');
    w.kv('Pain vs. before surgery', p.painVsBefore);
    w.kv('Pain today (0-10)', p.painNow);
    w.kv(w.wording.limbSymptoms, p.limbSymptoms);
    w.kv('Numbness / weakness', [p.neuro, p.neuroDetails].filter(Boolean).join(' · '));
    // The spine asks about the bowel and bladder; a bone or joint about the
    // circulation, motion and weight bearing. kv() skips what was not asked.
    w.kv('New bowel / bladder trouble', p.bowelBladder);
    w.kv('Hand or foot beyond it', p.circulation);
    w.kv('Joint motion', p.motion);
    w.subheading('Activity and medicines');
    w.kv('Walking', p.walking);
    w.kv('Weight bearing', p.weightBearing);
    w.kv(w.wording.brace, p.brace);
    w.kv('Physical therapy', p.pt);
    w.kv('Work', p.work);
    w.kv('Opioid use', [p.opioids, p.opioidDetails].filter(Boolean).join(' · '));
    w.kv('New medicines since surgery', p.newMedicines);
    w.kv('Questions for this visit', p.questions);
  }
}

/** The express request (lib/express.js): what the website chat collected, and the chat itself. */
function expressSection(w, intake) {
  if (!isExpressLead(intake)) return;
  const x = intake.express || {};
  w.heading('Express appointment request (website chat)');
  w.note('A short request from the website chat, not a completed intake: the office calls the patient to schedule. No history, examination, imaging or questionnaire was obtained.');
  w.kv('Received', fmtDateTime(x.completedAt));
  w.kv('Language for the call', LANGUAGE_NAMES[x.callLanguage || intake.language] || x.callLanguage || '');
  w.kv('Safety screen', SAFETY_SUMMARY[x.safety] || SAFETY_SUMMARY['']);
  w.kv('Went on to the full intake', x.continuedAt ? fmtDateTime(x.continuedAt) : 'Not yet');
  const msgs = (x.transcript || []).filter((m) => m && m.content);
  if (msgs.length) {
    w.subheading('Chat transcript');
    for (const m of msgs) {
      const who = m.role === 'user' ? 'Patient' : 'Assistant';
      w.need(24);
      w.text(who, { size: 8, bold: true, color: m.role === 'user' ? C.navy : C.teal });
      w.text(m.content, { size: 9, indent: 10, color: m.role === 'user' ? C.ink : C.gray });
      w.gap(3);
    }
  }
}

function chiefComplaintSection(w, intake) {
  const cc = intake.chiefComplaint || {};
  w.heading('Chief complaint');
  w.kv('Main reason', cc.mainReason);
  w.kv('Duration', cc.duration);
  w.kv('Symptom areas', (cc.symptomRegions || []).map((id) => regionLabel(w, id)));
  w.kv('Primary concern', cc.primaryConcern);
  w.kv(w.wording.priorSurgery, cc.hasPriorSpineSurgery ? 'Yes' : 'No');
  w.kv('Deformity concern', cc.hasDeformityConcern ? 'Yes' : '');
}

function symptomsSection(w, intake) {
  const hpi = intake.hpiData || {};
  const { PROBLEM_LABEL } = w.service.problems;
  const problems = Object.entries(hpi.problems || {});
  const regions = Object.entries(hpi.symptoms || {});
  w.heading('Symptom details');
  if (!problems.length && !regions.length) w.note('No structured symptom details recorded.');
  for (const [id, fields] of problems) {
    w.subheading(`${PROBLEM_LABEL[id] || id}${hpi.primaryProblem === id ? ' (bothers the patient most)' : ''}`);
    for (const [k, v] of Object.entries(fields || {})) w.kv(label(k), v);
  }
  for (const [region, fields] of regions) {
    w.subheading(regionLabel(w, region));
    for (const [k, v] of Object.entries(fields || {})) w.kv(label(k), v);
  }
  if (hpi.overall && Object.keys(hpi.overall).length) {
    w.subheading('Overall');
    for (const [k, v] of Object.entries(hpi.overall)) w.kv(label(k), v);
  }
  if (hpi.additionalConcerns) w.kv('Additional concerns', hpi.additionalConcerns);
  const prior = hpi.priorSpineSurgeries || [];
  if (prior.length) {
    w.subheading(w.wording.priorSurgery);
    w.table(
      [{ key: 'procedure', label: 'Procedure', w: 0.3 }, { key: 'level', label: w.wording.opLevel, w: 0.14 }, { key: 'year', label: 'When', w: 0.12 }, { key: 'surgeon', label: 'Surgeon / hospital', w: 0.24 }, { key: 'outcome', label: 'Outcome', w: 0.2 }],
      prior.map((s) => ({ procedure: s.procedure || s.type || '', level: s.level || '', year: s.year || s.date || '', surgeon: [s.surgeon, s.hospital].filter(Boolean).join(', '), outcome: s.outcome || s.helped || s.details || '' })),
    );
  }
}

function conversationSection(w, intake) {
  const msgs = (intake.hpiData?.conversationHistory || []).filter((m) => m && m.content);
  w.heading('Guided interview transcript');
  if (!msgs.length) { w.note('The guided interview was not used.'); return; }
  w.note(`${msgs.length} messages. The assistant gathers history only and gives no medical advice.`);
  for (const m of msgs) {
    const who = m.role === 'user' ? 'Patient' : 'Assistant';
    w.need(24);
    w.text(who, { size: 8, bold: true, color: m.role === 'user' ? C.navy : C.teal });
    w.text(m.content, { size: 9, indent: 10, color: m.role === 'user' ? C.ink : C.gray });
    w.gap(3);
  }
}

function treatmentsSection(w, intake) {
  const tx = intake.hpiData?.conservativeTreatments || {};
  const ev = intake.authEvidence || {};
  w.heading('Conservative treatment history');

  const pt = tx.physicalTherapy || {};
  w.subheading('Physical therapy');
  if (!pt.tried) w.text('Not tried.', { size: 9.2 });
  else {
    w.kv('Facility', pt.facility); w.kv('Therapist', pt.provider); w.kv('Duration', pt.duration); w.kv('Frequency', pt.frequency); w.kv('Response', pt.helped); w.kv('Details', pt.details);
  }
  const hep = tx.homeExercise || {};
  w.subheading('Home exercise program');
  if (!hep.tried) w.text('Not tried.', { size: 9.2 });
  else { w.kv('Guided by', hep.guided); w.kv('App / service', hep.appService); w.kv('Duration', hep.duration); w.kv('Frequency', hep.frequency); w.kv('Details', hep.details); }

  const meds = tx.medicationsTried || [];
  w.subheading('Medications tried for this problem');
  if (!meds.length) w.text('None recorded.', { size: 9.2 });
  else for (const m of meds) w.bullet(typeof m === 'string' ? m : str(m));

  const chiro = tx.chiropracticCare || {}; const acu = tx.acupuncture || {}; const brace = tx.braces || {};
  w.subheading('Other treatments');
  w.kv('Chiropractic', chiro.tried ? [chiro.duration, chiro.helped].filter(Boolean).join(' · ') || 'Yes' : 'No');
  w.kv('Acupuncture', acu.tried ? [acu.duration, acu.helped].filter(Boolean).join(' · ') || 'Yes' : 'No');
  w.kv('Bracing', brace.tried ? [brace.type, brace.helped].filter(Boolean).join(' · ') || 'Yes' : 'No');

  const inj = tx.injections || [];
  w.subheading('Injections');
  if (!inj.length) w.text('None recorded.', { size: 9.2 });
  else w.table(
    [{ key: 'type', label: 'Type', w: 0.26 }, { key: 'when', label: 'When', w: 0.14 }, { key: 'count', label: 'How many', w: 0.1 }, { key: 'where', label: 'Where / by whom', w: 0.26 }, { key: 'helped', label: 'Response', w: 0.24 }],
    inj.map((i) => ({ type: i.type || '', when: i.when || i.date || '', count: i.count || '', where: [i.facility, i.provider, i.level].filter(Boolean).join(', '), helped: [i.helped, i.duration && `relief ${i.duration}`, i.details].filter(Boolean).join(' · ') })),
  );

  w.subheading('Imaging and nerve studies');
  w.kv('Prior imaging', (tx.priorImaging || []).filter((x) => x && x !== 'None'));
  const studies = ev.imagingStudies || [];
  if (studies.length) w.table(
    [{ key: 'study', label: 'Study', w: 0.22 }, { key: 'date', label: 'Date', w: 0.16 }, { key: 'facility', label: 'Facility', w: 0.36 }, { key: 'has', label: 'On hand', w: 0.26 }],
    studies.map((s) => ({ study: s.study, date: s.date || '', facility: s.facility || '', has: [s.hasReport && 'report', s.hasImages && 'images'].filter(Boolean).join(', ') })),
  );
  const emg = tx.priorEMG || {};
  w.kv('EMG / nerve study', emg.done ? [emg.when, emg.facility, emg.provider, emg.results].filter(Boolean).join(' · ') || 'Yes' : 'No');

  const trials = ev.medicationTrials || [];
  if (trials.length || ev.conservativeCareStart || ev.nicotineCurrent) {
    w.subheading('Prior-authorization details');
    if (trials.length) w.table(
      [{ key: 'drugClass', label: 'Class', w: 0.3 }, { key: 'name', label: 'Medication', w: 0.25 }, { key: 'duration', label: 'Duration', w: 0.2 }, { key: 'helped', label: 'Response', w: 0.25 }],
      trials,
    );
    w.kv('Conservative care from', [ev.conservativeCareStart, ev.conservativeCareEnd].filter(Boolean).join(' to '));
    w.kv('Nicotine', [ev.nicotineCurrent, ev.nicotineProduct, ev.nicotineQuitDate && `quit ${ev.nicotineQuitDate}`, ev.nicotineWillingToQuit && `willing to quit: ${ev.nicotineWillingToQuit}`].filter(Boolean).join(' · '));
    w.kv('Records notes', ev.recordsNotes);
  }
}

function historySections(w, intake) {
  const pmh = intake.pastMedicalHistory || {};
  w.heading('Past medical history');
  const conds = pmh.conditions || [];
  if (!conds.length) w.text('None reported.', { size: 9.2 });
  for (const c of conds) w.kv(c.name || str(c), [c.yearDiagnosed, c.details].filter(Boolean).join(' · ') || 'Reported');
  w.kv('Implanted devices', pmh.implantedDevices);
  w.kv('Notes', pmh.additionalNotes);

  const psh = intake.pastSurgicalHistory || {};
  w.heading('Past surgical history');
  const surg = psh.surgeries || [];
  if (!surg.length) w.text('None reported.', { size: 9.2 });
  else w.table(
    [{ key: 'type', label: 'Surgery', w: 0.34 }, { key: 'date', label: 'When', w: 0.16 }, { key: 'bodyRegion', label: 'Region', w: 0.2 }, { key: 'rest', label: 'Notes', w: 0.3 }],
    surg.map((s) => ({ type: s.type || '', date: s.date || s.year || '', bodyRegion: s.bodyRegion || '', rest: [s.surgeon, s.hospital, s.helped, s.details].filter(Boolean).join(' · ') })),
  );

  const meds = intake.medications || {};
  w.heading('Medications');
  if (meds.noMedications) w.text('No current medications.', { size: 9.2 });
  else {
    const cur = meds.current || [];
    if (!cur.length) w.text('None listed.', { size: 9.2 });
    else w.table(
      [{ key: 'name', label: 'Medication', w: 0.3 }, { key: 'dose', label: 'Dose', w: 0.16 }, { key: 'frequency', label: 'Frequency', w: 0.18 }, { key: 'reason', label: 'Reason', w: 0.26 }, { key: 'flag', label: '', w: 0.1 }],
      cur.map((m) => ({ ...m, flag: m.isAnticoagulant ? 'ANTICOAG' : '' })),
    );
    const disc = meds.discontinued || [];
    if (disc.length) { w.subheading('Discontinued'); for (const m of disc) w.bullet(str(m)); }
  }

  const alg = intake.allergies || {};
  w.heading('Allergies');
  if (alg.nkda) w.text('No known drug allergies (NKDA).', { size: 9.2 });
  else {
    const list = alg.entries || [];
    if (!list.length) w.text('None listed.', { size: 9.2 });
    for (const a of list) w.kv(a.allergen || str(a), [a.type, a.reaction, a.severity].filter(Boolean).join(' · '));
  }

  const soc = intake.socialHistory || {};
  w.heading('Social history');
  for (const [k, v] of Object.entries(soc)) w.kv(label(k), v);

  const fam = intake.familyHistory || {};
  w.heading('Family history');
  if (fam.noRelevantHistory) w.text('No relevant family history.', { size: 9.2 });
  else {
    const list = fam.entries || [];
    if (!list.length) w.text('None listed.', { size: 9.2 });
    for (const e of list) w.kv(e.relation || 'Relative', [e.condition, e.details].filter(Boolean).join(' · '));
  }
}

function rosSection(w, intake) {
  const ros = intake.reviewOfSystems || {};
  const { ROS_SECTIONS, countReviewedSystems } = w.service.rosSystems;
  w.heading(`Review of systems (${countReviewedSystems(ros)} of ${ROS_SECTIONS.length} systems reviewed)`);
  for (const s of ROS_SECTIONS) {
    const answers = ros[s.id] || {};
    const answered = s.questions.filter((q) => !!answers[q.id]);
    if (!answered.length) { w.kv(s.system, 'not reviewed'); continue; }
    const pos = s.questions.filter((q) => answers[q.id] === 'yes').map((q) => q.label.replace(/\?$/, ''));
    w.kv(s.system, pos.length ? `POSITIVE: ${pos.join('; ')}` : 'Negative');
  }
  w.kv('Patient comments', ros.additionalNotes);
}

function promSection(w, intake) {
  const detail = w.service.promSummary.promDetail(intake.proms);
  w.heading('Patient-reported outcome measures');
  if (!detail.length) { w.note('None completed.'); return; }
  for (const d of detail) {
    w.subheading(`${d.name}${d.headline ? ` — ${d.headline}` : ''}`);
    if (d.domainScores) for (const dom of Object.values(d.domainScores)) w.kv(dom.name, `${dom.score} of 5`);
    for (const item of d.items) w.kv(item.title, item.answer, { labelW: 170 });
    if (d.itemsAreFindings) w.note('These items are a myelopathy history (hand function, gait, sphincter control), not only a score.');
  }
}

function attachmentsSection(w, attachments) {
  w.heading('Records attached by the patient');
  if (!attachments?.length) { w.note('No records were attached. The office may request them separately.'); return; }
  const catLabel = (id) => DOCUMENT_CATEGORIES.find((c) => c.id === id)?.label || 'Other';
  w.table(
    [{ key: 'cat', label: 'Category', w: 0.32 }, { key: 'name', label: 'File', w: 0.48 }, { key: 'size', label: 'Size', w: 0.2 }],
    attachments.map((a) => ({ cat: catLabel(a.category), name: a.name, size: a.size ? `${(a.size / 1024).toFixed(0)} KB` : '' })),
  );
}


/** The signature the patient drew, placed as the image they produced. Returns false when there is none. */
async function drawSignature(w, dataUrl, label = 'Signature') {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) return false;
  let png;
  try { png = await w.doc.embedPng(Buffer.from(m[1], 'base64')); } catch { return false; }
  const bold = (w.f && w.f.bold) || w.bold;
  const width = Math.min(260, png.width);
  const height = png.height * (width / png.width);
  w.need(height + 30);
  w.page.drawText(enc(label), { x: M, y: w.y - 9, size: 8.6, font: bold, color: C.gray });
  w.page.drawImage(png, { x: M + 150, y: w.y - height - 2, width, height });
  w.page.drawLine({ start: { x: M + 150, y: w.y - height - 5 }, end: { x: M + 150 + width, y: w.y - height - 5 }, thickness: 0.6, color: C.gray });
  w.y -= height + 14;
  return true;
}

async function consentSection(w, intake) {
  const c = intake.consent || {};
  w.heading('Acknowledgments and signature');
  const SHORT = { accurate: 'Accuracy', financial: 'Financial / benefits', sharing: 'Sharing with providers', privacy: 'Privacy notice', contact: 'Contact / emergencies' };
  for (const item of CONSENT_ITEMS) {
    w.kv(SHORT[item.key] || item.label, c[item.key] ? `AGREED. ${item.text}` : 'NOT agreed', { labelW: 150 });
  }
  w.kv('Name (printed)', c.signatureName);
  w.kv('Signed', fmtDateTime(c.signedAt));
  if (c.representativeName) w.kv('Completed by', [c.representativeName, c.representativeRelationship].filter(Boolean).join(' · '));
  const drawn = await drawSignature(w, c.signatureImage, 'Signature');
  if (!drawn) w.kv('Signature', c.signatureName ? `${c.signatureName} (typed)` : '');
  w.note('Electronic acknowledgment captured on the intake site at submission; the statements are shown in English as filed, and were presented to the patient in the language they chose.');
}

function correctionsSection(w, intake) {
  const list = (intake.noteCorrections || []).filter((c) => c && c.comment);
  if (!list.length) return;
  w.heading("Patient's corrections to the draft note");
  for (const c of list) {
    if (c.excerpt) w.text(`Regarding: "${String(c.excerpt).slice(0, 240)}"`, { size: 8.5, italic: true, color: C.gray });
    w.bullet(c.comment);
  }
}

function noteSection(w, note) {
  if (!note?.narrative) return;
  w.heading('Draft pre-visit note (AI-generated from the answers above; for physician review)');
  w.note(`Generated ${fmtDateTime(note.generatedAt)}${note.modelId ? ` · ${note.modelId}` : ''}. Not part of the medical record until reviewed, edited and signed by the physician.`);
  const blocks = String(note.narrative).split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  for (const b of blocks) {
    const m = /^([A-Z][A-Z /&()\-]{3,}):\s*([\s\S]*)$/.exec(b);
    if (m) {
      w.subheading(m[1]);
      if (m[2]) w.text(m[2], { size: 9.2 });
    } else w.text(b, { size: 9.2 });
    w.gap(2);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * @param {object} args
 * @param {object} args.intake      full intake data
 * @param {object} [args.note]      { narrative, generatedAt, modelId }
 * @param {object[]} [args.redFlags]
 * @param {object[]} [args.attachments] [{ name, category, size }]
 * @param {object} [args.meta]      { submissionId, submittedAt }
 * @returns {Promise<Uint8Array>}
 */
export async function buildIntakeTranscriptPdf({ intake, note = null, redFlags = [], attachments = [], meta = {} }) {
  const doc = await PDFDocument.create();
  doc.setTitle(enc(`Intake transcript — ${[intake.demographics?.lastName, intake.demographics?.firstName].filter(Boolean).join(', ') || 'patient'}`));
  doc.setAuthor(PRACTICE.surgeon);
  // The service (lib/service.js) names the modules the sections read from.
  const service = getService(intake.service?.key);
  doc.setCreator(WORDING[service.specialty].creator);
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };

  const d = intake.demographics || {};
  const running = `${[d.lastName, d.firstName].filter(Boolean).join(', ') || 'Patient'}  ·  DOB ${fmtDate(d.dob) || '—'}  ·  Intake transcript  ·  ${PRACTICE.surgeon}`;
  const w = new Writer(doc, fonts, running);
  w.service = service;
  w.wording = WORDING[service.specialty];

  header(w, intake, meta);
  expressSection(w, intake);
  demographicsSection(w, intake);
  visitSection(w, intake);
  chiefComplaintSection(w, intake);
  painMapSection(w, intake.painMap);
  symptomsSection(w, intake);
  conversationSection(w, intake);
  treatmentsSection(w, intake);
  historySections(w, intake);
  rosSection(w, intake);
  promSection(w, intake);
  attachmentsSection(w, attachments);
  await consentSection(w, intake);
  correctionsSection(w, intake);

  // Page numbers.
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const s = `Page ${i + 1} of ${pages.length}`;
    p.drawText(s, { x: LETTER[0] - M - fonts.regular.widthOfTextAtSize(s, 8), y: 30, size: 8, font: fonts.regular, color: C.gray });
    p.drawText('Confidential: contains protected health information.', { x: M, y: 30, size: 8, font: fonts.regular, color: C.gray });
  });

  return doc.save();
}
