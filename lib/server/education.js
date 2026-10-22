// ============================================================================
// Patient education after the intake: the right handouts, in the patient's
// language, on the thank-you screen and in a thank-you email.
//
// The handouts are the practice website's guides (lib/education/guides.json,
// built by scripts/build-guide-catalog.mjs). After a patient submits, the
// model reads a short summary of what they told us and picks up to three
// guides that clearly fit. It never guesses: no clear fit, no guide. The
// pick is stored with the submission (education.json) so the screen, the
// email and any retry all show the same guides, and the model runs once.
//
// Offered only in the languages the website has the guides in: English,
// Spanish, Portuguese, Korean and Mandarin.
// ============================================================================

import catalog from '../education/guides.json';
import { getService } from '../service';
import { complete } from './llm';
import { loadJson, saveJson } from './submissionStore';
import { emailConfigured, isEmail, sendEmail } from './email';
import { logError, logEvent } from './log';

export const EDUCATION_LANGS = ['en', 'es', 'pt', 'ko', 'zh'];
const MAX_GUIDES = 3;
const BY_ID = new Map(catalog.guides.map((g) => [g.id, g]));

const educationKey = (id) => `submissions/${id}/education.json`;

/** The guide language for an intake, or '' when the website has no guides in it. */
export function educationLang(intake) {
  const lang = String(intake?.language || 'en').toLowerCase();
  return EDUCATION_LANGS.includes(lang) ? lang : '';
}

export function guideUrl(lang, section, slug) {
  return `${catalog.site}${lang === 'en' ? '' : `/${lang}`}/${section}/${slug}/`;
}

/** The chosen guides, in one language, ready to show or to email. */
export function localizeGuides(ids, lang) {
  return (ids || [])
    .map((id) => BY_ID.get(id))
    .filter(Boolean)
    .map((g) => ({
      id: g.id,
      section: g.section,
      title: g.i18n[lang]?.title || g.i18n.en.title,
      description: g.i18n[lang]?.description || g.i18n.en.description,
      url: guideUrl(lang, g.section, g.slug),
    }));
}

const yearsOld = (dob) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dob || ''));
  if (!m) return null;
  const now = new Date();
  let y = now.getFullYear() - Number(m[1]);
  if (now.getMonth() + 1 < Number(m[2]) || (now.getMonth() + 1 === Number(m[2]) && now.getDate() < Number(m[3]))) y -= 1;
  return y >= 0 && y < 120 ? y : null;
};

/**
 * What the model sees: the clinical gist only. No name, no contact details,
 * no insurance; the patient's own words about the problem, the areas, the
 * kind of visit, any diagnosis or operation they named.
 */
