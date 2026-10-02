/**
 * Build the fillable PDF version of the spine intake.
 *
 *   node scripts/build-intake-pdf.mjs
 *   node scripts/build-intake-pdf.mjs --office-email=someone@holyname.org
 *
 * Writes forms/Spine-Intake-Form.pdf — a form the office emails to a new
 * patient, who fills it in and emails it back with their treatment records.
 *
 * HOW THE BRANCHING WORKS
 *
 * A PDF page cannot reflow, so a section that does not apply is hidden rather
 * than removed. Everything inside a conditional block — including its labels,
 * which are drawn as read-only fields for exactly this reason — is registered
 * under a group name. A document script (siRefresh) decides which groups show,
 * and a hidden calculated field re-runs it whenever any answer changes.
 *
 * That is how "add an earlier round of physical therapy" works: round 1
 * appears when Physical therapy is ticked, and each round carries a checkbox
 * that reveals the one before it. Injections chain the same way.
 *
 * The file is saved with every block VISIBLE. A viewer without PDF JavaScript
 * (Apple Preview, most phone mail previews) therefore shows the whole form —
 * longer, but complete and usable — instead of a form with pieces missing.
 *
 * The body diagram needs no script: it is a grid of checkboxes laid over the
 * traced figure, only where there is body. A click marks a cell, a second
 * click clears it, and each cell's tooltip is its anatomical zone.
 *
 * Content comes from the app's own modules (questionnaires, review of
 * systems, condition lists), so this form and the web intake cannot drift.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const {
  PDFDocument, StandardFonts, rgb, PDFName, PDFString, PDFHexString, PDFOperator,
  PDFOperatorNames, pushGraphicsState, popGraphicsState, concatTransformationMatrix,
  setFillingColor,
} = require('pdf-lib');
const { svgPathToOperators } = require('pdf-lib/cjs/api/svgPath');
const { Jimp } = require('jimp');

const ROOT = process.cwd();
const arg = (flag) => {
  const a = process.argv.find((x) => x.startsWith(`--${flag}=`));
  return a ? a.slice(flag.length + 3) : '';
};

const CONFIG = {
  surgeon: 'Aaron Wey, MD, FAAOS, FACS',
  surgeonShort: 'Dr. Wey',
  credential: 'Adult and Pediatric Spine Surgeon',
  practice: 'Comprehensive Spine & Scoliosis Center',
  institution: 'Holy Name',
  formTitle: 'New Patient Intake Form',
  // The surgeon's WORK address. Never a personal one on patient-facing material.
  officeEmail: arg('office-email') || process.env.OFFICE_EMAIL || 'awey@holyname.org',
  logoPath: path.join(ROOT, 'assets', 'holy-name-logo.png'),
  out: path.join(ROOT, 'forms', 'Spine-Intake-Form.pdf'),
};

// ---------------------------------------------------------------------------
// App data. lib/ is ESM inside a CommonJS package, so the modules are staged
// as .mjs copies for the duration of the build.
// ---------------------------------------------------------------------------
const TMP = path.join(ROOT, '.pdf-tmp');
async function loadLib() {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  const out = {};
  try {
    for (const name of ['constants', 'questionnaires', 'rosSystems', 'bodyMap']) {
      fs.copyFileSync(path.join(ROOT, 'lib', `${name}.js`), path.join(TMP, `${name}.mjs`));
      out[name] = await import(pathToFileURL(path.join(TMP, `${name}.mjs`)).href);
    }
  } finally {
    fs.rmSync(TMP, { recursive: true, force: true });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Palette — Holy Name's own, read from their site stylesheet.
// ---------------------------------------------------------------------------
const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  navy: hex('#123559'),
  teal: hex('#38BFBD'),
  tealDark: hex('#1F8F8D'),
  intro: hex('#27557D'),
  ink: hex('#1D2C3C'),
  gray: hex('#5B6770'),
  rule: hex('#D5DDE2'),
  tint: hex('#E3F3F3'),
  fieldBg: hex('#EFF8F7'),
  fieldBorder: hex('#A3D6D2'),
  red: hex('#B3261E'),
  redBg: hex('#FBE4E2'),
  white: rgb(1, 1, 1),
};
const comps = (c) => `${c.red.toFixed(4)} ${c.green.toFixed(4)} ${c.blue.toFixed(4)}`;

const PAGE = { w: 612, h: 792 };
const M = 40;
const CW = PAGE.w - M * 2;
const BOTTOM = 54;

// Characters the standard PDF fonts cannot encode.
const sanitize = (s) => String(s)
  .replace(/[→➔➜]/g, '>')
  .replace(/≥/g, 'at least ')
  .replace(/≤/g, 'at most ')
  .replace(/—/g, '-')
  .replace(/[☐☑]/g, '')
  .replace(/ /g, ' ');

async function main() {
  const lib = await loadLib();
  const { ODI, NDI, MJOA } = lib.questionnaires;
  const { ROS_SECTIONS } = lib.rosSystems;
  const { COMMON_CONDITIONS, IMPLANTED_DEVICES } = lib.constants;
  const { zoneAt, VIEW_BOX } = lib.bodyMap;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`New Patient Spine Intake - ${CONFIG.surgeon}`);
  pdf.setAuthor(CONFIG.surgeon);
  pdf.setSubject('New patient intake: history, prior non-operative care, and records checklist');
  pdf.setCreator('scripts/build-intake-pdf.mjs');
  pdf.catalog.set(PDFName.of('Lang'), PDFString.of('en-US'));

  const reg = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const ital = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const form = pdf.getForm();
  const ctx = pdf.context;

  const pages = [];
  let page = null;
  let y = 0;
  const names = new Set();

  // ---- conditional groups ---------------------------------------------------
  // While a group is open, every field created — and every piece of text,
  // which becomes a read-only label field — is recorded under it.
  const groups = {};
  let group = null;
  const track = (name) => { if (group) (groups[group] = groups[group] || []).push(name); };
  let needFn = () => {};
  const inGroup = (name, fn, keep = 0) => { if (keep) needFn(keep); const prev = group; group = name; fn(); group = prev; };

  const claim = (name) => {
    if (names.has(name)) throw new Error(`Duplicate field name "${name}" - the script refers to fields by name, so they must be unique.`);
    names.add(name);
    return name;
  };
  const slug = (s) => sanitize(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32);

  const addField = (ref, pg = page) => { form.acroForm.addField(ref); pg.node.addAnnot(ref); };

  // ---- text -----------------------------------------------------------------
  const wrap = (str, font, size, maxW) => {
    const out = [];
    for (const para of sanitize(str).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const trial = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(trial, size) <= maxW || !line) line = trial;
        else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out;
  };

  let labelCount = 0;
  /**
   * Text that can be hidden. A page's own text is permanent, so anything
   * inside a conditional block is drawn as a read-only field carrying a
   * ready-made appearance. Read-only fields are not tinted by viewers and are
   * skipped when tabbing, so they read as ordinary print.
   */
  function labelField(str, x, yBase, { size, font, color }) {
    const s = sanitize(str);
    const w = font.widthOfTextAtSize(s, size) * 1.04 + 4;
    const drop = size * 0.28;
    const h = size * 1.18;
    const ap = ctx.register(ctx.stream(
      `BT /${font.name} ${size} Tf ${comps(color)} rg 0 ${drop.toFixed(2)} Td ${font.encodeText(s)} Tj ET`,
      { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, w, h], Resources: { Font: { [font.name]: font.ref } } }
    ));
    const name = claim(`lbl_${++labelCount}`);
    const d = ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Tx', Ff: 1, F: 4, Rect: [x, yBase - drop, x + w, yBase - drop + h], AP: { N: ap }, MK: {} });
    d.set(PDFName.of('T'), PDFString.of(name));
    d.set(PDFName.of('V'), PDFHexString.fromText(s));
    d.set(PDFName.of('DA'), PDFString.of(`/${font.name} ${size} Tf ${comps(color)} rg`));
    d.set(PDFName.of('P'), page.ref);
    addField(ctx.register(d));
    track(name);
  }

  function draw(str, x, yBase, { size = 9.5, font = reg, color = C.ink } = {}) {
    if (!String(str).trim()) return;
    if (group) labelField(str, x, yBase, { size, font, color });
    else page.drawText(sanitize(str), { x, y: yBase, size, font, color });
  }

  // ---- pages ------------------------------------------------------------------
  const logo = fs.existsSync(CONFIG.logoPath) ? await pdf.embedPng(fs.readFileSync(CONFIG.logoPath)) : null;

  function newPage() {
    page = pdf.addPage([PAGE.w, PAGE.h]);
    pages.push(page);
    const first = pages.length === 1;
    const top = PAGE.h - 36;
    const logoH = first ? 52 : 24;
    if (logo) {
      page.drawImage(logo, { x: M, y: top - logoH, width: (logo.width / logo.height) * logoH, height: logoH });
    } else {
      page.drawText(CONFIG.institution, { x: M, y: top - logoH * 0.75, size: first ? 26 : 15, font: bold, color: C.navy });
    }
    const right = (s, yy, size, font, color) =>
      page.drawText(s, { x: PAGE.w - M - font.widthOfTextAtSize(s, size), y: yy, size, font, color });
    if (first) {
      right(CONFIG.surgeon, top - 16, 12.5, bold, C.navy);
      right(CONFIG.credential, top - 31, 10, reg, C.tealDark);
      right(CONFIG.practice, top - 44, 9, ital, C.intro);
      page.drawLine({ start: { x: M, y: top - 62 }, end: { x: PAGE.w - M, y: top - 62 }, thickness: 1.6, color: C.teal });
      page.drawRectangle({ x: M, y: top - 106, width: CW, height: 38, color: C.tint });
      page.drawRectangle({ x: M, y: top - 106, width: 4.5, height: 38, color: C.navy });
      page.drawText(CONFIG.formTitle, { x: M + 14, y: top - 86, size: 18, font: bold, color: C.navy });
      page.drawText('Adult Spine Surgery   |   Please complete before your appointment', { x: M + 14, y: top - 99.5, size: 8.6, font: reg, color: C.tealDark });
      y = top - 120;
    } else {
      right(CONFIG.surgeon, top - 10, 9.2, bold, C.navy);
      right(CONFIG.credential, top - 22, 8.2, reg, C.tealDark);
      page.drawLine({ start: { x: M, y: top - 30 }, end: { x: PAGE.w - M, y: top - 30 }, thickness: 1.2, color: C.teal });
      y = top - 46;
    }
  }
  const need = (h) => { if (y - h < BOTTOM) newPage(); };
  needFn = need;

  // ---- blocks -------------------------------------------------------------------
  function text(str, { x = M, size = 9.5, font = reg, color = C.ink, maxW = CW - (x - M), gap = 3, lh } = {}) {
    const lineH = lh || size * 1.34;
    const lines = wrap(str, font, size, maxW);
    need(lines.length * lineH);
    for (const line of lines) {
      draw(line, x, y - size, { size, font, color });
      y -= lineH;
    }
    y -= gap;
  }

  function section(num, title, intro) {
    need(70);
    page.drawRectangle({ x: M, y: y - 21, width: CW, height: 21, color: C.tint });
    page.drawRectangle({ x: M, y: y - 21, width: 4, height: 21, color: C.navy });
    page.drawText(sanitize(`${num}. ${title}`), { x: M + 11, y: y - 15, size: 12.5, font: bold, color: C.navy });
    y -= 29;
    if (intro) text(intro, { size: 8.8, font: ital, color: C.intro, gap: 5 });
  }

  function sub(title) {
    need(34);
    y -= 2;
    draw(title, M, y - 10, { size: 10.6, font: bold, color: C.navy });
    if (!group) page.drawLine({ start: { x: M, y: y - 14 }, end: { x: M + CW, y: y - 14 }, thickness: 0.5, color: C.rule });
    y -= group ? 14 : 19;
  }

  function box(title, lines, { edge = C.teal, bg = C.tint, reserveRight = 0 } = {}) {
    const size = 8.9;
    const lh = size * 1.42;
    const pad = 10;
    const wrapped = [];
    for (const l of lines) wrapped.push(...wrap(l, reg, size, CW - pad * 2 - reserveRight));
    const h = pad * 2 + (title ? 15 : 0) + wrapped.length * lh - 3;
    need(h + 8);
    page.drawRectangle({ x: M, y: y - h, width: CW, height: h, color: bg, borderColor: edge, borderWidth: 1 });
    let yy = y - pad;
    if (title) { page.drawText(sanitize(title), { x: M + pad, y: yy - 10, size: 10.4, font: bold, color: C.navy }); yy -= 15; }
    for (const l of wrapped) { page.drawText(l, { x: M + pad, y: yy - size, size, font: reg, color: C.ink }); yy -= lh; }
    const topY = y;
    y -= h + 10;
    return { top: topY, bottom: topY - h };
  }

  // ---- fields ---------------------------------------------------------------------
  const FIELD = { borderWidth: 0.8, borderColor: C.fieldBorder, backgroundColor: C.fieldBg, textColor: C.ink };
  const setTip = (dict, tip) => { if (tip) dict.set(PDFName.of('TU'), PDFHexString.fromText(sanitize(tip))); };
  const jsAction = (code) => {
    const a = ctx.obj({ Type: 'Action', S: 'JavaScript' });
    a.set(PDFName.of('JS'), PDFHexString.fromText(code));
    return a;
  };

  function tf(name, x, yTop, w, h = 17, { multiline = false, size = 9.5, tip, required = false, readOnly = false, value, font = reg, color, plain = false } = {}) {
    const f = form.createTextField(claim(name));
    if (multiline) f.enableMultiline();
    if (value) f.setText(sanitize(value));
    const look = plain
      ? { borderWidth: 0, textColor: color || C.ink }
      : { ...FIELD, textColor: color || C.ink };
    f.addToPage(page, { x, y: yTop - h, width: w, height: h, font, ...look });
    f.setFontSize(size);
    if (required) f.enableRequired();
    if (readOnly) f.enableReadOnly();
    setTip(f.acroField.dict, tip);
    track(name);
    return f;
  }

  function dd(name, x, yTop, w, h, options, tip) {
    const f = form.createDropdown(claim(name));
    f.addOptions(options.map(sanitize));
    f.addToPage(page, { x, y: yTop - h, width: w, height: h, font: reg, ...FIELD });
    f.setFontSize(9);
    setTip(f.acroField.dict, tip);
    track(name);
    return f;
  }

  // Checkbox and radio appearances are drawn here rather than left to the
  // PDF library, so their "on" values are the real answers the script reads
  // ("Yes", "current", "3") and the look matches across viewers.
  const apCache = {};
  function boxAP(size) {
    const key = `box_${size}`;
    if (apCache[key]) return apCache[key];
    const s = size;
    const frame = `q ${comps(C.fieldBg)} rg ${comps(C.fieldBorder)} RG 0.8 w 0.4 0.4 ${s - 0.8} ${s - 0.8} re B Q`;
    const tick = `q ${comps(C.navy)} RG 1.5 w 1 J 1 j ${(s * 0.22).toFixed(2)} ${(s * 0.52).toFixed(2)} m ${(s * 0.43).toFixed(2)} ${(s * 0.28).toFixed(2)} l ${(s * 0.8).toFixed(2)} ${(s * 0.76).toFixed(2)} l S Q`;
    const mk = (ops) => ctx.register(ctx.stream(ops, { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, s, s] }));
    return (apCache[key] = { on: mk(`${frame} ${tick}`), off: mk(frame) });
  }
  function dotAP(size) {
    const key = `dot_${size}`;
    if (apCache[key]) return apCache[key];
    const c = size / 2;
    const circle = (r) => {
      const k = 0.5523 * r;
      return `${c + r} ${c} m ${c + r} ${c + k} ${c + k} ${c + r} ${c} ${c + r} c ${c - k} ${c + r} ${c - r} ${c + k} ${c - r} ${c} c ${c - r} ${c - k} ${c - k} ${c - r} ${c} ${c - r} c ${c + k} ${c - r} ${c + r} ${c - k} ${c + r} ${c} c h`;
    };
    const frame = `q ${comps(C.fieldBg)} rg ${comps(C.fieldBorder)} RG 0.8 w ${circle(c - 0.5)} B Q`;
    const dot = `q ${comps(C.navy)} rg ${circle(c * 0.45)} f Q`;
    const mk = (ops) => ctx.register(ctx.stream(ops, { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, size, size] }));
    return (apCache[key] = { on: mk(`${frame} ${dot}`), off: mk(frame) });
  }

  function cb(name, x, yTop, size = 9.5, tip) {
    const { on, off } = boxAP(size);
    const d = ctx.obj({
      Type: 'Annot', Subtype: 'Widget', FT: 'Btn', F: 4, V: 'Off', AS: 'Off',
      Rect: [x, yTop - size, x + size, yTop], AP: { N: { Yes: on, Off: off }, D: { Yes: on, Off: off } }, MK: {},
    });
    d.set(PDFName.of('T'), PDFString.of(claim(name)));
    d.set(PDFName.of('P'), page.ref);
    setTip(d, tip);
    addField(ctx.register(d));
    track(name);
  }

  /** A radio group. Returns a function that places one option; values are PDF names. */
  function radioGroup(name, tip) {
    const parent = ctx.obj({ FT: 'Btn', Ff: 32768, Kids: [] });
    parent.set(PDFName.of('T'), PDFString.of(claim(name)));
    setTip(parent, tip);
    const parentRef = ctx.register(parent);
    form.acroForm.addField(parentRef);
    track(name);
    const kids = parent.get(PDFName.of('Kids'));
    return (value, x, yTop, size = 9.5) => {
      if (!/^[A-Za-z0-9_]+$/.test(String(value))) throw new Error(`Radio value "${value}" in ${name} must be a plain name.`);
      const { on, off } = dotAP(size);
      const w = ctx.obj({
        Type: 'Annot', Subtype: 'Widget', F: 4, AS: 'Off', Rect: [x, yTop - size, x + size, yTop],
        AP: { N: { [value]: on, Off: off }, D: { [value]: on, Off: off } }, MK: {},
      });
      w.set(PDFName.of('Parent'), parentRef);
      w.set(PDFName.of('P'), page.ref);
      const ref = ctx.register(w);
      kids.push(ref);
      page.node.addAnnot(ref);
    };
  }

  /** A row of labelled fields. `w` values are relative; `hint` sits right-aligned in italics. */
  function fields(defs, { h = 17, x0 = M, width = CW } = {}) {
    need(11 + h + 7);
    const gap = 8;
    const total = width - gap * (defs.length - 1);
    const sum = defs.reduce((s, d) => s + (d.w || 1), 0);
    let x = x0;
    for (const d of defs) {
      const w = (total * (d.w || 1)) / sum;
      draw(d.label, x, y - 8.2, { size: 8.8, color: C.gray });
      if (d.hint) {
        const hw = ital.widthOfTextAtSize(sanitize(d.hint), 7.2);
        if (reg.widthOfTextAtSize(sanitize(d.label), 8.8) + hw + 6 < w) draw(d.hint, x + w - hw - 1, y - 8, { size: 7.2, font: ital, color: C.gray });
      }
      if (d.options) dd(d.name, x, y - 11, w, h, d.options, d.tip || d.label);
      else tf(d.name, x, y - 11, w, h, { ...d, tip: d.tip || (d.hint ? `${d.label} (${d.hint})` : d.label) });
      x += w + gap;
    }
    y -= 11 + h + 7;
  }

  /** Checkboxes in columns. Items are labels, or [name, label] pairs. */
  function checks(prefix, items, { cols = 4, size = 9.1, x0 = M, width = CW } = {}) {
    const colW = width / cols;
    for (let i = 0; i < items.length; i += cols) {
      const row = items.slice(i, i + cols).map((it) => (Array.isArray(it) ? it : [`${prefix}_${slug(it)}`, it]));
      const wrapped = row.map(([, l]) => wrap(l, reg, size, colW - 18));
      const lh = size * 1.22;
      const rowH = Math.max(...wrapped.map((w) => w.length)) * lh + 4;
      need(rowH);
      row.forEach(([name, label], j) => {
        const x = x0 + j * colW;
        cb(name, x, y - 0.5, 9.5, label);
        wrapped[j].forEach((line, k) => draw(line, x + 14, y - size + 0.8 - k * lh, { size }));
      });
      y -= rowH;
    }
    y -= 3;
  }

  /** "Question ............ ( ) Yes ( ) No", one line. */
  function ask(name, question, options = [['Yes', 'Yes'], ['No', 'No']], { size = 9.3 } = {}) {
    const optW = options.reduce((s, [, l]) => s + 9.5 + 4 + reg.widthOfTextAtSize(l, size) + 11, 0);
    const startX = M + CW - optW;
    const lines = wrap(question, reg, size, startX - M - 12);
    const lh = size * 1.3;
    const h = Math.max(lines.length * lh, 13) + 4;
    need(h);
    lines.forEach((l, i) => draw(l, M, y - size - i * lh, { size }));
    const add = radioGroup(name, question);
    let x = startX;
    for (const [value, label] of options) {
      add(value, x, y - 0.5);
      draw(label, x + 13.5, y - size + 0.4, { size });
      x += 9.5 + 4 + reg.widthOfTextAtSize(label, size) + 11;
    }
    y -= h;
  }

  /** A labelled radio row whose options wrap as needed. */
  function choose(name, label, options, { labelW = 150, size = 9.3 } = {}) {
    need(16);
    draw(label, M, y - size, { size });
    const add = radioGroup(name, label);
    let x = M + labelW;
    for (const [value, text_] of options) {
      const w = 9.5 + 4 + reg.widthOfTextAtSize(sanitize(text_), size);
      if (x + w > M + CW) { x = M + labelW; y -= 15; need(16); }
      add(value, x, y - 0.5);
      draw(text_, x + 13.5, y - size + 0.4, { size });
      x += w + 13;
    }
    y -= 17;
  }

  /** A grid of fields. Column types: text | dd | cb | label. */
  function table(prefix, cols, rows, { rowH = 19 } = {}) {
    const n = typeof rows === 'number' ? rows : rows.length;
    const gap = 4;
    const total = CW - gap * (cols.length - 1);
    const sum = cols.reduce((s, c) => s + c.w, 0);
    const widths = cols.map((c) => (total * c.w) / sum);
    need(14 + rowH * Math.min(n, 3));
    let x = M;
    cols.forEach((c, i) => { draw(c.label, x + 1, y - 9, { size: 8.8, font: bold, color: C.navy }); x += widths[i] + gap; });
    y -= 13;
    for (let r = 0; r < n; r++) {
      need(rowH + 2);
      x = M;
      cols.forEach((c, i) => {
        const w = widths[i];
        const fname = `${prefix}_${r + 1}_${c.key}`;
        if (c.type === 'label') draw(rows[r], x + 1, y - 12, { size: 9.2 });
        else if (c.type === 'cb') cb(fname, x + Math.min(w / 2 - 5, 12), y - (rowH - 2 - 9.5) / 2, 9.5, `${c.label}${typeof rows === 'number' ? '' : ` - ${rows[r]}`}`);
        else if (c.type === 'dd') dd(fname, x, y, w, rowH - 2, c.options, c.label);
        else tf(fname, x, y, w, rowH - 2, { size: 9, tip: c.tip || c.label });
        x += w + gap;
      });
      y -= rowH + 1.5;
    }
    y -= 5;
  }

  /** "Add another" control: a checkbox whose label reads as an action. */
  function more(name, label) {
    need(18);
    cb(name, M, y - 1, 10, label);
    draw(label, M + 15, y - 9, { size: 9.2, font: bold, color: C.tealDark });
    y -= 18;
  }

  // ---- body diagram ---------------------------------------------------------------
  function loadFigure(view) {
    const svg = fs.readFileSync(path.join(ROOT, 'public', 'figures', `figure-${view}.svg`), 'utf8');
    const t = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)\s*scale\(([-\d.]+)\)/.exec(svg);
    const d = /<path[^>]*\sd="([^"]+)"/.exec(svg);
    if (!t || !d) throw new Error(`figure-${view}.svg: transform or path not found`);
    return { tx: +t[1], ty: +t[2], s: +t[3], d: d[1] };
  }

  /**
   * Which pixels of each traced half are body. The drawing is line art with a
   * white interior, so the background is flooded in from the border and
   * whatever it cannot reach is body. The outline is thickened by a pixel
   * first: the back view has a hairline break that otherwise lets the flood in.
   */
  async function bodyMasks() {
    const img = await Jimp.read(path.join(ROOT, 'public', 'figures', 'pain-map.png'));
    img.crop({ x: 0, y: 45, w: img.bitmap.width, h: img.bitmap.height - 45 });
    const W = img.bitmap.width;
    const halves = {
      front: img.clone().crop({ x: 0, y: 0, w: Math.floor(W / 2), h: img.bitmap.height }),
      back: img.clone().crop({ x: Math.floor(W / 2), y: 0, w: Math.ceil(W / 2), h: img.bitmap.height }),
    };
    const out = {};
    for (const [name, half] of Object.entries(halves)) {
      half.autocrop();
      const { width, height, data } = half.bitmap;
      const ink = new Uint8Array(width * height);
      for (let i = 0, p = 0; i < width * height; i++, p += 4) ink[i] = (data[p] + data[p + 1] + data[p + 2]) / 3 < 170 ? 1 : 0;
      const thick = new Uint8Array(ink);
      for (let yy = 0; yy < height; yy++) for (let xx = 0; xx < width; xx++) {
        const i = yy * width + xx;
        if (ink[i]) continue;
        if ((xx > 0 && ink[i - 1]) || (xx < width - 1 && ink[i + 1]) || (yy > 0 && ink[i - width]) || (yy < height - 1 && ink[i + width])) thick[i] = 1;
      }
      const outside = new Uint8Array(width * height);
      const stack = [];
      const push = (xx, yy) => {
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) return;
        const i = yy * width + xx;
        if (outside[i] || thick[i]) return;
        outside[i] = 1; stack.push(i);
      };
      for (let xx = 0; xx < width; xx++) { push(xx, 0); push(xx, height - 1); }
      for (let yy = 0; yy < height; yy++) { push(0, yy); push(width - 1, yy); }
      while (stack.length) {
        const i = stack.pop();
        const xx = i % width, yy = (i / width) | 0;
        push(xx + 1, yy); push(xx - 1, yy); push(xx, yy + 1); push(xx, yy - 1);
      }
      out[name] = { isBody: (xx, yy) => xx >= 0 && yy >= 0 && xx < width && yy < height && !outside[yy * width + xx] };
    }
    return out;
  }

  const masks = await bodyMasks();
  const figures = { front: loadFigure('front'), back: loadFigure('back') };
  const GRID = { cols: 20, rows: 40 };
  const MARK = { pain: [0.86, 0.15, 0.15], numb: [0.15, 0.39, 0.92] };
  const cellCounts = {};

  function markAP(size, kind) {
    const key = `mark_${kind}_${size.toFixed(3)}`;
    if (apCache[key]) return apCache[key];
    const r = size * 0.4;
    const c = size / 2;
    const k = 0.5523 * r;
    const [R, G, B] = MARK[kind];
    const circle =
      `${c + r} ${c} m ${c + r} ${c + k} ${c + k} ${c + r} ${c} ${c + r} c ${c - k} ${c + r} ${c - r} ${c + k} ${c - r} ${c} c ` +
      `${c - r} ${c - k} ${c - k} ${c - r} ${c} ${c - r} c ${c + k} ${c - r} ${c + r} ${c - k} ${c + r} ${c} c h`;
    const on = ctx.register(ctx.stream(
      `q /GS gs ${R} ${G} ${B} rg 1 1 1 RG 0.7 w ${circle} B Q`,
      { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, size, size], Resources: { ExtGState: { GS: { Type: 'ExtGState', ca: 0.88, CA: 1 } } } }
    ));
    const off = ctx.register(ctx.stream('', { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, size, size] }));
    return (apCache[key] = { on, off });
  }

  function figure(view, kind, x0, yTop, widthPt) {
    const fig = figures[view];
    const mask = masks[view];
    const k = widthPt / VIEW_BOX.width;
    page.pushOperators(
      pushGraphicsState(),
      concatTransformationMatrix(fig.s * k, 0, 0, -fig.s * k, x0 + fig.tx * k, yTop - fig.ty * k),
      setFillingColor(C.ink),
      ...svgPathToOperators(fig.d),
      PDFOperator.of(PDFOperatorNames.FillEvenOdd),
      popGraphicsState()
    );
    const key = `diagram_${kind}_${view}`;
    const parent = ctx.obj({ FT: 'Btn', Kids: [] });
    parent.set(PDFName.of('T'), PDFString.of(claim(key)));
    const parentRef = ctx.register(parent);
    form.acroForm.addField(parentRef);
    const kids = parent.get(PDFName.of('Kids'));
    const cellV = VIEW_BOX.width / GRID.cols;
    const cellPt = cellV * k;
    const { on, off } = markAP(cellPt, kind);
    const bodyView = view === 'front' ? 'anterior' : 'posterior';
    let n = 0;
    for (let r = 0; r < GRID.rows; r++) for (let c = 0; c < GRID.cols; c++) {
      let hit = 0;
      const N = 5;
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
        const vx = (c + (a + 0.5) / N) * cellV;
        const vy = (r + (b + 0.5) / N) * cellV;
        if (mask.isBody(Math.round((vx - fig.tx) / fig.s), Math.round((vy - fig.ty) / fig.s))) hit++;
      }
      if (hit / (N * N) < 0.2) continue;
      const zone = zoneAt((c + 0.5) / GRID.cols, (r + 0.5) / GRID.rows, bodyView);
      const w = ctx.obj({
        Type: 'Annot', Subtype: 'Widget', F: 4, AS: 'Off', V: 'Off',
        Rect: [x0 + c * cellPt, yTop - (r + 1) * cellPt, x0 + (c + 1) * cellPt, yTop - r * cellPt],
        AP: { N: { On: on, Off: off }, D: { On: on, Off: off } }, MK: {},
      });
      w.set(PDFName.of('T'), PDFString.of(`r${String(r).padStart(2, '0')}c${String(c).padStart(2, '0')}`));
      w.set(PDFName.of('TU'), PDFHexString.fromText(`${kind === 'pain' ? 'Pain' : 'Numbness / tingling'}: ${zone}`));
      w.set(PDFName.of('P'), page.ref);
      w.set(PDFName.of('Parent'), parentRef);
      const ref = ctx.register(w);
      kids.push(ref);
      page.node.addAnnot(ref);
      n++;
    }
    cellCounts[key] = n;
    return widthPt * (VIEW_BOX.height / VIEW_BOX.width);
  }

  function diagramPair(kind, yTop, widthPt) {
    const gapX = 30;
    const xFront = M + 5;
    const xBack = xFront + widthPt + gapX;
    const h = figure('front', kind, xFront, yTop, widthPt);
    figure('back', kind, xBack, yTop, widthPt);
    const lab = (s, x, yy, color = C.gray) => page.drawText(s, { x, y: yy, size: 8, font: bold, color });
    lab('FRONT', xFront + widthPt / 2 - 14, yTop - h - 11);
    lab('BACK', xBack + widthPt / 2 - 12, yTop - h - 11);
    // Laterality: facing the patient the sides swap; from behind they match.
    lab('your RIGHT', xFront, yTop - 8, C.tealDark);
    lab('your LEFT', xFront + widthPt - 40, yTop - 8, C.tealDark);
    lab('your LEFT', xBack, yTop - 8, C.tealDark);
    lab('your RIGHT', xBack + widthPt - 46, yTop - 8, C.tealDark);
    return h;
  }

  // ---- questionnaires ----------------------------------------------------------------
  function questionnaire(def, prefix, { cols = 2, layout } = {}) {
    const gapX = 18;
    const colW = (CW - gapX * (cols - 1)) / cols;
    const size = 8.6;
    const lh = size * 1.24;
    const perCol = Math.ceil(def.sections.length / cols);
    const top = y;
    let lowest = y;
    // `layout` lists which items go in which column, for instruments whose
    // items differ a lot in length; the default is simply half and half.
    const plan = layout || Array.from({ length: cols }, (_, ci) =>
      Array.from({ length: Math.min((ci + 1) * perCol, def.sections.length) - ci * perCol }, (_, k) => ci * perCol + k));
    for (let ci = 0; ci < cols; ci++) {
      let yy = top;
      const x = M + ci * (colW + gapX);
      for (const si of plan[ci]) {
        const sec = def.sections[si];
        draw(`${si + 1}. ${sec.title}`, x, yy - 9.6, { size: 9.6, font: bold, color: C.navy });
        yy -= 14;
        const add = radioGroup(`${prefix}_${si + 1}`, sec.title);
        for (const o of sec.options) {
          const lines = wrap(o.label, reg, size, colW - 16);
          add(String(o.score), x, yy - 0.5, 8.5);
          lines.forEach((l, k) => draw(l, x + 13, yy - size + 0.6 - k * lh, { size }));
          yy -= Math.max(lines.length * lh, 11) + 1.2;
        }
        yy -= 6;
      }
      lowest = Math.min(lowest, yy);
    }
    y = lowest;
  }

  /** A line the script rewrites to say whether this questionnaire applies. */
  function statusLine(name, fallback) {
    need(30);
    tf(name, M, y, CW, 26, { readOnly: true, value: fallback, font: bold, size: 9.4, color: C.tealDark, multiline: true });
    y -= 32;
  }
  const calcFields = [];
  function scoreLine(name, code) {
    need(24);
    draw('Score (calculated automatically):', M, y - 12, { size: 9.4, font: bold, color: C.tealDark });
    const f = tf(name, M + 190, y - 1, CW - 190, 17, { readOnly: true, font: bold, size: 9.4, color: C.navy });
    f.acroField.dict.set(PDFName.of('AA'), ctx.obj({ C: jsAction(code) }));
    calcFields.push(f);
    y -= 24;
  }

  // =========================================================================
  // CONTENT
  // =========================================================================
  const RESULT = ['Helped a lot', 'Helped somewhat', 'Helped only briefly', 'Did not help', 'Made it worse'];
  const RECORDS = ['Attached to my email', 'Will send or bring later', 'Could not get them'];
  const EMAIL = CONFIG.officeEmail;
  let emailButtonCount = 0;

  function emailButton(x, yTop, w, h) {
    const label = 'Email this form';
    const size = 11;
    const tw = bold.widthOfTextAtSize(label, size);
    const ap = ctx.register(ctx.stream(
      `q ${comps(C.navy)} rg 0 0 ${w} ${h} re f BT /${bold.name} ${size} Tf 1 1 1 rg ${((w - tw) / 2).toFixed(2)} ${(h / 2 - size * 0.34).toFixed(2)} Td ${bold.encodeText(label)} Tj ET Q`,
      { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, w, h], Resources: { Font: { [bold.name]: bold.ref } } }
    ));
    const code =
      'var n = this.getField("pt_footer").value; if (!n) n = "patient";\n' +
      `try { this.mailDoc({ bUI: true, cTo: "${EMAIL}", cSubject: "New patient spine intake - " + n, ` +
      'cMsg: "Attached is my completed intake form for Dr. Wey.\\n\\nPatient: " + n + "\\n\\nIMPORTANT: before sending, also attach your treatment records (physical therapy notes, injection reports, imaging reports, pharmacy medication history) to this same email." }); }\n' +
      `catch (e) { app.alert("Your PDF viewer could not open an email automatically.\\n\\nPlease save this file, then attach it - together with your treatment records - to an email to ${EMAIL}.", 3); }`;
    const d = ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Btn', Ff: 65536, F: 4, Rect: [x, yTop - h, x + w, yTop], AP: { N: ap }, MK: {}, H: 'P' });
    d.set(PDFName.of('T'), PDFString.of(claim(`btn_email_${++emailButtonCount}`)));
    d.set(PDFName.of('TU'), PDFHexString.fromText(`Email this completed form to ${EMAIL}`));
    d.set(PDFName.of('P'), page.ref);
    d.set(PDFName.of('A'), jsAction(code));
    addField(ctx.register(d));
  }

  // ---------------------------------------------------------------- page 1
  newPage();
  text('Welcome. This form helps us learn about you before your appointment, so your visit can focus on what matters most to you. It takes about 20-30 minutes. Answer what you can - sections appear only when they are relevant to your answers.', { size: 9.8, gap: 6 });
  {
    const b = box('How to complete and return this form', [
      '1. Open this PDF in Adobe Acrobat Reader (free) or the Chrome / Edge browser, so the interactive sections work.',
      '2. Type your answers directly into the fields. Sections that apply to you appear as you go.',
      '3. Gather your treatment records (see Section 5) - they are the most important part.',
      `4. Click "Email this form", or save the file and email it to ${EMAIL}. Attach your records to the same email.`,
    ], { reserveRight: 150 });
    emailButton(M + CW - 146, (b.top + b.bottom) / 2 + 13, 132, 26);
  }

  section(1, 'Patient Information', 'Fields marked with * are required.');
  fields([
    { label: 'First name *', name: 'pt_first', w: 2.4, required: true },
    { label: 'Last name *', name: 'pt_last', w: 2.4, required: true },
    { label: 'Date of birth *', name: 'pt_dob', w: 1.7, required: true, hint: 'MM/DD/YYYY' },
    { label: 'Age', name: 'pt_age', w: 0.8, hint: 'auto', readOnly: true },
    { label: 'Sex', name: 'pt_sex', w: 1.6, options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  ]);
  fields([
    { label: 'What brings you to the spine surgery clinic?', name: 'pt_reason', w: 3, options: ['New patient evaluation', 'Second opinion', 'Follow-up after surgery elsewhere', 'Scoliosis / spinal deformity evaluation', 'Other'] },
    { label: "Today's date", name: 'pt_today', w: 1.4, hint: 'MM/DD/YYYY' },
    { label: 'Height', name: 'pt_height', w: 1 },
    { label: 'Weight', name: 'pt_weight', w: 1 },
  ]);
  need(20);
  cb('pt_onfile', M, y - 1, 10, 'Office already has my contact and insurance information');
  draw('Your office already has my current contact and insurance information (skip the rest of this page).', M + 15, y - 9, { size: 9.4, font: bold, color: C.navy });
  y -= 20;
  inGroup('contact', () => {
    fields([
      { label: 'Phone', name: 'pt_phone', w: 1.6 },
      { label: 'Email', name: 'pt_email', w: 2.4 },
      { label: 'Street address', name: 'pt_address', w: 3 },
    ]);
    fields([
      { label: 'City', name: 'pt_city', w: 2 },
      { label: 'State', name: 'pt_state', w: 0.7 },
      { label: 'ZIP', name: 'pt_zip', w: 1 },
      { label: 'How did you hear about us? (optional)', name: 'pt_heard', w: 3 },
    ]);
    sub('Insurance & Referral');
    fields([
      { label: 'Insurance provider', name: 'ins_provider', w: 3 },
      { label: 'Member / policy ID', name: 'ins_member', w: 2.4 },
      { label: 'Group number', name: 'ins_group', w: 2 },
    ]);
    fields([
      { label: 'Referring physician', name: 'ref_physician', w: 1 },
      { label: 'Primary care physician', name: 'ref_pcp', w: 1 },
      { label: 'PCP phone / practice', name: 'ref_pcp_phone', w: 1 },
    ]);
    sub('Emergency Contact');
    fields([
      { label: 'Name', name: 'ec_name', w: 2.4 },
      { label: 'Relationship', name: 'ec_relation', w: 1.8, hint: 'e.g., spouse, parent' },
      { label: 'Phone', name: 'ec_phone', w: 1.8 },
    ]);
  });

  // ---------------------------------------------------------------- page 2
  newPage();
  section(2, 'What Brings You In Today?', 'Tell us about your main concern. This helps us focus on what matters most to you.');
  fields([{ label: 'In your own words, what is the main reason for your visit? *', name: 'cc_reason', multiline: true, hint: 'e.g., "My low back hurts and the pain goes down my left leg"' }], { h: 44 });
  fields([
    { label: 'When did this start?', name: 'cc_onset', w: 1, hint: 'e.g., March 2025; after a fall' },
    { label: 'What bothers you the most right now?', name: 'cc_worst', w: 1.3 },
  ]);
  choose('cc_start', 'How did it start?', [['gradual', 'Gradually'], ['sudden', 'Suddenly'], ['injury', 'After an injury'], ['surgery', 'After surgery'], ['unsure', 'Not sure']]);
  choose('cc_trend', 'Over time, has it been...', [['worse', 'Getting worse'], ['same', 'Staying about the same'], ['better', 'Getting better'], ['varies', 'Comes and goes']]);

  sub('Which areas are affected? Select all that apply. *');
  text('Check every area with pain, numbness, tingling, or weakness. Your answers decide which later sections and questionnaires apply to you.', { size: 8.6, font: ital, color: C.intro, gap: 4 });
  {
    const colX = [M, M + 208, M + 330, M + 452];
    const top = y;
    const head = (s, x) => page.drawText(s, { x, y: top - 9.5, size: 9.6, font: bold, color: C.navy });
    head('Spine & Back', colX[0]); head('Arms & Legs (left / right)', colX[1]); head('Other', colX[3]);
    const col = (items, x) => {
      let yy = top - 15;
      for (const [name, label] of items) {
        cb(name, x, yy - 0.5, 9.5, label);
        page.drawText(label, { x: x + 14, y: yy - 8.6, size: 9.1, font: reg, color: C.ink });
        yy -= 14.5;
      }
      return yy;
    };
    const a = col([['area_neck', 'Neck'], ['area_upperback', 'Upper back'], ['area_midback', 'Mid back'], ['area_lowback', 'Low back'], ['area_tailbone', 'Tailbone / sacrum / SI joint'], ['area_curve', 'Spinal curvature (scoliosis / kyphosis)']], colX[0]);
    col([['area_shoulder_l', 'L shoulder'], ['area_arm_l', 'L arm'], ['area_hand_l', 'L hand'], ['area_hip_l', 'L hip / buttock'], ['area_leg_l', 'L leg'], ['area_foot_l', 'L foot']], colX[1]);
    col([['area_shoulder_r', 'R shoulder'], ['area_arm_r', 'R arm'], ['area_hand_r', 'R hand'], ['area_hip_r', 'R hip / buttock'], ['area_leg_r', 'R leg'], ['area_foot_r', 'R foot']], colX[2]);
    col([['area_headache', 'Headaches'], ['area_chest', 'Chest wall / ribs'], ['area_groin', 'Groin / pelvis'], ['area_balance', 'Balance / walking'], ['area_other', 'Other']], colX[3]);
    y = a - 4;
  }

  sub('Describe Your Main Symptom');
  text('How would you describe it? (select all that apply)', { size: 9.1, color: C.gray, gap: 2 });
  checks('qual', ['Aching / dull', 'Sharp / stabbing', 'Burning', 'Electric / shooting', 'Throbbing', 'Cramping', 'Pressure', 'Stiffness', 'Numbness', 'Pins and needles', 'Weakness', 'Something else']);
  text('How bad is it on average, over the past week? (0 = none, 10 = worst imaginable)', { size: 9.1, color: C.gray, gap: 3 });
  const nrs = (name, label) => {
    need(16);
    draw(label, M, y - 9.3, { size: 9.3, font: bold });
    const add = radioGroup(name, `${label}, 0 to 10`);
    for (let i = 0; i <= 10; i++) {
      const x = M + 78 + i * 41;
      add(String(i), x, y - 0.5);
      draw(String(i), x + 13, y - 8.9, { size: 9 });
    }
    y -= 16;
  };
  inGroup('neck_pain', () => { nrs('nrs_neck', 'Neck pain'); nrs('nrs_arm', 'Arm pain'); });
  inGroup('low_pain', () => { nrs('nrs_back', 'Back pain'); nrs('nrs_leg', 'Leg pain'); });
  y -= 4;
  need(20);
  cb('cc_prior_surgery', M, y - 1, 10, 'I have had spine surgery before');
  draw('I have had spine surgery before', M + 15, y - 9, { size: 9.4, font: bold, color: C.navy });
  y -= 18;
  inGroup('prior_surgery', () => {
    fields([
      { label: 'Most recent spine surgery (type and levels)', name: 'ps_type', w: 2.6 },
      { label: 'When and where (surgeon / hospital)', name: 'ps_when', w: 2.4 },
      { label: 'Did it help?', name: 'ps_helped', w: 1.5, options: RESULT },
    ]);
  });

  // ---------------------------------------------------------------- pages 3-4
  newPage();
  section(3, 'Where Do You Feel It?', 'Click (or tap) on the body wherever you feel PAIN. Each click places a red mark; click the same spot again to remove it. If the pain travels, mark the whole path - for example from the low back, down the outside of the leg, to the foot.');
  { const top = y - 2; const h = diagramPair('pain', top, 248); y = top - h - 22; }

  newPage();
  sub('Numbness and Tingling');
  text('Click wherever you have numbness, pins and needles, or a part that "falls asleep". These marks are blue. If you have none, leave the figures blank.', { size: 8.8, font: ital, color: C.intro, gap: 4 });
  { const top = y - 2; const h = diagramPair('numb', top, 248); y = top - h - 22; }
  fields([
    { label: 'Weakness - which arm, hand, leg or foot feels weak, and what is hard to do?', name: 'sym_weak_where', w: 1 },
    { label: 'Any other symptom not shown (itching, cramping, coldness ...) and where', name: 'sym_other', w: 1 },
  ]);

  // ---------------------------------------------------------------- page 5
  newPage();
  section(4, 'A Few Questions About Your Symptoms', "Answer what you can and skip anything that doesn't apply.");
  sub('Please Answer Every Line');
  ask('urg_bladder', 'New loss of bladder or bowel control, or new trouble starting to urinate?');
  ask('urg_saddle', 'New numbness in the groin or inner thighs ("saddle" area)?');
  ask('urg_weak', 'Weakness in an arm or leg that is getting worse quickly?');
  inGroup('redflag', () => {
    need(34);
    tf('redflag_msg', M, y, CW, 30, {
      readOnly: true, multiline: true, font: bold, size: 9.2, color: C.red,
      value: 'Important: new bladder or bowel changes, groin numbness, or rapidly worsening weakness can be signs of nerve compression that should not wait. If any of these are new or getting worse, please call the office today or go to the nearest emergency room.',
    });
    y -= 35;
  });
  ask('urg_fever', 'Fever or chills together with your spine pain?');
  ask('urg_weight', 'Weight loss you cannot explain (more than 10 lbs)?');
  ask('urg_cancer', 'Any history of cancer?');
  ask('urg_trauma', 'A recent serious fall, car accident, or other major injury?');

  inGroup('neck', () => {
    sub('Neck & Upper Body');
    ask('neck_fine', 'Trouble with buttons, writing, or small objects (fine motor difficulty)?');
    ask('neck_drop', 'Dropping objects more than usual?');
    ask('neck_balance', 'Balance or coordination problems?');
    ask('neck_shock', 'Electric shock feeling down your spine when you bend your neck?');
    ask('neck_belowelbow', 'Do arm symptoms travel below the elbow, into the hand or fingers?');
  });
  inGroup('lower', () => {
    sub('Lower Body');
    ask('low_belowknee', 'Pain below the knee?');
    ask('low_sitbetter', 'Do symptoms improve when you sit or lean forward?');
    ask('low_footdrop', 'Difficulty with stairs, or does a foot feel floppy or catch (foot drop)?');
  });

  sub('Impact on Daily Life');
  fields([
    { label: 'How far can you walk before needing to stop?', name: 'fx_walk', w: 1 },
    { label: 'How long can you sit comfortably?', name: 'fx_sit', w: 1 },
    { label: 'How long can you stand comfortably?', name: 'fx_stand', w: 1 },
  ]);
  text('What makes your symptoms worse? (select all that apply)', { size: 9.1, color: C.gray, gap: 2 });
  checks('worse', ['Sitting', 'Standing', 'Walking', 'Lying down', 'Bending forward', 'Bending backward', 'Twisting', 'Lifting', 'Coughing / sneezing', 'Looking up', 'Reaching overhead', 'Nothing in particular']);
  text('What makes your symptoms better? (select all that apply)', { size: 9.1, color: C.gray, gap: 2 });
  checks('better', ['Rest', 'Lying down', 'Sitting', 'Leaning forward', 'Walking', 'Medication', 'Heat or ice', 'Nothing helps']);

  // ---------------------------------------------------------------- page 6+
  newPage();
  section(5, 'Prior Treatments', 'This is the most important section. Insurers require written proof of the non-surgical care you have already tried before they approve further treatment, including surgery.');
  box('Two things are needed for each treatment you have tried', [
    '1. THE DETAILS - where you went, who treated you, the dates, how often, how many visits, and whether it helped. Full names and phone numbers are especially useful. More detail is better, but partial answers are fine.',
    '2. THE RECORDS - call each office and ask for a copy, then attach them to the same email as this form. Physical therapy: the first evaluation, visit notes, and discharge summary. Injections: the procedure notes. Chiropractic, acupuncture, massage: a visit log or dated receipts. Medications: a "medication history" printout from your pharmacy. Imaging: the radiologist\'s written report.',
  ]);
  text('Check each treatment you have tried. A section for its details will appear below.', { size: 9.1, color: C.gray, gap: 3 });
  checks('tx', [
    ['tx_pt', 'Physical therapy'], ['tx_hep', 'Home exercise program'], ['tx_chiro', 'Chiropractic care'], ['tx_acu', 'Acupuncture'],
    ['tx_massage', 'Massage therapy'], ['tx_brace', 'Back brace or collar'], ['tx_inj', 'Spine injections'], ['tx_meds', 'Medications'],
    ['tx_other', 'Other treatments'], ['tx_none', 'None of these'],
  ]);

  const ptRound = (n, title, moreLabel) => inGroup(`pt${n}`, () => {
    sub(title);
    fields([
      { label: 'Clinic name', name: `pt${n}_clinic`, w: 2.6 },
      { label: 'City and phone number', name: `pt${n}_cityphone`, w: 2.4 },
      { label: "Therapist's name", name: `pt${n}_therapist`, w: 2 },
      { label: 'Ordered by (doctor)', name: `pt${n}_orderedby`, w: 2 },
    ]);
    fields([
      { label: 'Start date', name: `pt${n}_start`, w: 1.2, hint: 'MM/YYYY' },
      { label: 'End date', name: `pt${n}_end`, w: 1.2, hint: 'MM/YYYY' },
      { label: 'Visits per week', name: `pt${n}_perweek`, w: 1.1 },
      { label: 'Total visits', name: `pt${n}_visits`, w: 1 },
      { label: 'Result', name: `pt${n}_result`, w: 1.7, options: RESULT },
      { label: 'Records', name: `pt${n}_records`, w: 1.9, options: RECORDS },
    ]);
    if (n === 1) fields([{ label: 'What did you work on?', name: 'pt1_what', hint: 'e.g., core strengthening, stretching, traction, dry needling' }]);
    if (moreLabel) more(`pt${n}_more`, moreLabel);
  }, n === 1 ? 150 : 108);
  ptRound(1, 'Physical Therapy - your most recent round', '+ I had an earlier round of physical therapy (add another section)');
  ptRound(2, 'Physical Therapy - the round before that', '+ I had another round before this one (add another section)');
  ptRound(3, 'Physical Therapy - an earlier round', null);

  inGroup('hep', () => {
    sub('Home Exercise Program');
    fields([
      { label: 'Who set it up?', name: 'hep_guided', w: 1.8, options: ['A physical therapist', 'A doctor', 'An app or online program', 'A printed handout', 'On my own'] },
      { label: 'App or program (if any)', name: 'hep_app', w: 1.6 },
      { label: 'From - to', name: 'hep_dates', w: 1.5, hint: 'MM/YYYY' },
      { label: 'Days / week', name: 'hep_perweek', w: 0.9 },
      { label: 'What did you work on?', name: 'hep_what', w: 2 },
      { label: 'Result', name: 'hep_result', w: 1.5, options: RESULT },
    ]);
  }, 56);

  const simpleTx = (key, title) => inGroup(key, () => {
    sub(title);
    fields([
      { label: 'Provider or clinic, city, phone', name: `${key}_provider`, w: 3 },
      { label: 'From - to', name: `${key}_dates`, w: 1.5, hint: 'MM/YYYY' },
      { label: 'How often', name: `${key}_freq`, w: 1.1 },
      { label: 'Total visits', name: `${key}_visits`, w: 0.9 },
      { label: 'Result', name: `${key}_result`, w: 1.5, options: RESULT },
      { label: 'Records', name: `${key}_records`, w: 1.7, options: RECORDS },
    ]);
  }, 56);
  simpleTx('chiro', 'Chiropractic Care');
  simpleTx('acu', 'Acupuncture');
  simpleTx('massage', 'Massage Therapy');
  inGroup('brace', () => {
    sub('Brace or Collar');
    fields([
      { label: 'Type', name: 'brace_type', w: 2, hint: 'e.g., lumbar support belt' },
      { label: 'Who prescribed it?', name: 'brace_by', w: 1.6 },
      { label: 'How long did you use it?', name: 'brace_when', w: 1.6 },
      { label: 'Result', name: 'brace_result', w: 1.3, options: RESULT },
    ]);
  }, 56);
  inGroup('othertx', () => {
    sub('Other Treatments');
    fields([
      { label: 'What was it, where, when, how often - and did it help?', name: 'othertx_detail', hint: 'TENS, yoga, Pilates, traction, pain psychology ...' },
    ]);
  }, 56);

  const INJ_TYPES = ['Epidural steroid', 'Facet joint', 'Medial branch block', 'Radiofrequency ablation', 'Selective nerve root block', 'Sacroiliac (SI) joint', 'Trigger point', 'Not sure', 'Other'];
  const injection = (n, title, moreLabel) => inGroup(`inj${n}`, () => {
    sub(title);
    fields([
      { label: 'Injection type', name: `inj${n}_type`, w: 2, options: INJ_TYPES },
      { label: 'Level and side', name: `inj${n}_level`, w: 1.3, hint: 'e.g., L4-5 right' },
      { label: 'Date', name: `inj${n}_date`, w: 1, hint: 'MM/YYYY' },
      { label: 'Doctor and facility, city, phone', name: `inj${n}_provider`, w: 3 },
    ]);
    fields([
      { label: 'How many in this series?', name: `inj${n}_count`, w: 1.3 },
      { label: '% relief', name: `inj${n}_relief`, w: 0.8 },
      { label: 'How long did relief last?', name: `inj${n}_lasted`, w: 1.6 },
      { label: 'Procedure notes', name: `inj${n}_records`, w: 1.8, options: RECORDS },
    ]);
    if (moreLabel) more(`inj${n}_more`, moreLabel);
  }, 112);
  injection(1, 'Spine Injections - your most recent', '+ I had another injection before this one (add another section)');
  injection(2, 'Spine Injections - the one before that', '+ I had another injection before this one (add another section)');
  injection(3, 'Spine Injections - an earlier one', '+ I had another injection before this one (add another section)');
  injection(4, 'Spine Injections - earlier still', null);

  inGroup('medtrial', () => {
    sub('Medications You Have Tried for This Problem');
    table('medtrial', [
      { key: 'name', label: 'Medication type', w: 3.3, type: 'label' },
      { key: 'tried', label: 'Tried', w: 0.7, type: 'cb' },
      { key: 'which', label: 'Which one, and dose', w: 2.4 },
      { key: 'by', label: 'Prescribed by', w: 1.7 },
      { key: 'dates', label: 'How long / when', w: 1.7 },
      { key: 'result', label: 'Did it help?', w: 1.9, type: 'dd', options: [...RESULT, 'Side effects - stopped'] },
    ], ['Anti-inflammatory (ibuprofen, naproxen)', 'Acetaminophen (Tylenol)', 'Oral steroid (prednisone, Medrol)', 'Nerve pain medicine (gabapentin)', 'Muscle relaxant', 'Opioid pain medicine', 'Cream or patch'], { rowH: 19 });
    fields([
      { label: 'Your pharmacy (name, town, phone) - they can print a "medication history" for you', name: 'medtrial_pharmacy', w: 3 },
      { label: 'Pharmacy printout', name: 'medtrial_records', w: 1.3, options: RECORDS },
    ]);
  }, 215);

  sub('Imaging & Tests');
  text('Check each study you have had for your spine. The written report matters most - please attach it.', { size: 8.8, font: ital, color: C.intro, gap: 3 });
  table('img', [
    { key: 'name', label: 'Study', w: 2.7, type: 'label' },
    { key: 'had', label: 'Had it', w: 0.8, type: 'cb' },
    { key: 'area', label: 'Body area', w: 1.5 },
    { key: 'date', label: 'Approx. date', w: 1.3 },
    { key: 'facility', label: 'Facility / imaging center, town', w: 3 },
    { key: 'report', label: 'Report attached', w: 1.5, type: 'cb' },
    { key: 'disc', label: 'Bringing disc', w: 1.3, type: 'cb' },
  ], ['X-rays', 'MRI', 'CT scan', 'EMG / nerve conduction study', 'Bone density scan (DEXA)'], { rowH: 19 });

  sub('Records Checklist');
  text('Check each kind of record you are attaching to your email, so we can confirm we received everything.', { size: 8.8, font: ital, color: C.intro, gap: 3 });
  checks('att', ['Physical therapy records', 'Injection procedure notes', 'Chiropractic / acupuncture / massage records', 'Pharmacy medication history', 'MRI / CT / X-ray reports', 'EMG report', 'Operative reports', "Other doctors' office notes"]);
  fields([{ label: 'Records you could NOT get - list the office and phone number, and we will help request them', name: 'att_missing', multiline: true }], { h: 32 });

  // ---------------------------------------------------------------- history
  newPage();
  section(6, 'Past Medical History', 'Select any medical conditions you have been diagnosed with. This helps your surgeon plan your care safely.');
  checks('pmh', [...COMMON_CONDITIONS.map((c) => c.replace('Hypertension (high blood pressure)', 'High blood pressure').replace('Seizure disorder / Epilepsy', 'Seizure disorder / epilepsy')), 'None of these'], { size: 8.9 });
  fields([{ label: 'Other conditions, year diagnosed, or details', name: 'pmh_other' }]);
  sub('Implanted Devices');
  checks('dev', [...IMPLANTED_DEVICES, 'None'], { size: 8.9 });

  section(7, 'Past Surgical History', 'List any prior surgeries, especially any spine surgeries. Approximate dates are fine.');
  table('psh', [
    { key: 'type', label: 'Surgery type', w: 3 },
    { key: 'region', label: 'Body region', w: 1.8 },
    { key: 'date', label: 'Date', w: 1.1 },
    { key: 'surgeon', label: 'Surgeon / hospital', w: 2.4 },
    { key: 'helped', label: 'Did it help?', w: 1.7, type: 'dd', options: [...RESULT, 'Not applicable'] },
  ], 5);
  fields([{ label: 'Any complications from surgery or anesthesia? (infection, blood clot, trouble waking up - or None)', name: 'psh_complications' }]);

  section(8, 'Allergies', 'List any known allergies, including medications, foods, latex, and metals.');
  need(20);
  cb('alg_nkda', M, y - 1, 10, 'No known drug allergies');
  draw('No Known Drug Allergies (NKDA)', M + 15, y - 9, { size: 9.4 });
  y -= 18;
  inGroup('allergies', () => {
    table('alg', [
      { key: 'what', label: 'What are you allergic to?', w: 3 },
      { key: 'reaction', label: 'Reaction', w: 3 },
      { key: 'severity', label: 'Severity', w: 1.6, type: 'dd', options: ['Mild', 'Moderate', 'Severe / anaphylaxis', 'Intolerance', 'Unknown'] },
    ], 4);
  });

  newPage();
  section(9, 'Current Medications', "List all medications you take, including over-the-counter medicines and supplements. Don't worry about exact doses - do your best.");
  need(20);
  cb('med_none', M, y - 1, 10, "I don't take any medications");
  draw("I don't take any medications", M + 15, y - 9, { size: 9.4 });
  y -= 18;
  inGroup('meds', () => {
    table('med', [
      { key: 'name', label: 'Medication name', w: 3.4 },
      { key: 'dose', label: 'Dose', w: 1.3 },
      { key: 'freq', label: 'How often', w: 1.8 },
      { key: 'reason', label: 'Reason (if known)', w: 2.5 },
    ], 8);
  });
  ask('med_thinner', 'Do you take a blood thinner or antiplatelet (warfarin, Eliquis, Xarelto, Plavix, aspirin)?', [['Yes', 'Yes'], ['No', 'No'], ['Unsure', 'Not sure']]);

  section(10, 'Social & Family History', 'This helps your surgeon understand your overall health. All responses are confidential.');
  ask('soc_nicotine', 'Do you use any nicotine (cigarettes, vape, chew, patch)?', [['never', 'Never'], ['current', 'Yes, currently'], ['former', 'Quit in the past']]);
  inGroup('nic_current', () => {
    fields([
      { label: 'What product?', name: 'nic_product', w: 1.6, hint: 'cigarettes, vape ...' },
      { label: 'How much and for how long?', name: 'nic_amount', w: 2 },
      { label: 'Willing to stop before surgery?', name: 'nic_willing', w: 1.4, options: ['Yes', 'No', 'Not sure'] },
    ]);
  });
  inGroup('nic_former', () => {
    fields([
      { label: 'What did you use, and how much?', name: 'nicf_product', w: 2, hint: 'e.g., 1 pack/day for 10 years' },
      { label: 'When did you quit?', name: 'nicf_quit', w: 1 },
    ]);
  });
  fields([
    { label: 'Alcohol', name: 'soc_alcohol', w: 1.4, options: ['None', 'Social / occasional', 'A few per week', 'Daily', 'Former heavy use'] },
    { label: 'Occupation', name: 'soc_occupation', w: 1.6 },
    { label: 'Current work status', name: 'soc_work', w: 1.7, options: ['Working full duty', 'Working with restrictions', 'Off work because of this', 'Retired', 'Disabled', 'Student', 'Homemaker'] },
    { label: 'Who lives with you?', name: 'soc_home', w: 1.4 },
    { label: 'Cane, walker, wheelchair?', name: 'soc_aids', w: 1.4 },
  ]);
  text('Is your condition related to any of the following? (Your answers do not affect the quality of your care.)', { size: 9.1, color: C.gray, gap: 2 });
  checks('ctx', [['ctx_na', 'Not applicable'], ['ctx_wc', "Workers' compensation claim"], ['ctx_mva', 'Motor vehicle accident'], ['ctx_pi', 'Personal injury case']]);
  inGroup('legal', () => {
    fields([
      { label: 'Date of injury / accident', name: 'ctx_date', w: 1.2 },
      { label: 'Claim number (if known)', name: 'ctx_claim', w: 1.4 },
      { label: 'Case manager or attorney contact', name: 'ctx_contact', w: 2.2 },
    ]);
  });
  fields([{ label: 'Family history relevant to your spine care (scoliosis, osteoporosis, bleeding or anesthesia problems) - or None', name: 'fam_history' }]);

  // ---------------------------------------------------------------- ROS
  newPage();
  section(11, 'Review of Systems', 'Check anything you have had recently. If nothing in a group applies, check "None" for that group - most people check "None" for most groups.');
  {
    const colW = (CW - 16) / 2;
    const size = 8.9;
    const lh = size * 1.24;
    const finding = (label) => {
      const t = label.replace(/\?$/, '').replace(/^Do you /, '');
      return t.charAt(0).toUpperCase() + t.slice(1);
    };
    const blockH = (s) => 13 + s.questions.reduce((sum, q) => sum + wrap(finding(q.label), reg, size, colW - 18).length * lh + 1.6, 0) + 8;
    const total = ROS_SECTIONS.reduce((s, x) => s + blockH(x), 0);
    const top = y;
    let col = 0;
    let yy = top;
    let used = 0;
    let lowest = top;
    for (const s of ROS_SECTIONS) {
      const h = blockH(s);
      if (col === 0 && used + h / 2 > total / 2) { col = 1; yy = top; }
      const x = M + col * (colW + 16);
      page.drawText(sanitize(s.title), { x, y: yy - 9.6, size: 9.8, font: bold, color: C.navy });
      cb(`ros_${s.id}_none`, x + colW - 46, yy - 0.5, 9, `${s.title}: none of these`);
      page.drawText('None', { x: x + colW - 33, y: yy - 8.6, size: 8.9, font: bold, color: C.tealDark });
      yy -= 13;
      for (const q of s.questions) {
        const lines = wrap(finding(q.label), reg, size, colW - 18);
        cb(`ros_${s.id}_${q.id}`, x, yy - 0.3, 9, q.label);
        lines.forEach((l, k) => page.drawText(l, { x: x + 13.5, y: yy - size + 0.6 - k * lh, size, font: reg, color: C.ink }));
        yy -= lines.length * lh + 1.6;
      }
      yy -= 8;
      used += h;
      lowest = Math.min(lowest, yy);
    }
    y = lowest - 2;
  }
  fields([{ label: 'Anything checked above that you would like to explain', name: 'ros_notes', multiline: true }], { h: 30 });

  // ---------------------------------------------------------------- PROMs
  const ODI_NDI_SCORE = (id, label) =>
    `var s=0,n=0;for(var i=1;i<=10;i++){var v=this.getField("${id}_"+i).value;if(v!==null&&v!=="Off"&&v!==""){s+=Number(v);n++;}}\n` +
    'if(n==0){event.value="";}else{var pct=Math.round(s/(n*5)*100);var lvl=pct<=20?"minimal disability":pct<=40?"moderate disability":pct<=60?"severe disability":pct<=80?"crippling disability":"bed-bound / exaggerated";\n' +
    `event.value="${label} "+s+"/"+(n*5)+" = "+pct+"% ("+lvl+")"+(n<10?"  -  "+(10-n)+" item(s) unanswered":"");}`;

  newPage();
  section(12, 'Questionnaires', 'These short questionnaires measure how your symptoms affect daily life. Only the ones that match your answers on page 2 appear.');
  statusLine('odi_status', 'Low back questionnaire - complete this page if you have low back, hip, or leg symptoms.');
  inGroup('odi', () => {
    sub('Oswestry Disability Index (ODI) - how your back or leg pain affects daily activities');
    text('For each topic, choose the ONE statement that best describes you today.', { size: 8.8, font: ital, color: C.intro, gap: 4 });
    questionnaire(ODI, 'odi');
    scoreLine('odi_score', ODI_NDI_SCORE('odi', 'ODI'));
  });

  newPage();
  statusLine('ndi_status', 'Neck questionnaire - complete this page if you have neck, shoulder, arm, or hand symptoms.');
  inGroup('ndi', () => {
    sub('Neck Disability Index (NDI) - how your neck pain affects daily activities');
    text('For each topic, choose the ONE statement that best describes you today.', { size: 8.8, font: ital, color: C.intro, gap: 4 });
    questionnaire(NDI, 'ndi');
    scoreLine('ndi_score', ODI_NDI_SCORE('ndi', 'NDI'));
  });

  newPage();
  statusLine('mjoa_status', 'Hand and walking function - complete this section if you have hand clumsiness, dropping objects, balance problems, or electric-shock sensations.');
  inGroup('mjoa', () => {
    sub('Modified Japanese Orthopaedic Association Score (mJOA)');
    text('For each topic, choose the ONE statement that best describes you right now.', { size: 8.8, font: ital, color: C.intro, gap: 4 });
    questionnaire(MJOA, 'mjoa', { layout: [[0, 2], [1, 3]] });
    scoreLine('mjoa_score',
      'var s=0,n=0;for(var i=1;i<=4;i++){var v=this.getField("mjoa_"+i).value;if(v!==null&&v!=="Off"&&v!==""){s+=Number(v);n++;}}\n' +
      'if(n==0){event.value="";}else if(n<4){event.value="Answered "+n+" of 4 - please complete all four topics";}else{var lvl=s>=18?"no myelopathy":s>=15?"mild myelopathy":s>=12?"moderate myelopathy":"severe myelopathy";event.value="mJOA "+s+"/18 ("+lvl+")";}');
  });

  // ---------------------------------------------------------------- close
  section(13, `Your Questions for ${CONFIG.surgeonShort}`, `What do you most want answered or addressed at this appointment? Writing it here lets ${CONFIG.surgeonShort} prepare before he sees you.`);
  fields([{ label: 'Your questions, and anything you specifically want addressed at the visit', name: 'q_visit', multiline: true }], { h: 58 });
  fields([{ label: 'What are you hoping this visit will achieve?', name: 'q_goals', hint: 'a diagnosis, treatment options, a second opinion, to discuss surgery ...' }]);

  section(14, 'Review & Submit');
  fields([
    { label: 'Patient signature (type your full name)', name: 'sig_name', w: 2.6 },
    { label: 'Date', name: 'sig_date', w: 1, hint: 'MM/DD/YYYY' },
    { label: 'Completed by (if not the patient)', name: 'sig_by', w: 1.8 },
  ]);
  {
    const b = box('Returning this form', [
      'Option 1: Click "Email this form" (works in Adobe Acrobat Reader), then attach your treatment records to that same email before sending.',
      `Option 2: Save this PDF (File > Save) and attach it, with your records, to an email to ${EMAIL}.`,
      'Option 3: Print it and bring it, with your records, to your appointment. Email is not fully secure, so use this option if you prefer.',
    ], { reserveRight: 150 });
    emailButton(M + CW - 146, (b.top + b.bottom) / 2 + 13, 132, 26);
  }

  // =========================================================================
  // FINISHING
  // =========================================================================

  // Footer, with the patient's name repeated on every page so a separated page
  // still says whose it is. The name is a calculated read-only field.
  const footer = form.createTextField(claim('pt_footer'));
  footer.enableReadOnly();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 40 }, end: { x: PAGE.w - M, y: 40 }, thickness: 0.5, color: C.rule });
    p.drawText(`${CONFIG.institution}  |  New Patient Spine Intake`, { x: M, y: 28, size: 7.6, font: reg, color: C.gray });
    p.drawText('Patient:', { x: M + 200, y: 28, size: 7.6, font: reg, color: C.gray });
    footer.addToPage(p, { x: M + 228, y: 24, width: 210, height: 12, font: reg, borderWidth: 0, textColor: C.gray });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: PAGE.w - M - reg.widthOfTextAtSize(label, 7.6), y: 28, size: 7.6, font: reg, color: C.gray });
  });
  footer.setFontSize(7.6);
  footer.acroField.dict.set(PDFName.of('AA'), ctx.obj({ C: jsAction(
    'var f=this.getField("pt_first").value||"",l=this.getField("pt_last").value||"",d=this.getField("pt_dob").value||"";' +
    'var n=String(f+" "+l).replace(/^\\s+|\\s+$/g,"");event.value=n+(n&&d?"   DOB "+d:"");'
  ) }));

  const age = form.getTextField('pt_age');
  age.acroField.dict.set(PDFName.of('AA'), ctx.obj({ C: jsAction(
    'var d=this.getField("pt_dob").value||"";var m=String(d).match(/^\\s*(\\d{1,2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{4})\\s*$/);\n' +
    'if(!m){event.value="";}else{var b=new Date(Number(m[3]),Number(m[1])-1,Number(m[2]));var t=new Date();var a=t.getFullYear()-b.getFullYear();\n' +
    'if(t.getMonth()<b.getMonth()||(t.getMonth()==b.getMonth()&&t.getDate()<b.getDate()))a--;event.value=(a>=0&&a<130)?String(a):"";}'
  ) }));

  // The red-flag notice gets its warning colours.
  {
    const w = form.getTextField('redflag_msg').acroField.getWidgets()[0];
    const mk = w.getOrCreateAppearanceCharacteristics();
    mk.setBackgroundColor([C.redBg.red, C.redBg.green, C.redBg.blue]);
    mk.setBorderColor([C.red.red, C.red.green, C.red.blue]);
    form.getTextField('redflag_msg').updateAppearances(bold);
  }

  // The hidden field whose only job is to re-run the branching on any change.
  const branch = form.createTextField(claim('_si_branch'));
  branch.addToPage(pages[0], { x: 0, y: 0, width: 1, height: 1, font: reg, borderWidth: 0, hidden: true });
  branch.enableReadOnly();
  branch.acroField.dict.set(PDFName.of('AA'), ctx.obj({ C: jsAction('siRefresh();') }));

  form.acroForm.dict.set(PDFName.of('CO'), ctx.obj([age.ref, ...calcFields.map((f) => f.ref), footer.ref, branch.ref]));

  // ---- the branching script ----------------------------------------------------
  const script = `
var SI_GROUPS = ${JSON.stringify(groups)};
var SI_STATE = {};
function siVal(n){ var f=this.getField(n); if(!f) return ""; var v=f.value; return (v===null||v===undefined)?"":String(v); }
function siOn(n){ var v=siVal(n); return v!=="" && v!=="Off"; }
function siAny(a){ for(var i=0;i<a.length;i++){ if(siOn(a[i])) return true; } return false; }
function siShow(g,on){
  on = !!on;
  if (SI_STATE[g]===on) return;
  SI_STATE[g]=on;
  var names=SI_GROUPS[g]||[];
  for(var i=0;i<names.length;i++){ var f=this.getField(names[i]); if(f){ f.display = on ? display.visible : display.hidden; } }
}
function siSet(n,v){ var f=this.getField(n); if(f && f.value!==v) f.value=v; }
function siRefresh(){
  try {
    var NECK=["area_neck","area_shoulder_l","area_shoulder_r","area_arm_l","area_arm_r","area_hand_l","area_hand_r"];
    var LOW=["area_lowback","area_tailbone","area_hip_l","area_hip_r","area_leg_l","area_leg_r","area_foot_l","area_foot_r"];
    var OTHER=["area_upperback","area_midback","area_curve","area_headache","area_chest","area_groin","area_balance","area_other"];
    var neck=siAny(NECK), low=siAny(LOW), anyArea=neck||low||siAny(OTHER);
    var myelo = siVal("neck_fine")=="Yes" || siVal("neck_drop")=="Yes" || siVal("neck_balance")=="Yes" || siVal("neck_shock")=="Yes" || siOn("area_balance");

    siShow("contact", !siOn("pt_onfile"));
    siShow("neck_pain", neck); siShow("low_pain", low);
    siShow("neck", neck); siShow("lower", low);
    siShow("prior_surgery", siOn("cc_prior_surgery") || siVal("pt_reason")=="Follow-up after surgery elsewhere");
    siShow("redflag", siVal("urg_bladder")=="Yes" || siVal("urg_saddle")=="Yes" || siVal("urg_weak")=="Yes");

    // Each round of treatment reveals the one before it, most recent first.
    var pt=siOn("tx_pt");
    siShow("pt1", pt);
    siShow("pt2", pt && siOn("pt1_more"));
    siShow("pt3", pt && siOn("pt1_more") && siOn("pt2_more"));
    var inj=siOn("tx_inj");
    siShow("inj1", inj);
    siShow("inj2", inj && siOn("inj1_more"));
    siShow("inj3", inj && siOn("inj1_more") && siOn("inj2_more"));
    siShow("inj4", inj && siOn("inj1_more") && siOn("inj2_more") && siOn("inj3_more"));

    siShow("hep", siOn("tx_hep")); siShow("chiro", siOn("tx_chiro")); siShow("acu", siOn("tx_acu"));
    siShow("massage", siOn("tx_massage")); siShow("brace", siOn("tx_brace")); siShow("othertx", siOn("tx_other"));
    siShow("medtrial", siOn("tx_meds"));

    siShow("meds", !siOn("med_none"));
    siShow("allergies", !siOn("alg_nkda"));
    var nic=siVal("soc_nicotine");
    siShow("nic_current", nic=="current"); siShow("nic_former", nic=="former");
    siShow("legal", siAny(["ctx_wc","ctx_mva","ctx_pi"]));

    siShow("odi", low); siShow("ndi", neck); siShow("mjoa", myelo);
    var first="Check your symptom areas on page 2 first.";
    var skip=" - not needed based on your answers. You may skip this page.";
    siSet("odi_status", !anyArea ? first : (low ? "Please complete this questionnaire (you reported low back, hip, or leg symptoms)." : "Low back questionnaire"+skip));
    siSet("ndi_status", !anyArea ? first : (neck ? "Please complete this questionnaire (you reported neck, shoulder, arm, or hand symptoms)." : "Neck questionnaire"+skip));
    siSet("mjoa_status", myelo ? "Please complete this section (you reported hand clumsiness, dropping objects, balance problems, or electric-shock sensations)." : (!anyArea ? first : "Hand and walking function - not needed based on your answers. You may skip this section."));
  } catch (e) {}
}
siRefresh();
`;
  // Every name the script mentions must exist, or a branch silently never fires.
  const unknown = new Set();
  for (const m of script.matchAll(/"([a-z][a-z0-9_]*)"/g)) {
    const n = m[1];
    const isName = /^(area|tx|pt|inj|neck|urg|ctx|med|alg|soc|cc|odi|ndi|mjoa)_|^(pt\d|inj\d)$/.test(n) || groups[n];
    if (isName && !names.has(n) && !groups[n]) unknown.add(n);
  }
  for (const m of script.matchAll(/siShow\("([a-z0-9_]+)"/g)) if (!groups[m[1]]) unknown.add(`group:${m[1]}`);
  if (unknown.size) throw new Error(`The branching script names things that do not exist in the form: ${[...unknown].join(', ')}`);

  pdf.catalog.set(PDFName.of('Names'), ctx.obj({ JavaScript: { Names: [PDFString.of('SpineIntake'), ctx.register(jsAction(script))] } }));

  form.updateFieldAppearances(reg);
  fs.mkdirSync(path.dirname(CONFIG.out), { recursive: true });
  fs.writeFileSync(CONFIG.out, await pdf.save({ updateFieldAppearances: false }));

  const kb = (fs.statSync(CONFIG.out).size / 1024).toFixed(0);
  const cells = Object.values(cellCounts).reduce((a, b) => a + b, 0);
  console.log(`Wrote ${path.relative(ROOT, CONFIG.out)}  (${kb} KB, ${pages.length} pages)`);
  console.log(`  fields:             ${names.size - labelCount} inputs, ${labelCount} hideable labels`);
  console.log(`  conditional groups: ${Object.keys(groups).length}  (${Object.keys(groups).join(', ')})`);
  console.log(`  diagram cells:      ${cells}`);
  console.log(`  logo:               ${logo ? 'embedded' : 'NOT FOUND - put the file at assets/holy-name-logo.png'}`);
  console.log(`  return address:     ${EMAIL}`);
}

main().catch((e) => {
  fs.rmSync(TMP, { recursive: true, force: true });
  console.error(e);
  process.exit(1);
});
