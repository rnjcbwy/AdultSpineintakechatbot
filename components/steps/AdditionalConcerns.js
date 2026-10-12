'use client';

import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// Shared display-only translations for this step (both components use it).
const LOCAL = {
  "Anything Else You'd Like to Share?": {
    es: '¿Algo más que quiera compartir?',
    zh: '还有什么想告诉我们的吗？',
  },
  'This step is optional. Type anything else about your symptoms, your goals for the visit, or questions you have.': {
    es: 'Este paso es opcional. Escriba cualquier otra cosa sobre sus síntomas, sus objetivos para la consulta o las preguntas que tenga.',
    zh: '此步骤为可选。请写下关于您的症状、就诊目标或疑问的任何其他内容。',
  },
  'Additional concerns or details (optional)': {
    es: 'Inquietudes o detalles adicionales (opcional)',
    zh: '其他顾虑或细节（可选）',
  },
  'Feel free to share anything about your symptoms, your goals for the visit, or questions you have — in your own words.': {
    es: 'Puede compartir con sus propias palabras cualquier cosa sobre sus síntomas, sus objetivos para la consulta o las preguntas que tenga.',
    zh: '欢迎用您自己的话分享任何关于您的症状、就诊目标或您的疑问。',
  },
  "For example: I'm most worried about the numbness in my hand, and I'd like to understand my options before considering surgery...": {
    es: 'Por ejemplo: Lo que más me preocupa es el entumecimiento en la mano, y me gustaría entender mis opciones antes de considerar una cirugía...',
    zh: '例如：我最担心手部的麻木，希望在考虑手术之前先了解我的选择……',
  },
  'Continue to Past Medical History': {
    es: 'Continuar a los antecedentes médicos',
    zh: '继续填写既往病史',
  },
  'Skip — nothing to add': {
    es: 'Omitir — nada que agregar',
    zh: '跳过 — 没有要补充的',
  },
  'Optional: Chat with our Assistant': {
    es: 'Opcional: Converse con nuestro asistente',
    zh: '可选：与我们的助手交谈',
  },
  "If you'd like, our assistant can ask a few follow-up questions about your symptoms to make sure we have a complete picture. It works like a friendly conversation — and it's entirely up to you.": {
    es: 'Si lo desea, nuestro asistente puede hacerle algunas preguntas de seguimiento sobre sus síntomas para asegurarnos de tener un panorama completo. Funciona como una conversación amigable, y depende totalmente de usted.',
    zh: '如果您愿意，我们的助手可以就您的症状问几个后续问题，以确保我们全面了解情况。它就像一次友好的对话——完全由您决定是否进行。',
  },
  'Start Conversation': {
    es: 'Iniciar conversación',
    zh: '开始对话',
  },
  'Intake Assistant': {
    es: 'Asistente de admisión',
    zh: '接诊助手',
  },
  'Optional follow-up · gathering your symptom history': {
    es: 'Seguimiento opcional · recopilando el historial de sus síntomas',
    zh: '可选的后续问题 · 收集您的症状史',
  },
  'Type your response...': {
    es: 'Escriba su respuesta...',
    zh: '输入您的回复……',
  },
  'Answer in your own words. There are no wrong answers — and you can stop anytime.': {
    es: 'Responda con sus propias palabras. No hay respuestas incorrectas, y puede detenerse en cualquier momento.',
    zh: '用您自己的话回答。没有错误的答案——您可以随时停止。',
  },
};

/**
 * Additional Details & AI Follow-up — the final part of the symptom history.
 *
 * Everything here is OPTIONAL. The patient can:
 *   - type any additional concerns or details they want to share, and/or
 *   - chat with the AI assistant, which asks a few further questions.
 */
export default function AdditionalConcerns({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const hpi = data.hpiData;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t("Anything Else You'd Like to Share?")}</h2>
        <p className="section-subtitle">
          {t('This step is optional. Type anything else about your symptoms, your goals for the visit, or questions you have.')}
        </p>
      </div>

      {/* Free-text additional concerns */}
      <div className="card mb-4">
        <label className="form-label text-base">{t('Additional concerns or details (optional)')}</label>
        <p className="text-sm text-gray-400 mb-3">
          {t('Feel free to share anything about your symptoms, your goals for the visit, or questions you have — in your own words.')}
        </p>
        <textarea
          value={hpi.additionalConcerns || ''}
          onChange={(e) => setNested('hpiData.additionalConcerns', e.target.value)}
          placeholder={t("For example: I'm most worried about the numbness in my hand, and I'd like to understand my options before considering surgery...")}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
        />
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext
        nextLabel={t('Continue')}
        showSkip
        skipLabel={t('Skip — nothing to add')}
      />
    </div>
  );
}
