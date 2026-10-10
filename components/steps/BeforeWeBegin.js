'use client';

import { IS_PRODUCTION_TIER } from '../../lib/deploymentTier';
import { translateDeep, useLang } from '../../lib/i18n';

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


/**
 * What the consent page says on the real deployment. The prototype wording
 * above warns people OFF entering real information; this does the opposite,
 * and says plainly where the information goes.
 */
const PROD = {
  en: {
    warning: 'Please answer as accurately as you can. This form gathers information for your visit; it is not medical advice and nobody reads it in real time.',
    intro: 'Take your time. There are no wrong answers, and you can pause and come back whenever you like.',
    points: [
      'Your answers are private and are read only by the people caring for you',
      'An assistant will help gather your history through conversation — it **cannot provide medical advice**',
      'If you have an emergency, **call 911** — do not wait for a reply through this form',
      'You can stop and come back later; your progress is saved on this device until you submit',
    ],
    ack: 'By continuing, you confirm that the information you enter is about you (or a patient you are authorized to represent) and is accurate to the best of your knowledge.',
  },
  es: {
    warning: 'Responda con la mayor precisión posible. Este formulario recopila información para su cita; no es consejo médico y nadie lo lee en tiempo real.',
    intro: 'Tómese su tiempo. No hay respuestas incorrectas y puede pausar y volver cuando quiera.',
    points: [
      'Sus respuestas son privadas y solo las leen las personas que lo atienden',
      'Un asistente le ayudará a recopilar su historial mediante una conversación — **no puede dar consejos médicos**',
      'Si tiene una emergencia, **llame al 911** — no espere una respuesta a través de este formulario',
      'Puede detenerse y volver más tarde; su progreso se guarda en este dispositivo hasta que lo envíe',
    ],
    ack: 'Al continuar, usted confirma que la información que ingresa es sobre usted (o sobre un paciente que está autorizado a representar) y es precisa según su leal saber y entender.',
  },
  zh: {
    warning: '请尽可能准确地回答。本表格用于为您的就诊收集信息；它不是医疗建议，也不会有人实时阅读。',
    intro: '请慢慢来。没有错误的答案，您可以随时暂停并稍后继续。',
    points: [
      '您的回答是保密的，只有照护您的人员会阅读',
      '一位助手将通过对话帮助收集您的病史——它**不能提供医疗建议**',
      '如遇紧急情况，请**拨打 911**——不要等待通过本表格得到回复',
      '您可以中途停止并稍后返回；在提交之前，您的进度会保存在本设备上',
    ],
    ack: '继续即表示您确认所输入的信息是关于您本人（或您有权代表的患者）的，并且在您所知范围内准确无误。',
  },
};

export default function BeforeWeBegin({ onNext, onBack }) {
  const lang = useLang();
  const base = T[lang] || translateDeep(T.en, lang);
  const prod = PROD[lang] || translateDeep(PROD.en, lang);
  const t = IS_PRODUCTION_TIER ? { ...base, ...prod } : base;

  return (
    <div className="animate-fade-in min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="card max-w-xl w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal-400 flex items-center justify-center shadow-sm">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="font-serif text-[1.75rem] md:text-[2rem] font-semibold text-navy-600 mb-6">
          {t.title}
        </h1>

        {/* Warning box */}
        <div className={`flex items-start gap-3 text-left rounded-xl px-4 py-3 mb-6 ${IS_PRODUCTION_TIER ? 'bg-teal-50 border border-teal-200' : 'bg-amber-100 border-2 border-amber-400'}`}>
          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${IS_PRODUCTION_TIER ? 'text-teal-600' : 'text-amber-600'}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className={`text-sm font-semibold leading-snug ${IS_PRODUCTION_TIER ? 'text-teal-900' : 'text-amber-800'}`}>{t.warning}</p>
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
