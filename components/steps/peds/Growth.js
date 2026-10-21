'use client';

import { useIntake } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import { ageOn } from '../../../lib/service';
import StepNavigation from '../../ui/StepNavigation';

// The sports and activities the pediatric intakes offered (the ortho list is
// the spine list plus four).
const SPORTS = [
  'Gymnastics', 'Dance', 'Swimming', 'Basketball', 'Soccer', 'Football',
  'Cheerleading', 'Running / Track', 'Baseball / Softball', 'Volleyball',
  'Tennis', 'Martial arts', 'Yoga / Pilates', 'Hockey', 'Lacrosse',
  'Wrestling', 'Weight training', 'Cycling', 'Skiing / Snowboarding',
  'Skateboarding', 'Climbing', 'Horseback riding',
];

const ACTIVITY_LEVELS = ['Sedentary', 'Light activity', 'Moderate activity', 'Very active', 'Competitive athlete'];

// The stored value and its label; the review page shows the label.
export const MENARCHE_ONSET = [
  ['~6 months ago', 'About 6 months ago'],
  ['~1 year ago', 'About 1 year ago'],
  ['~18 months ago', 'About 18 months ago'],
  ['~2 years ago', 'About 2 years ago'],
  ['2+ years ago', 'More than 2 years ago'],
];

const HANDEDNESS = ['Right-handed', 'Left-handed', 'Either / too young to tell'];

