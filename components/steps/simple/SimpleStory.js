'use client';

import { useIntake, useService } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import { SIMPLE_AREAS, SIMPLE_DURATIONS, SIMPLE_TRENDS, SIMPLE_CHANGE } from '../../../lib/simple';
import StepNavigation from '../../ui/StepNavigation';
import { TextArea } from '../../ui/Fields';
import { Card, BigChoice, PainNumbers } from './Big';

const LOCAL = {
  'What is bothering you?': { es: '¿Qué le molesta?', zh: '您哪里不舒服？' },
  'What has changed since your last visit?': { es: '¿Qué ha cambiado desde su última visita?', zh: '自上次就诊以来有什么变化？' },
  'Tell us in your own words. You can also tap the microphone and say it.': { es: 'Cuéntenos con sus propias palabras. También puede tocar el micrófono y decirlo.', zh: '请用您自己的话说明。您也可以点按麦克风口述。' },
  'In your own words, what is the problem?': { es: 'Con sus propias palabras, ¿cuál es el problema?', zh: '请用您自己的话描述问题。' },
  'For example: my low back hurts and the pain goes down my right leg.': { es: 'Por ejemplo: me duele la parte baja de la espalda y el dolor baja por la pierna derecha.', zh: '例如：我的下背部疼痛，并且疼痛沿右腿向下延伸。' },
  'How are you doing compared with your last visit?': { es: '¿Cómo está en comparación con su última visita?', zh: '与上次就诊相比，您现在怎么样？' },
  'Tell us what has changed.': { es: 'Cuéntenos qué ha cambiado.', zh: '请告诉我们有什么变化。' },
  'For example: the leg pain is gone but my back still hurts when I stand.': { es: 'Por ejemplo: el dolor de la pierna desapareció, pero la espalda todavía me duele al estar de pie.', zh: '例如：腿痛已经消失，但站立时背部仍然疼痛。' },
  'Where does it hurt? Tap all that apply.': { es: '¿Dónde le duele? Toque todo lo que corresponda.', zh: '哪里疼？请点选所有适用的部位。' },
  'How long has this been going on?': { es: '¿Desde hace cuánto tiempo tiene este problema?', zh: '这个问题持续多久了？' },
  'How bad is the pain today? 0 is no pain, 10 is the worst pain you can imagine.': { es: '¿Qué tan fuerte es el dolor hoy? 0 es sin dolor, 10 es el peor dolor que pueda imaginar.', zh: '今天疼痛有多严重？0 表示不痛，10 表示您能想象的最严重的疼痛。' },
  'Is it getting better, worse, or staying the same?': { es: '¿Está mejorando, empeorando o sigue igual?', zh: '是在好转、恶化，还是保持不变？' },
  'Neck': { es: 'Cuello', zh: '颈部' },
  'Upper or middle back': { es: 'Espalda alta o media', zh: '上背部或中背部' },
  'Low back': { es: 'Espalda baja', zh: '下背部' },
  'Right arm or hand': { es: 'Brazo o mano derecha', zh: '右臂或右手' },
  'Left arm or hand': { es: 'Brazo o mano izquierda', zh: '左臂或左手' },
  'Right leg or foot': { es: 'Pierna o pie derecho', zh: '右腿或右脚' },
  'Left leg or foot': { es: 'Pierna o pie izquierdo', zh: '左腿或左脚' },
  'Less than a month': { es: 'Menos de un mes', zh: '不到一个月' },
  '1 to 6 months': { es: 'De 1 a 6 meses', zh: '1 到 6 个月' },
  '6 months to 2 years': { es: 'De 6 meses a 2 años', zh: '6 个月到 2 年' },
  'More than 2 years': { es: 'Más de 2 años', zh: '超过 2 年' },
  'Getting better': { es: 'Mejorando', zh: '在好转' },
  'About the same': { es: 'Más o menos igual', zh: '差不多' },
  'Getting worse': { es: 'Empeorando', zh: '在恶化' },
  'Better': { es: 'Mejor', zh: '更好' },
  'Worse': { es: 'Peor', zh: '更差' },
};

