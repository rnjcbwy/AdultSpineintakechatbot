'use client';

import { useIntake, useService } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// One step for every service. The systems, their questions and the short
// screening list come from the service's lib/services/<specialty>/rosSystems.js
// through useService(), and so do their Spanish and Chinese (TRANSLATIONS,
// spread in below). This dictionary is the step's own chrome only. Stored ROS
// values stay 'yes'/'no' so red-flag logic keeps working unchanged regardless
// of the language on screen.
const LOCAL = {
  'Review of Systems': { es: 'Revisión de sistemas', zh: '系统回顾' },
  'Tap anything you have had in the past month. If none apply, tap "None of these".': {
    es: 'Toque todo lo que haya tenido en el último mes. Si nada aplica, toque "Ninguno de estos".',
    zh: '请点选过去一个月内您出现过的任何情况。如果都没有，请点选“以上都没有”。',
  },
  'None of these': { es: 'Ninguno de estos', zh: '以上都没有' },
  'Prefer the complete review? It asks about every body system (about 50 quick yes/no questions).': {
    es: '¿Prefiere la revisión completa? Pregunta sobre cada sistema del cuerpo (unas 50 preguntas rápidas de sí/no).',
    zh: '想做完整回顾？它会询问每个身体系统（约 50 个快速是/否问题）。',
  },
  'Do the complete review': { es: 'Hacer la revisión completa', zh: '进行完整回顾' },
  'Back to the short list': { es: 'Volver a la lista corta', zh: '返回简短列表' },
  'Complete review of every body system. Tap "No to all" in any section that does not apply.': {
    es: 'Revisión completa de cada sistema del cuerpo. Toque "No a todo" en cualquier sección que no aplique.',
    zh: '对每个身体系统的完整回顾。在不适用的部分点选“全部选否”。',
  },
  'Please answer these quick yes/no screening questions. They help us spot other health issues that could change your treatment or your surgery plan.': {
    es: 'Por favor responda estas preguntas rápidas de sí/no. Nos ayudan a detectar otros problemas de salud que podrían cambiar su tratamiento o su plan quirúrgico.',
    zh: '请回答这些快速的是/否筛查问题。它们帮助我们发现可能改变您的治疗或手术方案的其他健康问题。',
  },

  // Progress / completeness
  'systems reviewed': { es: 'sistemas revisados', zh: '已回顾的系统' },
  'of': { es: 'de', zh: '/' },
  'Complete': { es: 'Completo', zh: '完成' },
  'A complete review covers at least 10 systems. You can still continue.': {
    es: 'Una revisión completa cubre al menos 10 sistemas. Aún puede continuar.',
    zh: '完整的回顾至少涵盖10个系统。您仍可以继续。',
  },
  'No to all': { es: 'No a todo', zh: '全部选否' },
  'Clear': { es: 'Borrar', zh: '清除' },

  "Anything else you'd like to mention?": {
    es: '¿Algo más que quiera mencionar?',
    zh: '还有其他想告诉我们的吗？',
  },
  'Any other symptoms or concerns not covered above...': {
    es: 'Cualquier otro síntoma o preocupación no cubierto arriba...',
    zh: '上面未涵盖的其他症状或顾虑……',
  },
  'Continue to Final Review': { es: 'Continuar a la revisión final', zh: '继续进行最终审核' },
};

