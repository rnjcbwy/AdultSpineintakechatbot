'use client';

import { useIntake } from '../../lib/store';
import { US_STATES } from '../../lib/constants';

// Offered as suggestions only; any country can be typed.
const COUNTRY_SUGGESTIONS = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Ireland', 'Spain', 'France', 'Germany', 'Italy', 'Portugal', 'Brazil', 'Argentina', 'Colombia', 'Dominican Republic', 'Puerto Rico', 'India', 'China', 'Taiwan', 'Hong Kong', 'Singapore', 'Philippines', 'South Korea', 'Japan', 'Australia', 'Israel', 'United Arab Emirates', 'Saudi Arabia', 'Nigeria', 'South Africa'];
import StepNavigation from '../ui/StepNavigation';
import Collapsible, { countFilled } from '../ui/Collapsible';
import { useState } from 'react';
import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
  'Been here before?': { es: '¿Ya ha estado aquí antes?', zh: '以前来过吗？' },
  'If we already have you on file, we can send a private link to the email we have for you that opens this form with your history filled in.': {
    es: 'Si ya lo tenemos en nuestros registros, podemos enviar un enlace privado al correo que tenemos de usted, que abre este formulario con su historial ya completado.',
    zh: '如果我们已有您的记录，可以向我们存档的邮箱发送一个私密链接，打开后此表格会自动填入您的病史。',
  },
  'Send me my link': { es: 'Envíenme mi enlace', zh: '给我发送链接' },
  'Checking…': { es: 'Comprobando…', zh: '正在核对……' },
  'We sent a link to {hint}. Open it on any device to continue with your history filled in. Or simply carry on here.': {
    es: 'Enviamos un enlace a {hint}. Ábralo en cualquier dispositivo para continuar con su historial ya completado. O simplemente continúe aquí.',
    zh: '我们已向 {hint} 发送链接。在任何设备上打开即可继续，病史已填好。您也可以直接在这里继续。',
  },
  'We could not match you to a record with these details, or there is no email on file. Please carry on; the office will connect your form to your chart.': {
    es: 'No pudimos encontrar un registro con estos datos, o no hay un correo electrónico archivado. Continúe; el consultorio vinculará su formulario a su expediente.',
    zh: '我们无法根据这些信息匹配到您的记录，或者档案中没有邮箱。请继续填写，诊所会将您的表格关联到您的病历。',
  },
  'Address, insurance and referral': { es: 'Dirección, seguro y referencia', zh: '地址、保险与转诊' },
  'If you already have an appointment, or you have been seen here before, we most likely have this on file and you can leave it blank. If this is your first time, please fill it in.': {
    es: 'Si ya tiene una cita, o ya ha sido atendido aquí antes, lo más probable es que ya tengamos esta información y puede dejarla en blanco. Si es su primera vez, por favor complétela.',
    zh: '如果您已经预约，或者之前在这里就诊过，我们很可能已有这些信息，您可以留空。如果这是您第一次来，请填写。',
  },
  'Emergency contact (optional)': { es: 'Contacto de emergencia (opcional)', zh: '紧急联系人（可选）' },
  'Someone we may call if we cannot reach you.': { es: 'Alguien a quien podamos llamar si no logramos comunicarnos con usted.', zh: '在联系不到您时可以联系的人。' },
  'Address': { es: 'Dirección', zh: '地址' },
  'Patient Information': { es: 'Información del paciente', zh: '患者信息' },
  'State / Province / Region': { es: 'Estado / Provincia / Región', zh: '州 / 省 / 地区' },
  'Postal code': { es: 'Código postal', zh: '邮政编码' },
  'Country': { es: 'País', zh: '国家' },
  "Let's start with some basic information. Fields marked with * are required.": {
    es: 'Comencemos con información básica. Los campos marcados con * son obligatorios.',
    zh: '让我们从一些基本信息开始。标有 * 的字段为必填项。',
  },
  'Personal Details': { es: 'Datos personales', zh: '个人详细信息' },
  'First Name *': { es: 'Nombre *', zh: '名字 *' },
  'First name': { es: 'Nombre', zh: '名字' },
  'Last Name *': { es: 'Apellido *', zh: '姓氏 *' },
  'Last name': { es: 'Apellido', zh: '姓氏' },
  'Date of Birth *': { es: 'Fecha de nacimiento *', zh: '出生日期 *' },
  'Age': { es: 'Edad', zh: '年龄' },
  'Calculated from DOB': { es: 'Calculado a partir de la fecha de nacimiento', zh: '根据出生日期计算' },
  'Sex *': { es: 'Sexo *', zh: '性别 *' },
  'Male': { es: 'Masculino', zh: '男性' },
  'Female': { es: 'Femenino', zh: '女性' },
  'Other': { es: 'Otro', zh: '其他' },
  'Prefer not to say': { es: 'Prefiero no decirlo', zh: '不愿透露' },
  'Contact Information': { es: 'Información de contacto', zh: '联系信息' },
  'Phone': { es: 'Teléfono', zh: '电话' },
  'Email': { es: 'Correo electrónico', zh: '电子邮件' },
  'Address': { es: 'Dirección', zh: '地址' },
  'Street address': { es: 'Dirección de la calle', zh: '街道地址' },
  'City': { es: 'Ciudad', zh: '城市' },
  'State': { es: 'Estado', zh: '州' },
  'ZIP': { es: 'Código postal', zh: '邮政编码' },
  'ZIP code': { es: 'Código postal', zh: '邮政编码' },
  'Insurance & Referral': { es: 'Seguro y referencia', zh: '保险与转诊' },
  'Insurance Provider': { es: 'Compañía de seguros', zh: '保险公司' },
  'Insurance company name': { es: 'Nombre de la compañía de seguros', zh: '保险公司名称' },
  'Member ID': { es: 'Número de miembro', zh: '会员编号' },
  'Member/Policy ID': { es: 'Número de miembro/póliza', zh: '会员/保单编号' },
  'Referring Physician': { es: 'Médico que lo refirió', zh: '转诊医生' },
  'Dr. who referred you': { es: 'Médico que lo refirió', zh: '为您转诊的医生' },
  'Primary Care Physician': { es: 'Médico de atención primaria', zh: '初级保健医生' },
  'Your PCP': { es: 'Su médico de atención primaria', zh: '您的初级保健医生' },
  'Emergency Contact': { es: 'Contacto de emergencia', zh: '紧急联系人' },
  'Name': { es: 'Nombre', zh: '姓名' },
  'Emergency contact name': { es: 'Nombre del contacto de emergencia', zh: '紧急联系人姓名' },
  'Relationship': { es: 'Parentesco', zh: '关系' },
  'e.g., Spouse, Parent': { es: 'p. ej., cónyuge, padre/madre', zh: '例如：配偶、父母' },
};

