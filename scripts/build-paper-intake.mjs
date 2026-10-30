#!/usr/bin/env node
// ============================================================================
// The paper intake form: letter-size pages a patient fills in by hand in the
// clinic, written for a middle-school reading level, in large type with big
// boxes. Pages 1 to 4 are the clinical form; page 5 is the acknowledgments
// to sign (English on every form) and is filed with registration.
//
// The office scans or photographs pages 1 to 4 into Practice Hub ("Paper
// intake form" on the Intake forms page or on the chart), where Claude reads
// them, including the marks on the body diagram, and drafts the clinic note.
// The numbered questions and plain labels below are what that reader keys on.
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
const PAGES = 5;

const TEXT = {
  en: {
    title: 'Spine Visit: Patient Form',
    sub: 'Please print clearly. If you need help, ask the front desk. There are no wrong answers.',
    date: 'Today’s date',
    page: `Page {n} of ${PAGES}`,
    office: 'Office use: pages 1 to 4 go into Practice Hub. Page 5 is filed with registration.',
    yes: 'Yes', no: 'No', none: 'None',

    s1: '1. About you',
    first: 'First name', last: 'Last name',
    phone: 'Phone number', email: 'Email (if you have one)',

    s2: '2. What brings you in today?',
    s2hint: 'Tell us in your own words. For example: my low back hurts and the pain goes down my right leg.',

    s3: '3. Where does it hurt? Check all that apply.',
    areas: ['Neck', 'Upper or middle back', 'Low back', 'Right arm or hand', 'Left arm or hand', 'Right leg or foot', 'Left leg or foot'],
    other: 'Other:',

    s4: '4. Mark where your pain is',
    s4hint: 'Shade or circle the places that hurt. Draw an arrow to show where the pain travels. Write X where you feel numbness or tingling.',
    front: 'Front', back: 'Back', right: 'Right', left: 'Left',

    s5: '5. How long has this been going on?',
    durations: ['Less than a month', '1 to 6 months', '6 months to 2 years', 'More than 2 years'],

    s6: '6. How bad is the pain today? Circle one number.',
    s6hint: '0 = no pain          10 = the worst pain you can imagine',

    s7: '7. Is it getting better, worse, or staying the same?',
    trends: ['Getting better', 'About the same', 'Getting worse'],

    s8: '8. Please answer Yes or No.',
    questions: [
      'Do you have numbness or tingling in your arms, hands, legs or feet?',
      'Do you have weakness in an arm or a leg?',
      'Do you have trouble walking, or feel unsteady on your feet?',
      'Any new trouble controlling your bladder or bowels?',
    ],

    s9: '9. Have you already tried any of these? Check what you tried and tell us about it.',
    pt: 'Physical therapy', ptWhen: 'When', ptWhere: 'Where', ptHowLong: 'How long', ptHowOften: 'How often (times a week)',
    alternatives: ['Chiropractor', 'Dry needling', 'Massage therapy', 'Acupuncture', 'Cupping', 'Home exercises'],
    inj: 'Injections', injWhen: 'When', injHowMany: 'How many', injType: 'What type, and which level if you know (for example epidural L4-5)',
    painMeds: 'Pain medicine', painMedsDetail: 'Which ones',
    nothing: 'Nothing yet',

    s10: '10. Medicines you take every day',
    s11: '11. Allergies to medicines',

    s12: '12. Health conditions. Check any you have.',
    conditions: [
      'High blood pressure', 'Diabetes', 'Heart disease (blocked arteries or heart attack)',
      'Heart failure', 'Stroke', 'Blood clots (DVT or lung clot)',
      'Lung disease (COPD, asthma)', 'Sleep apnea', 'Kidney disease',
      'Osteoporosis', 'Osteopenia', 'Low thyroid (hypothyroid)',
      'Overactive thyroid (hyperthyroid)', 'Rheumatoid arthritis or other autoimmune disease', 'Depression or anxiety',
    ],
    cancer: 'Cancer', cancerType: 'What type', cancerWhen: 'When',
    cancerTreated: 'How was it treated', cancerStatus: 'Ongoing treatment, or in remission since when?',
    infections: 'Serious infections (for example MRSA, a bone or joint infection): what and when',
    otherConditions: 'Other conditions',

    s13: '13. Surgeries you have had',
    spineSurgery: 'Have you ever had surgery on your spine?',
    spineSurgeryDetail: 'If yes, what surgery and about when?',
    surgeryList: 'All other surgeries, with the year (for example appendix 1998, right knee 2015)',

    s14: '14. Review of systems. Check anything you have now.',
    rosNone: 'I have none of these',
    ros: [
      { system: 'General', items: ['fever or chills', 'weight loss', 'night sweats'] },
      { system: 'Heart', items: ['chest pain', 'skipped heartbeats', 'leg swelling'] },
      { system: 'Lungs', items: ['shortness of breath', 'cough that will not go away'] },
      { system: 'Stomach', items: ['nausea or vomiting', 'constipation', 'blood in the stool'] },
      { system: 'Bladder', items: ['trouble passing urine', 'burning', 'blood in the urine'] },
      { system: 'Nerves', items: ['headaches', 'dizziness or fainting', 'seizures'] },
      { system: 'Joints', items: ['pain in other joints', 'recent falls'] },
      { system: 'Skin', items: ['rashes', 'sores that will not heal'] },
      { system: 'Blood', items: ['easy bruising or bleeding', 'I take a blood thinner'] },
      { system: 'Mood and sleep', items: ['feeling down or anxious', 'trouble sleeping'] },
    ],

    s15: '15. About your life',
    job: 'Your job or career (or your former job, if retired)',
    living: 'Who do you live with?',
    livingOpts: ['Alone', 'Spouse or partner', 'Family', 'Assisted living or nursing home'],
    stairs: 'Do you have to climb stairs at home?',
    stairsOpts: ['No', 'Yes, a few steps', 'Yes, a full flight or more'],
    activity: 'How active are you?',
    activityOpts: ['Very active', 'Somewhat active', 'Mostly sitting', 'Mostly in bed'],
    activities: 'What do you do for exercise, hobbies or sport?',
    walking: 'Do you use anything to help you walk?',
    walkOpts: ['Nothing', 'Cane', 'Walker', 'Wheelchair'],
    smoke: 'Do you smoke or vape?',

    signature: 'Signature', signDate: 'Date',
    next: `Please turn to page ${PAGES} and sign there.`,

    // Page 5: the acknowledgments the online form collects (lib/consent.js),
    // in plain words, and the one signature. English on every form.
    s16: '16. Please read each statement, check the box, and sign',
    consents: [
      'What I wrote on this form is true and complete, as far as I know. I am the patient, or I am filling this out for the patient as a parent, guardian or someone the patient has authorized.',
      'I will pay for any care my insurance does not cover, and any copays or deductibles. The office may send my insurance company the information it needs to process my claims, and my insurance company may pay the office directly.',
      'The office may share my health information with the other doctors, hospitals, imaging centers and therapists who take care of me, and may ask them for my records, so that my care can be coordinated.',
      'I was given the chance to read the Notice of Privacy Practices of Holy Name Medical Partners. It explains how my health information may be used and shared, and my rights. A copy is available at the front desk.',
      'The office may call, text or email me at the phone number and email I gave, to schedule and coordinate my care. This form is not for emergencies. In an emergency I will call 911.',
    ],
    printed: 'Printed name',
    forPatient: 'If you are signing for the patient:',
    forName: 'Your name', forRel: 'Your relationship to the patient',
    thanks: 'Thank you for taking the time to fill this out. Please hand it to the front desk.',
  },
  es: {
    title: 'Visita de columna: formulario del paciente',
    sub: 'Escriba con letra de imprenta clara. Si necesita ayuda, pregunte en recepción. No hay respuestas incorrectas.',
    date: 'Fecha de hoy',
    page: `Página {n} de ${PAGES}`,
    office: 'Uso de la oficina: las páginas 1 a 4 van a Practice Hub. La página 5 se archiva con el registro.',
    yes: 'Sí', no: 'No', none: 'Ninguno',

    s1: '1. Sobre usted',
    first: 'Nombre', last: 'Apellido',
    phone: 'Número de teléfono', email: 'Correo electrónico (si tiene)',

    s2: '2. ¿Qué lo trae hoy a la consulta?',
    s2hint: 'Cuéntenos con sus propias palabras. Por ejemplo: me duele la espalda baja y el dolor baja por la pierna derecha.',

    s3: '3. ¿Dónde le duele? Marque todo lo que corresponda.',
    areas: ['Cuello', 'Espalda alta o media', 'Espalda baja', 'Brazo o mano derecha', 'Brazo o mano izquierda', 'Pierna o pie derecho', 'Pierna o pie izquierdo'],
    other: 'Otro:',

    s4: '4. Marque dónde le duele',
    s4hint: 'Sombree o encierre en un círculo los lugares que le duelen. Dibuje una flecha para mostrar hacia dónde viaja el dolor. Escriba una X donde sienta entumecimiento u hormigueo.',
    front: 'Frente', back: 'Espalda', right: 'Derecha', left: 'Izquierda',

    s5: '5. ¿Desde hace cuánto tiempo tiene este problema?',
    durations: ['Menos de un mes', 'De 1 a 6 meses', 'De 6 meses a 2 años', 'Más de 2 años'],

    s6: '6. ¿Qué tan fuerte es el dolor hoy? Encierre un número en un círculo.',
    s6hint: '0 = sin dolor          10 = el peor dolor que pueda imaginar',

    s7: '7. ¿Está mejorando, empeorando o sigue igual?',
    trends: ['Mejorando', 'Más o menos igual', 'Empeorando'],

    s8: '8. Responda Sí o No.',
    questions: [
      '¿Tiene entumecimiento u hormigueo en los brazos, las manos, las piernas o los pies?',
      '¿Tiene debilidad en un brazo o una pierna?',
      '¿Tiene dificultad para caminar o se siente inestable al caminar?',
      '¿Algún problema nuevo para controlar la vejiga o los intestinos?',
    ],

    s9: '9. ¿Ya ha probado alguno de estos? Marque lo que probó y cuéntenos.',
    pt: 'Fisioterapia', ptWhen: 'Cuándo', ptWhere: 'Dónde', ptHowLong: 'Por cuánto tiempo', ptHowOften: 'Veces por semana',
    alternatives: ['Quiropráctico', 'Punción seca', 'Masaje terapéutico', 'Acupuntura', 'Ventosas', 'Ejercicios en casa'],
    inj: 'Inyecciones', injWhen: 'Cuándo', injHowMany: 'Cuántas', injType: 'De qué tipo y en qué nivel, si lo sabe (por ejemplo epidural L4-5)',
    painMeds: 'Medicamentos para el dolor', painMedsDetail: 'Cuáles',
    nothing: 'Nada todavía',

    s10: '10. Medicamentos que toma todos los días',
    s11: '11. Alergias a medicamentos',

    s12: '12. Afecciones de salud. Marque las que tenga.',
    conditions: [
      'Presión alta', 'Diabetes', 'Enfermedad del corazón (arterias tapadas o infarto)',
      'Insuficiencia cardíaca', 'Derrame cerebral', 'Coágulos de sangre (en la pierna o el pulmón)',
      'Enfermedad pulmonar (EPOC, asma)', 'Apnea del sueño', 'Enfermedad de los riñones',
      'Osteoporosis', 'Osteopenia', 'Tiroides baja (hipotiroidismo)',
      'Tiroides alta (hipertiroidismo)', 'Artritis reumatoide u otra enfermedad autoinmune', 'Depresión o ansiedad',
    ],
    cancer: 'Cáncer', cancerType: 'De qué tipo', cancerWhen: 'Cuándo',
    cancerTreated: 'Cómo se trató', cancerStatus: '¿Tratamiento en curso, o en remisión desde cuándo?',
    infections: 'Infecciones graves (por ejemplo MRSA, infección de hueso o articulación): cuál y cuándo',
    otherConditions: 'Otras afecciones',

    s13: '13. Cirugías que ha tenido',
    spineSurgery: '¿Alguna vez le han operado la columna?',
    spineSurgeryDetail: 'Si la respuesta es sí, ¿qué cirugía y aproximadamente cuándo?',
    surgeryList: 'Todas las demás cirugías, con el año (por ejemplo apéndice 1998, rodilla derecha 2015)',

    s14: '14. Revisión por sistemas. Marque lo que tenga ahora.',
    rosNone: 'No tengo ninguno de estos',
    ros: [
      { system: 'General', items: ['fiebre o escalofríos', 'pérdida de peso', 'sudores nocturnos'] },
      { system: 'Corazón', items: ['dolor de pecho', 'latidos irregulares', 'hinchazón de piernas'] },
      { system: 'Pulmones', items: ['falta de aire', 'tos que no se quita'] },
      { system: 'Estómago', items: ['náuseas o vómitos', 'estreñimiento', 'sangre en las heces'] },
      { system: 'Vejiga', items: ['dificultad para orinar', 'ardor', 'sangre en la orina'] },
      { system: 'Nervios', items: ['dolores de cabeza', 'mareos o desmayos', 'convulsiones'] },
      { system: 'Articulaciones', items: ['dolor en otras articulaciones', 'caídas recientes'] },
      { system: 'Piel', items: ['sarpullido', 'llagas que no sanan'] },
      { system: 'Sangre', items: ['moretones o sangrado fácil', 'tomo un anticoagulante'] },
      { system: 'Ánimo y sueño', items: ['me siento decaído o ansioso', 'problemas para dormir'] },
    ],

    s15: '15. Sobre su vida',
    job: 'Su trabajo o carrera (o su trabajo anterior, si está jubilado)',
    living: '¿Con quién vive?',
    livingOpts: ['Solo', 'Esposo(a) o pareja', 'Familia', 'Residencia asistida o asilo'],
    stairs: '¿Tiene que subir escaleras en su casa?',
    stairsOpts: ['No', 'Sí, unos escalones', 'Sí, un piso completo o más'],
    activity: '¿Qué tan activo es usted?',
    activityOpts: ['Muy activo', 'Algo activo', 'Casi siempre sentado', 'Casi siempre en cama'],
    activities: '¿Qué hace de ejercicio, pasatiempos o deporte?',
    walking: '¿Usa algo para ayudarse a caminar?',
    walkOpts: ['Nada', 'Bastón', 'Andador', 'Silla de ruedas'],
    smoke: '¿Fuma o vapea?',

    signature: 'Firma', signDate: 'Fecha',
    next: `Pase a la página ${PAGES} y firme allí.`,
    // Page 5 (the acknowledgments) is printed in English on every form.
  },
};