export default function ReviewOfSystems({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const ros = data.reviewOfSystems;
  const svc = useService();
  const {
    ROS_SECTIONS, ROS_SCREEN, COMPLETE_ROS_THRESHOLD, isSectionComplete, countReviewedSystems, rosSectionOf, TRANSLATIONS,
  } = svc.rosSystems;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL, ...TRANSLATIONS }, lang);

  const updateROS = (section, questionId, value) => {
    setNested(`reviewOfSystems.${section}.${questionId}`, value);
  };

  /**
   * A review of systems is overwhelmingly negatives, so answering each one
   * individually is a lot of taps for no extra information. This fills the
   * section with "no" and leaves every answer individually changeable.
   */
  const setSectionAll = (section, value) => {
    for (const q of section.questions) {
      setNested(`reviewOfSystems.${section.id}.${q.id}`, value);
    }
  };

  const reviewed = countReviewedSystems(ros);
  const total = ROS_SECTIONS.length;

  // The short list is the default. Each item is one of the full review's
  // questions, so a tap stores 'yes' exactly where the full review would.
  const mode = ros.mode === 'full' ? 'full' : 'screen';
  const setMode = (m) => setNested('reviewOfSystems.mode', m);
  const screenValue = (q) => ros?.[rosSectionOf(q.id)]?.[q.id];
  const positives = ROS_SCREEN.filter((q) => screenValue(q) === 'yes');
  const screenAnswered = ROS_SCREEN.some((q) => !!screenValue(q));
  const noneSelected = screenAnswered && positives.length === 0;
  const tapScreen = (q) => {
    const v = screenValue(q) === 'yes' ? 'no' : 'yes';
    updateROS(rosSectionOf(q.id), q.id, v);
    // Once anything is answered, the rest of the list counts as asked.
    for (const other of ROS_SCREEN) {
      if (other.id !== q.id && !screenValue(other)) updateROS(rosSectionOf(other.id), other.id, 'no');
    }
  };
  const tapNone = () => {
    for (const q of ROS_SCREEN) updateROS(rosSectionOf(q.id), q.id, 'no');
  };
  // Continuing with nothing tapped records the list as reviewed and negative.
  const next = () => {
    if (mode === 'screen' && !screenAnswered) tapNone();
    onNext();
  };

  if (mode === 'screen') {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h2 className="section-title">{t('Review of Systems')}</h2>
          <p className="section-subtitle">
            {t('Tap anything you have had in the past month. If none apply, tap "None of these".')}
          </p>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-2">
            {ROS_SCREEN.map((q) => {
              const on = screenValue(q) === 'yes';
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => tapScreen(q)}
                  aria-pressed={on}
                  className={`px-3.5 py-2.5 rounded-full text-sm border transition-colors ${
                    on ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {t(q.label)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={tapNone}
              aria-pressed={noneSelected}
              className={`px-3.5 py-2.5 rounded-full text-sm border transition-colors ${
                noneSelected ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
              }`}
            >
              {t('None of these')}
            </button>
          </div>
        </div>

        <div className="card mt-4">
          <label className="form-label">{t("Anything else you'd like to mention?")}</label>
          <textarea
            value={ros.additionalNotes || ''}
            onChange={(e) => setNested('reviewOfSystems.additionalNotes', e.target.value)}
            placeholder={t('Any other symptoms or concerns not covered above...')}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
          />
        </div>

        <p className="text-sm text-gray-400 mt-4">
          {t('Prefer the complete review? It asks about every body system (about 50 quick yes/no questions).')}{' '}
          <button type="button" onClick={() => setMode('full')} className="text-teal-600 hover:underline font-medium">
            {t('Do the complete review')}
          </button>
        </p>

        <StepNavigation onNext={next} onBack={onBack} canGoNext={true} nextLabel={t('Continue')} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Review of Systems')}</h2>
        <p className="section-subtitle">
          {t('Complete review of every body system. Tap "No to all" in any section that does not apply.')}{' '}
          <button type="button" onClick={() => setMode('screen')} className="text-teal-600 hover:underline font-medium">
            {t('Back to the short list')}
          </button>
        </p>
      </div>

      {/* Completeness. A documented review is expected to cover at least ten
          systems, and the patient cannot know that, so the form tracks it. */}
      <div className="card mb-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-semibold text-navy-600">{reviewed}</span>
            <span className="text-sm text-gray-500">
              {t('of')} {total} {t('systems reviewed')}
            </span>
            {reviewed >= COMPLETE_ROS_THRESHOLD && (
              <span className="ml-auto text-xs font-semibold text-green-600 uppercase tracking-wide">
                {t('Complete')}
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                reviewed >= COMPLETE_ROS_THRESHOLD ? 'bg-green-500' : 'bg-teal-400'
              }`}
              style={{ width: `${(reviewed / total) * 100}%` }}
            />
          </div>
          {reviewed < COMPLETE_ROS_THRESHOLD && (
            <p className="text-xs text-gray-400 mt-1.5">
              {t('A complete review covers at least 10 systems. You can still continue.')}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {ROS_SECTIONS.map((section) => {
          const done = isSectionComplete(ros, section);
          const anyAnswered = section.questions.some((q) => !!ros?.[section.id]?.[q.id]);
          return (
            <div key={section.id} className="card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-medium text-navy-600 flex items-center gap-2">
                  {t(section.title)}
                  {done && (
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </h3>
                <button
                  onClick={() => setSectionAll(section, anyAnswered ? '' : 'no')}
                  className="text-xs font-medium text-gray-400 hover:text-teal-600 transition-colors flex-shrink-0"
                >
                  {anyAnswered ? t('Clear') : t('No to all')}
                </button>
              </div>
              <div className="space-y-3">
                {section.questions.map((q) => {
                  const value = ros?.[section.id]?.[q.id];
                  return (
                    <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700 flex-1 pr-4">{t(q.label)}</span>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {['yes', 'no'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => updateROS(section.id, q.id, opt)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              value === opt
                                ? opt === 'yes'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                  : 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {opt === 'yes' ? t('Yes') : t('No')}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Additional notes */}
        <div className="card">
          <label className="form-label">{t("Anything else you'd like to mention?")}</label>
          <textarea
            value={ros.additionalNotes || ''}
            onChange={(e) => setNested('reviewOfSystems.additionalNotes', e.target.value)}
            placeholder={t('Any other symptoms or concerns not covered above...')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
          />
        </div>
      </div>

      <StepNavigation
        onNext={next}
        onBack={onBack}
        canGoNext={true}
        nextLabel={t('Continue')}
      />
    </div>
  );
}
