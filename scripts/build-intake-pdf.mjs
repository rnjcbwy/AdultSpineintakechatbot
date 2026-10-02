/**
 * Build the fillable PDF version of the spine intake.
 *
 *   node scripts/build-intake-pdf.mjs
 *   node scripts/build-intake-pdf.mjs --office-email=frontdesk@example.org
 *
 * Writes forms/Spine-Intake-Form.pdf — a form the front desk emails to a new
 * patient, who fills it in, saves it, and replies with it and their treatment
 * records attached.
 *
 * Design constraints that shaped it:
 *
 *  - It has to work in whatever opens it. PDF JavaScript runs in Acrobat and
 *    little else, so nothing here depends on it. Branching is done with
 *    Yes/No gate questions and "skip" buttons that are ordinary internal
 *    links, which every viewer follows.
 *  - The body diagram is a grid of checkboxes laid over the traced figure,
 *    only where there is body. A click places a mark, a second click removes
 *    it. Each cell's tooltip is its anatomical zone, from the same zone table
 *    the web intake uses.
 *  - Content comes from the app's own modules (questionnaires, review of
 *    systems, condition lists), so the PDF and the web intake cannot drift.
 *
 * The office email is not known yet. Without --office-email the form tells the
 * patient to reply to the email it arrived in, which needs no address at all.
 * The logo is used if assets/holy-name-logo.png exists; otherwise the header
 * carries the institution name in text.
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
  credential: 'Adult and Pediatric Spine Surgeon',
  institution: 'Holy Name Medical Center',
  formTitle: 'New Patient Spine Intake Form',
  officeEmail: arg('office-email') || process.env.OFFICE_EMAIL || '',
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
  blue: hex('#0064A5'),
  ink: hex('#1F2937'),
  gray: hex('#566573'),
  rule: hex('#C9D6DE'),
  tint: hex('#EAF6F6'),
  fieldBg: hex('#F7FAFC'),
  fieldBorder: hex('#9DB2C2'),
  red: hex('#B3261E'),
  redBg: hex('#FCEDEC'),
  white: rgb(1, 1, 1),
};

const PAGE = { w: 612, h: 792 };
const M = 40;
const CW = PAGE.w - M * 2;
const BOTTOM = 44;

// Characters the standard PDF fonts cannot encode.
const sanitize = (s) => String(s)
  .replace(/[→➔➜]/g, '>')
  .replace(/≥/g, 'at least ')
  .replace(/≤/g, 'at most ')
  .replace(/[☐☑]/g, '')
  .replace(/ /g, ' ');

async function main() {
  const lib = await loadLib();
  const { ODI, NDI, MJOA } = lib.questionnaires;
  const { ROS_SECTIONS } = lib.rosSystems;
  const { COMMON_CONDITIONS, IMPLANTED_DEVICES } = lib.constants;
  const { zoneAt, VIEW_BOX } = lib.bodyMap;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${CONFIG.formTitle} - ${CONFIG.surgeon}`);
  pdf.setAuthor(CONFIG.surgeon);
  pdf.setSubject('New patient intake: history, prior non-operative care, and records checklist');
  pdf.setCreator('scripts/build-intake-pdf.mjs');
  pdf.catalog.set(PDFName.of('Lang'), PDFString.of('en-US'));

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const obl = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const form = pdf.getForm();
  const ctx = pdf.context;

  const pages = [];
  let page = null;
  let y = 0;
  const anchors = {};
  const links = [];
  const names = new Set();
  let mirrors = null;

  const uniq = (name) => {
    let n = name;
    let i = 2;
    while (names.has(n)) n = `${name}_${i++}`;
    names.add(n);
    return n;
  };
  const slug = (s) => sanitize(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

  // ---- text ---------------------------------------------------------------
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
  const draw = (str, x, yy, { size = 9, font = helv, color = C.ink } = {}) =>
    page.drawText(sanitize(str), { x, y: yy, size, font, color });

  // ---- pages ---------------------------------------------------------------
  function newPage() {
    page = pdf.addPage([PAGE.w, PAGE.h]);
    pages.push(page);
    if (pages.length === 1) {
      mainHeader();
    } else {
      page.drawRectangle({ x: 0, y: PAGE.h - 22, width: PAGE.w, height: 22, color: C.navy });
      page.drawRectangle({ x: 0, y: PAGE.h - 24.5, width: PAGE.w, height: 2.5, color: C.teal });
      draw(`${CONFIG.formTitle}   |   ${CONFIG.surgeon}`, M, PAGE.h - 15, { size: 8, font: bold, color: C.white });
      y = PAGE.h - 52;
    }
  }
  const need = (h) => { if (y - h < BOTTOM) newPage(); };
  const space = (h) => { y -= h; };
  const anchor = (key) => { anchors[key] = { page: pages.length - 1, y: y + 6 }; };

  async function embedLogo() {
    if (!fs.existsSync(CONFIG.logoPath)) return null;
    const bytes = fs.readFileSync(CONFIG.logoPath);
    return CONFIG.logoPath.toLowerCase().endsWith('.png') ? pdf.embedPng(bytes) : pdf.embedJpg(bytes);
  }
  const logo = await embedLogo();

  function mainHeader() {
    const top = PAGE.h - 30;
    if (logo) {
      const h = 38;
      const w = (logo.width / logo.height) * h;
      page.drawImage(logo, { x: M, y: top - h, width: w, height: h });
    } else {
      // Stand-in until the official logo file is supplied.
      draw(CONFIG.institution, M, top - 24, { size: 19, font: serifBold, color: C.navy });
    }
    const nameW = bold.widthOfTextAtSize(CONFIG.surgeon, 12.5);
    draw(CONFIG.surgeon, PAGE.w - M - nameW, top - 13, { size: 12.5, font: bold, color: C.navy });
    const credW = helv.widthOfTextAtSize(CONFIG.credential, 10);
    draw(CONFIG.credential, PAGE.w - M - credW, top - 27, { size: 10, color: C.blue });

    const bandTop = top - 46;
    page.drawRectangle({ x: M, y: bandTop - 26, width: CW, height: 26, color: C.navy });
    page.drawRectangle({ x: M, y: bandTop - 29, width: CW, height: 3, color: C.teal });
    draw(CONFIG.formTitle.toUpperCase(), M + 10, bandTop - 17.5, { size: 12.5, font: bold, color: C.white });
    y = bandTop - 40;
  }

  // ---- blocks --------------------------------------------------------------
  function text(str, { x = M, size = 9, font = helv, color = C.ink, maxW = CW - (x - M), gap = 3, lh } = {}) {
    const lineH = lh || size * 1.32;
    const lines = wrap(str, font, size, maxW);
    need(lines.length * lineH);
    for (const line of lines) {
      draw(line, x, y - size, { size, font, color });
      y -= lineH;
    }
    y -= gap;
  }

  function section(num, title, { key, note } = {}) {
    need(64);
    if (key) anchor(key);
    page.drawRectangle({ x: M, y: y - 20, width: CW, height: 20, color: C.navy });
    page.drawRectangle({ x: M, y: y - 20, width: 5, height: 20, color: C.teal });
    draw(`${num}.  ${title}`, M + 13, y - 14, { size: 10.5, font: bold, color: C.white });
    y -= 27;
    if (note) text(note, { size: 8.3, color: C.gray, gap: 4 });
  }

  function sub(title, { key } = {}) {
    need(40);
    if (key) anchor(key);
    y -= 3;
    draw(title, M, y - 9.5, { size: 9.8, font: bold, color: C.tealDark });
    page.drawLine({ start: { x: M, y: y - 13.5 }, end: { x: M + CW, y: y - 13.5 }, thickness: 0.7, color: C.teal });
    y -= 19;
  }

  function callout(title, body, { bg = C.tint, edge = C.teal, titleColor = C.navy, size = 8.6 } = {}) {
    const pad = 9;
    const lines = [];
    for (const para of [].concat(body)) lines.push(...wrap(para, helv, size, CW - pad * 2 - 4), null);
    lines.pop();
    const lh = size * 1.36;
    const h = pad * 2 + (title ? 14 : 0) + lines.reduce((s, l) => s + (l === null ? 4 : lh), 0);
    need(h + 6);
    page.drawRectangle({ x: M, y: y - h, width: CW, height: h, color: bg });
    page.drawRectangle({ x: M, y: y - h, width: 4, height: h, color: edge });
    let yy = y - pad;
    if (title) { draw(title, M + pad + 4, yy - 9.5, { size: 9.8, font: bold, color: titleColor }); yy -= 14; }
    for (const l of lines) {
      if (l === null) { yy -= 4; continue; }
      draw(l, M + pad + 4, yy - size, { size });
      yy -= lh;
    }
    y -= h + 8;
  }

  // ---- fields --------------------------------------------------------------
  const FIELD = { borderWidth: 0.6, borderColor: C.fieldBorder, backgroundColor: C.fieldBg, textColor: C.ink };

  function setTip(field, tip) {
    if (tip) field.acroField.dict.set(PDFName.of('TU'), PDFHexString.fromText(sanitize(tip)));
  }

  function tf(name, x, yTop, w, h = 16, { multiline = false, size = 9, tip, required = false } = {}) {
    const f = form.createTextField(uniq(name));
    if (multiline) f.enableMultiline();
    f.addToPage(page, { x, y: yTop - h, width: w, height: h, font: helv, ...FIELD });
    f.setFontSize(size);
    if (required) f.enableRequired();
    setTip(f, tip);
    return f;
  }

  function cb(name, x, yTop, size = 9.5, tip) {
    const f = form.createCheckBox(uniq(name));
    f.addToPage(page, { x, y: yTop - size, width: size, height: size, ...FIELD, backgroundColor: C.white });
    setTip(f, tip);
    return f;
  }

  function dd(name, x, yTop, w, h, options, tip) {
    const f = form.createDropdown(uniq(name));
    f.addOptions(options.map(sanitize));
    f.addToPage(page, { x, y: yTop - h, width: w, height: h, font: helv, ...FIELD });
    f.setFontSize(8);
    setTip(f, tip);
    return f;
  }

  /** A row of labelled text fields. `w` values are relative widths. */
  function fields(defs, { h = 16, x0 = M, width = CW } = {}) {
    need(10 + h + 6);
    const gap = 8;
    const total = width - gap * (defs.length - 1);
    const sum = defs.reduce((s, d) => s + (d.w || 1), 0);
    let x = x0;
    for (const d of defs) {
      const w = (total * (d.w || 1)) / sum;
      draw(d.label, x, y - 7.2, { size: 7.4, color: d.required ? C.navy : C.gray, font: d.required ? bold : helv });
      tf(d.name, x, y - 10, w, h, { ...d, tip: d.tip || d.label });
      x += w + gap;
    }
    y -= 10 + h + 6;
  }

  /** Checkboxes in columns; labels wrap inside their column. */
  function checks(prefix, labels, { cols = 3, size = 8.5, x0 = M, width = CW, gap = 3 } = {}) {
    const colW = width / cols;
    for (let i = 0; i < labels.length; i += cols) {
      const row = labels.slice(i, i + cols);
      const wrapped = row.map((l) => wrap(l, helv, size, colW - 18));
      const lh = size * 1.25;
      const rowH = Math.max(...wrapped.map((w) => w.length)) * lh + gap;
      need(rowH);
      row.forEach((label, j) => {
        const x = x0 + j * colW;
        cb(`${prefix}.${slug(label)}`, x, y - 0.5, 9, label);
        wrapped[j].forEach((line, k) => draw(line, x + 13, y - size + 0.5 - k * lh, { size }));
      });
      y -= rowH;
    }
    y -= 2;
  }

  /** One radio group laid out inline, wrapping when it runs out of width. */
  function radios(name, options, { x0 = M, width = CW, size = 8.5, r = 9, gapX = 14 } = {}) {
    const g = form.createRadioGroup(uniq(name));
    let x = x0;
    need(r + 5);
    for (const o of options) {
      const label = typeof o === 'string' ? o : o.label;
      const value = typeof o === 'string' ? o : o.value;
      const w = r + 4 + helv.widthOfTextAtSize(sanitize(label), size);
      if (x + w > x0 + width && x > x0) { x = x0; y -= r + 5; need(r + 5); }
      g.addOptionToPage(sanitize(String(value)), page, { x, y: y - r, width: r, height: r, ...FIELD, backgroundColor: C.white });
      draw(label, x + r + 4, y - size + 0.5, { size });
      x += w + gapX;
    }
    y -= r + 6;
    return g;
  }

  /** "Question .......... ( ) Yes ( ) No" on one line. */
  function yesNo(name, question, { size = 8.6, options = ['Yes', 'No'], bullet = false } = {}) {
    const optW = options.reduce((s, o) => s + 9 + 4 + helv.widthOfTextAtSize(o, size) + 12, 0);
    const lines = wrap(question, helv, size, CW - optW - 10);
    const lh = size * 1.28;
    const h = Math.max(lines.length * lh, 12) + 3;
    need(h);
    lines.forEach((l, i) => draw(l, M, y - size - i * lh, { size }));
    const g = form.createRadioGroup(uniq(name));
    let x = M + CW - optW + 12;
    for (const o of options) {
      g.addOptionToPage(o, page, { x, y: y - 9.5, width: 9, height: 9, ...FIELD, backgroundColor: C.white });
      draw(o, x + 13, y - size, { size });
      x += 9 + 4 + helv.widthOfTextAtSize(o, size) + 12;
    }
    page.drawLine({ start: { x: M, y: y - h + 1.5 }, end: { x: M + CW, y: y - h + 1.5 }, thickness: 0.3, color: C.rule });
    y -= h + 1;
    return g;
  }

  /** A button that jumps to another part of the form. Works in any viewer. */
  function skipButton(label, target, x, yTop) {
    const size = 8.2;
    const w = bold.widthOfTextAtSize(sanitize(label), size) + 16;
    const h = 15;
    page.drawRectangle({ x, y: yTop - h, width: w, height: h, color: C.tint, borderColor: C.tealDark, borderWidth: 0.8 });
    draw(label, x + 8, yTop - 10.3, { size, font: bold, color: C.tealDark });
    links.push({ page: pages.length - 1, rect: [x, yTop - h, x + w, yTop], target });
    return w;
  }

  /**
   * A branch point: a Yes/No question, and a way past the section for "No".
   * The skip is a plain link, so it needs nothing from the viewer.
   */
  function gate(name, question, { skipTo, skipLabel } = {}) {
    const lines = wrap(question, bold, 9.4, CW);
    need(lines.length * 12.5 + 24);
    lines.forEach((l, i) => draw(l, M, y - 9.4 - i * 12.5, { size: 9.4, font: bold, color: C.navy }));
    y -= lines.length * 12.5 + 3;
    const g = form.createRadioGroup(uniq(name));
    let x = M;
    for (const o of ['Yes', 'No']) {
      g.addOptionToPage(o, page, { x, y: y - 10.5, width: 10, height: 10, ...FIELD, backgroundColor: C.white });
      draw(o, x + 14, y - 8.8, { size: 9, font: bold });
      x += 46;
    }
    if (skipTo) skipButton(skipLabel || 'If No, skip ahead »', skipTo, x + 6, y + 2);
    y -= 19;
  }

  /** A grid of fields. Column types: text | dd | cb | label. */
  function table(prefix, cols, rows, { rowH = 18, headSize = 7.2 } = {}) {
    const n = typeof rows === 'number' ? rows : rows.length;
    const gap = 3;
    const total = CW - gap * (cols.length - 1);
    const sum = cols.reduce((s, c) => s + c.w, 0);
    const widths = cols.map((c) => (total * c.w) / sum);
    const headLines = cols.map((c, i) => wrap(c.label, bold, headSize, widths[i] - 4));
    const headH = Math.max(...headLines.map((l) => l.length)) * (headSize + 1.6) + 6;
    need(headH + rowH * Math.min(n, 3) + 4);
    page.drawRectangle({ x: M, y: y - headH, width: CW, height: headH, color: C.tint });
    let x = M;
    headLines.forEach((lines, i) => {
      lines.forEach((l, k) => draw(l, x + 2, y - headSize - 2.5 - k * (headSize + 1.6), { size: headSize, font: bold, color: C.navy }));
      x += widths[i] + gap;
    });
    y -= headH + 3;
    for (let r = 0; r < n; r++) {
      need(rowH + 2);
      x = M;
      cols.forEach((c, i) => {
        const w = widths[i];
        const fname = `${prefix}.${r + 1}.${c.key}`;
        if (c.type === 'label') {
          wrap(rows[r], bold, 8.2, w - 2).forEach((l, k) => draw(l, x + 1, y - 9 - k * 9.6, { size: 8.2, font: bold, color: C.ink }));
        } else if (c.type === 'cb') {
          cb(fname, x + w / 2 - 5, y - (rowH - 2 - 10) / 2, 10, `${c.label}${typeof rows === 'number' ? '' : ` - ${rows[r]}`}`);
        } else if (c.type === 'dd') {
          dd(fname, x, y, w, rowH - 2, c.options, c.label);
        } else {
          tf(fname, x, y, w, rowH - 2, { size: 8, multiline: rowH > 24, tip: c.tip || c.label });
        }
        x += w + gap;
      });
      y -= rowH + 1.5;
    }
    y -= 4;
  }

  // ---- body diagram --------------------------------------------------------
  /** Path and placement of one traced figure, as normalised for the web app. */
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
      let ink = new Uint8Array(width * height);
      for (let i = 0, p = 0; i < width * height; i++, p += 4) ink[i] = (data[p] + data[p + 1] + data[p + 2]) / 3 < 170 ? 1 : 0;
      const thick = new Uint8Array(ink);
      for (let yy = 0; yy < height; yy++) for (let xx = 0; xx < width; xx++) {
        const i = yy * width + xx;
        if (ink[i]) continue;
        if ((xx > 0 && ink[i - 1]) || (xx < width - 1 && ink[i + 1]) || (yy > 0 && ink[i - width]) || (yy < height - 1 && ink[i + width])) thick[i] = 1;
      }
      ink = thick;
      const outside = new Uint8Array(width * height);
      const stack = [];
      const push = (xx, yy) => {
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) return;
        const i = yy * width + xx;
        if (outside[i] || ink[i]) return;
        outside[i] = 1; stack.push(i);
      };
      for (let xx = 0; xx < width; xx++) { push(xx, 0); push(xx, height - 1); }
      for (let yy = 0; yy < height; yy++) { push(0, yy); push(width - 1, yy); }
      while (stack.length) {
        const i = stack.pop();
        const xx = i % width, yy = (i / width) | 0;
        push(xx + 1, yy); push(xx - 1, yy); push(xx, yy + 1); push(xx, yy - 1);
      }
      out[name] = { width, height, isBody: (xx, yy) => xx >= 0 && yy >= 0 && xx < width && yy < height && !outside[yy * width + xx] };
    }
    return out;
  }

  const masks = await bodyMasks();
  const figures = { front: loadFigure('front'), back: loadFigure('back') };
  const GRID = { cols: 20, rows: 40 };
  const diagramCells = [];

  /** Appearance streams for a diagram cell: nothing when off, a dot when on. */
  function markAppearance(size, color) {
    const r = size * 0.4;
    const c = size / 2;
    const k = 0.5523 * r;
    const [R, G, B] = color;
    const circle =
      `${c + r} ${c} m ${c + r} ${c + k} ${c + k} ${c + r} ${c} ${c + r} c ` +
      `${c - k} ${c + r} ${c - r} ${c + k} ${c - r} ${c} c ` +
      `${c - r} ${c - k} ${c - k} ${c - r} ${c} ${c - r} c ` +
      `${c + k} ${c - r} ${c + r} ${c - k} ${c + r} ${c} c h`;
    const on = ctx.register(ctx.stream(
      `q /GS gs ${R} ${G} ${B} rg 1 1 1 RG 0.7 w ${circle} B Q`,
      { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, size, size], Resources: { ExtGState: { GS: { Type: 'ExtGState', ca: 0.88, CA: 1 } } } }
    ));
    const off = ctx.register(ctx.stream('', { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, size, size] }));
    return { on, off };
  }

  /**
   * One figure with its clickable cells. Returns the cell requests rather than
   * creating them, because these widgets are built by hand (shared appearance
   * streams, no border) and must be added after pdf-lib has generated the
   * appearances of every ordinary field.
   */
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
    const cellV = VIEW_BOX.width / GRID.cols;
    const cellPt = cellV * k;
    const bodyView = view === 'front' ? 'anterior' : 'posterior';
    for (let r = 0; r < GRID.rows; r++) for (let c = 0; c < GRID.cols; c++) {
      // Keep a cell only where enough of it lies on the body.
      let hit = 0;
      const N = 5;
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
        const vx = (c + (a + 0.5) / N) * cellV;
        const vy = (r + (b + 0.5) / N) * cellV;
        if (mask.isBody(Math.round((vx - fig.tx) / fig.s), Math.round((vy - fig.ty) / fig.s))) hit++;
      }
      if (hit / (N * N) < 0.2) continue;
      const zone = zoneAt((c + 0.5) / GRID.cols, (r + 0.5) / GRID.rows, bodyView);
      diagramCells.push({
        page, kind, view,
        name: `r${String(r).padStart(2, '0')}c${String(c).padStart(2, '0')}`,
        rect: [x0 + c * cellPt, yTop - (r + 1) * cellPt, x0 + (c + 1) * cellPt, yTop - r * cellPt],
        size: cellPt,
        tip: `${kind === 'pain' ? 'Pain' : 'Numbness / tingling'}: ${zone}`,
      });
    }
    return widthPt * (VIEW_BOX.height / VIEW_BOX.width);
  }

  function diagramPair(kind, title, color, yTop, widthPt) {
    const gapX = 30;
    const xFront = M + 5;
    const xBack = xFront + widthPt + gapX;
    const h = figure('front', kind, xFront, yTop, widthPt);
    figure('back', kind, xBack, yTop, widthPt);
    const lab = (s, x, yy, opt = {}) => draw(s, x, yy, { size: 7.6, font: bold, color: C.gray, ...opt });
    lab('FRONT', xFront + widthPt / 2 - 13, yTop - h - 10);
    lab('BACK', xBack + widthPt / 2 - 11, yTop - h - 10);
    // Laterality: facing the patient the sides swap; from behind they match.
    lab('your RIGHT', xFront, yTop - 8, { color: C.tealDark });
    lab('your LEFT', xFront + widthPt - 36, yTop - 8, { color: C.tealDark });
    lab('your LEFT', xBack, yTop - 8, { color: C.tealDark });
    lab('your RIGHT', xBack + widthPt - 42, yTop - 8, { color: C.tealDark });
    return { h, right: xBack + widthPt + 18 };
  }

  // ---- questionnaire pages ---------------------------------------------------
  function questionnaire(def, prefix, { cols = 2 } = {}) {
    const gapX = 18;
    const colW = (CW - gapX * (cols - 1)) / cols;
    const size = 7.7;
    const lh = size * 1.3;
    const measure = (sec) => 13 + (sec.subtitle ? 9 : 0) + sec.options.reduce((s, o) => s + Math.max(wrap(o.label, helv, size, colW - 15).length * lh, 10.5) + 1, 0) + 7;
    const heights = def.sections.map(measure);
    const perCol = Math.ceil(def.sections.length / cols);
    const top = y;
    let lowest = y;
    for (let ci = 0; ci < cols; ci++) {
      let yy = top;
      const x = M + ci * (colW + gapX);
      for (let si = ci * perCol; si < Math.min((ci + 1) * perCol, def.sections.length); si++) {
        const sec = def.sections[si];
        draw(`${si + 1}. ${sec.title}`, x, yy - 9, { size: 8.8, font: bold, color: C.navy });
        yy -= 13;
        if (sec.subtitle) { draw(sec.subtitle, x, yy - 7, { size: 7.4, font: obl, color: C.gray }); yy -= 9; }
        const g = form.createRadioGroup(uniq(`${prefix}.${sec.id}`));
        for (const o of sec.options) {
          const lines = wrap(o.label, helv, size, colW - 15);
          g.addOptionToPage(String(o.score), page, { x, y: yy - 8.5, width: 8, height: 8, ...FIELD, backgroundColor: C.white });
          lines.forEach((l, k) => draw(l, x + 12, yy - size + 0.3 - k * lh, { size }));
          yy -= Math.max(lines.length * lh, 10.5) + 1;
        }
        yy -= 7;
      }
      lowest = Math.min(lowest, yy);
    }
    void heights;
    y = lowest;
  }

  // =========================================================================
  // CONTENT
  // =========================================================================
  const RESULT = ['Helped a lot', 'Helped somewhat', 'Helped only briefly', 'Did not help', 'Made it worse'];
  const sendTo = CONFIG.officeEmail
    ? `email it to ${CONFIG.officeEmail}`
    : 'reply to the email our office sent you';

  // ---------------------------------------------------------------- page 1
  newPage();
  callout('How to complete this form', [
    '1.  Save this file to your computer first, then open it with the free Adobe Acrobat Reader. (If you fill it in inside an email preview or a web browser tab, your answers may not be saved.)',
    '2.  Type your answers. Many sections start with a Yes / No question - if your answer is No, press the Skip button and move on. Most patients skip several sections.',
    '3.  Section 8 (treatments you have already tried) is the most important part. Please gather those records before you send the form back.',
    `4.  Save the form, then ${sendTo} and attach BOTH this completed form AND your records, all in the same email.`,
    'Email is not a fully secure way to send health information. If you would rather not email it, bring the completed form and your records to your visit.',
  ]);

  section(1, 'About you', { key: 's1', note: 'Required. Please complete this section even if you skip others.' });
  fields([
    { label: 'LAST NAME (required)', name: 'patient.lastName', w: 3, required: true },
    { label: 'FIRST NAME (required)', name: 'patient.firstName', w: 3, required: true },
    { label: 'DATE OF BIRTH (required)', name: 'patient.dob', w: 2.2, required: true, tip: 'Date of birth, MM/DD/YYYY' },
    { label: "Today's date", name: 'patient.formDate', w: 1.6 },
  ]);
  mirrors = {
    last: form.getTextField('patient.lastName'),
    first: form.getTextField('patient.firstName'),
    dob: form.getTextField('patient.dob'),
  };
  fields([
    { label: 'Height', name: 'patient.height', w: 1 },
    { label: 'Weight', name: 'patient.weight', w: 1 },
    { label: 'Best phone number to reach you', name: 'patient.phone', w: 2 },
    { label: 'Completed by (if not the patient) and relationship', name: 'patient.completedBy', w: 3 },
  ]);

  section(2, 'Contact and insurance', { key: 's2' });
  need(22);
  cb('contact.alreadyOnFile', M, y - 1, 10.5, 'Office already has my contact and insurance information');
  draw('Your office already has my current contact and insurance information.', M + 15, y - 9, { size: 9.2, font: bold, color: C.navy });
  skipButton('Skip to Section 3 »', 's3', M + 348, y + 2.5);
  y -= 20;
  fields([
    { label: 'Street address', name: 'contact.address', w: 4 },
    { label: 'City', name: 'contact.city', w: 2.2 },
    { label: 'State', name: 'contact.state', w: 0.8 },
    { label: 'ZIP', name: 'contact.zip', w: 1.1 },
  ]);
  fields([
    { label: 'Email', name: 'contact.email', w: 3 },
    { label: 'Emergency contact (name and relationship)', name: 'contact.emergencyName', w: 3 },
    { label: 'Emergency contact phone', name: 'contact.emergencyPhone', w: 2 },
  ]);
  fields([
    { label: 'Insurance company', name: 'insurance.company', w: 3 },
    { label: 'Member ID', name: 'insurance.memberId', w: 2.2 },
    { label: 'Group number', name: 'insurance.group', w: 1.8 },
  ]);
  fields([
    { label: 'Primary care doctor (name, town)', name: 'contact.pcp', w: 1 },
    { label: 'Who referred you to us? (name, town)', name: 'contact.referredBy', w: 1 },
  ]);

  section(3, 'Reason for your visit', { key: 's3' });
  fields([{ label: 'In your own words, what is the main problem you want help with?', name: 'reason.main', multiline: true }], { h: 40 });
  fields([
    { label: 'When did it start? (for example: March 2025)', name: 'reason.onset', w: 2 },
    { label: 'If it began with an injury or accident, what happened?', name: 'reason.injury', w: 3 },
  ]);
  draw('How did it begin?', M, y - 8.5, { size: 8.6, font: bold });
  y -= 0;
  radios('reason.howStarted', ['Gradually', 'Suddenly', 'After an injury or accident', 'After a surgery'], { x0: M + 96, width: CW - 96 });
  draw('Since then it is:', M, y - 8.5, { size: 8.6, font: bold });
  radios('reason.trend', ['Getting worse', 'Staying the same', 'Getting better', 'Comes and goes'], { x0: M + 96, width: CW - 96 });
  draw('Is this related to:', M, y - 8.5, { size: 8.6, font: bold });
  radios('reason.claim', ["A work injury (workers' comp)", 'A car accident', 'A lawsuit', 'None of these'], { x0: M + 96, width: CW - 96 });

  // ---------------------------------------------------------------- page 2
  newPage();
  sub('Where are your symptoms? Check every area that applies.');
  checks('regions', [
    'Neck', 'Right arm or hand', 'Left arm or hand',
    'Mid back', 'Low back', 'Buttock or hip',
    'Right leg or foot', 'Left leg or foot', 'Trouble walking or with balance',
    'Clumsy hands (buttons, handwriting)', 'Curvature / posture concern', 'Other (describe in Section 3)',
  ], { cols: 3 });
  callout(null, [
    'These answers decide which later sections apply to you.  NECK or ARM symptoms: complete Section 7A and Section 15.  LOW BACK or LEG symptoms: complete Section 7B and Section 14.  Trouble with balance or clumsy hands: also complete Section 16.  Skip the ones that do not apply.',
  ], { size: 8.4 });

  sub('How bad is it? Average over the past week (0 = none, 10 = worst imaginable). Leave a row blank if it does not apply.');
  for (const [key, label] of [['neck', 'Neck pain'], ['arm', 'Arm pain'], ['back', 'Back pain'], ['leg', 'Leg pain']]) {
    need(16);
    draw(label, M, y - 8.6, { size: 8.8, font: bold });
    const g = form.createRadioGroup(uniq(`pain.${key}`));
    for (let i = 0; i <= 10; i++) {
      const x = M + 86 + i * 40;
      g.addOptionToPage(String(i), page, { x, y: y - 10, width: 9.5, height: 9.5, ...FIELD, backgroundColor: C.white });
      draw(String(i), x + 13, y - 8.6, { size: 8.6 });
    }
    y -= 16;
  }
  y -= 6;

  section(4, 'Urgent symptom check', { key: 's4', note: 'Please answer every line.' });
  callout('Do not wait for your appointment', [
    'If you have NEW loss of bladder or bowel control, new numbness in the groin or inner thighs, or weakness that is getting worse quickly: call our office today or go to the nearest emergency room.',
  ], { bg: C.redBg, edge: C.red, titleColor: C.red });
  for (const [key, q] of [
    ['bladderBowel', 'New loss of bladder or bowel control, or new trouble starting to urinate'],
    ['saddle', 'New numbness in the groin, genitals, or inner thighs ("saddle" area)'],
    ['rapidWeakness', 'Weakness in an arm or leg that is getting worse quickly'],
    ['fever', 'Fever or chills together with your spine pain'],
    ['weightLoss', 'Weight loss you cannot explain (more than 10 lbs)'],
    ['cancer', 'Any history of cancer'],
    ['trauma', 'A recent serious fall, car accident, or other major injury'],
    ['nightPain', 'Pain that is constant and worse at night, not eased by any position'],
    ['infection', 'A recent infection, or use of injected drugs'],
  ]) yesNo(`urgent.${key}`, q);
  fields([{ label: 'If you answered Yes to any of these, please explain', name: 'urgent.explain', multiline: true }], { h: 30 });

  // ---------------------------------------------------------------- page 3
  newPage();
  section(5, 'Body diagram: where is your PAIN?', {
    key: 's5',
    note: 'Click (or tap) on the body wherever you feel pain. Each click places a red mark; click the same spot again to remove it. If the pain travels, mark the whole path - for example from the low back, down the outside of the leg, to the foot.',
  });
  {
    const W = 246;
    const top = y - 4;
    const { h } = diagramPair('pain', 'Pain', [0.86, 0.15, 0.15], top, W);
    y = top - h - 22;
  }
  sub('What does the pain feel like? Check all that apply.');
  checks('painQuality', ['Aching or dull', 'Sharp or stabbing', 'Burning', 'Shooting or electric', 'Throbbing', 'Cramping or spasm', 'Pressure or tightness', 'Constant', 'Comes and goes'], { cols: 5, size: 8.2 });

  // ---------------------------------------------------------------- page 4
  newPage();
  section(6, 'Body diagram: where is it NUMB or TINGLING?', {
    key: 's6',
    note: 'Click wherever you have numbness, pins and needles, or a part that "falls asleep". Marks here are blue. If you have none, leave the figures blank and go on.',
  });
  {
    const W = 246;
    const top = y - 4;
    const { h } = diagramPair('numb', 'Numbness / tingling', [0.15, 0.39, 0.92], top, W);
    y = top - h - 22;
  }
  sub('Tell us more');
  checks('sensory', ['Numbness', 'Pins and needles', 'A part that "falls asleep"', 'Burning skin', 'Cold or hot sensation'], { cols: 5, size: 8.2 });
  fields([
    { label: 'WEAKNESS - which arm, hand, leg or foot feels weak, and what is hard to do?', name: 'weakness.where', w: 3, multiline: true },
    { label: 'Any other symptom not shown (itching, cramping, coldness ...) and where', name: 'symptoms.other', w: 2.4, multiline: true },
  ], { h: 30 });

  // ---------------------------------------------------------------- page 5
  newPage();
  section(7, 'About your symptoms', { key: 's7', note: 'Complete only the parts that apply to you.' });

  sub('7A.  Neck and arm', { key: 's7a' });
  gate('neckArm.applies', 'Do you have neck or arm symptoms?', { skipTo: 's7b', skipLabel: 'If No, skip to 7B »' });
  draw('Which is worse?', M, y - 8.5, { size: 8.6, font: bold });
  radios('neckArm.worse', ['Neck pain', 'Arm pain', 'About equal'], { x0: M + 150, width: CW - 150 });
  draw('Which arm?', M, y - 8.5, { size: 8.6, font: bold });
  radios('neckArm.side', ['Right', 'Left', 'Both', 'Neither'], { x0: M + 150, width: CW - 150 });
  draw('How far down does it travel?', M, y - 8.5, { size: 8.6, font: bold });
  radios('neckArm.reach', ['Shoulder only', 'Above the elbow', 'Below the elbow', 'Into the hand or fingers'], { x0: M + 150, width: CW - 150 });
  draw('Which fingers are affected? (check all)', M, y - 8.5, { size: 8.6, font: bold });
  y -= 13;
  checks('neckArm.fingers', ['Thumb', 'Index', 'Middle', 'Ring', 'Little finger', 'None'], { cols: 6, size: 8.2 });
  draw('What makes it WORSE? (check all)', M, y - 8.5, { size: 8.6, font: bold });
  y -= 13;
  checks('neckArm.worseWith', ['Looking up', 'Turning the head', 'Reaching overhead', 'Coughing or sneezing', 'Driving', 'Computer or desk work', 'Lying down', 'Nothing in particular'], { cols: 4, size: 8.2 });
  draw('What makes it BETTER? (check all)', M, y - 8.5, { size: 8.6, font: bold });
  y -= 13;
  checks('neckArm.betterWith', ['Rest', 'Resting the hand on top of the head', 'Medication', 'Heat or ice', 'Changing position', 'Nothing helps'], { cols: 3, size: 8.2 });

  sub('7B.  Low back and leg', { key: 's7b' });
  gate('backLeg.applies', 'Do you have low back or leg symptoms?', { skipTo: 's7c', skipLabel: 'If No, skip to 7C »' });
  draw('Which is worse?', M, y - 8.5, { size: 8.6, font: bold });
  radios('backLeg.worse', ['Back pain', 'Leg pain', 'About equal'], { x0: M + 150, width: CW - 150 });
  draw('Which leg?', M, y - 8.5, { size: 8.6, font: bold });
  radios('backLeg.side', ['Right', 'Left', 'Both', 'Neither'], { x0: M + 150, width: CW - 150 });
  draw('How far down does it travel?', M, y - 8.5, { size: 8.6, font: bold });
  radios('backLeg.reach', ['Buttock only', 'Thigh, above the knee', 'Below the knee', 'Into the foot or toes'], { x0: M + 150, width: CW - 150 });
  draw('How far can you walk before you must stop?', M, y - 8.5, { size: 8.6, font: bold });
  y -= 13;
  radios('backLeg.walking', ['Less than 1 block', '1 to 2 blocks', '3 to 5 blocks', 'More than 5 blocks', 'No limit']);
  draw('What makes it WORSE? (check all)', M, y - 8.5, { size: 8.6, font: bold });
  y -= 13;
  checks('backLeg.worseWith', ['Sitting', 'Standing', 'Walking', 'Bending forward', 'Bending backward', 'Coughing or sneezing', 'Lifting', 'Lying down'], { cols: 4, size: 8.2 });
  draw('What makes it BETTER? (check all)', M, y - 8.5, { size: 8.6, font: bold });
  y -= 13;
  checks('backLeg.betterWith', ['Sitting down', 'Leaning on a shopping cart', 'Lying down', 'Walking', 'Changing position', 'Medication', 'Heat or ice', 'Nothing helps'], { cols: 4, size: 8.2 });
  yesNo('backLeg.footDrop', 'Does your foot slap or drag, or do you catch your toes and trip?');
  yesNo('backLeg.givesWay', 'Does a leg give way or buckle?');

  sub('7C.  Hands, walking and balance - everyone please answer', { key: 's7c' });
  yesNo('myelo.hands', 'Increasing clumsiness with your hands - buttons, handwriting, picking up coins?');
  yesNo('myelo.dropping', 'Dropping things more than you used to?');
  yesNo('myelo.balance', 'Unsteady on your feet, or needing to hold on to walk?');
  yesNo('myelo.lhermitte', 'An electric shock down your spine or limbs when you bend your neck?');
  text('If you answered Yes to any of these four, please also complete Section 16.', { size: 8.2, font: obl, color: C.gray });

  // ---------------------------------------------------------------- page 6
  newPage();
  section(8, 'Treatments you have already tried', { key: 's8' });
  callout('This is the most important section of the form', [
    'Insurance companies will not approve further treatment, including surgery, without written proof of the non-surgical care you have already had. Two things are needed for each treatment below:',
    '1.  FILL IN THE DETAILS - where you went, who treated you, the dates, how often, how many visits, and whether it helped. Full names and phone numbers are especially useful.',
    '2.  ATTACH THE RECORDS to the same email as this form. Call each office and ask for: physical therapy - the first evaluation, the visit notes or attendance log, and the discharge summary;  injections - the procedure notes;  chiropractic, acupuncture, massage - a visit log or dated receipts;  medications - a "medication history" printout from your pharmacy;  imaging - the radiologist\'s written report.',
    'More detail is better, but do not let a missing detail stop you. If you cannot get a record, still fill in what you remember and tell us in Section 11 - we will help request it.',
  ]);

  sub('8A.  Physical therapy', { key: 's8a' });
  gate('pt.tried', 'Have you had physical therapy for this problem?', { skipTo: 's8b', skipLabel: 'If No, skip to 8B »' });
  fields([
    { label: 'Clinic name', name: 'pt.clinic', w: 3 },
    { label: 'City and phone number', name: 'pt.cityPhone', w: 2.6 },
    { label: "Therapist's name", name: 'pt.therapist', w: 2.4 },
  ]);
  fields([
    { label: 'Ordered by (doctor)', name: 'pt.orderedBy', w: 2.4 },
    { label: 'Start date (MM/YYYY)', name: 'pt.start', w: 1.5 },
    { label: 'End date (MM/YYYY)', name: 'pt.end', w: 1.5 },
    { label: 'Visits per week', name: 'pt.perWeek', w: 1.2 },
    { label: 'Total visits (about)', name: 'pt.totalVisits', w: 1.4 },
  ]);
  fields([{ label: 'What did you work on? (exercises, stretching, traction, dry needling, aquatic therapy ...)', name: 'pt.what' }]);
  draw('Result:', M, y - 8.5, { size: 8.6, font: bold });
  radios('pt.result', RESULT, { x0: M + 44, width: CW - 44, size: 8.2, gapX: 9 });
  draw('Records:', M, y - 8.5, { size: 8.6, font: bold });
  radios('pt.records', ['Attached to my email', 'I will send or bring them', 'I could not get them'], { x0: M + 44, width: CW - 44, size: 8.2 });
  need(46);
  draw('A second course of physical therapy, if you had one:', M, y - 8.6, { size: 8.6, font: bold, color: C.navy });
  y -= 13;
  fields([
    { label: 'Clinic name, city, phone', name: 'pt2.clinic', w: 3.4 },
    { label: 'Start (MM/YYYY)', name: 'pt2.start', w: 1.2 },
    { label: 'End (MM/YYYY)', name: 'pt2.end', w: 1.2 },
    { label: 'Visits per week', name: 'pt2.perWeek', w: 1.1 },
    { label: 'Total visits', name: 'pt2.totalVisits', w: 1 },
    { label: 'Result', name: 'pt2.result', w: 1.7 },
  ]);

  sub('8B.  Home exercise program', { key: 's8b' });
  gate('hep.tried', 'Have you done a home exercise program for this problem?', { skipTo: 's8c', skipLabel: 'If No, skip to 8C »' });
  draw('Who set it up?', M, y - 8.5, { size: 8.6, font: bold });
  radios('hep.guidedBy', ['A physical therapist', 'A doctor', 'An app or online program', 'A printed handout', 'On my own'], { x0: M + 72, width: CW - 72, size: 8.2, gapX: 9 });
  fields([
    { label: 'App or program name (if any)', name: 'hep.app', w: 2.4 },
    { label: 'Start date (MM/YYYY)', name: 'hep.start', w: 1.4 },
    { label: 'End date, or "still doing"', name: 'hep.end', w: 1.6 },
    { label: 'Days per week', name: 'hep.daysPerWeek', w: 1.1 },
    { label: 'Minutes per session', name: 'hep.minutes', w: 1.3 },
  ]);
  fields([
    { label: 'What exercises? (core strengthening, stretching, walking ...)', name: 'hep.what', w: 3 },
    { label: 'Result', name: 'hep.result', w: 1.4 },
  ]);

  // ---------------------------------------------------------------- page 7
  newPage();
  sub('8C.  Other hands-on and supportive treatments', { key: 's8c' });
  text('Check "Tried" for each one you have had, and fill in that row. Leave the others blank.', { size: 8.3, color: C.gray });
  table('other', [
    { key: 'name', label: 'Treatment', w: 2.1, type: 'label' },
    { key: 'tried', label: 'Tried', w: 0.7, type: 'cb' },
    { key: 'provider', label: 'Provider or clinic, city, phone', w: 3.5 },
    { key: 'dates', label: 'Dates (from - to)', w: 2 },
    { key: 'frequency', label: 'How often', w: 1.4 },
    { key: 'visits', label: 'Total visits', w: 1 },
    { key: 'result', label: 'Result', w: 2.1, type: 'dd', options: RESULT },
    { key: 'records', label: 'Records attached', w: 1.1, type: 'cb' },
  ], ['Chiropractic', 'Acupuncture', 'Massage therapy', 'Brace or collar', 'TENS unit', 'Other:', 'Other:'], { rowH: 20 });
  fields([{ label: 'If you checked "Other", what was it? (yoga, Pilates, traction, pain psychology, inversion table ...)', name: 'other.otherNames' }]);

  sub('8D.  Injections', { key: 's8d' });
  gate('inj.tried', 'Have you had any spine injections or nerve procedures?', { skipTo: 's8e', skipLabel: 'If No, skip to 8E »' });
  table('inj', [
    { key: 'type', label: 'Type', w: 2.4, type: 'dd', options: ['Epidural steroid', 'Facet joint', 'Medial branch block', 'Radiofrequency ablation', 'Selective nerve root block', 'Sacroiliac (SI) joint', 'Trigger point', 'Not sure', 'Other'] },
    { key: 'level', label: 'Level and side (L4-5 right)', w: 1.8 },
    { key: 'date', label: 'Date (MM/YYYY)', w: 1.3 },
    { key: 'provider', label: 'Doctor and facility, city, phone', w: 3.6 },
    { key: 'relief', label: '% relief', w: 0.9 },
    { key: 'lasted', label: 'Relief lasted', w: 1.4 },
    { key: 'records', label: 'Notes attached', w: 1, type: 'cb' },
  ], 5, { rowH: 20 });

  sub('8E.  Medications you have tried for this problem', { key: 's8e' });
  gate('meds.tried', 'Have you taken any medication for this problem (prescription or over the counter)?', { skipTo: 's9', skipLabel: 'If No, skip to Section 9 »' });
  table('medTrial', [
    { key: 'name', label: 'Medication and dose', w: 2.8 },
    { key: 'type', label: 'Type', w: 2.4, type: 'dd', options: ['Anti-inflammatory (NSAID)', 'Acetaminophen (Tylenol)', 'Muscle relaxant', 'Nerve pain medicine', 'Oral steroid', 'Opioid pain medicine', 'Cream or patch', 'Other'] },
    { key: 'prescriber', label: 'Prescribed by', w: 2 },
    { key: 'dates', label: 'Dates (from - to)', w: 1.9 },
    { key: 'result', label: 'Result', w: 2, type: 'dd', options: [...RESULT, 'Side effects - stopped'] },
    { key: 'current', label: 'Still taking', w: 0.9, type: 'cb' },
  ], 6, { rowH: 20 });
  fields([
    { label: 'Your pharmacy (name, town, phone) - they can print a "medication history" for you', name: 'meds.pharmacy', w: 3 },
    { label: 'Pharmacy printout attached?', name: 'meds.printout', w: 1.2 },
  ]);

  // ---------------------------------------------------------------- page 8
  newPage();
  section(9, 'Imaging and tests', { key: 's9', note: 'Check each test you have had for this problem and tell us where. The written report is what we need most.' });
  table('imaging', [
    { key: 'name', label: 'Test', w: 2, type: 'label' },
    { key: 'done', label: 'Had it', w: 0.7, type: 'cb' },
    { key: 'area', label: 'Body area', w: 1.6 },
    { key: 'date', label: 'Date (MM/YYYY)', w: 1.4 },
    { key: 'facility', label: 'Facility name and town', w: 3.6 },
    { key: 'report', label: 'Report attached', w: 1, type: 'cb' },
    { key: 'disc', label: 'Bringing the disc', w: 1, type: 'cb' },
  ], ['X-ray', 'MRI', 'CT scan', 'EMG / nerve test', 'Bone density (DEXA)', 'Other:'], { rowH: 20 });

  section(10, 'Previous spine surgery', { key: 's10' });
  gate('spineSurgery.any', 'Have you ever had surgery on your neck or back?', { skipTo: 's11', skipLabel: 'If No, skip to Section 11 »' });
  table('spineSurgery', [
    { key: 'operation', label: 'Operation (for example: L4-5 fusion)', w: 3 },
    { key: 'date', label: 'Date (MM/YYYY)', w: 1.3 },
    { key: 'surgeon', label: 'Surgeon and hospital', w: 3.2 },
    { key: 'result', label: 'Result', w: 2, type: 'dd', options: RESULT },
    { key: 'report', label: 'Operative report attached', w: 1.2, type: 'cb' },
  ], 3, { rowH: 20 });

  section(11, 'Records checklist', { key: 's11', note: 'Check each kind of record you are attaching to your email, so we can confirm we received everything.' });
  checks('attached', [
    'Physical therapy records', 'Injection procedure notes', 'Chiropractic records',
    'Acupuncture records', 'Massage therapy records', 'Pharmacy medication history',
    'MRI report', 'CT report', 'X-ray report',
    'EMG / nerve test report', 'Operative reports', 'Other doctors\' office notes',
  ], { cols: 3 });
  fields([{ label: 'Records you could NOT get - list the office name and phone number, and we will help request them', name: 'attached.couldNotGet', multiline: true }], { h: 44 });
  fields([{ label: 'Anything else you want Dr. Wey to know before your visit?', name: 'reason.anythingElse', multiline: true }], { h: 44 });

  // ---------------------------------------------------------------- page 9
  newPage();
  section(12, 'Your medical history', { key: 's12' });
  sub('Medical conditions - check all you have or have had');
  checks('pmh', [...COMMON_CONDITIONS, 'None of these'], { cols: 4, size: 7.9 });
  fields([{ label: 'Other conditions, and details for any checked above (type of cancer, year, etc.)', name: 'pmh.other' }]);
  sub('Implanted devices and blood thinners');
  checks('devices', [...IMPLANTED_DEVICES, 'None'], { cols: 5, size: 7.9 });
  fields([
    { label: 'Blood thinners or antiplatelet medicines (Eliquis, Xarelto, warfarin, Plavix, aspirin ...)', name: 'pmh.bloodThinners', w: 3 },
    { label: 'Other surgeries (operation and year)', name: 'psh.other', w: 3 },
  ]);
  sub('Current medications and allergies');
  fields([{ label: 'All medications you take now, with dose and how often - or write "list attached" / "none"', name: 'meds.current', multiline: true }], { h: 46 });
  fields([{ label: 'Allergies (medicines, latex, metals, tape, contrast dye) and the reaction - or write "none"', name: 'allergies.list', multiline: true }], { h: 30 });
  sub('About you');
  draw('Tobacco or nicotine:', M, y - 8.5, { size: 8.6, font: bold });
  radios('social.tobacco', ['Never', 'Former', 'Current smoker', 'Vaping', 'Smokeless / nicotine pouch'], { x0: M + 96, width: CW - 96, size: 8.2, gapX: 10 });
  fields([
    { label: 'If current or former: how much, how long, quit date', name: 'social.tobaccoDetail', w: 2.6 },
    { label: 'Alcohol (drinks per week)', name: 'social.alcohol', w: 1.4 },
    { label: 'Occupation', name: 'social.occupation', w: 2 },
  ]);
  draw('Work status:', M, y - 8.5, { size: 8.6, font: bold });
  radios('social.work', ['Working full duty', 'Working with restrictions', 'Off work because of this', 'Retired', 'Disabled', 'Other'], { x0: M + 62, width: CW - 62, size: 8.2, gapX: 9 });
  fields([
    { label: 'Who lives with you?', name: 'social.household', w: 2 },
    { label: 'Cane, walker, wheelchair, or other aid?', name: 'social.aids', w: 2 },
    { label: 'Family history (scoliosis, spine problems, osteoporosis, bleeding or anesthesia problems)', name: 'family.history', w: 4 },
  ]);

  // ---------------------------------------------------------------- page 10
  newPage();
  section(13, 'Review of symptoms', {
    key: 's13',
    note: 'Check anything you have had recently. If nothing in a group applies, check "None" for that group - most people check "None" for most groups.',
  });
  {
    const colW = (CW - 16) / 2;
    const size = 7.9;
    const lh = size * 1.26;
    // The web intake asks these as questions; next to a checkbox they read
    // better as findings ("Do you bruise or bleed easily?" -> "Bruise or bleed easily").
    const finding = (label) => {
      const t = label.replace(/\?$/, '').replace(/^Do you /, '');
      return t.charAt(0).toUpperCase() + t.slice(1);
    };
    const blockH = (s) => 12 + s.questions.reduce((sum, q) => sum + wrap(finding(q.label), helv, size, colW - 18).length * lh + 1.5, 0) + lh + 7;
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
      draw(s.title, x, yy - 8.8, { size: 8.8, font: bold, color: C.navy });
      cb(`ros.${s.id}.none`, x + colW - 44, yy - 0.5, 8.5, `${s.title}: none of these`);
      draw('None', x + colW - 32, yy - 8, { size: 7.9, font: bold, color: C.tealDark });
      yy -= 12;
      for (const q of s.questions) {
        const lines = wrap(finding(q.label), helv, size, colW - 18);
        cb(`ros.${s.id}.${q.id}`, x, yy - 0.3, 8.5, q.label);
        lines.forEach((l, k) => draw(l, x + 12.5, yy - size + 0.3 - k * lh, { size }));
        yy -= lines.length * lh + 1.5;
      }
      yy -= 7;
      used += h;
      lowest = Math.min(lowest, yy);
    }
    y = lowest - 4;
  }
  fields([{ label: 'Anything checked above that you would like to explain', name: 'ros.notes', multiline: true }], { h: 30 });

  // ---------------------------------------------------------------- page 11
  newPage();
  section(14, 'Low back questionnaire', { key: 's14' });
  need(22);
  draw('Complete this page ONLY if you have low back or leg symptoms.', M, y - 9.4, { size: 9.4, font: bold, color: C.navy });
  skipButton('No back or leg symptoms - skip to Section 15 »', 's15', M + 300, y + 2.5);
  y -= 19;
  text('For each topic, choose the ONE statement that best describes you today.', { size: 8.3, color: C.gray, gap: 5 });
  questionnaire(ODI, 'odi');

  // ---------------------------------------------------------------- page 12
  newPage();
  section(15, 'Neck questionnaire', { key: 's15' });
  need(22);
  draw('Complete this page ONLY if you have neck or arm symptoms.', M, y - 9.4, { size: 9.4, font: bold, color: C.navy });
  skipButton('No neck or arm symptoms - skip to Section 16 »', 's16', M + 300, y + 2.5);
  y -= 19;
  text('For each topic, choose the ONE statement that best describes you today.', { size: 8.3, color: C.gray, gap: 5 });
  questionnaire(NDI, 'ndi');

  // ---------------------------------------------------------------- page 13
  newPage();
  section(16, 'Hand and walking function', { key: 's16' });
  need(22);
  draw('Complete this ONLY if you answered Yes to any question in 7C.', M, y - 9.4, { size: 9.4, font: bold, color: C.navy });
  skipButton('All No in 7C - skip to Section 17 »', 's17', M + 320, y + 2.5);
  y -= 19;
  text('For each topic, choose the ONE statement that best describes you now.', { size: 8.3, color: C.gray, gap: 5 });
  questionnaire(MJOA, 'mjoa');

  section(17, 'Your questions for Dr. Wey', {
    key: 's17',
    note: 'What do you most want answered or addressed at this appointment? Writing it here lets Dr. Wey prepare before he sees you.',
  });
  fields([{ label: 'Your questions, and anything you specifically want addressed at the visit', name: 'questions.forVisit', multiline: true }], { h: 76 });
  fields([{ label: 'What are you hoping this visit will achieve? (a diagnosis, treatment options, a second opinion, to discuss surgery ...)', name: 'questions.goals', multiline: true }], { h: 24 });

  section(18, 'Send it back', { key: 's18' });
  callout('Before you send', [
    `Save this form (File > Save), then ${sendTo}. Attach this completed form AND every record you checked in Section 11 to that one email, so we receive everything together.`,
    'If a file is too large to email, send what you can and tell us what is missing - we will arrange another way.',
  ]);
  checks('send', [
    'I saved this form after filling it in',
    'I attached the completed form to my email',
    'I attached my treatment records (or listed in Section 11 the ones I could not get)',
  ], { cols: 1, size: 8.8 });
  text('By typing my name below, I confirm that this information is accurate to the best of my knowledge.', { size: 8.2, color: C.gray, gap: 1 });
  fields([
    { label: 'Type your full name (this is your signature)', name: 'signature.name', w: 3.4 },
    { label: 'Date', name: 'signature.date', w: 1.2 },
    { label: 'If signing for the patient: your name and relationship', name: 'signature.onBehalf', w: 2.6 },
  ]);
  if (CONFIG.officeEmail) {
    const subject = encodeURIComponent('Completed spine intake form');
    const label = `Email this form to ${CONFIG.officeEmail} »`;
    const w = bold.widthOfTextAtSize(label, 9) + 20;
    page.drawRectangle({ x: M, y: y - 20, width: w, height: 20, color: C.navy });
    draw(label, M + 10, y - 13.5, { size: 9, font: bold, color: C.white });
    links.push({ page: pages.length - 1, rect: [M, y - 20, M + w, y], uri: `mailto:${CONFIG.officeEmail}?subject=${subject}` });
    y -= 26;
    text('This opens a new email addressed to our office. Remember to attach the saved form and your records before sending.', { size: 8, color: C.gray });
  }

  // =========================================================================
  // FINISHING
  // =========================================================================

  // Name and date of birth repeat at the top of every later page. They are
  // extra widgets on the SAME fields, so typing them once on page 1 fills
  // every page - and a page that gets separated still says whose it is.
  pages.forEach((p, i) => {
    if (i === 0) return;
    const yTop = PAGE.h - 28;
    const put = (label, field, x, w) => {
      p.drawText(label, { x, y: yTop - 10, size: 7, font: helv, color: C.gray });
      const lx = x + helv.widthOfTextAtSize(label, 7) + 3;
      field.addToPage(p, { x: lx, y: yTop - 14, width: w, height: 13, font: helv, ...FIELD });
      return lx + w + 8;
    };
    let x = PAGE.w - M - 318;
    x = put('Last name', mirrors.last, x, 96);
    x = put('First', mirrors.first, x, 76);
    put('DOB', mirrors.dob, x, 58);
  });
  for (const f of Object.values(mirrors)) f.setFontSize(8);

  // Footers.
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 34 }, end: { x: PAGE.w - M, y: 34 }, thickness: 0.5, color: C.rule });
    p.drawText(`${CONFIG.surgeon}  |  ${CONFIG.credential}  |  ${CONFIG.institution}`, { x: M, y: 23, size: 7, font: helv, color: C.gray });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: PAGE.w - M - helv.widthOfTextAtSize(label, 7), y: 23, size: 7, font: helv, color: C.gray });
  });

  // Skip links and the mailto button.
  for (const l of links) {
    const dict = { Type: 'Annot', Subtype: 'Link', Rect: l.rect, Border: [0, 0, 0], H: 'I' };
    if (l.uri) {
      const annot = ctx.obj(dict);
      const action = ctx.obj({ Type: 'Action', S: 'URI' });
      action.set(PDFName.of('URI'), PDFString.of(l.uri));
      annot.set(PDFName.of('A'), action);
      pages[l.page].node.addAnnot(ctx.register(annot));
      continue;
    }
    const a = anchors[l.target];
    if (!a) throw new Error(`Skip link points at "${l.target}", which is not a section in this form.`);
    // Explicit left edge, zoom left alone (null). A null LEFT is legal but some
    // viewers and tools treat such a destination as unresolved.
    const annot = ctx.obj({ ...dict, Dest: [pages[a.page].ref, 'XYZ', 0, Math.min(a.y + 8, PAGE.h), null] });
    pages[l.page].node.addAnnot(ctx.register(annot));
  }

  // Generate appearances for every ordinary field now, so the save below can
  // leave the hand-built diagram cells exactly as they are.
  form.updateFieldAppearances(helv);

  // Diagram cells.
  const groups = {};
  for (const cell of diagramCells) {
    const key = `diagram_${cell.kind}_${cell.view}`;
    (groups[key] = groups[key] || []).push(cell);
  }
  const apCache = {};
  for (const [key, cells] of Object.entries(groups)) {
    const parent = ctx.obj({ FT: 'Btn', Kids: [] });
    parent.set(PDFName.of('T'), PDFString.of(key));
    const parentRef = ctx.register(parent);
    const kids = parent.get(PDFName.of('Kids'));
    for (const cell of cells) {
      const apKey = `${cell.kind}_${cell.size.toFixed(3)}`;
      apCache[apKey] = apCache[apKey] || markAppearance(cell.size, cell.kind === 'pain' ? [0.86, 0.15, 0.15] : [0.15, 0.39, 0.92]);
      const { on, off } = apCache[apKey];
      const w = ctx.obj({
        Type: 'Annot', Subtype: 'Widget', Rect: cell.rect, F: 4, AS: 'Off', V: 'Off',
        AP: { N: { On: on, Off: off }, D: { On: on, Off: off } }, MK: {},
      });
      w.set(PDFName.of('T'), PDFString.of(cell.name));
      w.set(PDFName.of('TU'), PDFHexString.fromText(cell.tip));
      w.set(PDFName.of('P'), cell.page.ref);
      w.set(PDFName.of('Parent'), parentRef);
      const ref = ctx.register(w);
      kids.push(ref);
      cell.page.node.addAnnot(ref);
    }
    form.acroForm.addField(parentRef);
  }

  fs.mkdirSync(path.dirname(CONFIG.out), { recursive: true });
  fs.writeFileSync(CONFIG.out, await pdf.save({ updateFieldAppearances: false }));

  const kb = (fs.statSync(CONFIG.out).size / 1024).toFixed(0);
  console.log(`Wrote ${path.relative(ROOT, CONFIG.out)}  (${kb} KB, ${pages.length} pages)`);
  console.log(`  form fields:     ${names.size}`);
  console.log(`  diagram cells:   ${diagramCells.length}  (${Object.entries(groups).map(([k, v]) => `${k.replace('diagram_', '')} ${v.length}`).join(', ')})`);
  console.log(`  skip links:      ${links.filter((l) => !l.uri).length}`);
  console.log(`  logo:            ${logo ? 'embedded' : 'NOT FOUND - institution name shown as text (put the file at assets/holy-name-logo.png)'}`);
  console.log(`  return address:  ${CONFIG.officeEmail || 'not set - form says "reply to the email our office sent you"'}`);
}

main().catch((e) => {
  fs.rmSync(TMP, { recursive: true, force: true });
  console.error(e);
  process.exit(1);
});