// Shared with the review page, which shows the same labels and values.
export const GROWTH_STRINGS = {
  'Growth and activities': { es: 'Crecimiento y actividades', zh: '生长发育与活动' },
  'A few things about how {name} is growing and what they like to do. Skip anything you do not know.': {
    es: 'Algunos datos sobre cómo está creciendo {name} y qué le gusta hacer. Omita lo que no sepa.',
    zh: '关于{name}的生长情况和平时喜欢的活动。不清楚的可以跳过。',
  },
  'the patient': { es: 'el paciente', zh: '患者' },
  'Growth Information': { es: 'Información sobre el crecimiento', zh: '生长发育信息' },
  'Height': { es: 'Estatura', zh: '身高' },
  'Feet': { es: 'Pies', zh: '英尺' },
  'In': { es: 'Pulg.', zh: '英寸' },
  'ft': { es: 'pies', zh: '英尺' },
  'in': { es: 'pulg.', zh: '英寸' },
  'Weight (lbs)': { es: 'Peso (libras)', zh: '体重（磅）' },
  'Weight in pounds': { es: 'Peso en libras', zh: '体重（磅）' },
  'Has {name} started having periods?': { es: '¿{name} ya ha tenido su primera menstruación?', zh: '{name}是否已经开始来月经？' },
  'About when did the first period start?': { es: '¿Aproximadamente cuándo fue la primera menstruación?', zh: '第一次月经大约是什么时候？' },
  'About 6 months ago': { es: 'Hace unos 6 meses', zh: '大约6个月前' },
  'About 1 year ago': { es: 'Hace aproximadamente 1 año', zh: '大约1年前' },
  'About 18 months ago': { es: 'Hace unos 18 meses', zh: '大约18个月前' },
  'About 2 years ago': { es: 'Hace aproximadamente 2 años', zh: '大约2年前' },
  'More than 2 years ago': { es: 'Hace más de 2 años', zh: '2年以上' },
  'Has there been a noticeable growth spurt recently?': { es: '¿Ha habido un estirón notable recientemente?', zh: '最近是否有明显的快速长高？' },
  'Unsure': { es: 'No estoy seguro', zh: '不确定' },
  'Which hand does {name} write with?': { es: '¿Con qué mano escribe {name}?', zh: '{name}用哪只手写字？' },
  'Right-handed': { es: 'Diestro (mano derecha)', zh: '右手' },
  'Left-handed': { es: 'Zurdo (mano izquierda)', zh: '左手' },
  'Either / too young to tell': { es: 'Cualquiera / aún es muy pequeño para saberlo', zh: '两只手都用 / 年龄太小尚不确定' },
  'School and activities': { es: 'Escuela y actividades', zh: '学校与活动' },
  'Grade in school': { es: 'Grado escolar', zh: '就读年级' },
  'e.g., 7th grade': { es: 'p. ej., 7.º grado', zh: '例如：七年级' },
  'School': { es: 'Escuela', zh: '学校' },
  'Name of the school (optional)': { es: 'Nombre de la escuela (opcional)', zh: '学校名称（可选）' },
  'Activity level': { es: 'Nivel de actividad', zh: '活动量' },
  'Sedentary': { es: 'Sedentario', zh: '久坐少动' },
  'Light activity': { es: 'Actividad ligera', zh: '轻度活动' },
  'Moderate activity': { es: 'Actividad moderada', zh: '中度活动' },
  'Very active': { es: 'Muy activo', zh: '非常活跃' },
  'Competitive athlete': { es: 'Deportista de competición', zh: '竞技运动员' },
  'Sports and activities': { es: 'Deportes y actividades', zh: '运动与活动' },
  'Tap everything {name} does, or wants to get back to.': { es: 'Marque todo lo que {name} practica o a lo que quiere volver.', zh: '请选择{name}目前参加的、或希望恢复的所有活动。' },
  'Gymnastics': { es: 'Gimnasia', zh: '体操' },
  'Dance': { es: 'Baile', zh: '舞蹈' },
  'Swimming': { es: 'Natación', zh: '游泳' },
  'Basketball': { es: 'Baloncesto', zh: '篮球' },
  'Soccer': { es: 'Fútbol', zh: '足球' },
  'Football': { es: 'Fútbol americano', zh: '美式橄榄球' },
  'Cheerleading': { es: 'Porrismo', zh: '啦啦队' },
  'Running / Track': { es: 'Correr / Atletismo', zh: '跑步 / 田径' },
  'Baseball / Softball': { es: 'Béisbol / Sóftbol', zh: '棒球 / 垒球' },
  'Volleyball': { es: 'Voleibol', zh: '排球' },
  'Tennis': { es: 'Tenis', zh: '网球' },
  'Martial arts': { es: 'Artes marciales', zh: '武术' },
  'Yoga / Pilates': { es: 'Yoga / Pilates', zh: '瑜伽 / 普拉提' },
  'Hockey': { es: 'Hockey', zh: '曲棍球 / 冰球' },
  'Lacrosse': { es: 'Lacrosse', zh: '长曲棍球' },
  'Wrestling': { es: 'Lucha', zh: '摔跤' },
  'Weight training': { es: 'Entrenamiento con pesas', zh: '力量训练' },
  'Cycling': { es: 'Ciclismo', zh: '骑自行车' },
  'Skiing / Snowboarding': { es: 'Esquí / Snowboard', zh: '滑雪 / 单板滑雪' },
  'Skateboarding': { es: 'Patineta', zh: '滑板' },
  'Climbing': { es: 'Escalada', zh: '攀岩' },
  'Horseback riding': { es: 'Equitación', zh: '骑马' },
  'Other activities': { es: 'Otras actividades', zh: '其他活动' },
  'Anything else, such as an instrument, a club, or a job': { es: 'Cualquier otra cosa, como un instrumento, un club o un trabajo', zh: '其他内容，例如乐器、社团或工作' },
};

const EMPTY = { heightFeet: '', heightInches: '', weightLbs: '', hasMenarche: '', menarcheOnset: '', recentGrowthSpurt: '', handedness: '', grade: '', school: '', sports: [], otherActivities: '', activityLevel: '' };

