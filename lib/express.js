// ============================================================================
// The express request: a five-turn chat that ends in a lead the office calls.
//
// Patients reach it from the "Chat with us" launcher on aaronweymd.com (and
// from /express directly). It is deliberately small: who you are, how to reach
// you, what is going on in your own words, one safety question, and the
// language to use when the office calls. The assistant (Claude on Bedrock, the
// same /api/chat route as the guided interview) phrases each question warmly
// in the patient's language; the answers are kept by slot, so nothing
// structured depends on the model. A confirmation card then shows the patient
// what was understood before anything is sent.
//
// A finished express request goes through the ordinary submission path
// (/api/intake/submit, worker, Practice Hub), marked `express`, so the office
// sees it where every other intake arrives. The lead note is written here,
// deterministically, rather than by the model: there is no history to
// summarise, and a lead must never be delayed by a slow model.
//
// Everything in this file runs in the browser and on the server.
// ============================================================================

import { LANGUAGE_NAMES } from './languages';

/** The five turns, in order. */
export const EXPRESS_SLOTS = ['who', 'contact', 'insurance', 'problem', 'safety', 'language'];

/**
 * What each turn asks. The model is told the slot and asks in its own words
 * in the patient's language; these are the words used when the model is
 * unavailable. Spanish and Chinese are inline, other languages come from the
 * translation tables (lib/translations) or fall back to English.
 */
export const EXPRESS_QUESTIONS = {
  who: {
    en: "Let's start with who you are. What is your full name, and your date of birth?",
    es: 'Empecemos por usted. ¿Cuál es su nombre completo y su fecha de nacimiento?',
    zh: '我们先从您的基本信息开始。请问您的全名和出生日期是？',
  },
  contact: {
    en: 'Thank you. What is the best phone number to reach you, and your email address? We will email you a link to your pre-visit questionnaire.',
    es: 'Gracias. ¿Cuál es el mejor número de teléfono para comunicarnos con usted, y su correo electrónico? Le enviaremos por correo un enlace a su cuestionario previo a la visita.',
    zh: '谢谢。联系您最方便的电话号码是？另外请留下您的电子邮箱，我们会把就诊前问卷的链接发给您。',
  },
  insurance: {
    en: 'Which health insurance do you have? The plan name is enough; add the member ID if it is handy. It is fine to say "none" or "not sure".',
    es: '¿Qué seguro médico tiene? Con el nombre del plan basta; agregue el número de miembro si lo tiene a mano. Puede responder "ninguno" o "no estoy seguro/a".',
    zh: '您有哪种医疗保险？写保险计划名称即可；方便的话也可以加上会员号。回答“没有”或“不确定”也可以。',
  },
  problem: {
    en: 'In your own words, what is going on, and what do you hope we can help with?',
    es: 'Con sus propias palabras, ¿qué le está pasando y en qué espera que podamos ayudarle?',
    zh: '请用您自己的话说说，您现在的情况是怎样的，希望我们在哪些方面帮到您？',
  },
  safety: {
    en: 'One safety question. Right now, do you have any of these: new trouble controlling your bladder or bowels, numbness around the groin or inner thighs, weakness that is getting worse quickly, or a fever together with back pain?',
    es: 'Una pregunta de seguridad. En este momento, ¿tiene alguno de estos síntomas: dificultad nueva para controlar la vejiga o el intestino, entumecimiento en la zona de la ingle o la parte interna de los muslos, debilidad que empeora rápidamente, o fiebre junto con dolor de espalda?',
    zh: '一个安全问题。您现在是否有以下任何情况：新出现的大小便控制困难、腹股沟或大腿内侧麻木、迅速加重的无力，或发烧伴随背痛？',
  },
  language: {
    en: 'Last one: which language would you like us to use when we call you?',
    es: 'Última pregunta: ¿en qué idioma prefiere que le llamemos?',
    zh: '最后一个问题：您希望我们打电话时使用哪种语言？',
  },
};

