'use client';

import { useIntake } from '../../lib/store';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// Display-only translations. Stored ROS values stay 'yes'/'no' so red-flag
// logic (e.g. bowelBladderChanges === 'yes') keeps working unchanged.
const LOCAL = {
  // Section title / subtitle
  'Review of Systems': { es: 'Revisión de sistemas', zh: '系统回顾' },
  'Please answer these quick yes/no screening questions. These help identify any other health concerns that may be important for your care.': {
    es: 'Por favor responda estas preguntas rápidas de sí/no. Ayudan a identificar otros problemas de salud que puedan ser importantes para su atención.',
    zh: '请回答这些快速的是/否筛查问题。它们有助于发现可能对您的护理很重要的其他健康问题。',
  },

  // Body-system headings
  'General / Constitutional': { es: 'General / Constitucional', zh: '一般 / 全身' },
  'Heart & Circulation': { es: 'Corazón y circulación', zh: '心脏与循环' },
  'Neurological': { es: 'Neurológico', zh: '神经系统' },
  'Digestive': { es: 'Digestivo', zh: '消化系统' },
  'Bladder & Urinary': { es: 'Vejiga y sistema urinario', zh: '膀胱与泌尿' },
  'Musculoskeletal': { es: 'Musculoesquelético', zh: '肌肉骨骼' },
  'Safety Screening': { es: 'Detección de seguridad', zh: '安全筛查' },

  // Symptom question labels
  'Fevers or chills?': { es: '¿Fiebre o escalofríos?', zh: '发烧或发冷？' },
  'Night sweats?': { es: '¿Sudores nocturnos?', zh: '夜间盗汗？' },
  'Unexplained weight loss (more than 10 lbs)?': {
    es: '¿Pérdida de peso inexplicable (más de 10 libras)?',
    zh: '不明原因的体重减轻（超过10磅）？',
  },
  'Unusual fatigue or malaise?': { es: '¿Fatiga o malestar inusual?', zh: '异常疲劳或不适？' },
  'Chest pain or pressure?': { es: '¿Dolor u opresión en el pecho?', zh: '胸痛或胸闷？' },
  'Shortness of breath?': { es: '¿Falta de aire?', zh: '呼吸急促？' },
  'Leg swelling?': { es: '¿Hinchazón de las piernas?', zh: '腿部肿胀？' },
  'Frequent headaches?': { es: '¿Dolores de cabeza frecuentes?', zh: '经常头痛？' },
  'Dizziness or lightheadedness?': { es: '¿Mareos o aturdimiento?', zh: '头晕或头重脚轻？' },
  'Seizures?': { es: '¿Convulsiones?', zh: '癫痫发作？' },
  'Memory or concentration problems?': {
    es: '¿Problemas de memoria o concentración?',
    zh: '记忆力或注意力问题？',
  },
  'Changes in bowel habits?': { es: '¿Cambios en los hábitos intestinales?', zh: '排便习惯改变？' },
  'Nausea or vomiting?': { es: '¿Náuseas o vómitos?', zh: '恶心或呕吐？' },
  'Abdominal pain?': { es: '¿Dolor abdominal?', zh: '腹痛？' },
  'Changes in bladder function?': {
    es: '¿Cambios en la función de la vejiga?',
    zh: '膀胱功能改变？',
  },
  'Increased urinary frequency or urgency?': {
    es: '¿Aumento de la frecuencia o urgencia urinaria?',
    zh: '尿频或尿急增加？',
  },
  'Difficulty starting or maintaining urination?': {
    es: '¿Dificultad para iniciar o mantener la micción?',
    zh: '排尿困难或难以维持排尿？',
  },
  'Joint pain or swelling (besides your spine symptoms)?': {
    es: '¿Dolor o hinchazón en las articulaciones (además de sus síntomas de columna)?',
    zh: '关节疼痛或肿胀（除脊柱症状之外）？',
  },
  'General muscle weakness?': { es: '¿Debilidad muscular general?', zh: '全身肌肉无力？' },
  'Recent falls?': { es: '¿Caídas recientes?', zh: '近期跌倒？' },
  'Any recent infections?': { es: '¿Alguna infección reciente?', zh: '近期有任何感染？' },
  'Any current wounds or skin issues?': {
    es: '¿Alguna herida o problema de piel actual?',
    zh: '目前有任何伤口或皮肤问题？',
  },
  'Any history of cancer?': { es: '¿Algún antecedente de cáncer?', zh: '有任何癌症史？' },

  // Additional notes
  "Anything else you'd like to mention?": {
    es: '¿Algo más que le gustaría mencionar?',
    zh: '还有什么想补充的吗？',
  },
  'Any other symptoms or concerns not covered above...': {
    es: 'Cualquier otro síntoma o inquietud no cubierto anteriormente...',
    zh: '上面未涵盖的任何其他症状或疑虑……',
  },

  // Navigation
  'Continue to Final Review': { es: 'Continuar a la revisión final', zh: '继续进行最终审核' },
};

