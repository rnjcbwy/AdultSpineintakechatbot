'use client';

import { useIntake } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import { INJURY_KINDS, LAWSUIT_Q, claimFor, VISIT_LABEL, visitTypeFor } from '../../../lib/flows';
import { SIMPLE_TRIED } from '../../../lib/simple';
import StepNavigation from '../../ui/StepNavigation';
import { TextArea } from '../../ui/Fields';
import { Card, BigChoice, YesNo } from './Big';

const LOCAL = {
  'A few questions': { es: 'Unas preguntas', zh: '几个问题' },
  'Tap Yes or No. There are no wrong answers.': { es: 'Toque Sí o No. No hay respuestas incorrectas.', zh: '请点选“是”或“否”。没有错误的答案。' },
  'Do you have numbness or tingling in your arms, hands, legs or feet?': { es: '¿Tiene entumecimiento u hormigueo en los brazos, las manos, las piernas o los pies?', zh: '您的手臂、手、腿或脚有麻木或刺痛吗？' },
  'Do you have weakness in an arm or a leg?': { es: '¿Tiene debilidad en un brazo o una pierna?', zh: '您的手臂或腿有无力吗？' },
  'Do you have trouble walking, or feel unsteady on your feet?': { es: '¿Tiene dificultad para caminar o se siente inestable al caminar?', zh: '您走路有困难或感觉站不稳吗？' },
  'Any new trouble controlling your bladder or bowels?': { es: '¿Algún problema nuevo para controlar la vejiga o los intestinos?', zh: '最近出现控制大小便的困难吗？' },
  'Have you ever had surgery on your spine?': { es: '¿Alguna vez le han operado la columna?', zh: '您做过脊柱手术吗？' },
  'What surgery, and about when?': { es: '¿Qué cirugía y aproximadamente cuándo?', zh: '什么手术？大约什么时候？' },
  'Did this start with an injury at work, a car crash or another accident?': { es: '¿Esto empezó con una lesión en el trabajo, un choque de auto u otro accidente?', zh: '这个问题是因工伤、车祸或其他事故引起的吗？' },
  'Yes, I was hurt at work': { es: 'Sí, me lastimé en el trabajo', zh: '是，我在工作中受伤' },
  'Yes, a car crash or other accident': { es: 'Sí, un choque de auto u otro accidente', zh: '是，车祸或其他事故' },
  'Have you already tried any of these? You can skip this.': { es: '¿Ya ha probado alguno de estos? Puede omitir esta pregunta.', zh: '您已经尝试过以下哪些？可以跳过此问题。' },
  'Physical therapy': { es: 'Fisioterapia', zh: '物理治疗' },
  'Chiropractor': { es: 'Quiropráctico', zh: '脊椎按摩' },
  'Injections': { es: 'Inyecciones', zh: '注射' },
  'Pain medicine': { es: 'Medicamentos para el dolor', zh: '止痛药' },
  'Surgery on my spine': { es: 'Cirugía de columna', zh: '脊柱手术' },
  'Nothing yet': { es: 'Nada todavía', zh: '还没有' },
  'Physical therapy: when, and for how long?': { es: 'Fisioterapia: ¿cuándo y por cuánto tiempo?', zh: '物理治疗：什么时候、持续了多久？' },
  'For example: last spring, 6 weeks': { es: 'Por ejemplo: la primavera pasada, 6 semanas', zh: '例如：去年春天，6 周' },
  'Injections: what type, and which level if you know?': { es: 'Inyecciones: ¿de qué tipo y en qué nivel, si lo sabe?', zh: '注射：什么类型，如果知道的话在哪个节段？' },
  'For example: epidural, L4-5, two of them': { es: 'Por ejemplo: epidural, L4-5, dos veces', zh: '例如：硬膜外，L4-5，两次' },
  'No': { es: 'No', zh: '否' },
  'Yes': { es: 'Sí', zh: '是' },
};

