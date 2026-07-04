'use client';

import { useIntake } from '../../lib/store';

const T = {
  en: {
    title: 'Before We Begin',
    warning:
      'This is a demonstration prototype. Please use fictional information only — do not enter real protected health information (PHI).',
    intro:
      'This intake form demonstrates how patient information would be collected to help prepare for an appointment.',
    points: [
      'This is a prototype — it is **not HIPAA compliant** and should not be used for real patients',
      'Do not enter real names, dates of birth, phone numbers, or other identifying information',
      'An AI assistant will help gather medical history through conversation — this assistant **cannot provide medical advice**',
      'Data entered here is stored for demonstration purposes only',
    ],
    ack: 'By proceeding, you acknowledge that this is a prototype and you will not enter real patient information.',
    back: 'Back',
    continue: 'I Understand, Continue',
  },
  es: {
    title: 'Antes de Comenzar',
    warning:
      'Esto es un prototipo de demostración. Utilice únicamente información ficticia — no ingrese información médica protegida (PHI) real.',
    intro:
      'Este formulario demuestra cómo se recopilaría la información del paciente para ayudar a prepararse para una cita.',
    points: [
      'Esto es un prototipo — **no cumple con HIPAA** y no debe usarse con pacientes reales',
      'No ingrese nombres reales, fechas de nacimiento, números de teléfono ni otra información identificable',
      'Un asistente de IA ayudará a recopilar el historial médico mediante una conversación — este asistente **no puede dar consejos médicos**',
      'Los datos ingresados aquí se almacenan solo con fines de demostración',
    ],
    ack: 'Al continuar, usted reconoce que esto es un prototipo y que no ingresará información real de pacientes.',
    back: 'Atrás',
    continue: 'Entiendo, Continuar',
  },
  zh: {
    title: '开始之前',
    warning: '这是一个演示原型。请仅使用虚构信息 — 请勿输入真实的受保护健康信息 (PHI)。',
    intro: '此登记表演示了如何收集患者信息以帮助准备就诊。',
    points: [
      '这是一个原型 — **不符合 HIPAA 标准**，不应用于真实患者',
      '请勿输入真实姓名、出生日期、电话号码或其他身份识别信息',
      'AI 助手将通过对话帮助收集病史 — 该助手**无法提供医疗建议**',
      '此处输入的数据仅用于演示目的',
    ],
    ack: '继续即表示您确认这是一个原型，并且您不会输入真实的患者信息。',
    back: '返回',
    continue: '我明白了，继续',
  },
};

function renderBold(text) {
  return text.split('**').map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export default function BeforeWeBegin({ onNext, onBack }) {
  const { data } = useIntake();
  const t = T[data.language] || T.en;

  return (
    <div className="animate-fade-in min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="card max-w-xl w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#2A8A8A] flex items-center justify-center shadow-sm">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="font-serif text-[1.75rem] md:text-[2rem] font-semibold text-[#1A2A44] mb-6">
          {t.title}
        </h1>

        {/* Warning box */}
        <div className="flex items-start gap-3 text-left bg-amber-100 border-2 border-amber-400 rounded-xl px-4 py-3 mb-6">
          <svg className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-semibold text-amber-800 leading-snug">{t.warning}</p>
        </div>

        <p className="text-gray-600 text-left mb-6 leading-relaxed">{t.intro}</p>

        {/* Checklist */}
        <ul className="space-y-3 text-left mb-6">
          {t.points.map((p, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
              <svg className="w-5 h-5 flex-shrink-0 text-teal-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>{renderBold(p)}</span>
            </li>
          ))}
        </ul>

        <p className="text-gray-600 text-left mb-8 leading-relaxed">{t.ack}</p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={onBack} className="btn-secondary px-6">
            {t.back}
          </button>
          <button onClick={onNext} className="btn-primary inline-flex items-center gap-2 px-6">
            {t.continue}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
