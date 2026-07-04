'use client';

import { useIntake } from '../../lib/store';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
];

const T = {
  en: {
    subtitle: 'New Patient Intake',
    banner:
      '⚠️ PROTOTYPE / DEMONSTRATION ONLY — Please do not enter real patient information. Use fictional names and details for testing purposes.',
    under18Prefix: 'Patient under 18 years old? ',
    under18Link: 'Please use our pediatric intake form',
    description:
      'Welcome! This intake form helps us learn about you before your appointment. The process takes about 15–25 minutes and includes:',
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
    hipaa: '🚧 This is a prototype — not HIPAA compliant',
  },
  es: {
    subtitle: 'Admisión de Nuevo Paciente',
    banner:
      '⚠️ SOLO PROTOTIPO / DEMOSTRACIÓN — Por favor, no ingrese información real de pacientes. Use nombres y datos ficticios con fines de prueba.',
    under18Prefix: '¿Paciente menor de 18 años? ',
    under18Link: 'Por favor, use nuestro formulario de admisión pediátrica',
    description:
      '¡Bienvenido! Este formulario nos ayuda a conocerlo antes de su cita. El proceso toma entre 15 y 25 minutos e incluye:',
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
    hipaa: '🚧 Esto es un prototipo — no cumple con HIPAA',
  },
  zh: {
    subtitle: '新患者登记',
    banner:
      '⚠️ 仅供原型/演示 — 请勿输入真实患者信息。请使用虚构的姓名和信息进行测试。',
    under18Prefix: '患者未满 18 岁？',
    under18Link: '请使用我们的儿科登记表',
    description:
      '欢迎！此登记表可帮助我们在您就诊前了解您的情况。整个过程大约需要 15–25 分钟，包括：',
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
    hipaa: '🚧 这是一个原型 — 不符合 HIPAA 标准',
  },
};

function SpineLogo() {
  const vertebrae = [10, 25, 40, 55, 70, 85, 100];
  return (
    <svg viewBox="0 0 100 120" className="spine-logo mx-auto" aria-label="Spine logo">
      <defs>
        <linearGradient id="spineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2A5A8C" />
          <stop offset="100%" stopColor="#1A3A5C" />
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
  const { data, resetIntake, setLanguage } = useIntake();
  const hasExisting = data.lastUpdated && data.demographics?.firstName;
  const lang = data.language || 'en';
  const t = T[lang] || T.en;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-[600px] w-full mx-auto text-center animate-fade-in">
        {/* Animated spine logo */}
        <div className="mb-8">
          <SpineLogo />
        </div>

        <h1 className="font-serif text-[1.75rem] md:text-[2.5rem] leading-tight font-semibold text-[#1A2A44] mb-1">
          Comprehensive Spine &amp; Scoliosis Center
        </h1>
        <p className="text-[1.1rem] font-medium text-[#2A8A8A] tracking-[0.02em] mb-2">
          Aaron Wey, MD, FAAOS, FACS
        </p>
        <h2 className="text-[1.25rem] font-normal text-[#6B7280] mb-6">
          {t.subtitle}
        </h2>

        {/* Language selector */}
        <div className="flex items-center justify-center gap-2 mb-6" role="group" aria-label="Select language">
          {LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                aria-pressed={active}
                className={
                  'px-5 py-2 rounded-full text-sm font-medium border transition-all duration-150 ' +
                  (active
                    ? 'bg-navy-600 text-white border-navy-600 shadow-sm'
                    : 'bg-white text-navy-600 border-navy-200 hover:border-teal-300 hover:bg-teal-50')
                }
              >
                {l.label}
              </button>
            );
          })}
        </div>

        {/* Prototype banner */}
        <div className="bg-amber-100 border-2 border-amber-500 rounded-xl px-4 py-3 mb-3 text-sm font-semibold text-amber-800 leading-snug">
          {t.banner}
        </div>

        {/* Under-18 redirect */}
        <p className="text-sm text-gray-600 mb-6">
          {t.under18Prefix}
          <a
            href="https://peds-spine-intake.vercel.app/"
            className="font-semibold text-teal-500 underline hover:text-teal-600"
          >
            {t.under18Link}
          </a>
          .
        </p>

        <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-6">
          {t.description}
        </p>

        <ul className="bg-white rounded-2xl shadow-sm p-6 mb-8 text-left divide-y divide-cream-200">
          {t.steps.map((label, i) => (
            <li key={i} className="flex items-center gap-4 py-3 text-gray-600">
              <span className="flex items-center justify-center w-7 h-7 flex-shrink-0 bg-navy-600 text-white rounded-full text-sm font-semibold">
                {i + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-3">
          {hasExisting && (
            <button onClick={onNext} className="btn-primary text-lg px-10 py-4 w-full max-w-xs mx-auto block">
              {t.continue}
            </button>
          )}
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
        </div>

        <p className="mt-8 text-sm font-medium text-amber-600">
          {t.hipaa}
        </p>
      </div>
    </div>
  );
}