// The claim question in plain words. The stored answers stay the shared
// CLAIM_OPTIONS strings, which visitTypeFor and the full form key on.
// How it started, then, only after an accident, whether a claim or lawsuit is
// involved. The stored claim (visit.workInjury) is derived by claimFor.
const INJURY_CHOICES = [
  { id: 'none', label: INJURY_KINDS[0] },
  { id: 'work', label: INJURY_KINDS[1] },
  { id: 'accident', label: INJURY_KINDS[2] },
];

const TRIED_FLAGS = { 'Physical therapy': 'physicalTherapy.tried', Chiropractor: 'chiropracticCare.tried' };

/**
 * The short form's yes/no screen: the safety questions the symptom step
 * asks, prior spine surgery, any claim, and the optional "what have you
 * tried". Writes the same fields as the full form.
 */
export default function SimpleQuestions({ onNext, onBack }) {
  const { data, setField, setNested, setSection } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const o = data.hpiData?.overall || {};
  const s = data.simple || {};
  const v = data.visit || {};
  const yn = (v2) => (v2 === 'Yes' ? 'yes' : v2 === 'No' ? 'no' : '');
  const back = (v2) => (v2 === 'yes' ? 'Yes' : v2 === 'no' ? 'No' : '');

  const setOverall = (field, value) => {
    setNested(`hpiData.overall.${field}`, yn(value));
    if (field === 'numbness') setNested('hpiData.overall.tingling', yn(value));
  };

  const setSurgery = (answer) => {
    setNested('simple.priorSurgery', answer);
    setField('chiefComplaint', 'hasPriorSpineSurgery', answer === 'Yes');
    if (answer === 'No') setSection('pastSurgicalHistory', { ...data.pastSurgicalHistory, surgeries: (data.pastSurgicalHistory?.surgeries || []).filter((x) => !x.simple) });
  };
  const setSurgeryText = (text) => {
    setNested('simple.priorSurgeryText', text);
    const others = (data.pastSurgicalHistory?.surgeries || []).filter((x) => !x.simple);
    setSection('pastSurgicalHistory', { ...data.pastSurgicalHistory, surgeries: text.trim() ? [...others, { type: text.trim(), bodyRegion: 'Spine', date: '', hospital: '', surgeon: '', isSpineSurgery: true, simple: true }] : others });
  };

  const setInjury = (kind, lawsuit) => {
    setNested('visit.injuryKind', kind);
    setNested('visit.lawsuit', kind === 'accident' ? lawsuit || '' : '');
    setClaim(claimFor({ injuryKind: kind, lawsuit }));
  };
  const setClaim = (answer) => {
    setNested('visit.workInjury', answer);
    const type = visitTypeFor({ choice: v.choice || 'new', workInjury: answer, hadSurgery: v.hadSurgery || '', established: v.type === 'new_problem' });
    if (type && type !== v.type) {
      setNested('visit.type', type);
      setField('demographics', 'visitReason', VISIT_LABEL[type]);
      const here = data.currentStep || 0;
      setNested('completedSteps', (data.completedSteps || []).filter((i) => i <= here));
    }
  };

  const setTried = (list) => {
    const chosen = list.includes('Nothing yet') && !(s.tried || []).includes('Nothing yet') ? ['Nothing yet'] : list.filter((x) => x !== 'Nothing yet' || list.length === 1);
    setNested('simple.tried', chosen);
    for (const [label, flag] of Object.entries(TRIED_FLAGS)) setNested(`hpiData.conservativeTreatments.${flag}`, chosen.includes(label));
    setNested('hpiData.conservativeTreatments.injections', chosen.includes('Injections') ? [{ type: String(s.injectionDetail || '').trim() || 'Spine injection', location: '', provider: '', when: '', count: '', reliefDuration: '', helped: '' }] : []);
    setNested('hpiData.conservativeTreatments.painMedicineTried', chosen.includes('Pain medicine'));
    setNested('hpiData.conservativeTreatments.nothingYet', chosen.includes('Nothing yet'));
  };
  // One short line of detail each, optional: when and how long for therapy;
  // the type and level for injections. Written where the full form writes them.
  const setPtDetail = (text) => {
    setNested('simple.ptDetail', text);
    setNested('hpiData.conservativeTreatments.physicalTherapy.details', text);
  };
  const setInjectionDetail = (text) => {
    setNested('simple.injectionDetail', text);
    setNested('hpiData.conservativeTreatments.injections', [{ type: text.trim() || 'Spine injection', location: '', provider: '', when: '', count: '', reliefDuration: '', helped: '' }]);
  };

  const followup = v.type === 'followup' || v.type === 'postop';
  const answered = ['numbness', 'weakness', 'gaitChanges', 'bowelBladder'].every((f) => o[f]) && !!s.priorSurgery && (s.priorSurgery !== 'Yes' || String(s.priorSurgeryText || '').trim()) && (followup || !!v.workInjury);
  // (claimFor leaves the claim blank after an accident until the lawsuit question is answered.)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('A few questions')}</h2>
        <p className="section-subtitle">{t('Tap Yes or No. There are no wrong answers.')}</p>
      </div>
      <div className="space-y-4">
        <Card title={t('Do you have numbness or tingling in your arms, hands, legs or feet?')}><YesNo t={t} value={back(o.numbness)} onChange={(x) => setOverall('numbness', x)} /></Card>
        <Card title={t('Do you have weakness in an arm or a leg?')}><YesNo t={t} value={back(o.weakness)} onChange={(x) => setOverall('weakness', x)} /></Card>
        <Card title={t('Do you have trouble walking, or feel unsteady on your feet?')}><YesNo t={t} value={back(o.gaitChanges)} onChange={(x) => setOverall('gaitChanges', x)} /></Card>
        <Card title={t('Any new trouble controlling your bladder or bowels?')}><YesNo t={t} value={back(o.bowelBladder)} onChange={(x) => setOverall('bowelBladder', x)} /></Card>
        <Card title={t('Have you ever had surgery on your spine?')}>
          <YesNo t={t} value={s.priorSurgery || ''} onChange={setSurgery} />
          {s.priorSurgery === 'Yes' && <TextArea label={t('What surgery, and about when?')} value={s.priorSurgeryText || ''} onChange={setSurgeryText} rows={2} />}
        </Card>
        {!followup && (
          <Card title={t('Did this start with an injury at work, a car crash or another accident?')}>
            <BigChoice t={t} options={INJURY_CHOICES} value={v.injuryKind || ''} onChange={(kind) => setInjury(kind, '')} />
            {v.injuryKind === 'accident' && (
              <div className="mt-4">
                <p className="text-lg font-medium text-navy-600 mb-3">{t(LAWSUIT_Q)}</p>
                <YesNo t={t} value={v.lawsuit || ''} onChange={(x) => setInjury('accident', x)} />
              </div>
            )}
          </Card>
        )}
        <Card title={t('Have you already tried any of these? You can skip this.')}>
          <BigChoice t={t} multi options={SIMPLE_TRIED} value={s.tried || []} onChange={setTried} />
          {(s.tried || []).includes('Physical therapy') && (
            <div className="mt-4">
              <label className="form-label">{t('Physical therapy: when, and for how long?')}</label>
              <input type="text" value={s.ptDetail || ''} onChange={(e) => setPtDetail(e.target.value)} placeholder={t('For example: last spring, 6 weeks')} />
            </div>
          )}
          {(s.tried || []).includes('Injections') && (
            <div className="mt-4">
              <label className="form-label">{t('Injections: what type, and which level if you know?')}</label>
              <input type="text" value={s.injectionDetail || ''} onChange={(e) => setInjectionDetail(e.target.value)} placeholder={t('For example: epidural, L4-5, two of them')} />
            </div>
          )}
        </Card>
      </div>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={answered} />
    </div>
  );
}
