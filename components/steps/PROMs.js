'use client';

import { useState, useMemo } from 'react';
import { useIntake, useService } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// ============================================================================
// One step for every service. Which instruments exist, which apply, how each
// is scored and how its score reads all come from the service's modules
// (lib/services/<specialty>/questionnaires.js and promSummary.js) through
// useService(); nothing here names ODI or KOOS JR.
//
// Display-only translations (es = Spanish, zh = Simplified Chinese) for the
// step's own chrome. The instrument text (names, items, options,
// interpretations) is translated beside its definition, in the service
// module's TRANSLATIONS, and spread in below. Scoring is done entirely on
// numeric `option.score` values and is never touched. English is the
// canonical fallback (see makeT).
// ============================================================================
const LOCAL = {
  'Patient-Reported Outcome Measures': {
    es: 'Medidas de resultados informadas por el paciente',
    zh: '患者自评结果量表',
  },
  'Based on your symptoms, no additional outcome questionnaires are needed at this time.': {
    es: 'Según sus síntomas, no se necesitan cuestionarios de resultados adicionales en este momento.',
    zh: '根据您的症状，目前无需填写额外的结果问卷。',
  },
  'No questionnaires required. You can continue to the next step.': {
    es: 'No se requieren cuestionarios. Puede continuar al siguiente paso.',
    zh: '无需填写问卷。您可以继续下一步。',
  },
  'Based on your symptoms, please complete the following questionnaire. These help your surgeon understand how your condition affects your daily life.': {
    es: 'Según sus síntomas, por favor complete el siguiente cuestionario. Esto ayuda a su cirujano a entender cómo su afección afecta su vida diaria.',
    zh: '根据您的症状，请填写以下问卷。这有助于您的外科医生了解您的病情如何影响您的日常生活。',
  },
  'Based on your symptoms, please complete the following questionnaires. These help your surgeon understand how your condition affects your daily life.': {
    es: 'Según sus síntomas, por favor complete los siguientes cuestionarios. Esto ayuda a su cirujano a entender cómo su afección afecta su vida diaria.',
    zh: '根据您的症状，请填写以下问卷。这有助于您的外科医生了解您的病情如何影响您的日常生活。',
  },
  '(optional)': { es: '(opcional)', zh: '（可选）' },
  'Score': { es: 'Puntuación', zh: '评分' },
  'of': { es: 'de', zh: '/' },
};

/** The colour of the interpretation chip, by the tone the service module names. */
const TONE_CLASSES = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-700',
  muted: 'bg-gray-100 text-gray-600',
  teal: 'bg-teal-50 text-teal-700',
};

/** An instrument's items: titled sections, or numbered questions (SRS-22r). */
const itemsOf = (q) => q.questions || q.sections;