const DURATION_TO_ONSET = { 'Less than a month': '1-4 weeks', '1 to 6 months': '1-3 months', '6 months to 2 years': '6-12 months', 'More than 2 years': 'More than 2 years' };
const CHANGE_TO_FULL = { Better: 'Somewhat better', 'About the same': 'About the same', Worse: 'Somewhat worse' };

/**
 * The short form's story screen: the problem in the patient's own words,
 * where it hurts, how long, how bad, and which way it is going. A returning
 * patient is asked what has changed instead. Writes the chief complaint and
 * one answer set per problem (lib/services/spine/problems.js folds the areas
 * into neck-and-arm, mid-back and low-back-and-leg problems), so the office
 * note reads it as it reads the full form.
 */
export default function SimpleStory({ onNext, onBack }) {
  const { data, setField, setNested } = useIntake();
  const svc = useService();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const cc = data.chiefComplaint || {};
  const s = data.simple || {};
  const followup = data.visit?.type === 'followup' || data.visit?.type === 'postop';
  const regions = cc.symptomRegions || [];

  const setStory = (text) => {
    setField('chiefComplaint', 'mainReason', text);
    if (followup) setNested('visit.followup.whatChanged', text);
    setNested('triage.description', text);
  };

  /** The same answers for every problem the areas add up to. */
  const writeProblems = (next) => {
    const merged = { ...s, ...next };
    setNested('simple', merged);
    const problems = svc.problems.problemsFor(merged.regions || regions);
    const answers = {};
    for (const p of problems) {
      answers[p.id] = {
        ...(data.hpiData?.problems?.[p.id] || {}),
        onset: DURATION_TO_ONSET[merged.duration] || merged.duration || '',
        progression: merged.trend || '',
        severity: merged.pain === '' || merged.pain == null ? '' : Number(merged.pain),
      };
    }
    setNested('hpiData.problems', answers);
    if (problems.length === 1) setNested('hpiData.primaryProblem', problems[0].id);
  };

  const setRegions = (ids) => {
    setField('chiefComplaint', 'symptomRegions', ids);
    writeProblems({ regions: ids });
  };

  const story = cc.mainReason || '';
  const canGoNext = followup
    ? story.trim().length >= 3 && !!data.visit?.followup?.overallChange
    : story.trim().length >= 3 && regions.length > 0 && !!s.duration && s.pain !== '' && s.pain != null && !!s.trend;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t(followup ? 'What has changed since your last visit?' : 'What is bothering you?')}</h2>
        <p className="section-subtitle">{t('Tell us in your own words. You can also tap the microphone and say it.')}</p>
      </div>
      <div className="space-y-4">
        {followup && (
          <Card title={t('How are you doing compared with your last visit?')}>
            <BigChoice t={t} options={SIMPLE_CHANGE} value={Object.keys(CHANGE_TO_FULL).find((k) => CHANGE_TO_FULL[k] === data.visit?.followup?.overallChange) || ''} onChange={(x) => { setNested('visit.followup.overallChange', CHANGE_TO_FULL[x]); setNested('simple.change', x); }} />
          </Card>
        )}
        <Card title={t(followup ? 'Tell us what has changed.' : 'In your own words, what is the problem?')}>
          <TextArea
            value={story}
            onChange={setStory}
            rows={5}
            placeholder={t(followup ? 'For example: the leg pain is gone but my back still hurts when I stand.' : 'For example: my low back hurts and the pain goes down my right leg.')}
          />
        </Card>
        {!followup && (
          <>
            <Card title={t('Where does it hurt? Tap all that apply.')}>
              <BigChoice t={t} multi options={SIMPLE_AREAS} value={regions} onChange={setRegions} />
            </Card>
            <Card title={t('How long has this been going on?')}>
              <BigChoice t={t} options={SIMPLE_DURATIONS} value={s.duration || ''} onChange={(x) => writeProblems({ duration: x })} />
            </Card>
            <Card title={t('How bad is the pain today? 0 is no pain, 10 is the worst pain you can imagine.')}>
              <PainNumbers value={s.pain ?? ''} onChange={(n) => writeProblems({ pain: n })} />
            </Card>
            <Card title={t('Is it getting better, worse, or staying the same?')}>
              <BigChoice t={t} options={SIMPLE_TRENDS} value={s.trend || ''} onChange={(x) => writeProblems({ trend: x })} />
            </Card>
          </>
        )}
      </div>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}
