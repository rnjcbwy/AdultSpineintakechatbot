'use client';

import { useIntake } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import StepNavigation from '../../ui/StepNavigation';
import UploadToFill from '../../UploadToFill';

const LOCAL = {
  'About your child': { es: 'Sobre su hijo o hija', zh: '关于您的孩子' },
  'Just the basics. The questions after this are about the injury.': { es: 'Solo lo básico. Las preguntas siguientes son sobre la lesión.', zh: '只需基本信息。接下来的问题都是关于这次受伤的。' },
  'Your name': { es: 'Su nombre', zh: '您的姓名' },
  'First and last name': { es: 'Nombre y apellido', zh: '名字和姓氏' },
  'You are the child’s': { es: 'Usted es el/la … del niño o niña', zh: '您是孩子的' },
  'Select...': { es: 'Seleccione...', zh: '请选择...' },
  'Mother': { es: 'Madre', zh: '母亲' },
  'Father': { es: 'Padre', zh: '父亲' },
  'Grandparent': { es: 'Abuelo o abuela', zh: '祖父母或外祖父母' },
  'Legal guardian': { es: 'Tutor legal', zh: '法定监护人' },
  'Other': { es: 'Otro', zh: '其他' },
  'Your child': { es: 'Su hijo o hija', zh: '您的孩子' },
  "Child's first name": { es: 'Nombre del niño o niña', zh: '孩子的名字' },
  "Child's last name": { es: 'Apellido del niño o niña', zh: '孩子的姓氏' },
  'Date of birth': { es: 'Fecha de nacimiento', zh: '出生日期' },
  'Girl': { es: 'Niña', zh: '女孩' },
  'Boy': { es: 'Niño', zh: '男孩' },
  'How can we reach you?': { es: '¿Cómo podemos comunicarnos con usted?', zh: '我们如何联系您？' },
  'Mobile phone': { es: 'Teléfono celular', zh: '手机' },
  'Email': { es: 'Correo electrónico', zh: '电子邮件' },
  'A phone number or an email is needed.': { es: 'Se necesita un teléfono o un correo electrónico.', zh: '请至少提供电话或电子邮件。' },
  'Has your child been seen here for this injury before?': { es: '¿Su hijo o hija ya fue atendido aquí por esta lesión?', zh: '您的孩子之前是否因这次受伤在这里就诊过？' },
  'No, this is the first visit for it': { es: 'No, es la primera visita por esta lesión', zh: '没有，这是第一次因此就诊' },
  'Yes, this is a follow-up': { es: 'Sí, es una visita de seguimiento', zh: '是的，这是复诊' },
  'Insurance (skip this if the office already has it)': { es: 'Seguro (omita esto si la oficina ya lo tiene)', zh: '保险（如果诊所已有您的保险信息，可跳过）' },
  'Insurance company': { es: 'Compañía de seguros', zh: '保险公司' },
  'Member ID': { es: 'Número de miembro', zh: '会员编号' },
};

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

const RELATIONSHIPS = ['Mother', 'Father', 'Grandparent', 'Legal guardian', 'Other'];
const SEX = [['Female', 'Girl'], ['Male', 'Boy']];
const VISIT = [['new', 'No, this is the first visit for it'], ['followup', 'Yes, this is a follow-up']];

