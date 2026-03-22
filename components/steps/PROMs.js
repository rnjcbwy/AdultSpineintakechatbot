'use client';

import { useState, useMemo } from 'react';
import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import {
  ODI, NDI, MJOA, SRS22R,
  scoreOdiNdi, scoreMJOA, scoreSRS22R,
  getApplicableQuestionnaires,
} from '../../lib/questionnaires';

const QUESTIONNAIRE_MAP = {
  odi: ODI,
  ndi: NDI,
  mjoa: MJOA,
  srs22r: SRS22R,
};

export default function PROMs({ onNext, onBack }) {
  const { data, setSection } = useIntake();
  const proms = data.proms || {};

  // Determine which questionnaires to show
  const applicableIds = useMemo(() => getApplicableQuestionnaires(data), [data]);

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
      const q = QUESTIONNAIRE_MAP[id];
      const a = updated[id] || {};
      let score = null;
      if (id === 'odi' || id === 'ndi') score = scoreOdiNdi(a, q);
      else if (id === 'mjoa') score = scoreMJOA(a);
      else if (id === 'srs22r') score = scoreSRS22R(a);
      promsData[id] = { answers: a, score };
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
          <h2 className="section-title">Patient-Reported Outcome Measures</h2>
          <p className="section-subtitle">
            Based on your symptoms, no additional outcome questionnaires are needed at this time.
          </p>
        </div>
        <div className="card p-8 text-center">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600">No questionnaires required. You can continue to the next step.</p>
        </div>
        <StepNavigation onBack={onBack} onNext={onNext} nextLabel="Continue" />
      </div>
    );
  }

  const activeId = applicableIds[activeIndex];
  const activeQ = QUESTIONNAIRE_MAP[activeId];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">Patient-Reported Outcome Measures</h2>
        <p className="section-subtitle">
          Based on your symptoms, please complete the following questionnaire{applicableIds.length > 1 ? 's' : ''}.
          These help your surgeon understand how your condition affects your daily life.
        </p>
      </div>

      {/* Questionnaire tabs if more than one */}
      {applicableIds.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {applicableIds.map((id, idx) => {
            const q = QUESTIONNAIRE_MAP[id];
            const a = answers[id] || {};
            const totalQuestions = id === 'srs22r' ? q.questions.length : q.sections.length;
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
          <h3 className="text-lg font-semibold text-navy-600">{activeQ.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{activeQ.description}</p>
        </div>

        {activeId === 'srs22r' ? (
          <SRS22RForm
            questionnaire={activeQ}
            answers={answers[activeId] || {}}
            onAnswer={(qId, score) => handleAnswer(activeId, qId, score)}
          />
        ) : (
          <StandardForm
            questionnaire={activeQ}
            answers={answers[activeId] || {}}
            onAnswer={(sectionId, score) => handleAnswer(activeId, sectionId, score)}
          />
        )}
      </div>

      {/* Score preview */}
      <ScorePreview questionnaireId={activeId} answers={answers[activeId] || {}} />

      <StepNavigation onBack={onBack} onNext={onNext} nextLabel="Continue" />
    </div>
  );
}


/** Renders ODI, NDI, or mJOA sections */
function StandardForm({ questionnaire, answers, onAnswer }) {
  return (
    <div className="space-y-6">
      {questionnaire.sections.map((section, idx) => (
        <div key={section.id} className="border border-gray-100 rounded-xl p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-navy-600">
              {idx + 1}. {section.title}
              {section.optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
            </h4>
            {section.subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{section.subtitle}</p>
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
                <span className="text-sm text-gray-700 leading-snug">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


/** Renders SRS-22r questions */
function SRS22RForm({ questionnaire, answers, onAnswer }) {
  return (
    <div className="space-y-6">
      {questionnaire.questions.map((q, idx) => (
        <div key={q.id} className="border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-navy-600 mb-3">
            {idx + 1}. {q.text}
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
                  name={`srs22r-q${q.id}`}
                  checked={answers[q.id] === option.score}
                  onChange={() => onAnswer(q.id, option.score)}
                  className="mt-0.5 accent-teal-500"
                />
                <span className="text-sm text-gray-700 leading-snug">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


/** Score preview below the questionnaire */
function ScorePreview({ questionnaireId, answers }) {
  const q = QUESTIONNAIRE_MAP[questionnaireId];
  const answeredCount = Object.keys(answers).length;

  if (answeredCount === 0) return null;

  let scoreDisplay = null;

  if (questionnaireId === 'odi' || questionnaireId === 'ndi') {
    const result = scoreOdiNdi(answers, q);
    if (result) {
      scoreDisplay = (
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-2xl font-bold text-navy-600">{result.percentage}%</span>
            <span className="text-sm text-gray-500 ml-2">({result.sectionsAnswered} of {q.sections.length} sections)</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getInterpretationColor(result.interpretation)}`}>
            {result.interpretation}
          </span>
        </div>
      );
    }
  } else if (questionnaireId === 'mjoa') {
    const result = scoreMJOA(answers);
    if (result) {
      scoreDisplay = (
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-2xl font-bold text-navy-600">{result.totalScore}</span>
            <span className="text-sm text-gray-500 ml-1">/ {result.maxScore}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMjoaColor(result.interpretation)}`}>
            {result.interpretation}
          </span>
        </div>
      );
    }
  } else if (questionnaireId === 'srs22r') {
    const result = scoreSRS22R(answers);
    if (result) {
      scoreDisplay = (
        <div className="space-y-2">
          {result.totalScore && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-navy-600">{result.totalScore}</span>
              <span className="text-sm text-gray-500">/ 5.0 overall mean</span>
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            {Object.values(result.domainScores).map((d) => (
              <span key={d.name} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                {d.name}: <strong>{d.score}</strong>
              </span>
            ))}
          </div>
        </div>
      );
    }
  }

  if (!scoreDisplay) return null;

  return (
    <div className="card mb-6 bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h4 className="text-sm font-semibold text-navy-600">{q.shortName} Score</h4>
      </div>
      {scoreDisplay}
    </div>
  );
}


function getInterpretationColor(interpretation) {
  switch (interpretation) {
    case 'Minimal disability': return 'bg-green-100 text-green-700';
    case 'Moderate disability': return 'bg-yellow-100 text-yellow-700';
    case 'Severe disability': return 'bg-orange-100 text-orange-700';
    case 'Crippled': return 'bg-red-100 text-red-700';
    default: return 'bg-red-100 text-red-700';
  }
}

function getMjoaColor(interpretation) {
  switch (interpretation) {
    case 'No myelopathy': return 'bg-green-100 text-green-700';
    case 'Mild myelopathy': return 'bg-yellow-100 text-yellow-700';
    case 'Moderate myelopathy': return 'bg-orange-100 text-orange-700';
    case 'Severe myelopathy': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
