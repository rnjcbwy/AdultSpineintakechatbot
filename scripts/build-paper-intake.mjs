#!/usr/bin/env node
// ============================================================================
// The paper intake form: two letter-size pages a patient fills in by hand in
// the clinic. The same questions as the short on-screen form (lib/simple.js),
// written for a middle-school reading level, in large type with big boxes.
//
// The office scans or photographs the completed pages into Practice Hub
// ("Paper intake form" on the Intake forms page or on the chart), where
// Claude reads them and drafts the clinic note. The numbered questions and
// plain labels below are what that reader keys on.
//
//   node scripts/build-paper-intake.mjs            -> public/paper/spine-intake-paper-en.pdf (+ es)
//   node scripts/build-paper-intake.mjs --sample   -> also a filled-in sample, for testing the reader
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'paper');
const SAMPLE = process.argv.includes('--sample');

const NAVY = rgb(0x12 / 255, 0x35 / 255, 0x59 / 255);
const TEAL = rgb(0x0e / 255, 0x84 / 255, 0x82 / 255);
const INK = rgb(0.13, 0.15, 0.17);
const GREY = rgb(0.45, 0.47, 0.5);
const LINE = rgb(0.72, 0.74, 0.76);
const PEN = rgb(0.1, 0.1, 0.45);

const PAGE = { w: 612, h: 792 };
const M = 44;
const CW = PAGE.w - M * 2;

const TEXT = {
  en: {
    title: 'Spine Visit: Patient Form',
    sub: 'Please print clearly. If you need help, ask the front desk. There are no wrong answers.',
    date: 'Today’s date',
    page: 'Page {n} of 2',
    s1: '1. About you',
    first: 'First name', last: 'Last name', dob: 'Date of birth (month / day / year)',
    sex: 'Are you a', woman: 'Woman', man: 'Man',
    phone: 'Phone number', email: 'Email (if you have one)',
    seen: 'Have you seen this doctor before?', seenNo: 'No, this is my first visit', seenYes: 'Yes, I have been here before',
    s2: '2. What is bothering you?',
    s2hint: 'Tell us in your own words. For example: my low back hurts and the pain goes down my right leg.',
    s3: '3. Where does it hurt? Check all that apply.',
    areas: ['Neck', 'Upper or middle back', 'Low back', 'Right arm or hand', 'Left arm or hand', 'Right leg or foot', 'Left leg or foot'],
    s4: '4. How long has this been going on?',
    durations: ['Less than a month', '1 to 6 months', '6 months to 2 years', 'More than 2 years'],
    s5: '5. How bad is the pain today? Circle one number.',
    s5hint: '0 = no pain          10 = the worst pain you can imagine',
    s6: '6. Is it getting better, worse, or staying the same?',
    trends: ['Getting better', 'About the same', 'Getting worse'],
    s7: '7. Please answer Yes or No.',
    yes: 'Yes', no: 'No',
    questions: [
      'Do you have numbness or tingling in your arms, hands, legs or feet?',
      'Do you have weakness in an arm or a leg?',
      'Do you have trouble walking, or feel unsteady on your feet?',
      'Any new trouble controlling your bladder or bowels?',
    ],
    s8: '8. Have you ever had surgery on your spine?',
    s8detail: 'If yes, what surgery and about when?',
    s9: '9. Is this problem from an injury at work, or an accident with an insurance claim or a lawyer?',
    claims: ['No', 'Yes, a work injury', 'Yes, an accident with a claim or a lawyer'],
    s10: '10. Have you already tried any of these? (You can skip this.)',
    tried: ['Physical therapy', 'Chiropractor', 'Injections', 'Pain medicine', 'Nothing yet'],
    s11: '11. Medicines you take every day',
    s12: '12. Allergies to medicines',
    s13: '13. Health conditions (for example diabetes, heart disease, high blood pressure)',
    none: 'None',
    s14: '14. Please sign',
    attest: 'My answers are true to the best of my knowledge. The office may contact me by phone or email about my care.',
    signature: 'Signature', printed: 'Printed name', signDate: 'Date',
    thanks: 'Thank you for taking the time to fill this out. Please hand it to the front desk.',
    office: 'Office use: scan or photograph both pages into Practice Hub.',
  },
  es: {
    title: 'Visita de columna: formulario del paciente',
    sub: 'Escriba con letra de imprenta clara. Si necesita ayuda, pregunte en recepción. No hay respuestas incorrectas.',
    date: 'Fecha de hoy',
    page: 'Página {n} de 2',
    s1: '1. Sobre usted',
    first: 'Nombre', last: 'Apellido', dob: 'Fecha de nacimiento (mes / día / año)',
    sex: 'Es usted', woman: 'Mujer', man: 'Hombre',
    phone: 'Número de teléfono', email: 'Correo electrónico (si tiene)',
    seen: '¿Ya ha visto a este médico antes?', seenNo: 'No, es mi primera visita', seenYes: 'Sí, ya he venido antes',
    s2: '2. ¿Qué le molesta?',
    s2hint: 'Cuéntenos con sus propias palabras. Por ejemplo: me duele la espalda baja y el dolor baja por la pierna derecha.',
    s3: '3. ¿Dónde le duele? Marque todo lo que corresponda.',
    areas: ['Cuello', 'Espalda alta o media', 'Espalda baja', 'Brazo o mano derecha', 'Brazo o mano izquierda', 'Pierna o pie derecho', 'Pierna o pie izquierdo'],
    s4: '4. ¿Desde hace cuánto tiempo tiene este problema?',
    durations: ['Menos de un mes', 'De 1 a 6 meses', 'De 6 meses a 2 años', 'Más de 2 años'],
    s5: '5. ¿Qué tan fuerte es el dolor hoy? Encierre un número en un círculo.',
    s5hint: '0 = sin dolor          10 = el peor dolor que pueda imaginar',
    s6: '6. ¿Está mejorando, empeorando o sigue igual?',
    trends: ['Mejorando', 'Más o menos igual', 'Empeorando'],
    s7: '7. Responda Sí o No.',
    yes: 'Sí', no: 'No',
    questions: [
      '¿Tiene entumecimiento u hormigueo en los brazos, las manos, las piernas o los pies?',
      '¿Tiene debilidad en un brazo o una pierna?',
      '¿Tiene dificultad para caminar o se siente inestable al caminar?',
      '¿Algún problema nuevo para controlar la vejiga o los intestinos?',
    ],
    s8: '8. ¿Alguna vez le han operado la columna?',
    s8detail: 'Si la respuesta es sí, ¿qué cirugía y aproximadamente cuándo?',
    s9: '9. ¿Este problema se debe a una lesión en el trabajo o a un accidente con un reclamo de seguro o un abogado?',
    claims: ['No', 'Sí, una lesión en el trabajo', 'Sí, un accidente con reclamo o abogado'],
    s10: '10. ¿Ya ha probado alguno de estos? (Puede omitir esta pregunta.)',
    tried: ['Fisioterapia', 'Quiropráctico', 'Inyecciones', 'Medicamentos para el dolor', 'Nada todavía'],
    s11: '11. Medicamentos que toma todos los días',
    s12: '12. Alergias a medicamentos',
    s13: '13. Afecciones de salud (por ejemplo diabetes, enfermedad del corazón, presión alta)',
    none: 'Ninguno',
    s14: '14. Firme aquí',
    attest: 'Mis respuestas son verdaderas según mi leal saber y entender. La oficina puede comunicarse conmigo por teléfono o correo electrónico sobre mi atención.',
    signature: 'Firma', printed: 'Nombre en letra de imprenta', signDate: 'Fecha',
    thanks: 'Gracias por tomarse el tiempo de completar este formulario. Entréguelo en recepción.',
    office: 'Uso de la oficina: escanee o fotografíe ambas páginas en Practice Hub.',
  },
};

