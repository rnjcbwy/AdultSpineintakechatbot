'use client';

import { useIntake } from '../../lib/store';
import { lockedSpecialty, pedsSiteFor, otherAdultSite } from '../../lib/siteLock';
import { useState } from 'react';
import { IS_PRODUCTION_TIER } from '../../lib/deploymentTier';

import { LANGUAGES, translateDeep, useLang } from '../../lib/i18n';

const T = {
  en: {
    title: 'Before Your Visit',
    subtitle: 'A calm, step-by-step way to put your whole history in one place: your symptoms, what you have tried, and what matters to you. For adults and children, and for the spine, bones and joints.',
    banner:
      '⚠️ PROTOTYPE / DEMONSTRATION ONLY — Please do not enter real patient information. Use fictional names and details for testing purposes.',
    description:
      'A follow-up takes about 10 minutes; a first visit about 20. You can stop and finish later. It covers:',
    steps: [
      'A few taps so the form knows who you are and what this visit is about',
      'Your story, in your own words, with questions that fit it',
      'What you have tried, and any records you can add',
      'Your health history, or a quick check if we already have it',
      'A short questionnaire and a review before you send',
    ],
    fxTitle: "Your Child's Injury",
    fxSubtitle: 'A short form for a broken bone or a recent injury, so the visit can focus on getting your child better.',
    fxDescription: 'This takes about 5 minutes. It asks:',
    fxSteps: [
      'A little about your child and how to reach you',
      'What happened, and what has been done so far',
      'Four quick health questions',
      'Your signature, and you are done',
    ],
    spineTitle: 'Your Spine Story',
    spineSubtitle: 'A calm, step-by-step way to put your whole history in one place: your symptoms, what you have tried, and what matters to you.',
    orthoTitle: 'Your Orthopaedic Visit',
    orthoSubtitle: 'Start your experience with your orthopaedic team here. Tell us about your condition, what you have tried, and what matters to you, so your visit is ready for you before you arrive.',
    under18Prefix: 'Younger and teenage patients can use the ',
    under18Link: 'pediatric version, which asks more age-appropriate questions',
    spinePrefix: 'Neck or back problem? Use the ',
    spineLink: 'spine intake, which asks the right questions for the spine',
    orthoPrefix: 'A bone or joint problem? Use the ',
    orthoLink: 'orthopaedic intake, which asks the right questions for bones and joints',
    simpleTitle: 'Your Spine Story',
    simpleSubtitle: 'A short form about what is bothering you. Big buttons, a few questions, about 5 minutes.',
    simpleDescription: 'It asks:',
    simpleSteps: [
      'Your name, date of birth and phone number',
      'What is bothering you, in your own words',
      'A few yes or no questions',
      'Your medicines and allergies',
      'Your signature, and you are done',
    ],
    fullPrefix: 'Prefer to give more detail? ',
    fullLink: 'Use the detailed form',
    simpleLink: 'Use the short form instead',
    begin: 'Begin Intake',
    continue: 'Continue Where You Left Off',
    startNew: 'Start New Form',
    resetConfirm: 'This will start a new form and clear your previous answers. Continue?',
    kioskStart: 'Start a new intake form',
    kioskCode: 'Enter clinic code',
    kioskOpen: 'Open the form',
    kioskBad: 'That code did not work. Please ask the front desk.',
    hipaa: '🚧 This is a prototype — not HIPAA compliant',
    bannerProd: 'Your answers are sent securely to the care team and reviewed before your visit.',
  },
  es: {
    title: 'Antes de su visita',
    subtitle: 'Una forma tranquila, paso a paso, de reunir toda su historia en un solo lugar: sus síntomas, lo que ha probado y lo que le importa. Para adultos y niños, y para la columna, los huesos y las articulaciones.',
    banner:
      '⚠️ SOLO PROTOTIPO / DEMOSTRACIÓN — Por favor, no ingrese información real de pacientes. Use nombres y datos ficticios con fines de prueba.',
    description:
      'Una visita de seguimiento toma unos 10 minutos; una primera visita unos 20. Puede detenerse y terminar más tarde. Incluye:',
    steps: [
      'Unos toques para que el formulario sepa quién es usted y de qué trata esta visita',
      'Su historia, con sus propias palabras, con preguntas que se ajustan a ella',
      'Lo que ha probado y los registros que pueda agregar',
      'Su historial de salud, o una revisión rápida si ya lo tenemos',
      'Un cuestionario breve y una revisión antes de enviar',
    ],
    fxTitle: 'La lesión de su hijo o hija',
    fxSubtitle: 'Un formulario corto para un hueso roto o una lesión reciente, para que la visita se centre en que su hijo o hija se recupere.',
    fxDescription: 'Toma unos 5 minutos. Pregunta:',
    fxSteps: [
      'Un poco sobre su hijo o hija y cómo comunicarnos con usted',
      'Qué pasó y qué se ha hecho hasta ahora',
      'Cuatro preguntas rápidas de salud',
      'Su firma, y listo',
    ],
    spineTitle: 'La historia de su columna',
    spineSubtitle: 'Una forma tranquila, paso a paso, de reunir toda su historia en un solo lugar: sus síntomas, lo que ha probado y lo que le importa.',
    orthoTitle: 'Su visita de ortopedia',
    orthoSubtitle: 'Comience aquí su experiencia con su equipo de ortopedia. Cuéntenos sobre su afección, lo que ha probado y lo que le importa, para que su visita esté preparada antes de que llegue.',
    under18Prefix: 'Los pacientes más jóvenes y adolescentes pueden usar la ',
    under18Link: 'versión pediátrica, con preguntas más adecuadas a su edad',
    spinePrefix: '¿Problema de cuello o espalda? Use el ',
    spineLink: 'formulario de columna, que hace las preguntas adecuadas para la columna',
    orthoPrefix: '¿Un problema de huesos o articulaciones? Use el ',
    orthoLink: 'formulario de ortopedia, que hace las preguntas adecuadas para huesos y articulaciones',
    simpleTitle: 'La historia de su columna',
    simpleSubtitle: 'Un formulario corto sobre lo que le molesta. Botones grandes, unas pocas preguntas, unos 5 minutos.',
    simpleDescription: 'Pregunta:',
    simpleSteps: [
      'Su nombre, fecha de nacimiento y teléfono',
      'Qué le molesta, con sus propias palabras',
      'Unas preguntas de sí o no',
      'Sus medicamentos y alergias',
      'Su firma, y listo',
    ],
    fullPrefix: '¿Prefiere dar más detalles? ',
    fullLink: 'Use el formulario detallado',
    simpleLink: 'Use el formulario corto',
    begin: 'Comenzar Admisión',
    continue: 'Continuar Donde lo Dejó',
    startNew: 'Comenzar Nuevo Formulario',
    resetConfirm: 'Esto iniciará un formulario nuevo y borrará sus respuestas anteriores. ¿Continuar?',
    kioskStart: 'Comenzar un formulario nuevo',
    kioskCode: 'Ingresar el código de la clínica',
    kioskOpen: 'Abrir el formulario',
    kioskBad: 'Ese código no funcionó. Pregunte en la recepción.',
    hipaa: '🚧 Esto es un prototipo — no cumple con HIPAA',
    bannerProd: 'Sus respuestas se envían de forma segura al equipo de atención y se revisan antes de su cita.',
  },
  zh: {
    title: '就诊之前',
    subtitle: '以平静、循序渐进的方式，把您的全部病史放在一处：您的症状、尝试过的治疗，以及对您重要的事。适用于成人和儿童，涵盖脊柱、骨骼和关节。',
    banner:
      '⚠️ 仅供原型/演示 — 请勿输入真实患者信息。请使用虚构的姓名和信息进行测试。',
    description:
      '复诊约需 10 分钟，初诊约需 20 分钟。您可以随时暂停，稍后完成。内容包括：',
    steps: [
      '几次点选，让表格了解您是谁以及本次就诊的目的',
      '用您自己的话讲述情况，并回答与之相关的问题',
      '您尝试过的治疗，以及可以添加的病历资料',
      '您的健康史；如果我们已有记录，则只需快速核对',
      '一份简短的问卷，发送前再查看一遍',
    ],
    fxTitle: '孩子的受伤情况',
    fxSubtitle: '针对骨折或近期受伤的简短表格，让就诊专注于帮助孩子康复。',
    fxDescription: '大约需要 5 分钟，包括：',
    fxSteps: [
      '孩子的基本信息和您的联系方式',
      '发生了什么，以及目前已做过的处理',
      '四个简短的健康问题',
      '签名，然后就完成了',
    ],
    spineTitle: '您的脊柱故事',
    spineSubtitle: '以平静、循序渐进的方式，把您的全部病史放在一处：您的症状、尝试过的治疗，以及对您重要的事。',
    orthoTitle: '您的骨科就诊',
    orthoSubtitle: '从这里开始您与骨科团队的就诊体验。请告诉我们您的病情、尝试过的治疗，以及对您重要的事，让我们在您到达前为您做好准备。',
    under18Prefix: '儿童和青少年患者可以使用',
    under18Link: '儿科版本，其中的问题更适合他们的年龄',
    spinePrefix: '颈部或背部问题？请使用',
    spineLink: '脊柱问诊表，它会针对脊柱提出合适的问题',
    orthoPrefix: '骨骼或关节问题？请使用',
    orthoLink: '骨科问诊表，它会针对骨骼和关节提出合适的问题',
    simpleTitle: '您的脊柱故事',
    simpleSubtitle: '一份关于您不适的简短表格。大按钮，几个问题，大约 5 分钟。',
    simpleDescription: '内容包括：',
    simpleSteps: [
      '您的姓名、出生日期和电话',
      '用您自己的话说明哪里不舒服',
      '几个是或否的问题',
      '您的药物和过敏情况',
      '签名，然后就完成了',
    ],
    fullPrefix: '想提供更多细节？',
    fullLink: '使用详细表格',
    simpleLink: '改用简短表格',
    begin: '开始登记',
    continue: '从上次中断处继续',
    startNew: '开始新表格',
    resetConfirm: '这将开始一个新表格并清除您之前的答案。是否继续？',
    kioskStart: '开始新的登记表',
    kioskCode: '输入诊所代码',
    kioskOpen: '打开表格',
    kioskBad: '该代码无效，请咨询前台。',
    hipaa: '🚧 这是一个原型 — 不符合 HIPAA 标准',
    bannerProd: '您的回答将安全地发送给医疗团队，并在您就诊前审阅。',
  },
};

