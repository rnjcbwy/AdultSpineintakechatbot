'use client';

import { useIntake } from '../../lib/store';
import { useState } from 'react';
import { IS_PRODUCTION_TIER } from '../../lib/deploymentTier';

import { LANGUAGES, translateDeep, useLang } from '../../lib/i18n';

const T = {
  en: {
    title: 'Your Spine Story',
    subtitle: 'A calm, step-by-step way to put your whole history in one place: your symptoms, what you have tried, and what matters to you.',
    banner:
      '⚠️ PROTOTYPE / DEMONSTRATION ONLY — Please do not enter real patient information. Use fictional names and details for testing purposes.',
    under18Prefix: 'Younger and teenage patients can use the ',
    under18Link: 'pediatric version, which asks more age-appropriate questions',
    description:
      'This takes about 10–15 minutes and covers:',
    steps: [
      'Basic demographic information',
      'A guided conversation about your symptoms',
      'Structured medical history forms',
      'Quality of life questionnaires',
      'Review and submission',
    ],
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
    title: 'La historia de su columna',
    subtitle: 'Una forma tranquila, paso a paso, de reunir toda su historia en un solo lugar: sus síntomas, lo que ha probado y lo que le importa.',
    banner:
      '⚠️ SOLO PROTOTIPO / DEMOSTRACIÓN — Por favor, no ingrese información real de pacientes. Use nombres y datos ficticios con fines de prueba.',
    under18Prefix: 'Los pacientes más jóvenes y adolescentes pueden usar la ',
    under18Link: 'versión pediátrica, con preguntas más adecuadas a su edad',
    description:
      'Toma entre 15 y 25 minutos y abarca:',
    steps: [
      'Información demográfica básica',
      'Una conversación guiada sobre sus síntomas',
      'Formularios estructurados de historia médica',
      'Cuestionarios de calidad de vida',
      'Revisión y envío',
    ],
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
    title: '您的脊柱故事',
    subtitle: '以平静、循序渐进的方式，把您的全部病史放在一处：您的症状、尝试过的治疗，以及对您重要的事。',
    banner:
      '⚠️ 仅供原型/演示 — 请勿输入真实患者信息。请使用虚构的姓名和信息进行测试。',
    under18Prefix: '儿童和青少年患者可以使用',
    under18Link: '儿科版本，其中的问题更适合他们的年龄',
    description:
      '大约需要 10–15 分钟，包括：',
    steps: [
      '基本人口统计信息',
      '关于症状的引导式对话',
      '结构化病史表格',
      '生活质量问卷',
      '查看并提交',
    ],
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

export default function Welcome({ onNext }) {
  const { data, resetIntake, setLanguage, kiosk } = useIntake();
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
        resetIntake();
        window.location.href = `${window.location.pathname}?invite=${encodeURIComponent(r.token)}`;
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

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-[560px] w-full mx-auto text-center animate-fade-in">
        {/* No name, no ownership: the page is the form. The spine is the only mark. */}
        <div className="mb-7">
          <SpineLogo />
        </div>

        <h1 className="font-serif text-[2rem] md:text-[2.6rem] leading-tight font-semibold text-navy-600 mb-3">
          {t.title}
        </h1>
        <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-md mx-auto mb-7">
          {t.subtitle}
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

        {/* Under-18 redirect */}
        <p className="text-sm text-gray-600 mb-6">
          {t.under18Prefix}
          <a
            href="https://pedsspine.aaronweymd.com/"
            className="font-semibold text-teal-500 underline hover:text-teal-600"
          >
            {t.under18Link}
          </a>
          .
        </p>

        <p className="text-sm font-medium uppercase tracking-[0.12em] text-gray-400 mb-3">
          {t.description}
        </p>

        <ul className="bg-white rounded-2xl border border-navy-100 p-2 mb-8 text-left">
          {t.steps.map((label, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3 text-gray-700 rounded-xl">
              <span className="flex items-center justify-center w-7 h-7 flex-shrink-0 bg-navy-50 text-navy-600 rounded-full text-xs font-semibold tabular-nums">
                {i + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        {kiosk && (
          <div className="space-y-3 mb-3">
            <button
              onClick={() => { resetIntake(); setTimeout(onNext, 100); }}
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
