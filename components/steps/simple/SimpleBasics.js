'use client';

import { useIntake } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import StepNavigation from '../../ui/StepNavigation';
import { Card, BigChoice } from './Big';

const LOCAL = {
  'About you': { es: 'Sobre usted', zh: '关于您' },
  'Just a few details so the office can find you and reach you.': { es: 'Solo unos datos para que la oficina pueda encontrarlo y comunicarse con usted.', zh: '只需几项信息，以便诊所找到您并与您联系。' },
  'Your name': { es: 'Su nombre', zh: '您的姓名' },
  'First name': { es: 'Nombre', zh: '名字' },
  'Last name': { es: 'Apellido', zh: '姓氏' },
  'Date of birth': { es: 'Fecha de nacimiento', zh: '出生日期' },
  'Are you a man or a woman?': { es: '¿Es usted hombre o mujer?', zh: '您的性别是？' },
  'Woman': { es: 'Mujer', zh: '女' },
  'Man': { es: 'Hombre', zh: '男' },
  'How can we reach you?': { es: '¿Cómo podemos comunicarnos con usted?', zh: '我们如何联系您？' },
  'Phone number': { es: 'Número de teléfono', zh: '电话号码' },
  'Email (if you have one)': { es: 'Correo electrónico (si tiene)', zh: '电子邮件（如有）' },
  'A phone number or an email is needed.': { es: 'Se necesita un teléfono o un correo electrónico.', zh: '请至少提供电话或电子邮件。' },
  'Have you seen this doctor before?': { es: '¿Ya ha visto a este médico antes?', zh: '您以前看过这位医生吗？' },
  'No, this is my first visit': { es: 'No, es mi primera visita', zh: '没有，这是第一次' },
  'Yes, I have been here before': { es: 'Sí, ya he venido antes', zh: '是的，我来过' },
};

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

const ageFrom = (dob) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || ''));
  if (!m) return '';
  const now = new Date();
  let y = now.getFullYear() - Number(m[1]);
  if (now.getMonth() + 1 < Number(m[2]) || (now.getMonth() + 1 === Number(m[2]) && now.getDate() < Number(m[3]))) y -= 1;
  return y >= 0 && y < 130 ? String(y) : '';
};

/** The short form's first screen: name, birth date, sex, how to reach them, first visit or not. */
export default function SimpleBasics({ onNext, onBack }) {
  const { data, setField, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const d = data.demographics || {};
  const v = data.visit || {};
  const seen = v.type === 'followup' || v.type === 'postop' ? 'Yes, I have been here before' : v.type ? 'No, this is my first visit' : '';

  const setSeen = (answer) => {
    const followup = answer === 'Yes, I have been here before';
    setNested('visit.choice', followup ? 'followup' : 'new');
    setNested('visit.hadSurgery', followup ? 'No' : '');
    setNested('visit.workInjury', v.workInjury || 'No');
    setNested('visit.type', followup ? 'followup' : 'new');
    setNested('triage.firstTime', followup ? 'No, I have seen this doctor before' : 'Yes, my first time with this doctor');
    setField('demographics', 'visitReason', followup ? 'Follow-up visit' : 'New patient or new problem');
    const here = data.currentStep || 0;
    setNested('completedSteps', (data.completedSteps || []).filter((i) => i <= here));
  };

  const canGoNext = !!(d.firstName && d.lastName && d.dob && d.sex && (d.phone || d.email) && (!d.email || isEmail(d.email)) && seen);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('About you')}</h2>
        <p className="section-subtitle">{t('Just a few details so the office can find you and reach you.')}</p>
      </div>
      <div className="space-y-4">
        <Card title={t('Your name')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('First name')} *</label>
              <input type="text" value={d.firstName || ''} onChange={(e) => setField('demographics', 'firstName', e.target.value)} autoComplete="given-name" />
            </div>
            <div>
              <label className="form-label">{t('Last name')} *</label>
              <input type="text" value={d.lastName || ''} onChange={(e) => setField('demographics', 'lastName', e.target.value)} autoComplete="family-name" />
            </div>
          </div>
        </Card>
        <Card title={t('Date of birth')}>
          <input type="date" value={d.dob || ''} max={new Date().toISOString().slice(0, 10)} onChange={(e) => { setField('demographics', 'dob', e.target.value); setField('demographics', 'age', ageFrom(e.target.value)); }} />
        </Card>
        <Card title={t('Are you a man or a woman?')}>
          <BigChoice t={t} options={[{ id: 'Female', label: 'Woman' }, { id: 'Male', label: 'Man' }]} value={d.sex} onChange={(x) => setField('demographics', 'sex', x)} />
        </Card>
        <Card title={t('How can we reach you?')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('Phone number')}</label>
              <input type="tel" inputMode="tel" autoComplete="tel" value={d.phone || ''} onChange={(e) => setField('demographics', 'phone', e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <div>
              <label className="form-label">{t('Email (if you have one)')}</label>
              <input type="email" inputMode="email" autoComplete="email" value={d.email || ''} onChange={(e) => setField('demographics', 'email', e.target.value)} placeholder="name@example.com" />
            </div>
          </div>
          {!d.phone && !d.email && <p className="text-sm text-gray-500">{t('A phone number or an email is needed.')}</p>}
        </Card>
        <Card title={t('Have you seen this doctor before?')}>
          <BigChoice t={t} options={['No, this is my first visit', 'Yes, I have been here before']} value={seen} onChange={setSeen} />
        </Card>
      </div>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}