export function educationCase(intake) {
  const svc = getService(intake?.service?.key);
  const d = intake?.demographics || {};
  const v = intake?.visit || {};
  const cc = intake?.chiefComplaint || {};
  const regionLabel = Object.fromEntries((svc.constants?.SYMPTOM_REGIONS || []).map((r) => [r.id, r.label]));
  const age = yearsOld(d.dob) ?? (Number(d.age) || null);
  const lines = [
    `Service: ${svc.label}${svc.patient === 'child' ? ' (the patient is a child)' : ''}`,
    age != null ? `Age: ${age}` : '',
    d.sex ? `Sex: ${d.sex}` : '',
    `Kind of visit: ${v.type || 'new'}${v.type === 'postop' ? ' (after an operation)' : ''}`,
    intake?.triage?.description ? `In their own words: "${String(intake.triage.description).slice(0, 600)}"` : '',
    cc.mainReason && cc.mainReason !== intake?.triage?.description ? `Main concern: "${String(cc.mainReason).slice(0, 600)}"` : '',
    (cc.symptomRegions || []).length ? `Areas: ${cc.symptomRegions.map((r) => regionLabel[r] || r).join(', ')}` : '',
  ];
  const problems = intake?.hpiData?.problems || {};
  for (const [area, p] of Object.entries(problems)) {
    const bits = [p?.kind, p?.onsetType, p?.progression, p?.severity != null && p?.severity !== '' ? `pain ${p.severity}/10` : '', (p?.quality || []).join(', ')].filter(Boolean);
    if (bits.length) lines.push(`Problem (${area}): ${bits.join('; ')}`);
  }
  // Older forms keep the answers per area under hpiData.symptoms.
  for (const [area, sx] of Object.entries(intake?.hpiData?.symptoms || {})) {
    const bits = [sx?.onset, sx?.severity != null && sx?.severity !== '' ? `pain ${sx.severity}/10` : '', (sx?.quality || []).join(', '),
      sx?.aggravating ? `worse with ${sx.aggravating}` : '', sx?.relieving ? `better with ${sx.relieving}` : '',
      sx?.radiates ? `travels${sx?.belowKnee ? ' below the knee' : ''}` : '', sx?.numbness ? `numbness: ${sx.numbness}` : '', sx?.weakness && sx.weakness !== 'no' ? `weakness: ${sx.weakness}` : ''].filter(Boolean);
    if (bits.length) lines.push(`Symptoms (${area}): ${bits.join('; ')}`);
  }
  const ps = intake?.pedsSpine?.history || {};
  if (ps.diagnosis) lines.push(`Diagnosis the family was given: ${ps.diagnosis}`);
  if ((ps.treatments || []).length) lines.push(`Spine treatment so far: ${ps.treatments.join(', ')}`);
  const po = intake?.pedsOrtho || {};
  if (po.track === 'fracture') lines.push('A recent injury or a broken bone (fracture clinic).');
  const parts = po.injury?.bodyPart || po.fxFollowUp?.bodyPart || [];
  if (parts.length) lines.push(`Injured part: ${parts.join(', ')}${po.injury?.side ? ` (${po.injury.side})` : ''}`);
  if ((po.injuryCare?.treatment || po.fxFollowUp?.treatment || []).length) lines.push(`Treatment: ${(po.injuryCare?.treatment || po.fxFollowUp?.treatment).join(', ')}`);
  const ops = (v.postop?.operations || []).map((o) => [o.procedure, o.levels?.length ? `at ${o.levels.join(', ')}` : '', o.month && o.year ? `${o.month}/${o.year}` : o.year].filter(Boolean).join(' '));
  if (ops.length) lines.push(`Operations: ${ops.join('; ')}`);
  const pmh = (intake?.pastMedicalHistory?.conditions || []).map((c) => c.name).filter(Boolean);
  if (pmh.length) lines.push(`Other conditions: ${pmh.slice(0, 12).join(', ')}`);
  return lines.filter(Boolean).join('\n').slice(0, 4000);
}

const SYSTEM = `You choose patient-education handouts for a surgical practice's patients, after they complete an intake form. You do not diagnose, and the patient never sees your reasoning.

From the CATALOGUE only, pick up to ${MAX_GUIDES} handouts that clearly fit what this patient told us. Rules:
- When a common pattern is clear, DO offer the matching condition handout; that is the point. Clear patterns include: back pain travelling down one leg (especially below the knee, or with numbness in the leg or foot): lumbar radiculopathy / sciatica; leg heaviness or pain on standing and walking eased by sitting or leaning forward: lumbar spinal stenosis; neck pain travelling down an arm with numbness or tingling: cervical radiculopathy; neck pain alone: neck pain; an older adult's knee or hip pain from wear and tear, worse on stairs or walking: osteoarthritis of that joint; a curve found at a school or pediatrician check: adolescent idiopathic scoliosis; a child's broken wrist in a cast: that fracture and cast care for children.
- Pick a less common condition only when the patient's own words or a diagnosis they were given name it.
- When a condition handout fits, you may add its home program or care plan from "for-patients" (e.g. home program for sciatica, walking plan for spinal stenosis).
- Never pick a handout about a serious or rare condition (tumour, infection, cancer, cauda equina, cord injury, fracture from cancer, arachnoiditis, syndromes) unless the patient said they were told they have it.
- For a visit after an operation, prefer the recovery handout for that operation (e.g. after lumbar fusion surgery).
- For a recent broken bone or cast, prefer the matching fracture or cast-care handout.
- A treatment handout only when the patient names that treatment as done or planned.
- "Your first visit" only for a new patient when no condition or treatment handout fits.
- Many bone-and-joint handouts are written for children (growth plates, casts, conditions of childhood). Offer one to an adult only when it clearly fits an adult.
- The catalogue has already been narrowed to the part of the body this patient told us about. If no condition handout there fits what they described, do not pick one; a care plan or "Your first visit" is better than a handout about the wrong thing.
- At most ${MAX_GUIDES}. If nothing fits at all, return an empty list.

Reply with ONLY a JSON object: {"guides":[{"id":"<id from the catalogue>","why":"<a few words>"}]}`;

