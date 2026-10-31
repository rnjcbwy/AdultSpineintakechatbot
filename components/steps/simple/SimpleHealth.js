'use client';

import { useIntake } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import { SIMPLE_CONDITIONS, MEDS_LATER } from '../../../lib/simple';
import StepNavigation from '../../ui/StepNavigation';
import UploadToFill from '../../UploadToFill';
import { TextArea } from '../../ui/Fields';
import { Card, YesNo, BigChoice } from './Big';

const LOCAL = {
  'Your health': { es: 'Su salud', zh: '您的健康' },
  'Three questions, so the doctor knows what else is going on.': { es: 'Tres preguntas, para que el médico sepa qué más está pasando.', zh: '三个问题，让医生了解您的其他健康情况。' },
  'Do you take any medicines every day?': { es: '¿Toma algún medicamento todos los días?', zh: '您每天服用任何药物吗？' },
  'Yes, but I do not have my list with me': { es: 'Sí, pero no tengo mi lista conmigo', zh: '有，但我没带药物清单' },
  'No problem. Bring your pill bottles or a list to the visit, or the office can ask your pharmacy.': { es: 'No hay problema. Traiga sus frascos o una lista a la visita, o la oficina puede pedirla a su farmacia.', zh: '没关系。就诊时带上药瓶或清单，或者诊所可以向您的药房询问。' },
  'Which medicines?': { es: '¿Qué medicamentos?', zh: '哪些药物？' },
  'Have your list or your pill bottles handy? Take a photo and we fill it in.': { es: '¿Tiene su lista o sus frascos a mano? Tome una foto y lo llenamos por usted.', zh: '药物清单或药瓶在手边？拍张照片，我们帮您填写。' },
  'Are you allergic to any medicines?': { es: '¿Es alérgico a algún medicamento?', zh: '您对任何药物过敏吗？' },
  'Which medicines, and what happened?': { es: '¿A qué medicamentos y qué pasó?', zh: '对哪些药物过敏？出现了什么反应？' },
  'Do you have any health conditions, such as diabetes, heart disease or high blood pressure?': { es: '¿Tiene alguna afección de salud, como diabetes, enfermedad del corazón o presión alta?', zh: '您有任何健康问题，例如糖尿病、心脏病或高血压吗？' },
  'Tap any that apply.': { es: 'Toque las que correspondan.', zh: '点选所有符合的项目。' },
  'Anything else? You can leave this blank.': { es: '¿Algo más? Puede dejarlo en blanco.', zh: '还有其他吗？可以留空。' },
  'High blood pressure': { es: 'Presión alta', zh: '高血压' },
  'Diabetes': { es: 'Diabetes', zh: '糖尿病' },
  'Heart disease': { es: 'Enfermedad del corazón', zh: '心脏病' },
  'Osteoporosis': { es: 'Osteoporosis', zh: '骨质疏松' },
  'Thyroid problem': { es: 'Problema de tiroides', zh: '甲状腺问题' },
  'Cancer': { es: 'Cáncer', zh: '癌症' },
  'Kidney disease': { es: 'Enfermedad de los riñones', zh: '肾病' },
  'Lung disease or asthma': { es: 'Enfermedad pulmonar o asma', zh: '肺病或哮喘' },
  'One per line': { es: 'Uno por línea', zh: '每行一项' },
  'No': { es: 'No', zh: '否' },
  'Yes': { es: 'Sí', zh: '是' },
};

const lines = (text) => String(text || '').split(/\r?\n|,|;/).map((x) => x.trim()).filter(Boolean);

/**
 * The short form's health screen: three yes/no questions in place of the
 * full history steps, written into the usual medication, allergy and
 * condition lists. Nothing here needs a list the patient does not have to
 * hand: medicines can wait for the visit, the photo fill is folded away,
 * and the common conditions are buttons.
 */
