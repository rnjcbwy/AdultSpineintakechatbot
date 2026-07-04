'use client';

import { useIntake } from '../../lib/store';
import { US_STATES, VISIT_REASONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';
import { useLang, makeT, COMMON } from '../../lib/i18n';

const LOCAL = {
  'Patient Information': { es: 'Información del paciente', zh: '患者信息' },
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
  'Reason for Visit *': { es: 'Motivo de la visita *', zh: '就诊原因 *' },
  'What brings you to the spine surgery clinic?': {
    es: '¿Qué lo trae a la clínica de cirugía de columna?',
    zh: '您来脊柱外科诊所的原因是什么？',
  },
  'Continue to Chief Complaint': { es: 'Continuar al motivo principal', zh: '继续填写主诉' },
  // VISIT_REASONS options (display-only; stored English)
  'New patient evaluation': { es: 'Evaluación de paciente nuevo', zh: '新患者评估' },
  'Second opinion': { es: 'Segunda opinión', zh: '第二意见' },
  'Follow-up visit': { es: 'Visita de seguimiento', zh: '复诊' },
  'Post-operative follow-up': { es: 'Seguimiento posoperatorio', zh: '术后复诊' },
  'Referred for surgical evaluation': { es: 'Referido para evaluación quirúrgica', zh: '转诊进行手术评估' },
};

export default function Demographics({ onNext, onBack }) {
  const { data, setField } = useIntake();
  const d = data.demographics;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

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

  const isValid = d.firstName && d.lastName && d.dob && d.sex && d.visitReason;

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
                <label className="form-label">{t('State')}</label>
                <select value={d.state} onChange={(e) => updateField('state', e.target.value)}>
                  <option value="">{t('State')}</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{t('ZIP')}</label>
                <input
                  type="text"
                  value={d.zip}
                  onChange={(e) => updateField('zip', e.target.value)}
                  placeholder={t('ZIP code')}
                  maxLength={10}
                />
              </div>
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

        {/* Visit Reason */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Reason for Visit *')}</h3>
          <p className="text-sm text-gray-500 mb-3">{t('What brings you to the spine surgery clinic?')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VISIT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  d.visitReason === reason
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50/30'
                }`}
              >
                <input
                  type="radio"
                  name="visitReason"
                  value={reason}
                  checked={d.visitReason === reason}
                  onChange={(e) => updateField('visitReason', e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  d.visitReason === reason ? 'border-teal-400' : 'border-gray-300'
                }`}>
                  {d.visitReason === reason && (
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  )}
                </div>
                <span className="text-sm font-medium">{t(reason)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={isValid}
        nextLabel={t('Continue to Chief Complaint')}
        showBack={true}
      />
    </div>
  );
}