/** A handwritten-looking answer set, drawn onto the sample copy only. */
const SAMPLE_ANSWERS = {
  first: 'Margaret', last: 'Okafor', phone: '(201) 555-0142', email: '',
  story: ['My low back hurts and the pain goes down my', 'right leg to the foot. It is worse when I walk', 'more than one block. Started after I moved', 'some boxes in July.'],
  areas: ['Low back', 'Right leg or foot'], otherArea: '',
  duration: '1 to 6 months', pain: 7, trend: 'Getting worse',
  yesno: ['yes', 'no', 'no', 'no'],
  tried: ['pt', 'painMeds'], alternatives: ['Massage therapy'],
  ptWhen: 'Aug - Sept 2026', ptWhere: 'Englewood PT', ptHowLong: '6 weeks', ptHowOften: '2 x week',
  injWhen: '', injHowMany: '', injType: '',
  painMedsDetail: 'Tylenol, Advil',
  meds: ['Lisinopril 10 mg', 'Metformin 500 mg twice a day'], allergies: [], allergiesNone: true,
  conditions: ['High blood pressure', 'Diabetes', 'Osteopenia'], cancer: false,
  cancerType: '', cancerWhen: '', cancerTreated: '', cancerStatus: '', infections: '', otherConditions: [],
  spineSurgery: 'no', spineSurgeryText: '', surgeries: ['Gallbladder 2009', 'Left cataract 2022'],
  rosNone: false, ros: { Joints: ['recent falls'], 'Mood and sleep': ['trouble sleeping'] },
  job: 'Retired school secretary', living: 'Spouse or partner', stairs: 'Yes, a full flight or more',
  activity: 'Somewhat active', activities: 'Walking, church choir, gardening', walking: 'Cane', smoke: 'no',
  signature: 'Margaret Okafor', date: '10 / 30 / 2026', printed: 'MARGARET OKAFOR', consents: true,
};

