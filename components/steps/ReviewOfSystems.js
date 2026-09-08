'use client';

import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import {
  ROS_SECTIONS,
  COMPLETE_ROS_THRESHOLD,
  isSectionComplete,
  countReviewedSystems,
} from '../../lib/rosSystems';

// Display-only translations. Stored ROS values stay 'yes'/'no' so red-flag
// logic keeps working unchanged regardless of the language on screen.
const LOCAL = {
  'Review of Systems': { es: 'Revisión de sistemas', zh: '系统回顾' },
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

  // Section headings
  'General & Whole-Body': { es: 'General y todo el cuerpo', zh: '全身状况' },
  'Eyes': { es: 'Ojos', zh: '眼睛' },
  'Ears, Nose, Mouth & Throat': { es: 'Oídos, nariz, boca y garganta', zh: '耳鼻口喉' },
  'Heart & Circulation': { es: 'Corazón y circulación', zh: '心脏与循环' },
  'Breathing & Lungs': { es: 'Respiración y pulmones', zh: '呼吸与肺部' },
  'Digestive': { es: 'Digestivo', zh: '消化系统' },
  'Bladder & Urinary': { es: 'Vejiga y sistema urinario', zh: '膀胱与泌尿' },
  'Muscles & Joints': { es: 'Músculos y articulaciones', zh: '肌肉与关节' },
  'Skin': { es: 'Piel', zh: '皮肤' },
  'Nerves & Brain': { es: 'Nervios y cerebro', zh: '神经与大脑' },
  'Mood & Sleep': { es: 'Estado de ánimo y sueño', zh: '情绪与睡眠' },
  'Hormones & Metabolism': { es: 'Hormonas y metabolismo', zh: '激素与代谢' },
  'Blood & Lymph Nodes': { es: 'Sangre y ganglios linfáticos', zh: '血液与淋巴结' },
  'Allergies & Immune System': { es: 'Alergias y sistema inmunitario', zh: '过敏与免疫系统' },

  // Questions
  'Fevers or chills?': { es: '¿Fiebre o escalofríos?', zh: '发烧或发冷？' },
  'Night sweats?': { es: '¿Sudores nocturnos?', zh: '夜间盗汗？' },
  'Unexplained weight loss (more than 10 lbs)?': {
    es: '¿Pérdida de peso inexplicable (más de 10 libras)?',
    zh: '不明原因的体重减轻（超过10磅）？',
  },
  'Unusual fatigue or malaise?': { es: '¿Fatiga o malestar inusual?', zh: '异常疲劳或不适？' },
  'Recent changes in your vision?': { es: '¿Cambios recientes en su visión?', zh: '最近视力有变化吗？' },
  'Double or blurred vision?': { es: '¿Visión doble o borrosa?', zh: '复视或视力模糊？' },
  'Hearing loss or ringing in the ears?': {
    es: '¿Pérdida de audición o zumbido en los oídos?',
    zh: '听力下降或耳鸣？',
  },
  'Difficulty or pain when swallowing?': {
    es: '¿Dificultad o dolor al tragar?',
    zh: '吞咽困难或疼痛？',
  },
  'Hoarseness or a change in your voice?': {
    es: '¿Ronquera o cambio en su voz?',
    zh: '声音嘶哑或声音改变？',
  },
  'Chest pain or pressure?': { es: '¿Dolor u opresión en el pecho?', zh: '胸痛或胸闷？' },
  'Shortness of breath?': { es: '¿Falta de aire?', zh: '呼吸急促？' },
  'Racing or irregular heartbeat?': {
    es: '¿Latidos acelerados o irregulares?',
    zh: '心跳加速或不规律？',
  },
  'Leg swelling?': { es: '¿Hinchazón de las piernas?', zh: '腿部肿胀？' },
  'A cough that will not go away?': { es: '¿Tos que no se quita?', zh: '持续不愈的咳嗽？' },
  'Wheezing or asthma?': { es: '¿Sibilancias o asma?', zh: '喘息或哮喘？' },
  'Sleep apnea, or been told you snore heavily?': {
    es: '¿Apnea del sueño, o le han dicho que ronca fuerte?',
    zh: '睡眠呼吸暂停，或被告知打鼾严重？',
  },
  'Changes in bowel habits?': { es: '¿Cambios en los hábitos intestinales?', zh: '排便习惯改变？' },
  'Nausea or vomiting?': { es: '¿Náuseas o vómitos?', zh: '恶心或呕吐？' },
  'Abdominal pain?': { es: '¿Dolor abdominal?', zh: '腹痛？' },
  'Frequent heartburn, reflux, or stomach ulcers?': {
    es: '¿Acidez frecuente, reflujo o úlceras estomacales?',
    zh: '经常胃灼热、反流或胃溃疡？',
  },
  'Changes in bladder function?': { es: '¿Cambios en la función de la vejiga?', zh: '膀胱功能改变？' },
  'Increased urinary frequency or urgency?': {
    es: '¿Aumento de la frecuencia o urgencia urinaria?',
    zh: '尿频或尿急增加？',
  },
  'Difficulty starting or maintaining urination?': {
    es: '¿Dificultad para iniciar o mantener la micción?',
    zh: '排尿起始或维持困难？',
  },
  'Joint pain or swelling (besides your spine symptoms)?': {
    es: '¿Dolor o hinchazón articular (además de sus síntomas de columna)?',
    zh: '关节疼痛或肿胀（脊柱症状之外）？',
  },
  'General muscle weakness?': { es: '¿Debilidad muscular general?', zh: '全身肌肉无力？' },
  'Recent falls?': { es: '¿Caídas recientes?', zh: '最近跌倒？' },
  'Any new rash?': { es: '¿Alguna erupción nueva?', zh: '有新出现的皮疹吗？' },
  'Any current wounds, sores, or skin infections?': {
    es: '¿Alguna herida, llaga o infección de la piel actualmente?',
    zh: '目前有伤口、溃疡或皮肤感染吗？',
  },
  'Any skin breakdown from sitting or lying down?': {
    es: '¿Alguna lesión en la piel por estar sentado o acostado?',
    zh: '因久坐或久卧导致的皮肤破损？',
  },
  'Frequent headaches?': { es: '¿Dolores de cabeza frecuentes?', zh: '经常头痛？' },
  'Dizziness or lightheadedness?': { es: '¿Mareos o aturdimiento?', zh: '头晕或头重脚轻？' },
  'Seizures?': { es: '¿Convulsiones?', zh: '癫痫发作？' },
  'Memory or concentration problems?': {
    es: '¿Problemas de memoria o concentración?',
    zh: '记忆力或注意力问题？',
  },
  'Trouble with balance, or feeling unsteady on your feet?': {
    es: '¿Problemas de equilibrio o sensación de inestabilidad al caminar?',
    zh: '平衡困难，或走路时感觉不稳？',
  },
  'Increasing clumsiness with your hands — buttons, handwriting, dropping things?': {
    es: '¿Torpeza creciente en las manos: botones, escritura, dejar caer cosas?',
    zh: '双手越来越笨拙——扣扣子、写字、掉落物品？',
  },
  'Feeling down, depressed, or hopeless?': {
    es: '¿Se siente decaído, deprimido o sin esperanza?',
    zh: '感到情绪低落、抑郁或绝望？',
  },
  'Feeling anxious or on edge?': { es: '¿Se siente ansioso o nervioso?', zh: '感到焦虑或紧张？' },
  'Trouble sleeping because of your pain?': {
    es: '¿Dificultad para dormir a causa del dolor?',
    zh: '因疼痛而难以入睡？',
  },
  'Diabetes or high blood sugar?': { es: '¿Diabetes o azúcar alta en sangre?', zh: '糖尿病或高血糖？' },
  'Thyroid problems?': { es: '¿Problemas de tiroides?', zh: '甲状腺问题？' },
  'Osteoporosis, thinning bones, or a fracture from a minor fall?': {
    es: '¿Osteoporosis, huesos débiles o una fractura por una caída leve?',
    zh: '骨质疏松、骨质变薄，或因轻微跌倒而骨折？',
  },
  'Do you bruise or bleed easily?': {
    es: '¿Se le hacen moretones o sangra con facilidad?',
    zh: '容易瘀青或出血？',
  },
  'History of blood clots in the legs or lungs?': {
    es: '¿Antecedentes de coágulos en las piernas o los pulmones?',
    zh: '腿部或肺部血栓病史？',
  },
  'Swollen glands?': { es: '¿Ganglios inflamados?', zh: '淋巴结肿大？' },
  'Any history of cancer?': { es: '¿Algún antecedente de cáncer?', zh: '有癌症病史吗？' },
  'Any recent or frequent infections?': {
    es: '¿Infecciones recientes o frecuentes?',
    zh: '近期或频繁感染？',
  },
  'Seasonal allergies or hay fever?': {
    es: '¿Alergias estacionales o fiebre del heno?',
    zh: '季节性过敏或花粉症？',
  },
  'Do you take steroids or medicines that lower your immune system?': {
    es: '¿Toma esteroides o medicamentos que bajan sus defensas?',
    zh: '您是否服用类固醇或降低免疫力的药物？',
  },

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
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

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

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Review of Systems')}</h2>
        <p className="section-subtitle">
          {t('Please answer these quick yes/no screening questions. They help us spot other health issues that could change your treatment or your surgery plan.')}
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
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel={t('Continue to Final Review')}
      />
    </div>
  );
}