export default function PROMs({ onNext, onBack }) {
  const { data, setSection } = useIntake();
  const svc = useService();
  const { QUESTIONNAIRES, scoreQuestionnaire, getApplicableQuestionnaires, TRANSLATIONS } = svc.questionnaires;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL, ...TRANSLATIONS }, lang);
  const proms = data.proms || {};

  // Determine which questionnaires to show
  const applicableIds = useMemo(() => getApplicableQuestionnaires(data), [data, getApplicableQuestionnaires]);

  // Track which questionnaire is currently active
  const [activeIndex, setActiveIndex] = useState(0);

  // Local answers state, initialized from store
  const [answers, setAnswers] = useState(() => {
    const init = {};
    for (const id of applicableIds) {
      init[id] = proms[id]?.answers || {};
    }
    return init;
  });

  const saveToStore = (updated) => {
    const promsData = {};
    for (const id of applicableIds) {
      const a = updated[id] || {};
      promsData[id] = { answers: a, score: scoreQuestionnaire(id, a) };
    }
    setSection('proms', promsData);
  };

  const handleAnswer = (questionnaireId, questionId, score) => {
    const updated = {
      ...answers,
      [questionnaireId]: {
        ...answers[questionnaireId],
        [questionId]: score,
      },
    };
    setAnswers(updated);
    saveToStore(updated);
  };

  // If no questionnaires apply, skip this step
  if (applicableIds.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h2 className="section-title">{t('Patient-Reported Outcome Measures')}</h2>
          <p className="section-subtitle">
            {t('Based on your symptoms, no additional outcome questionnaires are needed at this time.')}
          </p>
        </div>
        <div className="card p-8 text-center">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600">{t('No questionnaires required. You can continue to the next step.')}</p>
        </div>
        <StepNavigation onBack={onBack} onNext={onNext} nextLabel={t('Continue')} />
      </div>
    );
  }

  const activeId = applicableIds[Math.min(activeIndex, applicableIds.length - 1)];
  const activeQ = QUESTIONNAIRES[activeId];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Patient-Reported Outcome Measures')}</h2>
        <p className="section-subtitle">
          {applicableIds.length > 1
            ? t('Based on your symptoms, please complete the following questionnaires. These help your surgeon understand how your condition affects your daily life.')
            : t('Based on your symptoms, please complete the following questionnaire. These help your surgeon understand how your condition affects your daily life.')}
        </p>
      </div>

      {/* Questionnaire tabs if more than one */}
      {applicableIds.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {applicableIds.map((id, idx) => {
            const q = QUESTIONNAIRES[id];
            const a = answers[id] || {};
            const totalQuestions = itemsOf(q).length;
            const answeredCount = Object.keys(a).length;
            const isComplete = answeredCount >= totalQuestions;
            return (
              <button
                key={id}
                onClick={() => setActiveIndex(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  idx === activeIndex
                    ? 'bg-teal-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
                }`}
              >
                {q.shortName}
                {isComplete && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {!isComplete && answeredCount > 0 && (
                  <span className="text-xs opacity-75">({answeredCount}/{totalQuestions})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Active questionnaire */}
      <div className="card mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-navy-600">{t(activeQ.name)}</h3>
          <p className="text-sm text-gray-500 mt-1">{t(activeQ.description)}</p>
        </div>

        {activeQ.questions ? (
          <QuestionsForm
            questionnaire={activeQ}
            answers={answers[activeId] || {}}
            onAnswer={(qId, score) => handleAnswer(activeId, qId, score)}
            t={t}
          />
        ) : (
          <StandardForm
            questionnaire={activeQ}
            answers={answers[activeId] || {}}
            onAnswer={(sectionId, score) => handleAnswer(activeId, sectionId, score)}
            t={t}
          />
        )}
      </div>

      {/* Score preview */}
      <ScorePreview questionnaireId={activeId} answers={answers[activeId] || {}} t={t} />

      <StepNavigation onBack={onBack} onNext={onNext} nextLabel={t('Continue')} />
    </div>
  );
}


/** Renders any instrument whose items are titled sections with scored options (ODI, NDI, mJOA, the joint scores). */
function StandardForm({ questionnaire, answers, onAnswer, t }) {
  return (
    <div className="space-y-6">
      {questionnaire.sections.map((section, idx) => (
        <div key={section.id} className="border border-gray-100 rounded-xl p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-navy-600">
              {idx + 1}. {t(section.title)}
              {section.optional && <span className="text-gray-400 font-normal ml-1">{t('(optional)')}</span>}
            </h4>
            {section.subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{t(section.subtitle)}</p>
            )}
          </div>
          <div className="space-y-1.5">
            {section.options.map((option) => (
              <label
                key={option.score}
                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  answers[section.id] === option.score
                    ? 'bg-teal-50 border border-teal-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name={`${questionnaire.id}-${section.id}`}
                  checked={answers[section.id] === option.score}
                  onChange={() => onAnswer(section.id, option.score)}
                  className="mt-0.5 accent-teal-500"
                />
                <span className="text-sm text-gray-700 leading-snug">{t(option.label)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


/** Renders an instrument laid out as numbered questions (SRS-22r). */
function QuestionsForm({ questionnaire, answers, onAnswer, t }) {
  return (
    <div className="space-y-6">
      {questionnaire.questions.map((q, idx) => (
        <div key={q.id} className="border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-navy-600 mb-3">
            {idx + 1}. {t(q.text)}
          </h4>
          <div className="space-y-1.5">
            {q.options.map((option) => (
              <label
                key={option.score}
                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  answers[q.id] === option.score
                    ? 'bg-teal-50 border border-teal-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name={`${questionnaire.id}-q${q.id}`}
                  checked={answers[q.id] === option.score}
                  onChange={() => onAnswer(q.id, option.score)}
                  className="mt-0.5 accent-teal-500"
                />
                <span className="text-sm text-gray-700 leading-snug">{t(option.label)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


/**
 * Score preview below the questionnaire. The service module says what the
 * score reads as (promSummary.scorePreview); this only lays it out.
 */
function ScorePreview({ questionnaireId, answers, t }) {
  const svc = useService();
  const q = svc.questionnaires.QUESTIONNAIRES[questionnaireId];
  const answeredCount = Object.keys(answers).length;

  if (answeredCount === 0) return null;

  const result = svc.questionnaires.scoreQuestionnaire(questionnaireId, answers);
  const view = result && svc.promSummary.scorePreview(questionnaireId, result, t);
  if (!view) return null;

  return (
    <div className="card mb-6 bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h4 className="text-sm font-semibold text-navy-600">{q.shortName} {t('Score')}</h4>
      </div>
      {view.domains ? (
        // Scored by domain (SRS-22r): the overall mean, then one chip per domain.
        <div className="space-y-2">
          {view.big && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-navy-600">{view.big}</span>
              <span className="text-sm text-gray-500">{view.small}</span>
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            {view.domains.map((d) => (
              <span key={d.name} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                {t(d.name)}: <strong>{d.score}</strong>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-2xl font-bold text-navy-600">{view.big}</span>
            {view.small && <span className="text-sm text-gray-500 ml-1">{view.small}</span>}
            {view.count && <span className="text-sm text-gray-500 ml-2">{view.count}</span>}
          </div>
          {view.interpretation && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${TONE_CLASSES[view.tone] || TONE_CLASSES.gray}`}>
              {t(view.interpretation)}
            </span>
          )}
        </div>
      )}
      {view.srText && <p className="sr-only">{view.srText}</p>}
    </div>
  );
}
