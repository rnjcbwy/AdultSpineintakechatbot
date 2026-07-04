'use client';

import { useIntake } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import StepNavigation from '../ui/StepNavigation';

const LOCAL = {
  // Section header
  'Social History': { es: 'Historia social', zh: '社会史' },
  'This information helps your surgeon understand your overall health and lifestyle. All responses are confidential.': {
    es: 'Esta información ayuda a su cirujano a comprender su salud general y su estilo de vida. Todas las respuestas son confidenciales.',
    zh: '这些信息有助于您的外科医生了解您的整体健康和生活方式。所有回答均保密。',
  },

  // Tobacco
  'Tobacco Use': { es: 'Consumo de tabaco', zh: '烟草使用' },
  'Never': { es: 'Nunca', zh: '从不' },
  'Former smoker': { es: 'Exfumador', zh: '曾经吸烟' },
  'Current smoker': { es: 'Fumador actual', zh: '目前吸烟' },
  'Current vaping/e-cigarette': { es: 'Vapeo/cigarrillo electrónico actual', zh: '目前使用电子烟' },
  'Smokeless tobacco': { es: 'Tabaco sin humo', zh: '无烟烟草' },
  'How long did you smoke? When did you quit?': {
    es: '¿Cuánto tiempo fumó? ¿Cuándo lo dejó?',
    zh: '您吸烟多久了？何时戒烟的？',
  },
  'How much and for how long?': {
    es: '¿Cuánto y por cuánto tiempo?',
    zh: '吸多少，吸了多久？',
  },
  'Note: Tobacco use is an important factor in spine surgery healing and outcomes. Your surgeon may discuss this with you.': {
    es: 'Nota: El consumo de tabaco es un factor importante en la curación y los resultados de la cirugía de columna. Su cirujano podría hablar de esto con usted.',
    zh: '注意：烟草使用是脊柱手术愈合和效果的重要因素。您的外科医生可能会与您讨论这一点。',
  },

  // Alcohol
  'Alcohol Use': { es: 'Consumo de alcohol', zh: '饮酒' },
  'None': { es: 'Ninguno', zh: '无' },
  'Social/occasional': { es: 'Social/ocasional', zh: '社交/偶尔' },
  'Moderate (a few per week)': { es: 'Moderado (algunos por semana)', zh: '适度（每周几次）' },
  'Daily': { es: 'Diariamente', zh: '每天' },
  'Former heavy use': { es: 'Consumo excesivo en el pasado', zh: '曾经大量饮酒' },
  'Any additional details (optional)': {
    es: 'Cualquier detalle adicional (opcional)',
    zh: '任何其他详情（可选）',
  },

  // Recreational drugs
  'Recreational Drug Use': { es: 'Consumo de drogas recreativas', zh: '娱乐性药物使用' },
  'This is asked for your safety during medical care. Your responses are confidential.': {
    es: 'Esto se pregunta por su seguridad durante la atención médica. Sus respuestas son confidenciales.',
    zh: '询问此项是为了在医疗过程中保障您的安全。您的回答将保密。',
  },
  'Marijuana/cannabis': { es: 'Marihuana/cannabis', zh: '大麻' },
  'Other': { es: 'Otro', zh: '其他' },
  'Prefer not to answer': { es: 'Prefiero no responder', zh: '不愿回答' },
  'Details (optional)': { es: 'Detalles (opcional)', zh: '详情（可选）' },

  // Work & Occupation
  'Work & Occupation': { es: 'Trabajo y ocupación', zh: '工作与职业' },
  'Occupation': { es: 'Ocupación', zh: '职业' },
  'Your job or profession': { es: 'Su trabajo o profesión', zh: '您的工作或职业' },
  'Current work status': { es: 'Situación laboral actual', zh: '目前的工作状况' },
  'Working full-time': { es: 'Trabajando tiempo completo', zh: '全职工作' },
  'Working part-time': { es: 'Trabajando medio tiempo', zh: '兼职工作' },
  'Working with restrictions': { es: 'Trabajando con restricciones', zh: '有限制地工作' },
  'On medical leave': { es: 'De baja médica', zh: '病假中' },
  'Not working due to symptoms': { es: 'Sin trabajar debido a los síntomas', zh: '因症状而未工作' },
  'Retired': { es: 'Jubilado', zh: '已退休' },
  'Disabled': { es: 'Discapacitado', zh: '残疾' },
  'Student': { es: 'Estudiante', zh: '学生' },
  'Homemaker': { es: 'Ama/o de casa', zh: '家庭主妇/夫' },
  'Disability status': { es: 'Estado de discapacidad', zh: '残疾状况' },
  'Applying for disability': { es: 'Solicitando discapacidad', zh: '正在申请残疾' },
  'On temporary disability': { es: 'En discapacidad temporal', zh: '临时残疾中' },
  'On permanent disability': { es: 'En discapacidad permanente', zh: '永久残疾中' },

  // Living Situation & Mobility
  'Living Situation & Mobility': { es: 'Situación de vivienda y movilidad', zh: '居住情况与行动能力' },
  'Living situation': { es: 'Situación de vivienda', zh: '居住情况' },
  'Live alone': { es: 'Vivo solo/a', zh: '独居' },
  'Live with spouse/partner': { es: 'Vivo con cónyuge/pareja', zh: '与配偶/伴侣同住' },
  'Live with family': { es: 'Vivo con familia', zh: '与家人同住' },
  'Live with roommate(s)': { es: 'Vivo con compañero(s) de cuarto', zh: '与室友同住' },
  'Assisted living facility': { es: 'Residencia con asistencia', zh: '协助生活机构' },
  'Nursing home': { es: 'Hogar de ancianos', zh: '养老院' },
  'Do you use any mobility aids?': {
    es: '¿Usa algún dispositivo de ayuda para la movilidad?',
    zh: '您是否使用任何助行器具？',
  },
  'Cane': { es: 'Bastón', zh: '拐杖' },
  'Walker': { es: 'Andador', zh: '助行器' },
  'Wheelchair (sometimes)': { es: 'Silla de ruedas (a veces)', zh: '轮椅（有时）' },
  'Wheelchair (always)': { es: 'Silla de ruedas (siempre)', zh: '轮椅（总是）' },
  'Motorized scooter': { es: 'Scooter motorizado', zh: '电动代步车' },

  // Exercise & Activity
  'Exercise & Activity': { es: 'Ejercicio y actividad', zh: '运动与活动' },
  'Current exercise level': { es: 'Nivel de ejercicio actual', zh: '目前的运动水平' },
  'Sedentary': { es: 'Sedentario', zh: '久坐不动' },
  'Light activity': { es: 'Actividad ligera', zh: '轻度活动' },
  'Moderate exercise': { es: 'Ejercicio moderado', zh: '适度运动' },
  'Very active': { es: 'Muy activo', zh: '非常活跃' },
  'Limited by symptoms': { es: 'Limitado por los síntomas', zh: '受症状限制' },
  'Sports or hobbies affected by symptoms': {
    es: 'Deportes o pasatiempos afectados por los síntomas',
    zh: '受症状影响的运动或爱好',
  },
  'e.g., Golf, gardening, hiking': {
    es: 'p. ej., golf, jardinería, senderismo',
    zh: '例如：高尔夫、园艺、徒步',
  },

  // Additional Context / Compensation
  'Additional Context': { es: 'Contexto adicional', zh: '补充背景' },
  'This information helps your care team understand the full picture. Your answers do not affect the quality of your care.': {
    es: 'Esta información ayuda a su equipo de atención a comprender el panorama completo. Sus respuestas no afectan la calidad de su atención.',
    zh: '这些信息有助于您的医疗团队全面了解情况。您的回答不会影响您所获得的医疗质量。',
  },
  'Is your condition related to any of the following?': {
    es: '¿Su afección está relacionada con alguno de los siguientes?',
    zh: '您的病情是否与以下任何情况相关？',
  },
  'Not applicable': { es: 'No aplica', zh: '不适用' },
  "Workers' compensation claim": { es: 'Reclamo de compensación laboral', zh: '工伤赔偿申请' },
  'Motor vehicle accident': { es: 'Accidente de vehículo motorizado', zh: '机动车事故' },
  'Personal injury case': { es: 'Caso de lesiones personales', zh: '人身伤害案件' },

  // Navigation
  'Continue to Family History': { es: 'Continuar a la historia familiar', zh: '继续填写家族史' },
};