/** A handwritten-looking answer set, drawn onto the sample copy only. */
const SAMPLE_ANSWERS = {
  first: 'Margaret', last: 'Okafor', dob: '03 / 15 / 1950', sex: 'woman', phone: '(201) 555-0142', email: '',
  seen: 'no',
  story: ['My low back hurts and the pain goes down my', 'right leg to the foot. It is worse when I walk', 'more than one block. Started after I moved', 'some boxes in July.'],
  areas: ['Low back', 'Right leg or foot'], duration: '1 to 6 months', pain: 7, trend: 'Getting worse',
  yesno: ['yes', 'no', 'no', 'no'], surgery: 'no', surgeryText: '', claim: 'No',
  tried: ['Physical therapy', 'Pain medicine'],
  meds: ['Lisinopril 10 mg', 'Metformin 500 mg twice a day'], allergies: [], allergiesNone: true,
  conditions: ['High blood pressure', 'Diabetes'],
  signature: 'Margaret Okafor', printed: 'MARGARET OKAFOR', date: '10 / 29 / 2026',
};

async function build(lang) {
  const T = TEXT[lang];
  const pdf = await PDFDocument.create();
  pdf.setTitle(T.title);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pen = await pdf.embedFont(StandardFonts.HelveticaOblique);
  let page;
  let y;
  let pageNo = 0;

  const newPage = () => {
    pageNo += 1;
    page = pdf.addPage([PAGE.w, PAGE.h]);
    y = PAGE.h - M;
    if (pageNo === 1) {
      page.drawText(T.title, { x: M, y: y - 18, size: 20, font: bold, color: NAVY });
      y -= 30;
      page.drawText(T.sub, { x: M, y: y - 10, size: 10.5, font: reg, color: GREY });
      const d = `${T.date}: ____________`;
      page.drawText(d, { x: PAGE.w - M - reg.widthOfTextAtSize(d, 10.5), y: y + 20, size: 10.5, font: reg, color: INK });
      y -= 22;
    } else {
      page.drawText(T.title, { x: M, y: y - 12, size: 12, font: bold, color: NAVY });
      y -= 22;
    }
    const foot = T.page.replace('{n}', String(pageNo));
    page.drawText(foot, { x: PAGE.w - M - reg.widthOfTextAtSize(foot, 9), y: 28, size: 9, font: reg, color: GREY });
    page.drawText(T.office, { x: M, y: 28, size: 8.5, font: reg, color: GREY });
  };

  const heading = (text) => {
    y -= 14;
    page.drawText(text, { x: M, y: y - 4, size: 13, font: bold, color: NAVY });
    page.drawLine({ start: { x: M, y: y - 9 }, end: { x: M + CW, y: y - 9 }, thickness: 0.8, color: TEAL });
    y -= 18;
  };
  const text = (str, size = 11, color = INK, font = reg, x = M) => {
    page.drawText(str, { x, y: y - size, size, font, color });
    y -= size + 4;
  };
  const wrap = (str, size, font, width) => {
    const words = str.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const trial = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(trial, size) > width && cur) { lines.push(cur); cur = w; } else cur = trial;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const para = (str, size = 10.5, color = GREY) => { for (const l of wrap(str, size, reg, CW)) text(l, size, color); };

  const box = (x, yy, on, size = 13) => {
    page.drawRectangle({ x, y: yy - size + 3, width: size, height: size, borderColor: INK, borderWidth: 1 });
    if (SAMPLE && on) {
      page.drawLine({ start: { x: x + 2.5, y: yy - size / 2 + 2 }, end: { x: x + size / 2.2, y: yy - size + 5.5 }, thickness: 2, color: PEN });
      page.drawLine({ start: { x: x + size / 2.2, y: yy - size + 5.5 }, end: { x: x + size - 2, y: yy + 1 }, thickness: 2, color: PEN });
    }
  };
  /** Checkbox options laid across the width, wrapping to new rows. */
  const options = (opts, chosen = [], cols = 2) => {
    const colW = CW / cols;
    for (let i = 0; i < opts.length; i += cols) {
      const row = opts.slice(i, i + cols);
      row.forEach((o, j) => {
        const x = M + j * colW;
        box(x, y, chosen.includes(o));
        page.drawText(o, { x: x + 19, y: y - 10, size: 11.5, font: reg, color: INK });
      });
      y -= 22;
    }
  };
  const field = (label, x, width, value = '') => {
    page.drawText(label, { x, y: y - 9, size: 9.5, font: reg, color: GREY });
    page.drawLine({ start: { x, y: y - 28 }, end: { x: x + width, y: y - 28 }, thickness: 0.8, color: LINE });
    if (SAMPLE && value) page.drawText(value, { x: x + 4, y: y - 25, size: 12.5, font: pen, color: PEN });
  };
  const lines = (n, values = []) => {
    for (let i = 0; i < n; i += 1) {
      y -= 20;
      page.drawLine({ start: { x: M, y: y - 2 }, end: { x: M + CW, y: y - 2 }, thickness: 0.8, color: LINE });
      if (SAMPLE && values[i]) page.drawText(values[i], { x: M + 4, y: y + 2, size: 12.5, font: pen, color: PEN });
    }
    y -= 6;
  };
  const yesNo = (q, answer) => {
    const ls = wrap(q, 11.5, reg, CW - 150);
    const top = y;
    ls.forEach((l, i) => page.drawText(l, { x: M, y: top - 11 - i * 14, size: 11.5, font: reg, color: INK }));
    const bx = M + CW - 130;
    box(bx, top, answer === 'yes'); page.drawText(T.yes, { x: bx + 19, y: top - 10, size: 11.5, font: reg, color: INK });
    box(bx + 68, top, answer === 'no'); page.drawText(T.no, { x: bx + 87, y: top - 10, size: 11.5, font: reg, color: INK });
    y -= Math.max(ls.length * 14, 16) + 10;
  };
  const S = SAMPLE ? SAMPLE_ANSWERS : null;

  // ---------------------------------------------------------------- page 1
  newPage();
  heading(T.s1);
  field(T.first, M, CW / 2 - 10, S?.first); field(T.last, M + CW / 2 + 10, CW / 2 - 10, S?.last); y -= 36;
  field(T.dob, M, CW / 2 - 10, S?.dob);
  page.drawText(T.sex, { x: M + CW / 2 + 10, y: y - 9, size: 9.5, font: reg, color: GREY });
  box(M + CW / 2 + 10, y - 14, S?.sex === 'woman'); page.drawText(T.woman, { x: M + CW / 2 + 29, y: y - 24, size: 11.5, font: reg, color: INK });
  box(M + CW / 2 + 110, y - 14, S?.sex === 'man'); page.drawText(T.man, { x: M + CW / 2 + 129, y: y - 24, size: 11.5, font: reg, color: INK });
  y -= 36;
  field(T.phone, M, CW / 2 - 10, S?.phone); field(T.email, M + CW / 2 + 10, CW / 2 - 10, S?.email); y -= 36;
  text(T.seen, 11.5);
  options([T.seenNo, T.seenYes], S ? [S.seen === 'no' ? T.seenNo : T.seenYes] : []);

  heading(T.s2);
  para(T.s2hint);
  lines(4, S?.story);

  heading(T.s3);
  options(T.areas, S ? S.areas.map((a) => T.areas[TEXT.en.areas.indexOf(a)]) : [], 2);

  heading(T.s4);
  options(T.durations, S ? [T.durations[TEXT.en.durations.indexOf(S.duration)]] : [], 2);

  heading(T.s5);
  para(T.s5hint);
  y -= 6;
  for (let n = 0; n <= 10; n += 1) {
    const x = M + 12 + n * (CW - 24) / 10;
    page.drawCircle({ x, y: y - 8, size: 11, borderColor: INK, borderWidth: 0.8 });
    page.drawText(String(n), { x: x - (n === 10 ? 7 : 3.5), y: y - 12.5, size: 12, font: bold, color: INK });
    if (SAMPLE && S.pain === n) page.drawCircle({ x, y: y - 8, size: 14, borderColor: PEN, borderWidth: 2 });
  }
  y -= 34;

  heading(T.s6);
  options(T.trends, S ? [T.trends[TEXT.en.trends.indexOf(S.trend)]] : [], 3);

  // ---------------------------------------------------------------- page 2
  newPage();
  heading(T.s7);
  T.questions.forEach((q, i) => yesNo(q, S?.yesno[i]));

  heading(T.s8);
  yesNo(T.s8, S?.surgery);
  y += 6;
  field(T.s8detail, M, CW, S?.surgeryText); y -= 36;

  heading(T.s9);
  options(T.claims, S ? [T.claims[TEXT.en.claims.indexOf(S.claim)]] : [], 3);

  heading(T.s10);
  options(T.tried, S ? S.tried.map((a) => T.tried[TEXT.en.tried.indexOf(a)]) : [], 3);

  heading(T.s11);
  box(M + CW - 80, y + 14, S ? !S.meds.length : false); page.drawText(T.none, { x: M + CW - 61, y: y + 4, size: 11, font: reg, color: INK });
  lines(3, S?.meds);

  heading(T.s12);
  box(M + CW - 80, y + 14, S ? S.allergiesNone : false); page.drawText(T.none, { x: M + CW - 61, y: y + 4, size: 11, font: reg, color: INK });
  lines(2, S?.allergies);

  heading(T.s13);
  box(M + CW - 80, y + 14, S ? !S.conditions.length : false); page.drawText(T.none, { x: M + CW - 61, y: y + 4, size: 11, font: reg, color: INK });
  lines(2, S?.conditions);

  heading(T.s14);
  para(T.attest, 10.5, INK);
  y -= 8;
  field(T.signature, M, CW / 2 - 10, S?.signature); field(T.signDate, M + CW / 2 + 10, CW / 2 - 10, S?.date); y -= 36;
  field(T.printed, M, CW / 2 - 10, S?.printed); y -= 36;
  y -= 4;
  page.drawText(T.thanks, { x: M, y: y - 11, size: 11, font: bold, color: TEAL });

  return pdf.save();
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const lang of ['en', 'es']) {
  const bytes = await build(lang);
  const name = SAMPLE ? `spine-intake-paper-${lang}-SAMPLE.pdf` : `spine-intake-paper-${lang}.pdf`;
  const out = path.join(SAMPLE ? path.join(ROOT, '.pdf-tmp') : OUT_DIR, name);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, bytes);
  console.log(`${path.relative(ROOT, out)}  (${(bytes.length / 1024).toFixed(0)} KB)`);
}