function ChipRow({ options, value, onChange, t }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([id, label]) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(active ? '' : id)}
            aria-pressed={active}
            className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${active ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'}`}
          >
            {t(label)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A child's growth, handedness, school and activities (the pediatric
 * intakes' Growth Information and the school-and-sports half of their social
 * history). Everything is optional. Stored under demographics.growth.
 */
export default function Growth({ onNext, onBack }) {
  const { data, setField } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...GROWTH_STRINGS }, lang);
  const d = data.demographics || {};
  const gr = { ...EMPTY, ...(d.growth || {}) };
  const set = (field, value) => setField('demographics', 'growth', { ...gr, [field]: value });
  const name = d.firstName || t('the patient');
  const withName = (s) => t(s).replace('{name}', name);

  // Menarche is asked for a girl of 8 to 18, as the pediatric intakes did.
  const age = ageOn(d.dob);
  const asksMenarche = d.sex === 'Female' && !Number.isNaN(age) && age >= 8 && age <= 18;
  const yesNo = [['yes', 'Yes'], ['no', 'No']];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Growth and activities')}</h2>
        <p className="section-subtitle">{withName('A few things about how {name} is growing and what they like to do. Skip anything you do not know.')}</p>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Growth Information')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('Height')}</label>
              <div className="flex items-center gap-2">
                <input type="number" inputMode="numeric" min="1" max="8" className="w-24" placeholder={t('Feet')} value={gr.heightFeet} onChange={(e) => set('heightFeet', e.target.value)} />
                <span className="text-sm text-gray-500">{t('ft')}</span>
                <input type="number" inputMode="numeric" min="0" max="11" className="w-24" placeholder={t('In')} value={gr.heightInches} onChange={(e) => set('heightInches', e.target.value)} />
                <span className="text-sm text-gray-500">{t('in')}</span>
              </div>
            </div>
            <div>
              <label className="form-label">{t('Weight (lbs)')}</label>
              <input type="number" inputMode="numeric" min="1" max="500" placeholder={t('Weight in pounds')} value={gr.weightLbs} onChange={(e) => set('weightLbs', e.target.value)} />
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <label className="form-label">{t('Has there been a noticeable growth spurt recently?')}</label>
              <ChipRow t={t} options={[...yesNo, ['unsure', 'Unsure']]} value={gr.recentGrowthSpurt} onChange={(v) => set('recentGrowthSpurt', v)} />
            </div>

            {asksMenarche && (
              <>
                <div>
                  <label className="form-label">{withName('Has {name} started having periods?')}</label>
                  <ChipRow t={t} options={yesNo} value={gr.hasMenarche} onChange={(v) => setField('demographics', 'growth', { ...gr, hasMenarche: v, menarcheOnset: v === 'yes' ? gr.menarcheOnset : '' })} />
                </div>
                {gr.hasMenarche === 'yes' && (
                  <div className="md:w-1/2">
                    <label className="form-label">{t('About when did the first period start?')}</label>
                    <select value={gr.menarcheOnset} onChange={(e) => set('menarcheOnset', e.target.value)}>
                      <option value="">{t('Select...')}</option>
                      {MENARCHE_ONSET.map(([id, label]) => <option key={id} value={id}>{t(label)}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="form-label">{withName('Which hand does {name} write with?')}</label>
              <ChipRow t={t} options={HANDEDNESS.map((h) => [h, h])} value={gr.handedness} onChange={(v) => set('handedness', v)} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('School and activities')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('Grade in school')}</label>
              <input type="text" value={gr.grade} onChange={(e) => set('grade', e.target.value)} placeholder={t('e.g., 7th grade')} />
            </div>
            <div>
              <label className="form-label">{t('School')}</label>
              <input type="text" value={gr.school} onChange={(e) => set('school', e.target.value)} placeholder={t('Name of the school (optional)')} />
            </div>
            <div>
              <label className="form-label">{t('Activity level')}</label>
              <select value={gr.activityLevel} onChange={(e) => set('activityLevel', e.target.value)}>
                <option value="">{t('Select...')}</option>
                {ACTIVITY_LEVELS.map((o) => <option key={o} value={o}>{t(o)}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="form-label">{t('Sports and activities')}</label>
            <p className="text-xs text-gray-400 mb-2">{withName('Tap everything {name} does, or wants to get back to.')}</p>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => {
                const active = (gr.sports || []).includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('sports', active ? gr.sports.filter((x) => x !== s) : [...(gr.sports || []), s])}
                    aria-pressed={active}
                    className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${active ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'}`}
                  >
                    {t(s)}
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <label className="form-label">{t('Other activities')}</label>
              <input type="text" value={gr.otherActivities} onChange={(e) => set('otherActivities', e.target.value)} placeholder={t('Anything else, such as an instrument, a club, or a job')} />
            </div>
          </div>
        </div>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel={t('Continue')} />
    </div>
  );
}