export default function SocialHistory({ onNext, onBack }) {
  const { data, setField } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const sh = data.socialHistory;

  const update = (field, value) => setField('socialHistory', field, value);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Social History')}</h2>
        <p className="section-subtitle">
          {t('This information helps your surgeon understand your overall health and lifestyle. All responses are confidential.')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Tobacco */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">{t('Tobacco Use')}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Never', 'Former smoker', 'Current smoker', 'Current vaping/e-cigarette', 'Smokeless tobacco'].map((opt) => (
              <button
                key={opt}
                onClick={() => update('tobaccoUse', opt)}
                className={`chip ${sh.tobaccoUse === opt ? 'chip-selected' : 'chip-unselected'}`}
              >
                {t(opt)}
              </button>
            ))}
          </div>
          {(sh.tobaccoUse === 'Former smoker' || sh.tobaccoUse === 'Current smoker' || sh.tobaccoUse === 'Current vaping/e-cigarette') && (
            <input
              type="text"
              value={sh.tobaccoDetails || ''}
              onChange={(e) => update('tobaccoDetails', e.target.value)}
              placeholder={sh.tobaccoUse === 'Former smoker' ? t('How long did you smoke? When did you quit?') : t('How much and for how long?')}
            />
          )}
          {(sh.tobaccoUse === 'Current smoker' || sh.tobaccoUse === 'Current vaping/e-cigarette') && (
            <p className="text-xs text-amber-600 mt-2">
              {t('Note: Tobacco use is an important factor in spine surgery healing and outcomes. Your surgeon may discuss this with you.')}
            </p>
          )}
        </div>

        {/* Alcohol */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">{t('Alcohol Use')}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {['None', 'Social/occasional', 'Moderate (a few per week)', 'Daily', 'Former heavy use'].map((opt) => (
              <button
                key={opt}
                onClick={() => update('alcoholUse', opt)}
                className={`chip ${sh.alcoholUse === opt ? 'chip-selected' : 'chip-unselected'}`}
              >
                {t(opt)}
              </button>
            ))}
          </div>
          {sh.alcoholUse && sh.alcoholUse !== 'None' && (
            <input
              type="text"
              value={sh.alcoholDetails || ''}
              onChange={(e) => update('alcoholDetails', e.target.value)}
              placeholder={t('Any additional details (optional)')}
            />
          )}
        </div>

        {/* Recreational drugs */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">{t('Recreational Drug Use')}</h3>
          <p className="text-sm text-gray-400 mb-3">
            {t('This is asked for your safety during medical care. Your responses are confidential.')}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {['None', 'Marijuana/cannabis', 'Other', 'Prefer not to answer'].map((opt) => (
              <button
                key={opt}
                onClick={() => update('drugUse', opt)}
                className={`chip ${sh.drugUse === opt ? 'chip-selected' : 'chip-unselected'}`}
              >
                {t(opt)}
              </button>
            ))}
          </div>
          {(sh.drugUse === 'Marijuana/cannabis' || sh.drugUse === 'Other') && (
            <input
              type="text"
              value={sh.drugDetails || ''}
              onChange={(e) => update('drugDetails', e.target.value)}
              placeholder={t('Details (optional)')}
            />
          )}
        </div>

        {/* Occupation & Work */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">{t('Work & Occupation')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('Occupation')}</label>
              <input
                type="text"
                value={sh.occupation || ''}
                onChange={(e) => update('occupation', e.target.value)}
                placeholder={t('Your job or profession')}
              />
            </div>
            <div>
              <label className="form-label">{t('Current work status')}</label>
              <select value={sh.workStatus || ''} onChange={(e) => update('workStatus', e.target.value)}>
                <option value="">{t('Select...')}</option>
                <option value="Working full-time">{t('Working full-time')}</option>
                <option value="Working part-time">{t('Working part-time')}</option>
                <option value="Working with restrictions">{t('Working with restrictions')}</option>
                <option value="On medical leave">{t('On medical leave')}</option>
                <option value="Not working due to symptoms">{t('Not working due to symptoms')}</option>
                <option value="Retired">{t('Retired')}</option>
                <option value="Disabled">{t('Disabled')}</option>
                <option value="Student">{t('Student')}</option>
                <option value="Homemaker">{t('Homemaker')}</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label">{t('Disability status')}</label>
            <div className="flex flex-wrap gap-2">
              {['None', 'Applying for disability', 'On temporary disability', 'On permanent disability'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => update('disabilityStatus', opt)}
                  className={`chip ${sh.disabilityStatus === opt ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {t(opt)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Living Situation & Mobility */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">{t('Living Situation & Mobility')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('Living situation')}</label>
              <select value={sh.livingSituation || ''} onChange={(e) => update('livingSituation', e.target.value)}>
                <option value="">{t('Select...')}</option>
                <option value="Live alone">{t('Live alone')}</option>
                <option value="Live with spouse/partner">{t('Live with spouse/partner')}</option>
                <option value="Live with family">{t('Live with family')}</option>
                <option value="Live with roommate(s)">{t('Live with roommate(s)')}</option>
                <option value="Assisted living facility">{t('Assisted living facility')}</option>
                <option value="Nursing home">{t('Nursing home')}</option>
              </select>
            </div>
            <div>
              <label className="form-label">{t('Do you use any mobility aids?')}</label>
              <select value={sh.mobilityAids || ''} onChange={(e) => update('mobilityAids', e.target.value)}>
                <option value="">{t('Select...')}</option>
                <option value="None">{t('None')}</option>
                <option value="Cane">{t('Cane')}</option>
                <option value="Walker">{t('Walker')}</option>
                <option value="Wheelchair (sometimes)">{t('Wheelchair (sometimes)')}</option>
                <option value="Wheelchair (always)">{t('Wheelchair (always)')}</option>
                <option value="Motorized scooter">{t('Motorized scooter')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exercise & Activity */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">{t('Exercise & Activity')}</h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('Current exercise level')}</label>
              <div className="flex flex-wrap gap-2">
                {['Sedentary', 'Light activity', 'Moderate exercise', 'Very active', 'Limited by symptoms'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => update('exerciseLevel', opt)}
                    className={`chip ${sh.exerciseLevel === opt ? 'chip-selected' : 'chip-unselected'}`}
                  >
                    {t(opt)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">{t('Sports or hobbies affected by symptoms')}</label>
              <input
                type="text"
                value={sh.sports || ''}
                onChange={(e) => update('sports', e.target.value)}
                placeholder={t('e.g., Golf, gardening, hiking')}
              />
            </div>
          </div>
        </div>

        {/* Compensation/Legal */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-3">{t('Additional Context')}</h3>
          <p className="text-sm text-gray-400 mb-3">
            {t('This information helps your care team understand the full picture. Your answers do not affect the quality of your care.')}
          </p>
          <div>
            <label className="form-label">{t('Is your condition related to any of the following?')}</label>
            <div className="flex flex-wrap gap-2">
              {['Not applicable', 'Workers\' compensation claim', 'Motor vehicle accident', 'Personal injury case', 'Prefer not to answer'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => update('compensationCase', opt)}
                  className={`chip ${sh.compensationCase === opt ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {t(opt)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel={t('Continue to Family History')}
        showSkip={true}
      />
    </div>
  );
}