// The pain diagram: the practice's own front-and-back figure (the title
// cropped off), with the front figure on the left. Positions on it below
// are fractions of its width and height.
const BODY_IMAGE = path.join(ROOT, 'scripts', 'assets', 'body-diagram.jpg');
const FIG = {
  frontCx: 0.25, backCx: 0.757, shoulderY: 0.18,
  // The sample's marks on the back figure: the low back, and the patient's
  // right leg (the viewer's right from behind).
  lowBack: [0.757, 0.40], rightLegTop: [0.775, 0.49], rightLegBottom: [0.79, 0.9],
};

async function build(lang) {
  const T = TEXT[lang];
  const E = TEXT.en;
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
      const d = `${T.date}: ____________`;
      // The title shrinks until it and the date line fit side by side.
      let size = 20;
      while (size > 14 && bold.widthOfTextAtSize(T.title, size) + reg.widthOfTextAtSize(d, 10.5) + 24 > CW) size -= 0.5;
      page.drawText(T.title, { x: M, y: y - 18, size, font: bold, color: NAVY });
      y -= 30;
      page.drawText(T.sub, { x: M, y: y - 10, size: 10.5, font: reg, color: GREY });
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
    y -= 10;
    page.drawText(text, { x: M, y: y - 4, size: 13, font: bold, color: NAVY });
    page.drawLine({ start: { x: M, y: y - 9 }, end: { x: M + CW, y: y - 9 }, thickness: 0.8, color: TEAL });
    y -= 16;
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
  /** A checkbox with its label at the current line; the caller moves y. */
  const check = (x, label, on, size = 11.5) => {
    box(x, y, on);
    page.drawText(label, { x: x + 19, y: y - 10, size, font: reg, color: INK });
  };
  /** Checkbox options laid across the width in columns; a long label wraps inside its column. */
  const options = (opts, chosen = [], cols = 2, size = 11.5) => {
    const colW = CW / cols;
    for (let i = 0; i < opts.length; i += cols) {
      const row = opts.slice(i, i + cols);
      let rowLines = 1;
      row.forEach((o, j) => {
        const x = M + j * colW;
        box(x, y, chosen.includes(o));
        const ls = wrap(o, size, reg, colW - 26);
        rowLines = Math.max(rowLines, ls.length);
        ls.forEach((l, k) => page.drawText(l, { x: x + 19, y: y - 10 - k * 13, size, font: reg, color: INK }));
      });
      y -= 9 + rowLines * 13;
    }
  };
  /** A labelled line to write on: the label in small grey above a rule 28 pt down. The caller moves y (36 for a row). */
  const field = (label, x, width, value = '') => {
    page.drawText(label, { x, y: y - 9, size: 9.5, font: reg, color: GREY });
    page.drawLine({ start: { x, y: y - 28 }, end: { x: x + width, y: y - 28 }, thickness: 0.8, color: LINE });
    if (SAMPLE && value) page.drawText(value, { x: x + 4, y: y - 25, size: 12.5, font: pen, color: PEN });
  };
  const fieldRow = (a, b) => {
    field(a[0], M, CW / 2 - 10, a[1]);
    if (b) field(b[0], M + CW / 2 + 10, CW / 2 - 10, b[1]);
    y -= 36;
  };
  /** Several fields across one row, equal widths unless `widths` (fractions) is given. */
  const fieldsRow = (items, widths) => {
    const gap = 14;
    const total = CW - gap * (items.length - 1);
    let x = M;
    items.forEach(([label, value], i) => {
      const w = total * (widths ? widths[i] : 1 / items.length);
      field(label, x, w, value);
      x += w + gap;
    });
    y -= 36;
  };
  /**
   * Ruled lines to write on. With `none` given, the first line is shorter and
   * carries a "None" box at its right end (ticked on the sample when `none`
   * is true).
   */
  const lines = (n, values = [], none) => {
    for (let i = 0; i < n; i += 1) {
      y -= 20;
      const withNone = i === 0 && none !== undefined;
      page.drawLine({ start: { x: M, y: y - 2 }, end: { x: M + CW - (withNone ? 92 : 0), y: y - 2 }, thickness: 0.8, color: LINE });
      if (withNone) {
        box(M + CW - 80, y + 12, none);
        page.drawText(T.none, { x: M + CW - 61, y: y + 2, size: 11, font: reg, color: INK });
      }
      if (SAMPLE && values[i]) page.drawText(values[i], { x: M + 4, y: y + 2, size: 12.5, font: pen, color: PEN });
    }
    y -= 4;
  };
  /** A question at the left with Yes / No boxes at the right. */
  const yesNo = (q, answer) => {
    const ls = wrap(q, 11.5, reg, CW - 150);
    const top = y;
    ls.forEach((l, i) => page.drawText(l, { x: M, y: top - 11 - i * 14, size: 11.5, font: reg, color: INK }));
    const bx = M + CW - 130;
    box(bx, top, answer === 'yes'); page.drawText(T.yes, { x: bx + 19, y: top - 10, size: 11.5, font: reg, color: INK });
    box(bx + 68, top, answer === 'no'); page.drawText(T.no, { x: bx + 87, y: top - 10, size: 11.5, font: reg, color: INK });
    y -= Math.max(ls.length * 14, 16) + 6;
  };
  /** The footer sits at y = 28; the page's last line may not run into it. */
  const fits = () => {
    if (y - 14 < 44) throw new Error(`${lang}: page ${pageNo} overflows by ${Math.round(44 - (y - 14))} pt; shorten something`);
  };

  const bodyImage = await pdf.embedJpg(fs.readFileSync(BODY_IMAGE));
  /**
   * The body diagram, `h` points tall and centred, with Front / Back
   * captions and the patient's right and left marked beside each figure
   * (right is on the viewer's left from the front, on the right from
   * behind). Returns a function from image fractions to page points.
   */
  const diagram = (top, h) => {
    const w = h * (bodyImage.width / bodyImage.height);
    const x0 = M + (CW - w) / 2;
    page.drawImage(bodyImage, { x: x0, y: top - h, width: w, height: h });
    const P = ([fx, fy]) => ({ x: x0 + fx * w, y: top - fy * h });
    const cap = (label, cx) => page.drawText(label, { x: cx - bold.widthOfTextAtSize(label, 10.5) / 2, y: top - h - 13, size: 10.5, font: bold, color: NAVY });
    cap(T.front, P([FIG.frontCx, 0]).x);
    cap(T.back, P([FIG.backCx, 0]).x);
    const side = (label, x, alignRight, dy = 0) => page.drawText(label, { x: alignRight ? x - reg.widthOfTextAtSize(label, 9) : x, y: P([0, FIG.shoulderY]).y - dy, size: 9, font: reg, color: GREY });
    // The two inner labels sit between the figures, one a line below the other so they never collide.
    side(T.right, x0 - 4, true); side(T.left, P([0.5, 0]).x - 2, true);
    side(T.left, P([0.5, 0]).x + 2, false, 12); side(T.right, x0 + w + 4, false);
    return P;
  };

  const S = SAMPLE ? SAMPLE_ANSWERS : null;
  const enIdx = (list, v) => (v == null ? -1 : list.indexOf(v));
  const pick = (listKey, v) => (v == null ? [] : [T[listKey][enIdx(E[listKey], v)]]);
  const picks = (listKey, vs) => (vs || []).map((v) => T[listKey][enIdx(E[listKey], v)]);

  // ---------------------------------------------------------------- page 1
  newPage();
  heading(T.s1);
  fieldRow([T.first, S?.first], [T.last, S?.last]);
  fieldRow([T.phone, S?.phone], [T.email, S?.email]);

  heading(T.s2);
  para(T.s2hint);
  lines(4, S?.story);

  heading(T.s4);
  para(T.s4hint);
  y -= 6;
  {
    // As tall as the room left on the page allows (the Spanish hint wraps).
    const h = Math.min(340, y - 76);
    const top = y;
    const P = diagram(top, h);
    if (SAMPLE) {
      // Low back circled, an arrow down the right leg.
      const lb = P(FIG.lowBack);
      page.drawEllipse({ x: lb.x, y: lb.y, xScale: 14, yScale: 7, borderColor: PEN, borderWidth: 2 });
      const a = P(FIG.rightLegTop); const b = P(FIG.rightLegBottom);
      page.drawLine({ start: a, end: b, thickness: 2, color: PEN });
      page.drawLine({ start: b, end: { x: b.x - 7, y: b.y + 3 }, thickness: 2, color: PEN });
      page.drawLine({ start: b, end: { x: b.x + 1, y: b.y + 8 }, thickness: 2, color: PEN });
    }
    y = top - h - 18;
  }
  fits();

  // ---------------------------------------------------------------- page 2
  newPage();
  heading(T.s3);
  options(T.areas, picks('areas', S?.areas), 2);
  // "Other: ____" takes the free slot at the end of the last row.
  y += 22;
  check(M + CW / 2, T.other, S ? !!S.otherArea : false);
  const ox = M + CW / 2 + 19 + reg.widthOfTextAtSize(T.other, 11.5) + 6;
  page.drawLine({ start: { x: ox, y: y - 12 }, end: { x: M + CW, y: y - 12 }, thickness: 0.8, color: LINE });
  if (SAMPLE && S.otherArea) page.drawText(S.otherArea, { x: ox + 3, y: y - 9, size: 12.5, font: pen, color: PEN });
  y -= 22;

  heading(T.s5);
  options(T.durations, pick('durations', S?.duration), 2);

  heading(T.s6);
  para(T.s6hint);
  y -= 2;
  for (let n = 0; n <= 10; n += 1) {
    const x = M + 12 + n * (CW - 24) / 10;
    page.drawCircle({ x, y: y - 8, size: 11, borderColor: INK, borderWidth: 0.8 });
    page.drawText(String(n), { x: x - (n === 10 ? 7 : 3.5), y: y - 12.5, size: 12, font: bold, color: INK });
    if (SAMPLE && S.pain === n) page.drawCircle({ x, y: y - 8, size: 14, borderColor: PEN, borderWidth: 2 });
  }
  y -= 30;

  heading(T.s7);
  options(T.trends, pick('trends', S?.trend), 3);

  heading(T.s8);
  T.questions.forEach((q, i) => yesNo(q, S?.yesno[i]));

  heading(T.s9);
  const tried = (k) => (S ? S.tried.includes(k) : false);
  check(M, T.pt, tried('pt')); y -= 22;
  fieldsRow([[T.ptWhen, S?.ptWhen], [T.ptWhere, S?.ptWhere], [T.ptHowLong, S?.ptHowLong], [T.ptHowOften, S?.ptHowOften]]);
  options(T.alternatives, picks('alternatives', S?.alternatives), 3);
  check(M, T.inj, tried('inj')); y -= 22;
  fieldsRow([[T.injWhen, S?.injWhen], [T.injHowMany, S?.injHowMany], [T.injType, S?.injType]], [0.2, 0.2, 0.6]);
  check(M, T.painMeds, tried('painMeds')); field(T.painMedsDetail, M + 190, CW - 190, S?.painMedsDetail); y -= 36;
  check(M, T.nothing, tried('nothing')); y -= 14;
  fits();

  // ---------------------------------------------------------------- page 3
  newPage();
  heading(T.s10);
  lines(3, S?.meds, S ? !S.meds.length : false);

  heading(T.s11);
  lines(1, S?.allergies, S ? S.allergiesNone : false);

  heading(T.s12);
  options(T.conditions, picks('conditions', S?.conditions), 3);
  y -= 4;
  check(M, T.cancer, S ? S.cancer : false); y -= 22;
  fieldRow([T.cancerType, S?.cancerType], [T.cancerWhen, S?.cancerWhen]);
  fieldRow([T.cancerTreated, S?.cancerTreated], [T.cancerStatus, S?.cancerStatus]);
  field(T.infections, M, CW, S?.infections); y -= 36;
  field(T.otherConditions, M, CW, S?.otherConditions?.[0]); y -= 36;

  heading(T.s13);
  yesNo(T.spineSurgery, S?.spineSurgery);
  y += 4;
  field(T.spineSurgeryDetail, M, CW, S?.spineSurgeryText); y -= 36;
  y -= 2;
  page.drawText(T.surgeryList, { x: M, y: y - 9, size: 9.5, font: reg, color: GREY });
  y -= 8;
  lines(3, S?.surgeries);
  fits();

  // ---------------------------------------------------------------- page 4
  newPage();
  heading(T.s14);
  check(M, T.rosNone, S ? S.rosNone : false); y -= 24;
  const LABEL_W = 96;
  T.ros.forEach((sys, si) => {
    page.drawText(sys.system, { x: M, y: y - 10, size: 10.5, font: bold, color: INK });
    let x = M + LABEL_W;
    let lineY = y;
    sys.items.forEach((item, ii) => {
      const w = reg.widthOfTextAtSize(item, 10.5) + 15 + 14;
      if (x + w > M + CW + 2) { x = M + LABEL_W; lineY -= 16; }
      const on = S ? (S.ros[E.ros[si].system] || []).includes(E.ros[si].items[ii]) : false;
      box(x, lineY, on, 11);
      page.drawText(item, { x: x + 15, y: lineY - 9, size: 10.5, font: reg, color: INK });
      x += w;
    });
    y = lineY - 19;
  });

  heading(T.s15);
  field(T.job, M, CW, S?.job); y -= 36;
  text(T.living, 11.5); y -= 4;
  options(T.livingOpts, pick('livingOpts', S?.living), 4);
  text(T.stairs, 11.5); y -= 4;
  options(T.stairsOpts, pick('stairsOpts', S?.stairs), 3);
  text(T.activity, 11.5); y -= 4;
  options(T.activityOpts, pick('activityOpts', S?.activity), 4);
  field(T.activities, M, CW, S?.activities); y -= 36;
  text(T.walking, 11.5); y -= 4;
  options(T.walkOpts, pick('walkOpts', S?.walking), 4);
  yesNo(T.smoke, S?.smoke);
  y -= 6;
  page.drawText(T.next, { x: M, y: y - 11, size: 11, font: bold, color: TEAL });
  fits();

  // ---------------------------------------------------------------- page 5
  // The acknowledgments and the one signature, in English on every form.
  // Filed with registration.
  newPage();
  heading(E.s16);
  y -= 2;
  for (const statement of E.consents) {
    box(M, y - 1, S ? S.consents : false, 15);
    const ls = wrap(statement, 13, reg, CW - 28);
    ls.forEach((l, i) => page.drawText(l, { x: M + 28, y: y - 13 - i * 17, size: 13, font: reg, color: INK }));
    y -= ls.length * 17 + 14;
  }
  y -= 8;
  field(E.signature, M, CW / 2 - 10, S?.signature); field(E.signDate, M + CW / 2 + 10, CW / 2 - 10, S?.date); y -= 36;
  field(E.printed, M, CW / 2 - 10, S?.printed); y -= 44;
  text(E.forPatient, 10.5, GREY);
  y -= 2;
  field(E.forName, M, CW / 2 - 10); field(E.forRel, M + CW / 2 + 10, CW / 2 - 10); y -= 40;
  page.drawText(E.thanks, { x: M, y: y - 11, size: 11, font: bold, color: TEAL });
  fits();

  if (pageNo !== PAGES) throw new Error(`${lang}: ${pageNo} pages drawn but the footer says ${PAGES}`);
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