export default function Demographics({ onNext, onBack }) {
  const { data, setField } = useIntake();
  const d = data.demographics;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const isUS = !d.country || /^(us|usa|u\.s\.a?\.?|united states( of america)?)$/i.test(String(d.country).trim());


  const updateField = (field, value) => {
    setField('demographics', field, value);
  };

  // Auto-calculate age from DOB
  const handleDobChange = (dob) => {
    updateField('dob', dob);
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 0 && age < 150) updateField('age', age.toString());
    }
  };

  const isValid = d.firstName && d.lastName && d.dob && d.sex;

  // A returning patient without a link from the office: once there is enough
  // to recognise them, offer to send a link to the address on file. Nothing
  // from the chart comes back here; the link does the loading.
  const [recog, setRecog] = useState({ busy: false, status: '', hint: '' });
  const canRecognize = !data.invite?.status && d.firstName && d.lastName && /^\d{4}-\d{2}-\d{2}$/.test(d.dob || '') && (d.phone || d.email);
  const recognize = async () => {
    setRecog({ busy: true, status: '', hint: '' });
    try {
      const res = await fetch('/api/recognize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ demographics: d }) });
      const r = await res.json();
      setRecog({ busy: false, status: r.status || 'none', hint: r.hint || '' });
    } catch {
      setRecog({ busy: false, status: 'none', hint: '' });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Patient Information')}</h2>
        <p className="section-subtitle">
          {t("Let's start with some basic information. Fields marked with * are required.")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Personal Details')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('First Name *')}</label>
              <input
                type="text"
                value={d.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder={t('First name')}
              />
            </div>
            <div>
              <label className="form-label">{t('Last Name *')}</label>
              <input
                type="text"
                value={d.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder={t('Last name')}
              />
            </div>
            <div>
              <label className="form-label">{t('Date of Birth *')}</label>
              <input
                type="date"
                value={d.dob}
                onChange={(e) => handleDobChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="form-label">{t('Age')}</label>
              <input
                type="text"
                value={d.age}
                readOnly
                className="bg-gray-50"
                placeholder={t('Calculated from DOB')}
              />
            </div>
            <div>
              <label className="form-label">{t('Sex *')}</label>
              <select value={d.sex} onChange={(e) => updateField('sex', e.target.value)}>
                <option value="">{t('Select...')}</option>
                <option value="Male">{t('Male')}</option>
                <option value="Female">{t('Female')}</option>
                <option value="Other">{t('Other')}</option>
                <option value="Prefer not to say">{t('Prefer not to say')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Contact Information')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('Phone')}</label>
              <input
                type="tel"
                value={d.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="form-label">{t('Email')}</label>
              <input
                type="email"
                value={d.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="patient@email.com"
              />
            </div>
          </div>
        </div>

        {canRecognize && (
          <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 px-5 py-4">
            <p className="text-base font-medium text-navy-600">{t('Been here before?')}</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t('If we already have you on file, we can send a private link to the email we have for you that opens this form with your history filled in.')}</p>
            {recog.status === 'sent' ? (
              <p className="text-sm text-teal-800 mt-3">{t('We sent a link to {hint}. Open it on any device to continue with your history filled in. Or simply carry on here.').replace('{hint}', recog.hint)}</p>
            ) : recog.status ? (
              <p className="text-sm text-gray-600 mt-3">{t('We could not match you to a record with these details, or there is no email on file. Please carry on; the office will connect your form to your chart.')}</p>
            ) : (
              <button type="button" onClick={recognize} disabled={recog.busy} className="btn-secondary text-sm mt-3 disabled:opacity-50">{recog.busy ? t('Checking…') : t('Send me my link')}</button>
            )}
          </div>
        )}

        <div className="pt-2">
          <h3 className="text-base font-semibold text-navy-600">{t('Address, insurance and referral')}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {t('If you already have an appointment, or you have been seen here before, we most likely have this on file and you can leave it blank. If this is your first time, please fill it in.')}
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Address')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">{t('Address')}</label>
              <input
                type="text"
                value={d.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder={t('Street address')}
              />
            </div>
            <div>
              <label className="form-label">{t('City')}</label>
              <input
                type="text"
                value={d.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder={t('City')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{isUS ? t('State') : t('State / Province / Region')}</label>
                {isUS ? (
                  <select value={d.state} onChange={(e) => updateField('state', e.target.value)}>
                    <option value="">{t('State')}</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={d.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder={t('State / Province / Region')}
                  />
                )}
              </div>
              <div>
                <label className="form-label">{isUS ? t('ZIP') : t('Postal code')}</label>
                <input
                  type="text"
                  value={d.zip}
                  onChange={(e) => updateField('zip', e.target.value)}
                  placeholder={isUS ? t('ZIP code') : t('Postal code')}
                  maxLength={12}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">{t('Country')}</label>
              <input
                type="text"
                list="country-suggestions"
                value={d.country ?? 'United States'}
                onChange={(e) => updateField('country', e.target.value)}
                placeholder={t('Country')}
              />
              <datalist id="country-suggestions">
                {COUNTRY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
        </div>

        {/* Insurance & Referral */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Insurance & Referral')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('Insurance Provider')}</label>
              <input
                type="text"
                value={d.insuranceProvider}
                onChange={(e) => updateField('insuranceProvider', e.target.value)}
                placeholder={t('Insurance company name')}
              />
            </div>
            <div>
              <label className="form-label">{t('Member ID')}</label>
              <input
                type="text"
                value={d.memberId}
                onChange={(e) => updateField('memberId', e.target.value)}
                placeholder={t('Member/Policy ID')}
              />
            </div>
            <div>
              <label className="form-label">{t('Referring Physician')}</label>
              <input
                type="text"
                value={d.referringPhysician}
                onChange={(e) => updateField('referringPhysician', e.target.value)}
                placeholder={t('Dr. who referred you')}
              />
            </div>
            <div>
              <label className="form-label">{t('Primary Care Physician')}</label>
              <input
                type="text"
                value={d.primaryCarePhysician}
                onChange={(e) => updateField('primaryCarePhysician', e.target.value)}
                placeholder={t('Your PCP')}
              />
            </div>
            <div>
              <label className="form-label">{t('Group Number')}</label>
              <input type="text" value={d.groupNumber || ''} onChange={(e) => updateField('groupNumber', e.target.value)} placeholder={t('Group # on your card')} />
            </div>
            <div>
              <label className="form-label">{t('Insurance Phone')}</label>
              <input type="tel" value={d.insurancePhone || ''} onChange={(e) => updateField('insurancePhone', e.target.value)} placeholder={t('Member services number on the card')} />
            </div>
            <div>
              <label className="form-label">{t('Policy Holder (if not you)')}</label>
              <input type="text" value={d.policyHolderName || ''} onChange={(e) => updateField('policyHolderName', e.target.value)} placeholder={t('Name of the person who holds the policy')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('Policy Holder Date of Birth')}</label>
                <input type="date" value={d.policyHolderDob || ''} onChange={(e) => updateField('policyHolderDob', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('Relationship to You')}</label>
                <input type="text" value={d.policyHolderRelationship || ''} onChange={(e) => updateField('policyHolderRelationship', e.target.value)} placeholder={t('e.g., Spouse, Parent')} />
              </div>
            </div>
            <div>
              <label className="form-label">{t('Secondary Insurance (if any)')}</label>
              <input type="text" value={d.secondaryInsurance || ''} onChange={(e) => updateField('secondaryInsurance', e.target.value)} placeholder={t('Insurance company name')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('Secondary Member ID')}</label>
                <input type="text" value={d.secondaryMemberId || ''} onChange={(e) => updateField('secondaryMemberId', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('Secondary Group Number')}</label>
                <input type="text" value={d.secondaryGroupNumber || ''} onChange={(e) => updateField('secondaryGroupNumber', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('Referring Physician Phone')}</label>
                <input type="tel" value={d.referringPhone || ''} onChange={(e) => updateField('referringPhone', e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="form-label">{t('Referring Physician Fax')}</label>
                <input type="tel" value={d.referringFax || ''} onChange={(e) => updateField('referringFax', e.target.value)} placeholder="(555) 123-4567" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('Primary Care Phone')}</label>
                <input type="tel" value={d.pcpPhone || ''} onChange={(e) => updateField('pcpPhone', e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="form-label">{t('Primary Care Fax')}</label>
                <input type="tel" value={d.pcpFax || ''} onChange={(e) => updateField('pcpFax', e.target.value)} placeholder="(555) 123-4567" />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">{t('If you do not have an appointment yet, this is what the office needs to verify your benefits and request your records before scheduling.')}</p>
        </div>

        {/* Emergency Contact */}
        <Collapsible
          title={t('Emergency contact (optional)')}
          hint={t('Someone we may call if we cannot reach you.')}
          filled={countFilled([d.emergencyContactName, d.emergencyContactPhone, d.emergencyContactRelation])}
          total={3}
        >
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Emergency Contact')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">{t('Name')}</label>
              <input
                type="text"
                value={d.emergencyContactName}
                onChange={(e) => updateField('emergencyContactName', e.target.value)}
                placeholder={t('Emergency contact name')}
              />
            </div>
            <div>
              <label className="form-label">{t('Phone')}</label>
              <input
                type="tel"
                value={d.emergencyContactPhone}
                onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="form-label">{t('Relationship')}</label>
              <input
                type="text"
                value={d.emergencyContactRelation}
                onChange={(e) => updateField('emergencyContactRelation', e.target.value)}
                placeholder={t('e.g., Spouse, Parent')}
              />
            </div>
          </div>
        </div>
        </Collapsible>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={isValid}
        nextLabel={t('Continue')}
        showBack={true}
      />
    </div>
  );
}