// ROS questions grouped by system
const ROS_SECTIONS = [
  {
    id: 'constitutional',
    title: 'General / Constitutional',
    questions: [
      { id: 'fevers', label: 'Fevers or chills?' },
      { id: 'nightSweats', label: 'Night sweats?' },
      { id: 'unexplainedWeightLoss', label: 'Unexplained weight loss (more than 10 lbs)?' },
      { id: 'fatigue', label: 'Unusual fatigue or malaise?' },
    ],
  },
  {
    id: 'cardiovascular',
    title: 'Heart & Circulation',
    questions: [
      { id: 'chestPain', label: 'Chest pain or pressure?' },
      { id: 'shortnessOfBreath', label: 'Shortness of breath?' },
      { id: 'swelling', label: 'Leg swelling?' },
    ],
  },
  {
    id: 'neurological',
    title: 'Neurological',
    questions: [
      { id: 'headaches', label: 'Frequent headaches?' },
      { id: 'dizziness', label: 'Dizziness or lightheadedness?' },
      { id: 'seizures', label: 'Seizures?' },
      { id: 'memoryIssues', label: 'Memory or concentration problems?' },
    ],
  },
  {
    id: 'gastrointestinal',
    title: 'Digestive',
    questions: [
      { id: 'bowelChanges', label: 'Changes in bowel habits?' },
      { id: 'nausea', label: 'Nausea or vomiting?' },
      { id: 'abdominalPain', label: 'Abdominal pain?' },
    ],
  },
  {
    id: 'genitourinary',
    title: 'Bladder & Urinary',
    questions: [
      { id: 'bladderChanges', label: 'Changes in bladder function?' },
      { id: 'urinaryFrequency', label: 'Increased urinary frequency or urgency?' },
      { id: 'urinaryRetention', label: 'Difficulty starting or maintaining urination?' },
    ],
  },
  {
    id: 'musculoskeletal',
    title: 'Musculoskeletal',
    questions: [
      { id: 'jointPain', label: 'Joint pain or swelling (besides your spine symptoms)?' },
      { id: 'muscleWeakness', label: 'General muscle weakness?' },
      { id: 'falls', label: 'Recent falls?' },
    ],
  },
  {
    id: 'general',
    title: 'Safety Screening',
    questions: [
      { id: 'recentInfections', label: 'Any recent infections?' },
      { id: 'woundIssues', label: 'Any current wounds or skin issues?' },
      { id: 'cancerHistory', label: 'Any history of cancer?' },
    ],
  },
];

export default function ReviewOfSystems({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const ros = data.reviewOfSystems;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const updateROS = (section, questionId, value) => {
    setNested(`reviewOfSystems.${section}.${questionId}`, value);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Review of Systems')}</h2>
        <p className="section-subtitle">
          {t('Please answer these quick yes/no screening questions. These help identify any other health concerns that may be important for your care.')}
        </p>
      </div>

      <div className="space-y-4">
        {ROS_SECTIONS.map((section) => (
          <div key={section.id} className="card">
            <h3 className="text-lg font-medium text-navy-600 mb-4">{t(section.title)}</h3>
            <div className="space-y-3">
              {section.questions.map((q) => {
                const value = ros[section.id]?.[q.id];
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
        ))}

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
