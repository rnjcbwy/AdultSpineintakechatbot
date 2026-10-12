'use client';

import { useIntake } from '../../lib/store';
import { US_STATES } from '../../lib/constants';

// Offered as suggestions only; any country can be typed.
const COUNTRY_SUGGESTIONS = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Ireland', 'Spain', 'France', 'Germany', 'Italy', 'Portugal', 'Brazil', 'Argentina', 'Colombia', 'Dominican Republic', 'Puerto Rico', 'India', 'China', 'Taiwan', 'Hong Kong', 'Singapore', 'Philippines', 'South Korea', 'Japan', 'Australia', 'Israel', 'United Arab Emirates', 'Saudi Arabia', 'Nigeria', 'South Africa'];
import StepNavigation from '../ui/StepNavigation';
import Collapsible, { countFilled } from '../ui/Collapsible';
import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
  'Address, insurance and contacts (optional)': { es: 'Dirección, seguro y contactos (opcional)', zh: '地址、保险和联系人（可选）' },
  'The office can take these at your visit. Fill them in now if you have them handy.': {
    es: 'El consultorio puede tomarlos en su visita. Complételos ahora si los tiene a mano.',
    zh: '诊所可以在您就诊时登记这些信息。如果方便，现在也可以填写。',
  },
  'Address': { es: 'Dirección', zh: '地址' },
  'Patient Information': { es: 'Información del paciente', zh: '患者信息' },
  'State / Province / Region': { es: 'Estado / Provincia / Región', zh: '州 / 省 / 地区' },
  'Postal code': { es: 'Código postal', zh: '邮政编码' },
  'Country': { es: 'País', zh: '国家' },
  'Patients travel to Dr. Wey from everywhere; enter the country you live in.': {
    es: 'Pacientes de todo el mundo acuden al Dr. Wey; indique el país donde vive.',
    zh: '世界各地的患者都会来找 Wey 医生；请填写您居住的国家。',
  },
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

        <Collapsible
          title={t('Address, insurance and contacts (optional)')}
          hint={t('The office can take these at your visit. Fill them in now if you have them handy.')}
          filled={countFilled([d.address, d.city, d.zip, d.insuranceProvider, d.memberId, d.referringPhysician, d.primaryCarePhysician, d.emergencyContactName, d.emergencyContactPhone])}
          total={9}
        >
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
              <p className="text-xs text-gray-400 mt-1">{t('Patients travel to Dr. Wey from everywhere; enter the country you live in.')}</p>
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
          </div>
        </div>

        {/* Emergency Contact */}
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