/** The answers offered as one-tap chips on the safety turn. Stored as the `value`. */
export const SAFETY_CHOICES = [
  { value: 'none', label: 'No, none of these' },
  { value: 'yes', label: 'Yes, one or more of these' },
  { value: 'unsure', label: "I'm not sure" },
];

/** The safety answer behind a free-text reply, or '' when it cannot be told. */
export function classifySafety(text) {
  const s = String(text || '').trim().toLowerCase();
  if (!s) return '';
  const chip = SAFETY_CHOICES.find((c) => c.label.toLowerCase() === s || c.value === s);
  if (chip) return chip.value;
  if (/\b(not sure|unsure|maybe|don'?t know|no sé|no estoy segur)/.test(s) || /不确定|不知道/.test(s)) return 'unsure';
  if (/^(no|nope|none|ninguno|ninguna|没有|沒有|不是)\b/.test(s) || /^(没有|沒有|不是)/.test(s)) return 'none';
  if (/^(yes|yeah|yep|sí|si|是|有)\b/.test(s) || /^(是|有)/.test(s) || /\b(yes|sí)\b/.test(s)) return 'yes';
  return '';
}

/** A language code from a free-text reply (name or native label), or ''. */
export function classifyLanguage(text, languages) {
  const s = String(text || '').trim().toLowerCase();
  if (!s) return '';
  for (const l of languages) {
    if (s === l.code || s === l.label.toLowerCase() || s === (LANGUAGE_NAMES[l.code] || '').toLowerCase()) return l.code;
  }
  for (const l of languages) {
    if (s.includes(l.label.toLowerCase()) || s.includes((LANGUAGE_NAMES[l.code] || '').toLowerCase())) return l.code;
  }
  const ALIASES = { english: 'en', inglés: 'en', ingles: 'en', spanish: 'es', español: 'es', espanol: 'es', chinese: 'zh', mandarin: 'zh', cantonese: 'zh', portuguese: 'pt', portugués: 'pt', brazilian: 'pt', russian: 'ru', polish: 'pl', arabic: 'ar', hebrew: 'he', korean: 'ko', japanese: 'ja', hindi: 'hi', nepali: 'ne' };
  for (const [k, v] of Object.entries(ALIASES)) if (s.includes(k)) return v;
  return '';
}

// ---------------------------------------------------------------------------
// Reading the free-text answers into fields. These only PRE-FILL the
// confirmation card; the patient corrects anything that was misread.
// ---------------------------------------------------------------------------

const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

function pad(n) { return String(n).padStart(2, '0'); }
function validDate(y, m, d) {
  if (y < 1900 || y > new Date().getFullYear() || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}
function fourDigitYear(y) {
  const n = Number(y);
  return y.length === 2 ? (n > new Date().getFullYear() % 100 ? 1900 + n : 2000 + n) : n;
}

/**
 * A date of birth found in free text, as YYYY-MM-DD, with the text it came
 * from, or null. Understands 1980-03-05, 3/5/1980, 03-05-80, "March 5, 1980",
 * "5 de marzo de 1980" and 1980年3月5日. Ambiguous day/month is read in the
 * US order (month first), which the patient can correct on the card.
 */
export function findDate(text) {
  const s = String(text || '');
  let m;
  if ((m = /(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?/.exec(s))) {
    const iso = validDate(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) return { iso, raw: m[0] };
  }
  if ((m = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/.exec(s))) {
    const y = fourDigitYear(m[3]);
    const iso = validDate(y, Number(m[1]), Number(m[2])) || validDate(y, Number(m[2]), Number(m[1]));
    if (iso) return { iso, raw: m[0] };
  }
  const monthNames = Object.keys(MONTHS).join('|');
  if ((m = new RegExp(`\\b(${monthNames})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'i').exec(s))) {
    const iso = validDate(Number(m[3]), MONTHS[m[1].toLowerCase()], Number(m[2]));
    if (iso) return { iso, raw: m[0] };
  }
  if ((m = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:de\\s+)?(${monthNames})\\.?,?\\s+(?:de\\s+)?(\\d{4})\\b`, 'i').exec(s))) {
    const iso = validDate(Number(m[3]), MONTHS[m[2].toLowerCase()], Number(m[1]));
    if (iso) return { iso, raw: m[0] };
  }
  return null;
}

const NAME_LEADS = /^(?:hi|hello|hola|good (?:morning|afternoon|evening))[,.!]?\s*/i;
const NAME_PHRASES = /^(?:my name is|my name's|i am|i'm|im|this is|it's|its|name:?|me llamo|mi nombre es|soy|yo soy|我叫|我是|我的名字是)\s*/i;
// A lookahead rather than a trailing \b: JavaScript's \b is ASCII-only, so
// it never matches after "nací".
const DOB_PHRASES = /(?:^|\s)(?:and\s+)?(?:my\s+|i\s+was\s+)?(?:date of birth|dob|birthday|born|birth date|fecha de nacimiento|nací|naci|nacido|nacida)(?=\s|$|[,.:])[\s:,]*(?:(?:is|on|el|was)(?=\s|$))?[\s:,]*/i;

/**
 * First name, last name and date of birth from "My name is Jane Q. Doe, born
 * 3/5/1980". The first word is the first name and the rest the last name
 * (middle names fold into the last name; the patient can move them).
 */
export function parseWho(text) {
  let s = String(text || '').replace(/\s+/g, ' ').trim();
  const date = findDate(s);
  let dob = '';
  if (date) {
    dob = date.iso;
    s = s.replace(date.raw, ' ');
  }
  s = s.replace(DOB_PHRASES, ' ').replace(NAME_LEADS, '').replace(NAME_PHRASES, '');
  s = s.replace(/[,.;:!()[\]"]+/g, ' ').replace(/\b(?:and|y)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  const words = s.split(' ').filter((w) => w && !/^\d+$/.test(w));
  const firstName = words[0] || '';
  const lastName = words.slice(1).join(' ');
  return { firstName, lastName, dob };
}

/** A phone number and an email address found in free text. */
export function parseContact(text) {
  const s = String(text || '');
  const email = (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.exec(s) || [''])[0];
  const withoutEmail = email ? s.replace(email, ' ') : s;
  const digitsRun = /(?:\+?\d[\d\s().-]{8,}\d)/.exec(withoutEmail);
  let phone = '';
  if (digitsRun) {
    const digits = digitsRun[0].replace(/\D/g, '');
    if (digits.length === 10) phone = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    else if (digits.length === 11 && digits.startsWith('1')) phone = `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    else if (digits.length >= 7) phone = digitsRun[0].trim();
  }
  return { phone, email };
}

const NO_INSURANCE = /^(?:no|none|nothing|no insurance|not insured|uninsured|self[- ]pay|cash|ninguno|ninguna|no tengo|sin seguro|没有|沒有|无|無)(?:\s|$|[,.!])/i;
const UNSURE_INSURANCE = /\b(?:not sure|unsure|don'?t know|no s[eé]|no estoy segur)|不确定|不知道/i;
const MEMBER_ID = /(?:member|subscriber|policy|id|#|n[uú]mero|会员号|编号)\s*(?:id|no\.?|number|#)?\s*[:#]?\s*([A-Za-z0-9-]{5,20})/i;

/**
 * The plan name and member ID from "Aetna, member ID W123456789" or "Horizon
 * BCBS". A plain "none" or "not sure" becomes the provider text so the card
 * and the office see what was said; the patient can correct it on the card.
 */
export function parseInsurance(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return { provider: '', memberId: '' };
  if (NO_INSURANCE.test(s)) return { provider: 'None (self-pay)', memberId: '' };
  if (UNSURE_INSURANCE.test(s) && s.length < 40) return { provider: 'Not sure', memberId: '' };
  let memberId = '';
  let rest = s;
  const m = MEMBER_ID.exec(s);
  if (m) {
    memberId = m[1];
    rest = s.replace(m[0], ' ');
  } else {
    // A bare token with digits, long enough not to be a word.
    const bare = /(?:^|\s)([A-Za-z]{0,4}\d[A-Za-z0-9-]{6,19})(?=\s|$|[,.;])/.exec(s);
    if (bare) {
      memberId = bare[1];
      rest = s.replace(bare[1], ' ');
    }
  }
  const provider = rest
    .replace(/^(?:i have|i'm on|i am on|it's|its|my insurance is|tengo|es|我有|我的保险是)\s+/i, '')
    .replace(/\s*\b(?:through|with|from|via|my|insurance|health plan|plan|a través de|con|de)\s*$/i, '')
    .replace(/[,.;:]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { provider, memberId };
}

/** True when the intake is an express request (finished or in progress). */
export function isExpress(intake) {
  return !!(intake && intake.express && typeof intake.express === 'object');
}

/** True when the express request was completed (the card was sent). */
export function isExpressLead(intake) {
  return isExpress(intake) && !!intake.express.completedAt;
}

/** Date in the surgeon's note style: 5 Mar 2026. */
function fmtDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
}

export const SAFETY_SUMMARY = {
  none: 'None of the listed symptoms reported (bladder or bowel control, saddle numbness, rapidly worsening weakness, fever with back pain).',
  yes: 'PATIENT REPORTS ONE OR MORE: new bladder or bowel control problems, saddle numbness, rapidly worsening weakness, or fever with back pain. Call today; the patient was told to call 911 or go to the emergency room if this is happening now.',
  unsure: 'Patient was not sure. Ask about bladder or bowel control, saddle numbness, rapidly worsening weakness and fever when calling.',
  '': 'Not answered.',
};

/**
 * The lead note for the office. Written without the model: a lead has no
 * history to summarise, and must never wait on one.
 */
export function expressLeadNarrative(intake, redFlags = []) {
  const d = intake.demographics || {};
  const x = intake.express || {};
  const lang = x.callLanguage || intake.language || 'en';
  const lines = [];
  lines.push('EXPRESS APPOINTMENT REQUEST (website chat)');
  lines.push('');
  lines.push(`Received: ${fmtDate((x.completedAt || intake.submittedAt || '').slice(0, 10))}`);
  lines.push(`Patient: ${[d.lastName, d.firstName].filter(Boolean).join(', ')}${d.dob ? `, DOB ${fmtDate(d.dob)}` : ''}`);
  lines.push(`Reach by: ${[d.phone && `phone ${d.phone}`, d.email && `email ${d.email}`].filter(Boolean).join('; ') || 'no contact given'}`);
  lines.push(`Language for the call: ${LANGUAGE_NAMES[lang] || lang}`);
  lines.push(`Insurance: ${[d.insuranceProvider, d.memberId && `member ID ${d.memberId}`].filter(Boolean).join(', ') || 'not given'}`);
  lines.push('');
  lines.push("IN THE PATIENT'S WORDS");
  lines.push((intake.chiefComplaint?.mainReason || x.answers?.problem || '').trim() || '(nothing written)');
  lines.push('');
  lines.push('SAFETY SCREEN');
  lines.push(SAFETY_SUMMARY[x.safety] || SAFETY_SUMMARY['']);
  const urgent = redFlags.filter((f) => f.severity === 'urgent');
  if (redFlags.length) {
    lines.push(`Patterns noticed in the text: ${redFlags.map((f) => f.label).join('; ')}.${urgent.length ? ' Treat as urgent.' : ''}`);
  }
  lines.push('');
  lines.push('ACTION');
  const link = x.linkEmailed ? ' The link to it was emailed to the patient.' : x.linkEmailError ? ` The link to it could not be emailed (${x.linkEmailError}); the patient saw it on screen.` : '';
  lines.push(`Call to schedule a new-patient visit${x.safety === 'yes' || urgent.length ? ' today' : ' within 24 to 48 hours (the patient was told to expect this)'}. ${x.continuedAt ? 'The patient went on to the pre-visit questionnaire.' : 'The patient was offered the pre-visit questionnaire to complete before the visit.'}${link}`);
  lines.push('');
  lines.push('This is a request from the short website chat, not a completed intake: no history, examination, imaging or questionnaire was obtained.');
  return lines.join('\n');
}