function Choice({ options, value, onChange, t }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${value === v ? 'border-teal-400 bg-teal-50 text-navy-600' : 'border-gray-200 bg-white text-gray-600 hover:border-teal-200'}`}
        >
          {t(label)}
        </button>
      ))}
    </div>
  );
}

const ageFrom = (dob) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || ''));
  if (!m) return '';
  const now = new Date();
  let y = now.getFullYear() - Number(m[1]);
  if (now.getMonth() + 1 < Number(m[2]) || (now.getMonth() + 1 === Number(m[2]) && now.getDate() < Number(m[3]))) y -= 1;
  return y >= 0 && y < 30 ? String(y) : '';
};

/**
 * The fracture form's first screen: who is filling it in, the child, how to
 * reach the family, and whether this is the first visit for the injury.
 * Insurance is one optional fold with a photo of the card. Writes the same
 * fields as the full form, so the note, the PDF and Practice Hub read them
 * the same way.
 */
export default function FractureBasics({ onNext, onBack }) {
  const { data, setField, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const d = data.demographics || {};
  const g = d.guardian || {};
  const v = data.visit || {};
  const kind = v.type === 'followup' ? 'followup' : v.type ? 'new' : '';

  const setGuardian = (field, value) => setField('demographics', 'guardian', { completedBy: 'parent', name: '', relationship: '', ...g, [field]: value });
  const setVisit = (k) => {
    setNested('visit.choice', k === 'followup' ? 'followup' : 'new');
    setNested('visit.hadSurgery', k === 'followup' ? 'No' : '');
    setNested('visit.workInjury', 'No');
    setNested('visit.type', k);
    setNested('triage.firstTime', k === 'followup' ? 'No, I have seen this doctor before' : 'Yes, my first time with this doctor');
    setField('demographics', 'visitReason', k === 'followup' ? 'Fracture follow-up' : 'Injury or fracture');
    // The next steps depend on the answer, so any "completed" marks after this one are stale.
    const here = data.currentStep || 0;
    setNested('completedSteps', (data.completedSteps || []).filter((i) => i <= here));
  };

  const emailOk = !d.email || isEmail(d.email);
  const canGoNext = !!(g.name && g.relationship && d.firstName && d.lastName && d.dob && d.sex && (d.phone || d.email) && emailOk && kind);

  const input = 'w-full';
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('About your child')}</h2>
        <p className="section-subtitle">{t('Just the basics. The questions after this are about the injury.')}</p>
      </div>

      <div className="space-y-4">
        <div className="card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('Your name')} *</label>
              <input className={input} type="text" value={g.name || ''} onChange={(e) => setGuardian('name', e.target.value)} placeholder={t('First and last name')} autoComplete="name" />
            </div>
            <div>
              <label className="form-label">{t('You are the child’s')} *</label>
              <select className={input} value={g.relationship || ''} onChange={(e) => setGuardian('relationship', e.target.value)}>
                <option value="">{t('Select...')}</option>
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{t(r)}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Your child')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t("Child's first name")} *</label>
              <input className={input} type="text" value={d.firstName || ''} onChange={(e) => setField('demographics', 'firstName', e.target.value)} />
            </div>
            <div>
              <label className="form-label">{t("Child's last name")} *</label>
              <input className={input} type="text" value={d.lastName || ''} onChange={(e) => setField('demographics', 'lastName', e.target.value)} />
            </div>
            <div>
              <label className="form-label">{t('Date of birth')} *</label>
              <input
                className={input}
                type="date"
                value={d.dob || ''}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => { setField('demographics', 'dob', e.target.value); setField('demographics', 'age', ageFrom(e.target.value)); }}
              />
            </div>
            <div>
              <label className="form-label">&nbsp;</label>
              <Choice options={SEX} value={d.sex} onChange={(x) => setField('demographics', 'sex', x)} t={t} />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('How can we reach you?')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('Mobile phone')}</label>
              <input className={input} type="tel" inputMode="tel" autoComplete="tel" value={d.phone || ''} onChange={(e) => setField('demographics', 'phone', e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <div>
              <label className="form-label">{t('Email')}</label>
              <input className={input} type="email" inputMode="email" autoComplete="email" value={d.email || ''} onChange={(e) => setField('demographics', 'email', e.target.value)} placeholder="name@example.com" />
            </div>
          </div>
          {!d.phone && !d.email && <p className="text-xs text-gray-400">{t('A phone number or an email is needed.')}</p>}
        </div>

        <div className="card space-y-3">
          <p className="form-label">{t('Has your child been seen here for this injury before?')} *</p>
          <Choice options={VISIT} value={kind} onChange={setVisit} t={t} />
        </div>

        <details className="card">
          <summary className="cursor-pointer text-base font-medium text-navy-600">{t('Insurance (skip this if the office already has it)')}</summary>
          <div className="mt-4 space-y-4">
            <UploadToFill section="insurance" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('Insurance company')}</label>
                <input className={input} type="text" value={d.insuranceProvider || ''} onChange={(e) => setField('demographics', 'insuranceProvider', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('Member ID')}</label>
                <input className={input} type="text" value={d.memberId || ''} onChange={(e) => setField('demographics', 'memberId', e.target.value)} />
              </div>
            </div>
          </div>
        </details>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}
