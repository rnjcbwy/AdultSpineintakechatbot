'use client';

import { useIntake } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import StepNavigation from '../../ui/StepNavigation';
import UploadToFill from '../../UploadToFill';
import { TextArea } from '../../ui/Fields';
import { Card, YesNo } from './Big';

const LOCAL = {
  'Your health': { es: 'Su salud', zh: '您的健康' },
  'Three questions, so the doctor knows what else is going on.': { es: 'Tres preguntas, para que el médico sepa qué más está pasando.', zh: '三个问题，让医生了解您的其他健康情况。' },
  'Do you take any medicines every day?': { es: '¿Toma algún medicamento todos los días?', zh: '您每天服用任何药物吗？' },
  'Which medicines? A photo of your list or your pill bottles works too.': { es: '¿Qué medicamentos? También sirve una foto de su lista o de sus frascos.', zh: '哪些药物？也可以拍一张药物清单或药瓶的照片。' },
  'Are you allergic to any medicines?': { es: '¿Es alérgico a algún medicamento?', zh: '您对任何药物过敏吗？' },
  'Which medicines, and what happened?': { es: '¿A qué medicamentos y qué pasó?', zh: '对哪些药物过敏？出现了什么反应？' },
  'Do you have any health conditions, such as diabetes, heart disease or high blood pressure?': { es: '¿Tiene alguna afección de salud, como diabetes, enfermedad del corazón o presión alta?', zh: '您有任何健康问题，例如糖尿病、心脏病或高血压吗？' },
  'Which conditions?': { es: '¿Qué afecciones?', zh: '哪些疾病？' },
  'One per line': { es: 'Uno por línea', zh: '每行一项' },
  'No': { es: 'No', zh: '否' },
  'Yes': { es: 'Sí', zh: '是' },
};

const lines = (text) => String(text || '').split(/\r?\n|,|;/).map((x) => x.trim()).filter(Boolean);

/**
 * The short form's health screen: three yes/no questions in place of the
 * full history steps. Written into the usual medication, allergy and
 * condition lists. The medication photo fills the list the usual way.
 */
export default function SimpleHealth({ onNext, onBack }) {
  const { data, setSection, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const h = data.simple?.health || {};
  const typedMeds = (data.medications?.current || []).filter((m) => m.simple);
  const otherMeds = (data.medications?.current || []).filter((m) => !m.simple);

  const save = (next) => {
    const merged = { ...h, ...next };
    setNested('simple.health', merged);
    if ('meds' in next || 'medsText' in next) {
      setSection('medications', {
        ...data.medications,
        noMedications: merged.meds === 'No',
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
    if ('conditions' in next || 'conditionsText' in next) {
      setSection('pastMedicalHistory', {
        ...data.pastMedicalHistory,
        noConditions: merged.conditions === 'No',
        conditions: merged.conditions === 'Yes' ? lines(merged.conditionsText).map((name) => ({ name, yearDiagnosed: '', details: '' })) : [],
      });
    }
  };

  const medsFilled = h.meds !== 'Yes' || String(h.medsText || '').trim() || otherMeds.length > 0;
  const answered = !!h.meds && medsFilled && !!h.allergies && (h.allergies !== 'Yes' || String(h.allergiesText || '').trim()) && !!h.conditions && (h.conditions !== 'Yes' || String(h.conditionsText || '').trim());

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Your health')}</h2>
        <p className="section-subtitle">{t('Three questions, so the doctor knows what else is going on.')}</p>
      </div>
      <div className="space-y-4">
        <Card title={t('Do you take any medicines every day?')}>
          <YesNo t={t} value={h.meds || ''} onChange={(x) => save({ meds: x })} />
          {h.meds === 'Yes' && (
            <>
              <UploadToFill section="medications" />
              <TextArea label={t('Which medicines? A photo of your list or your pill bottles works too.')} value={h.medsText || ''} onChange={(x) => save({ medsText: x })} rows={3} hint={t('One per line')} />
            </>
          )}
        </Card>
        <Card title={t('Are you allergic to any medicines?')}>
          <YesNo t={t} value={h.allergies || ''} onChange={(x) => save({ allergies: x })} />
          {h.allergies === 'Yes' && <TextArea label={t('Which medicines, and what happened?')} value={h.allergiesText || ''} onChange={(x) => save({ allergiesText: x })} rows={2} hint={t('One per line')} />}
        </Card>
        <Card title={t('Do you have any health conditions, such as diabetes, heart disease or high blood pressure?')}>
          <YesNo t={t} value={h.conditions || ''} onChange={(x) => save({ conditions: x })} />
          {h.conditions === 'Yes' && <TextArea label={t('Which conditions?')} value={h.conditionsText || ''} onChange={(x) => save({ conditionsText: x })} rows={2} hint={t('One per line')} />}
        </Card>
      </div>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={answered} />
    </div>
  );
}