/** The first complete JSON object in a reply, ignoring anything the model added after it. */
function firstJsonObject(text) {
  const src = String(text || '');
  const start = src.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  for (let i = start; i < src.length; i += 1) {
    const c = src[i];
    if (inString) {
      if (c === '\\') i += 1;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        try { return JSON.parse(src.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

// Which guide categories fit which part of the body. A patient is offered
// condition handouts only for the part of the body they told us about: the
// website has, for example, no adult knee arthritis handout, and without this
// the model would reach for the nearest spine guide instead.
const SPINE_CATEGORIES = ['Cervical Spine', 'Thoracic & Thoracolumbar Spine', 'Lumbar & Sacral Spine', 'General Spine Conditions', 'Spine & General', 'Scoliosis in children', 'Syndromic scoliosis', 'Connective Tissue & Related Conditions'];
const AREA_CATEGORIES = {
  shoulder: ['Shoulder & Humerus'], arm: ['Shoulder & Humerus'], elbow: ['Elbow'],
  forearm: ['Distal Radius & Forearm'], wrist: ['Distal Radius & Forearm', 'Wrist & Hand'], hand: ['Wrist & Hand'],
  hip: ['Hip, Femur & Pelvis', 'Common Conditions'], thigh: ['Hip, Femur & Pelvis'], pelvis: ['Hip, Femur & Pelvis'],
  knee: ['Knee', 'Common Conditions'], leg: ['Tibia & Fibula', 'Common Conditions'], ankle: ['Ankle & Foot', 'Tibia & Fibula'], foot: ['Ankle & Foot', 'Common Conditions'],
};
const ORTHO_CATEGORIES = [...new Set(Object.values(AREA_CATEGORIES).flat())];
const CHILDHOOD_CATEGORIES = ['Common Conditions', 'Scoliosis in children', 'Syndromic scoliosis'];
const SPINE_TREATMENTS = ['Spine Procedures & Operations'];
const ORTHO_TREATMENTS = ['Fracture Surgery & Cast Care'];

/** The body areas this intake is about, as AREA_CATEGORIES keys plus 'spine'. */
function areasOf(intake) {
  const out = new Set();
  const svc = getService(intake?.service?.key);
  for (const t of intake?.triage?.regions || []) {
    if (['neck', 'back', 'posture', 'si', 'tailbone'].includes(t)) out.add('spine');
    else if (AREA_CATEGORIES[t]) out.add(t);
  }
  for (const r of intake?.chiefComplaint?.symptomRegions || []) {
    const area = String(r).replace(/^(right|left|both)-/, '');
    if (svc.specialty === 'spine' || ['neck-back', 'si', 'tailbone'].includes(area)) out.add('spine');
    else if (AREA_CATEGORIES[area]) out.add(area);
  }
  const parts = [...(intake?.pedsOrtho?.injury?.bodyPart || []), ...(intake?.pedsOrtho?.fxFollowUp?.bodyPart || [])].join(' ').toLowerCase();
  for (const [word, area] of [['collarbone', 'shoulder'], ['shoulder', 'shoulder'], ['upper arm', 'arm'], ['elbow', 'elbow'], ['forearm', 'forearm'], ['wrist', 'wrist'], ['hand', 'hand'], ['finger', 'hand'], ['hip', 'hip'], ['thigh', 'thigh'], ['knee', 'knee'], ['lower leg', 'leg'], ['ankle', 'ankle'], ['foot', 'foot'], ['toe', 'foot']]) {
    if (parts.includes(word)) out.add(area);
  }
  if (svc.specialty === 'spine' && !out.size) out.add('spine');
  return out;
}

/** The catalogue entries this patient may be offered. */
function candidatesFor(intake) {
  const svc = getService(intake?.service?.key);
  const areas = areasOf(intake);
  const conditionCats = new Set();
  if (areas.has('spine')) SPINE_CATEGORIES.forEach((c) => conditionCats.add(c));
  for (const a of areas) (AREA_CATEGORIES[a] || []).forEach((c) => conditionCats.add(c));
  // An orthopaedic visit that named no part yet: any bone-and-joint guide may fit.
  if (!conditionCats.size) (svc.specialty === 'ortho' ? ORTHO_CATEGORIES : SPINE_CATEGORIES).forEach((c) => conditionCats.add(c));
  const treatmentCats = new Set([...(areas.has('spine') || svc.specialty === 'spine' ? SPINE_TREATMENTS : []), ...([...areas].some((a) => AREA_CATEGORIES[a]) || svc.specialty === 'ortho' ? ORTHO_TREATMENTS : [])]);
  // Conditions of childhood are never offered to an adult.
  if (svc.patient !== 'child') CHILDHOOD_CATEGORIES.forEach((c) => conditionCats.delete(c));
  return catalog.guides.filter((g) => (g.section === 'conditions' ? conditionCats.has(g.category) : g.section === 'treatments' ? treatmentCats.has(g.category) : true));
}

/** The model's pick for this intake: catalogue ids, at most three, maybe none. */
export async function chooseGuides(intake) {
  const candidates = candidatesFor(intake);
  const list = candidates.map((g) => `${g.id} | ${g.i18n.en.title} | ${g.category}`).join('\n');
  const allowed = new Set(candidates.map((g) => g.id));
  const r = await complete({
    purpose: 'chat',
    system: SYSTEM,
    messages: [{ role: 'user', content: `CATALOGUE (id | title | category):\n${list}\n\nPATIENT:\n${educationCase(intake)}` }],
    maxTokens: 300,
    temperature: 0,
  });
  const parsed = firstJsonObject(r.text) || {};
  const ids = [...new Set((parsed.guides || []).map((g) => String(g?.id || '').trim()).filter((id) => allowed.has(id)))];
  return ids.slice(0, MAX_GUIDES);
}

/**
 * The education for a stored submission: chosen once, then read back.
 * Returns { lang, ids, guides } with guides in the intake's language;
 * `lang` is '' (and nothing is chosen) outside the five languages.
 */
export async function educationFor(id, intake) {
  const lang = educationLang(intake);
  if (!lang || intake?.express) return { lang: '', ids: [], guides: [] };
  let saved = await loadJson(educationKey(id)).catch(() => null);
  if (!saved) {
    let ids = [];
    try {
      ids = await chooseGuides(intake);
    } catch (err) {
      logError('education.choose_failed', err, { submissionId: id });
      return { lang, ids: [], guides: [] };
    }
    saved = { ids, chosenAt: new Date().toISOString(), catalogAt: catalog.generatedAt };
    await saveJson(educationKey(id), saved).catch((err) => logError('education.save_failed', err, { submissionId: id }));
    logEvent('education.chosen', { submissionId: id, count: ids.length, lang });
  }
  return { lang, ids: saved.ids || [], guides: localizeGuides(saved.ids, lang), emailedAt: saved.emailedAt || null };
}

/** Whether a thank-you email will go to this patient (the screen says so). */
export function willEmail(intake) {
  return emailConfigured() && !!educationLang(intake) && !intake?.express && isEmail(intake?.demographics?.email);
}

// ---------------------------------------------------------------------------
// The thank-you email
// ---------------------------------------------------------------------------

const EMAIL_TEXT = {
  en: {
    subject: 'Thank you for completing your intake form',
    subjectChild: "Thank you for completing your child's intake form",
    hello: 'Hello,',
    thanks: 'Thank you from our team for taking the time to complete your intake form. Everything you shared has reached us, and it will help us make the most of your visit.',
    thanksChild: "Thank you from our team for taking the time to complete your child's intake form. Everything you shared has reached us, and it will help us make the most of the visit.",
    education: 'Here is some patient education for your review. We hope you find it helpful.',
    read: 'Read the guide',
    general: 'These guides are general education and do not replace the advice we give you in person.',
    questions: 'If you have questions before your visit, please call the office at {phone}. If you have an emergency, call 911.',
    noreply: 'This mailbox is not monitored, so please do not reply to this email.',
    signoff: 'With thanks,',
    team: 'Your care team',
  },
  es: {
    subject: 'Gracias por completar su formulario de admisión',
    subjectChild: 'Gracias por completar el formulario de admisión de su hijo o hija',
    hello: 'Hola:',
    thanks: 'Gracias de parte de nuestro equipo por tomarse el tiempo de completar su formulario de admisión. Recibimos todo lo que compartió, y nos ayudará a aprovechar al máximo su visita.',
    thanksChild: 'Gracias de parte de nuestro equipo por tomarse el tiempo de completar el formulario de admisión de su hijo o hija. Recibimos todo lo que compartió, y nos ayudará a aprovechar al máximo la visita.',
    education: 'Le compartimos material educativo para que lo revise. Esperamos que le resulte útil.',
    read: 'Leer la guía',
    general: 'Estas guías son educación general y no reemplazan los consejos que le damos en persona.',
    questions: 'Si tiene preguntas antes de su visita, llame a la oficina al {phone}. Si tiene una emergencia, llame al 911.',
    noreply: 'Este buzón no se revisa; por favor, no responda a este correo.',
    signoff: 'Con agradecimiento,',
    team: 'Su equipo de atención',
  },
  pt: {
    subject: 'Obrigado por preencher seu formulário de admissão',
    subjectChild: 'Obrigado por preencher o formulário de admissão do seu filho ou filha',
    hello: 'Olá,',
    thanks: 'Agradecemos, em nome de toda a equipe, por dedicar seu tempo a preencher o formulário de admissão. Recebemos tudo o que você compartilhou, e isso nos ajudará a aproveitar ao máximo a sua consulta.',
    thanksChild: 'Agradecemos, em nome de toda a equipe, por dedicar seu tempo a preencher o formulário de admissão do seu filho ou filha. Recebemos tudo o que você compartilhou, e isso nos ajudará a aproveitar ao máximo a consulta.',
    education: 'Seguem alguns materiais educativos para a sua leitura. Esperamos que sejam úteis.',
    read: 'Ler o guia',
    general: 'Estes guias são educação geral e não substituem as orientações que damos pessoalmente.',
    questions: 'Se tiver dúvidas antes da consulta, ligue para o consultório no {phone}. Em caso de emergência, ligue para o 911.',
    noreply: 'Esta caixa de correio não é monitorada; por favor, não responda a este e-mail.',
    signoff: 'Com gratidão,',
    team: 'Sua equipe de cuidados',
  },
  ko: {
    subject: '접수 양식을 작성해 주셔서 감사합니다',
    subjectChild: '자녀의 접수 양식을 작성해 주셔서 감사합니다',
    hello: '안녕하세요,',
    thanks: '시간을 내어 접수 양식을 작성해 주셔서 저희 팀 모두 감사드립니다. 보내 주신 내용은 모두 잘 받았으며, 진료를 준비하는 데 큰 도움이 될 것입니다.',
    thanksChild: '시간을 내어 자녀의 접수 양식을 작성해 주셔서 저희 팀 모두 감사드립니다. 보내 주신 내용은 모두 잘 받았으며, 진료를 준비하는 데 큰 도움이 될 것입니다.',
    education: '참고하실 수 있도록 환자 교육 자료를 보내 드립니다. 도움이 되시기를 바랍니다.',
    read: '안내서 읽기',
    general: '이 안내서는 일반적인 교육 자료이며, 진료실에서 직접 드리는 조언을 대신하지 않습니다.',
    questions: '진료 전에 궁금한 점이 있으시면 {phone}으로 병원에 전화해 주십시오. 응급 상황에는 911에 전화하십시오.',
    noreply: '이 메일함은 확인하지 않으므로 이 이메일에 회신하지 마십시오.',
    signoff: '감사합니다.',
    team: '진료팀 드림',
  },
  zh: {
    subject: '感谢您填写就诊登记表',
    subjectChild: '感谢您为孩子填写就诊登记表',
    hello: '您好：',
    thanks: '感谢您抽出时间填写就诊登记表，我们全体团队向您致谢。您提供的所有信息我们都已收到，这将帮助我们充分准备您的就诊。',
    thanksChild: '感谢您抽出时间为孩子填写就诊登记表，我们全体团队向您致谢。您提供的所有信息我们都已收到，这将帮助我们充分准备这次就诊。',
    education: '以下是供您参考的患者教育资料，希望对您有所帮助。',
    read: '阅读指南',
    general: '这些指南属于一般性健康教育，不能代替我们当面给您的建议。',
    questions: '如果您在就诊前有任何问题，请致电诊所：{phone}。如遇紧急情况，请拨打 911。',
    noreply: '此邮箱无人查看，请勿回复本邮件。',
    signoff: '谨此致谢，',
    team: '您的医护团队',
  },
};

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Subject, plain text and HTML for the thank-you email, in one of the five languages. */
export function buildEducationEmail({ lang, guides, child = false, phone = process.env.OFFICE_PHONE || '(201) 836-1663' }) {
  const T = EMAIL_TEXT[lang] || EMAIL_TEXT.en;
  const thanks = child ? T.thanksChild : T.thanks;
  const questions = T.questions.replace('{phone}', phone);
  const subject = child ? T.subjectChild : T.subject;
  const text = [
    T.hello,
    '',
    thanks,
    ...(guides.length ? ['', T.education, '', ...guides.flatMap((g) => [`- ${g.title}`, `  ${g.url}`, ''])] : ['']),
    guides.length ? T.general : '',
    questions,
    '',
    T.signoff,
    T.team,
    '',
    T.noreply,
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
  const cards = guides.map((g) => `
        <tr><td style="padding:0 0 14px 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d6e4e3;border-radius:12px;">
            <tr><td style="padding:16px 18px;">
              <div style="font-size:17px;font-weight:600;color:#123559;margin:0 0 6px 0;">${esc(g.title)}</div>
              <div style="font-size:14px;line-height:1.5;color:#4a5560;margin:0 0 12px 0;">${esc(g.description)}</div>
              <a href="${esc(g.url)}" style="display:inline-block;background:#0E8482;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:9px 16px;border-radius:999px;">${esc(T.read)}</a>
            </td></tr>
          </table>
        </td></tr>`).join('');
  const html = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f3ee;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ee;"><tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans','Noto Sans KR','Noto Sans SC',Arial,sans-serif;">
      <tr><td style="padding:28px 28px 8px 28px;">
        <p style="font-size:16px;color:#123559;margin:0 0 14px 0;">${esc(T.hello)}</p>
        <p style="font-size:16px;line-height:1.6;color:#2b3640;margin:0 0 18px 0;">${esc(thanks)}</p>
        ${guides.length ? `<p style="font-size:16px;line-height:1.6;color:#2b3640;margin:0 0 16px 0;">${esc(T.education)}</p>` : ''}
      </td></tr>
      ${guides.length ? `<tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${cards}
      </table></td></tr>` : ''}
      <tr><td style="padding:8px 28px 28px 28px;">
        ${guides.length ? `<p style="font-size:13px;line-height:1.5;color:#6b7680;margin:0 0 12px 0;">${esc(T.general)}</p>` : ''}
        <p style="font-size:14px;line-height:1.6;color:#2b3640;margin:0 0 18px 0;">${esc(questions)}</p>
        <p style="font-size:15px;color:#123559;margin:0;">${esc(T.signoff)}<br>${esc(T.team)}</p>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#8a949c;margin:14px 0 0 0;font-family:Arial,sans-serif;">${esc(T.noreply)}</p>
  </td></tr></table>
</body></html>`;
  return { subject, text, html };
}

/**
 * Send the thank-you email once per submission (the worker calls this after
 * the hand-off). Returns what happened; never throws, so a mail problem can
 * not hold up the note or the office's copy.
 */
export async function sendEducationEmail(id, intake) {
  if (!willEmail(intake)) return { sent: false, reason: 'not-applicable' };
  try {
    const edu = await educationFor(id, intake);
    if (edu.emailedAt) return { sent: false, reason: 'already-sent' };
    const child = getService(intake?.service?.key).patient === 'child';
    const msg = buildEducationEmail({ lang: edu.lang, guides: edu.guides, child });
    const { messageId } = await sendEmail({ to: String(intake.demographics.email).trim(), ...msg });
    const saved = (await loadJson(educationKey(id)).catch(() => null)) || { ids: edu.ids };
    await saveJson(educationKey(id), { ...saved, emailedAt: new Date().toISOString(), messageId });
    logEvent('education.emailed', { submissionId: id, lang: edu.lang, guides: edu.guides.length });
    return { sent: true };
  } catch (err) {
    logError('education.email_failed', err, { submissionId: id });
    return { sent: false, reason: 'error' };
  }
}