export default function SimpleHealth({ onNext, onBack }) {
  const { data, setSection, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const h = data.simple?.health || {};
  const otherMeds = (data.medications?.current || []).filter((m) => !m.simple);

  const save = (next) => {
    const merged = { ...h, ...next };
    setNested('simple.health', merged);
    if ('meds' in next || 'medsText' in next) {
      setSection('medications', {
        ...data.medications,
        noMedications: merged.meds === 'No',
        // Takes medicines but has no list to hand: the office will get it at the visit.
        listPending: merged.meds === MEDS_LATER,
        current: merged.meds === 'Yes' ? [...otherMeds, ...lines(merged.medsText).map((name) => ({ name, dose: '', frequency: '', reason: '', status: 'current', simple: true }))] : otherMeds,
      });
    }
    if ('allergies' in next || 'allergiesText' in next) {
      setSection('allergies', {
        ...data.allergies,
        nkda: merged.allergies === 'No',
        entries: merged.allergies === 'Yes' ? lines(merged.allergiesText).map((allergen) => ({ allergen, reaction: '', severity: '', type: 'Medication' })) : [],
      });
    }
    if ('conditions' in next || 'conditionsText' in next || 'conditionPicks' in next) {
      const names = merged.conditions === 'Yes' ? [...(merged.conditionPicks || []), ...lines(merged.conditionsText)] : [];
      setSection('pastMedicalHistory', {
        ...data.pastMedicalHistory,
        noConditions: merged.conditions === 'No',
        conditions: names.map((name) => ({ name, yearDiagnosed: '', details: '' })),
      });
    }
  };

  const medsFilled = h.meds !== 'Yes' || String(h.medsText || '').trim() || otherMeds.length > 0;
  const conditionsFilled = h.conditions !== 'Yes' || (h.conditionPicks || []).length > 0 || String(h.conditionsText || '').trim();
  const answered = !!h.meds && medsFilled && !!h.allergies && (h.allergies !== 'Yes' || String(h.allergiesText || '').trim()) && !!h.conditions && conditionsFilled;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Your health')}</h2>
        <p className="section-subtitle">{t('Three questions, so the doctor knows what else is going on.')}</p>
      </div>
      <div className="space-y-4">
        <Card title={t('Do you take any medicines every day?')}>
          <BigChoice t={t} options={['No', 'Yes', MEDS_LATER]} value={h.meds || ''} onChange={(x) => save({ meds: x })} />
          {h.meds === MEDS_LATER && (
            <p className="mt-4 text-base text-gray-600">{t('No problem. Bring your pill bottles or a list to the visit, or the office can ask your pharmacy.')}</p>
          )}
          {h.meds === 'Yes' && (
            <div className="mt-4">
              <TextArea label={t('Which medicines?')} value={h.medsText || ''} onChange={(x) => save({ medsText: x })} rows={3} hint={t('One per line')} />
              <details className="mt-2">
                <summary className="cursor-pointer text-base font-medium text-teal-600">{t('Have your list or your pill bottles handy? Take a photo and we fill it in.')}</summary>
                <div className="mt-3"><UploadToFill section="medications" /></div>
              </details>
            </div>
          )}
        </Card>
        <Card title={t('Are you allergic to any medicines?')}>
          <YesNo t={t} value={h.allergies || ''} onChange={(x) => save({ allergies: x })} />
          {h.allergies === 'Yes' && <TextArea label={t('Which medicines, and what happened?')} value={h.allergiesText || ''} onChange={(x) => save({ allergiesText: x })} rows={2} hint={t('One per line')} />}
        </Card>
        <Card title={t('Do you have any health conditions, such as diabetes, heart disease or high blood pressure?')}>
          <YesNo t={t} value={h.conditions || ''} onChange={(x) => save({ conditions: x })} />
          {h.conditions === 'Yes' && (
            <div className="mt-4 space-y-4">
              <p className="text-base text-gray-600">{t('Tap any that apply.')}</p>
              <BigChoice t={t} multi options={SIMPLE_CONDITIONS} value={h.conditionPicks || []} onChange={(x) => save({ conditionPicks: x })} />
              <TextArea label={t('Anything else? You can leave this blank.')} value={h.conditionsText || ''} onChange={(x) => save({ conditionsText: x })} rows={2} hint={t('One per line')} />
            </div>
          )}
        </Card>
      </div>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={answered} />
    </div>
  );
}