/** The only mark on the page: the animated spine, as on the original intake. No name, no logo. */
function SpineLogo() {
  const vertebrae = [10, 25, 40, 55, 70, 85, 100];
  return (
    <svg viewBox="0 0 100 120" className="spine-logo mx-auto" aria-hidden="true">
      <defs>
        <linearGradient id="spineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#155842" />
          <stop offset="100%" stopColor="#0E3F31" />
        </linearGradient>
      </defs>
      {vertebrae.map((y, i) => (
        <rect
          key={y}
          x="30"
          y={y}
          width="40"
          height="12"
          rx="6"
          fill="url(#spineGrad)"
          className="vertebra"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </svg>
  );
}

/** The orthopaedic site's mark: a knee, as on the original orthopaedic intake. */
function KneeLogo() {
  return (
    <svg viewBox="0 0 100 120" className="spine-logo mx-auto" aria-hidden="true">
      <defs>
        <linearGradient id="kneeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#155842" />
          <stop offset="100%" stopColor="#0E3F31" />
        </linearGradient>
      </defs>
      {/* femur: shaft widening into the two condyles */}
      <path
        d="M42 2 Q42 0 50 0 Q58 0 58 2 L58 32 Q60 42 70 46 Q76 50 74 58 Q72 64 64 64 L58 64 Q54 60 50 60 Q46 60 42 64 L36 64 Q28 64 26 58 Q24 50 30 46 Q40 42 42 32 Z"
        fill="url(#kneeGrad)" className="vertebra" style={{ animationDelay: '0s' }}
      />
      {/* tibia: plateau, then the shaft */}
      <path
        d="M28 72 Q28 69 32 69 L68 69 Q72 69 72 72 Q72 78 64 82 L60 84 L60 116 Q60 120 51 120 Q42 120 42 116 L42 84 L36 82 Q28 78 28 72 Z"
        fill="url(#kneeGrad)" className="vertebra" style={{ animationDelay: '0.15s' }}
      />
      {/* fibula */}
      <rect x="68" y="80" width="7" height="40" rx="3.5" fill="url(#kneeGrad)" className="vertebra" style={{ animationDelay: '0.25s' }} />
      {/* patella, in front of the joint */}
      <path d="M50 48 Q60 48 60 58 Q60 70 50 72 Q40 70 40 58 Q40 48 50 48 Z" fill="#6DCDB8" className="vertebra" style={{ animationDelay: '0.3s' }} />
    </svg>
  );
}

export default function Welcome({ onNext }) {
  const { data, resetIntake, setLanguage, setNested, kiosk } = useIntake();
  // The short form or the detailed one (lib/simple.js); the choice survives a reset.
  const setMode = (mode) => { setNested('mode', mode); if (mode === 'simple') { setNested('service', { patient: 'adult', specialty: 'spine', key: 'adult_spine', how: 'site' }); setNested('triage.who', 'Myself'); } };
  const hasExisting = data.lastUpdated && data.demographics?.firstName;
  // The clinic tablet: a code the office read out opens a form sent from the chart.
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  const [codeState, setCodeState] = useState('');
  const openCode = async () => {
    if (!/^\d{6}$/.test(code)) return setCodeState('bad');
    setCodeState('busy');
    try {
      const r = await fetch(`/api/invite?code=${code}`).then((x) => x.json());
      if (r?.status === 'ok' && r.token) {
        // The reset wipes the chosen language with everything else; carry it
        // across the reload on the address (the store applies ?lang= on load).
        const lang = data.language && data.language !== 'en' ? `&lang=${encodeURIComponent(data.language)}` : '';
        resetIntake();
        window.location.href = `${window.location.pathname}?invite=${encodeURIComponent(r.token)}${lang}`;
        return;
      }
      setCodeState('bad');
    } catch {
      setCodeState('bad');
    }
  };
  const lang = useLang();
  // Spanish and Chinese are written out below; the other languages come from
  // the loaded table, string by string, falling back to English.
  const t = T[lang] || translateDeep(T.en, lang);
  // The short fracture form (lib/fracture.js) has its own welcome.
  const fracture = data.mode === 'fracture';
  const simple = data.mode === 'simple';
  // A one-service site (lib/siteLock.js) has its own title, mark and links.
  const lockSpec = lockedSpecialty();
  const canSwitch = lockSpec === 'spine' && !fracture;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-[560px] w-full mx-auto text-center animate-fade-in">
        {/* No name, no ownership: the page is the form. One plain mark for every patient. */}
        <div className="mb-7">
          {lockSpec === 'ortho' ? <KneeLogo /> : <SpineLogo />}
        </div>

        <h1 className="font-serif text-[2rem] md:text-[2.6rem] leading-tight font-semibold text-navy-600 mb-3">
          {fracture ? t.fxTitle : simple ? t.simpleTitle : lockSpec === 'spine' ? t.spineTitle : lockSpec === 'ortho' ? t.orthoTitle : t.title}
        </h1>
        <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-md mx-auto mb-7">
          {fracture ? t.fxSubtitle : simple ? t.simpleSubtitle : lockSpec === 'spine' ? t.spineSubtitle : lockSpec === 'ortho' ? t.orthoSubtitle : t.subtitle}
        </p>

        {/* Language selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6" role="group" aria-label="Select language">
          {LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                aria-pressed={active}
                className={
                  'px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all duration-150 ' +
                  (active
                    ? 'bg-navy-600 text-white border-navy-600'
                    : 'bg-white text-gray-600 border-navy-100 hover:border-teal-300 hover:text-navy-600')
                }
              >
                {l.label}
              </button>
            );
          })}
        </div>

        {/* Prototype warning, or the privacy notice on the real deployment */}
        {IS_PRODUCTION_TIER ? null : (
          <div className="bg-amber-100 border-2 border-amber-500 rounded-xl px-4 py-3 mb-3 text-sm font-semibold text-amber-800 leading-snug">
            {t.banner}
          </div>
        )}

        {/* No redirects: the next step works out who the form is for and what it is about. */}
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-gray-400 mb-3 mt-6">
          {fracture ? t.fxDescription : simple ? t.simpleDescription : t.description}
        </p>

        <ul className="bg-white rounded-2xl border border-navy-100 p-2 mb-8 text-left">
          {(fracture ? t.fxSteps : simple ? t.simpleSteps : t.steps).map((label, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3 text-gray-700 rounded-xl">
              <span className="flex items-center justify-center w-7 h-7 flex-shrink-0 bg-navy-50 text-navy-600 rounded-full text-xs font-semibold tabular-nums">
                {i + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        {canSwitch && (
          <p className="text-sm text-gray-600 mb-4">
            <button
              type="button"
              className="font-semibold text-teal-500 underline hover:text-teal-600"
              onClick={() => { setMode(simple ? 'full' : 'simple'); }}
            >
              {simple ? t.fullLink : t.simpleLink}
            </button>
          </p>
        )}
        {lockSpec && !fracture && (
          <div className="text-sm text-gray-600 mb-6 space-y-2">
            <p>
              {lockSpec === 'ortho' ? t.spinePrefix : t.orthoPrefix}
              <a href={otherAdultSite(lockSpec)} className="font-semibold text-teal-500 underline hover:text-teal-600">{lockSpec === 'ortho' ? t.spineLink : t.orthoLink}</a>.
            </p>
            <p>
              {t.under18Prefix}
              <a href={pedsSiteFor(lockSpec)} className="font-semibold text-teal-500 underline hover:text-teal-600">{t.under18Link}</a>.
            </p>
          </div>
        )}

        {kiosk && (
          <div className="space-y-3 mb-3">
            <button
              onClick={() => {
                // A new form, but in the language the patient just picked:
                // the reset would otherwise put the next page back in English.
                const lang = data.language;
                resetIntake();
                if (lang && lang !== 'en') setLanguage(lang);
                setTimeout(onNext, 100);
              }}
              className="btn-primary text-lg px-10 py-4 w-full max-w-xs mx-auto block"
            >
              {t.kioskStart || 'Start a new intake form'}
            </button>
            {!codeOpen ? (
              <button onClick={() => setCodeOpen(true)} className="btn-secondary text-base px-8 py-3 w-full max-w-xs mx-auto block">
                {t.kioskCode || 'Enter clinic code'}
              </button>
            ) : (
              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeState(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && openCode()}
                  placeholder="000000"
                  autoFocus
                  className="text-center text-2xl tracking-[0.4em] font-mono"
                />
                <button onClick={openCode} disabled={codeState === 'busy'} className="btn-secondary text-base px-8 py-3 w-full mt-2 disabled:opacity-50">
                  {codeState === 'busy' ? '…' : t.kioskOpen || 'Open the form'}
                </button>
                {codeState === 'bad' && <p className="text-sm text-red-600 mt-2">{t.kioskBad || 'That code did not work. Please ask the front desk.'}</p>}
              </div>
            )}
          </div>
        )}
        <div className="space-y-3">
          {!kiosk && hasExisting && (
            <button onClick={onNext} className="btn-primary text-lg px-10 py-4 w-full max-w-xs mx-auto block">
              {t.continue}
            </button>
          )}
          {!kiosk && (
          <button
            onClick={() => {
              if (hasExisting) {
                if (confirm(t.resetConfirm)) {
                  resetIntake();
                  setTimeout(onNext, 100);
                }
              } else {
                onNext();
              }
            }}
            className={hasExisting
              ? 'btn-secondary text-base px-8 py-3 w-full max-w-xs mx-auto block'
              : 'btn-primary inline-flex items-center justify-center gap-3 text-lg px-10 py-4 mx-auto'
            }
          >
            {hasExisting ? t.startNew : (
              <>
                {t.begin}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          )}
        </div>

        {!IS_PRODUCTION_TIER && (
          <p className="mt-8 text-sm font-medium text-amber-600">{t.hipaa}</p>
        )}
      </div>
    </div>
  );
}
