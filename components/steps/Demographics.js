'use client';

import { useIntake, useService } from '../../lib/store';

// Offered as suggestions only; any country can be typed.
const COUNTRY_SUGGESTIONS = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Ireland', 'Spain', 'France', 'Germany', 'Italy', 'Portugal', 'Brazil', 'Argentina', 'Colombia', 'Dominican Republic', 'Puerto Rico', 'India', 'China', 'Taiwan', 'Hong Kong', 'Singapore', 'Philippines', 'South Korea', 'Japan', 'Australia', 'Israel', 'United Arab Emirates', 'Saudi Arabia', 'Nigeria', 'South Africa'];
import StepNavigation from '../ui/StepNavigation';
import UploadToFill from '../UploadToFill';
import Collapsible, { countFilled } from '../ui/Collapsible';
import { useState } from 'react';
import { useLang, makeT, COMMON } from '../../lib/i18n';

// A child's visit: who the adult filling the form in is to the child.
const GUARDIAN_RELATIONSHIPS = ['Mother', 'Father', 'Stepmother', 'Stepfather', 'Grandmother', 'Grandfather', 'Legal Guardian', 'Foster Parent', 'Other'];

// The language the family prefers at the visit (the pediatric intakes' list,
// plus the languages this form itself offers).
const FAMILY_LANGUAGES = ['English', 'Spanish', 'Mandarin', 'Arabic', 'Bengali', 'French', 'Haitian Creole', 'Hebrew', 'Hindi', 'Igbo', 'Italian', 'Japanese', 'Korean', 'Nepali', 'Polish', 'Portuguese', 'Russian', 'Urdu', 'Yiddish', 'Yoruba'];

const INTERPRETER_OPTIONS = ['Yes', 'No, we are comfortable in English', 'We may bring our own interpreter'];

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
  'Already a patient here, or already gave the office this information? If nothing has changed, you can skip this. If you are new to the office or anything has changed, please fill it in so your appointment can be made.': {
    es: '¿Ya es paciente aquí, o ya le dio esta información a la oficina? Si nada ha cambiado, puede omitir esta parte. Si es nuevo en la oficina o algo ha cambiado, por favor complétela para que se pueda programar su cita.',
    zh: '您已经是这里的患者，或者已经向办公室提供过这些信息？如果没有任何变化，可以跳过此部分。如果您是新患者或信息有变动，请填写，以便为您安排预约。',
  },
  'If the office already has your insurance and nothing has changed, leave this blank.': {
    es: 'Si la oficina ya tiene su seguro y nada ha cambiado, deje esto en blanco.',
    zh: '如果办公室已有您的保险信息且没有变化，请留空。',
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

  // A child's visit
  'Tell us about the child this visit is for. Fields marked with * are required.': {
    es: 'Cuéntenos sobre el niño o la niña para quien es esta visita. Los campos marcados con * son obligatorios.',
    zh: '请告诉我们这次就诊的孩子的信息。标有 * 的字段为必填项。',
  },
  'Who is completing this form?': { es: '¿Quién está completando este formulario?', zh: '本表格由谁填写？' },
  'A parent or guardian': { es: 'Un padre, madre o tutor', zh: '家长或监护人' },
  'The patient': { es: 'El paciente', zh: '患者本人' },
  'Your name *': { es: 'Su nombre *', zh: '您的姓名 *' },
  'First and last name': { es: 'Nombre y apellido', zh: '名字和姓氏' },
  'Relationship to the patient *': { es: 'Parentesco con el paciente *', zh: '与患者的关系 *' },
  'Mother': { es: 'Madre', zh: '母亲' },
  'Father': { es: 'Padre', zh: '父亲' },
  'Stepmother': { es: 'Madrastra', zh: '继母' },
  'Stepfather': { es: 'Padrastro', zh: '继父' },
  'Grandmother': { es: 'Abuela', zh: '祖母／外祖母' },
  'Grandfather': { es: 'Abuelo', zh: '祖父／外祖父' },
  'Legal Guardian': { es: 'Tutor legal', zh: '法定监护人' },
  'Foster Parent': { es: 'Padre o madre de acogida', zh: '寄养家长' },
  "The patient's details": { es: 'Datos del paciente', zh: '患者详细信息' },
  'The phone and email of the parent or guardian the office should contact.': {
    es: 'El teléfono y el correo electrónico del padre, madre o tutor con quien la oficina debe comunicarse.',
    zh: '办公室应联系的家长或监护人的电话和电子邮件。',
  },
  'Has the patient been here before?': { es: '¿El paciente ya ha estado aquí antes?', zh: '患者以前来过吗？' },
  'If we already have the patient on file, we can send a private link to the email we have for the family that opens this form with the history filled in.': {
    es: 'Si ya tenemos al paciente en nuestros registros, podemos enviar un enlace privado al correo que tenemos de la familia, que abre este formulario con el historial ya completado.',
    zh: '如果我们已有该患者的记录，可以向我们存档的家庭邮箱发送一个私密链接，打开后此表格会自动填入病史。',
  },
  'Language, cultural and scheduling preferences (optional)': { es: 'Idioma, preferencias culturales y de programación (opcional)', zh: '语言、文化与预约安排偏好（可选）' },
  'Every family has its own values, traditions and needs; knowing yours helps the office plan a respectful, comfortable visit.': {
    es: 'Cada familia tiene sus propios valores, tradiciones y necesidades; conocerlos ayuda a la oficina a planificar una visita respetuosa y cómoda.',
    zh: '每个家庭都有自己的价值观、传统和需求；了解这些有助于办公室安排一次尊重且舒适的就诊。',
  },
  'Language and preferences': { es: 'Idioma y preferencias', zh: '语言与偏好' },
  'Whether it is scheduling around religious observances, dietary needs during a hospital stay, or anything else that matters to your family, we want to know so we can get it right.': {
    es: 'Ya sea programar en torno a festividades religiosas, necesidades alimentarias durante una hospitalización o cualquier otra cosa importante para su familia, queremos saberlo para hacerlo bien.',
    zh: '无论是避开宗教节日安排时间、住院期间的饮食需求，还是对您家庭重要的其他事项，我们都希望了解，以便做好安排。',
  },
  'Preferred language': { es: 'Idioma preferido', zh: '首选语言' },
  'English': { es: 'Inglés', zh: '英语' },
  'Spanish': { es: 'Español', zh: '西班牙语' },
  'Mandarin': { es: 'Mandarín', zh: '普通话' },
  'Arabic': { es: 'Árabe', zh: '阿拉伯语' },
  'Bengali': { es: 'Bengalí', zh: '孟加拉语' },
  'French': { es: 'Francés', zh: '法语' },
  'Haitian Creole': { es: 'Criollo haitiano', zh: '海地克里奥尔语' },
  'Hebrew': { es: 'Hebreo', zh: '希伯来语' },
  'Hindi': { es: 'Hindi', zh: '印地语' },
  'Igbo': { es: 'Igbo', zh: '伊博语' },
  'Italian': { es: 'Italiano', zh: '意大利语' },
  'Japanese': { es: 'Japonés', zh: '日语' },
  'Korean': { es: 'Coreano', zh: '韩语' },
  'Nepali': { es: 'Nepalí', zh: '尼泊尔语' },
  'Polish': { es: 'Polaco', zh: '波兰语' },
  'Portuguese': { es: 'Portugués', zh: '葡萄牙语' },
  'Russian': { es: 'Ruso', zh: '俄语' },
  'Urdu': { es: 'Urdu', zh: '乌尔都语' },
  'Yiddish': { es: 'Yidis', zh: '意第绪语' },
  'Yoruba': { es: 'Yoruba', zh: '约鲁巴语' },
  'Please specify the language': { es: 'Especifique el idioma', zh: '请注明语言' },
  'Type the language': { es: 'Escriba el idioma', zh: '请输入语言' },
  'Will you need an interpreter at the visit?': { es: '¿Necesitará un intérprete en la visita?', zh: '就诊时需要口译员吗？' },
  'No, we are comfortable in English': { es: 'No, nos manejamos bien en inglés', zh: '不需要，我们能用英语交流' },
  'We may bring our own interpreter': { es: 'Puede que traigamos nuestro propio intérprete', zh: '我们可能自带口译员' },
  'Any religious, cultural or personal preferences we should know about, to give your family the best care?': {
    es: '¿Hay alguna preferencia religiosa, cultural o personal que debamos conocer para brindarle a su familia la mejor atención?',
    zh: '有哪些宗教、文化或个人偏好需要我们了解，以便为您的家庭提供最好的照护？',
  },
  'e.g., dietary restrictions, religious observances, how you prefer to be addressed': {
    es: 'p. ej., restricciones alimentarias, festividades religiosas, cómo prefiere que se dirijan a usted',
    zh: '例如：饮食限制、宗教节日、您希望的称呼方式',
  },
  'Any scheduling considerations we should know about?': { es: '¿Alguna consideración sobre la programación que debamos conocer?', zh: '在安排时间上有什么需要我们注意的吗？' },
  'e.g., religious observances, a long drive to the office, school hours, other medical appointments': {
    es: 'p. ej., festividades religiosas, un viaje largo hasta la oficina, el horario escolar, otras citas médicas',
    zh: '例如：宗教节日、路途遥远、上学时间、其他就医安排',
  },
  "Your child's other doctors": { es: 'Los otros médicos de su hijo o hija', zh: '孩子的其他医生' },
  'A phone or fax number here saves the office a long search when records need to go back and forth. Fill in what you know.': {
    es: 'Un número de teléfono o de fax aquí le ahorra a la oficina una larga búsqueda cuando hay que intercambiar registros. Complete lo que sepa.',
    zh: '在此填写电话或传真号码，可以在需要来回传送病历时为办公室省去大量查找。知道多少填多少。',
  },
  'Who referred you': { es: 'Quién lo refirió', zh: '转诊人' },
  'Name of the doctor or clinic': { es: 'Nombre del médico o de la clínica', zh: '医生或诊所名称' },
  'Their office phone': { es: 'Teléfono de su consultorio', zh: '其办公室电话' },
  'Their fax': { es: 'Su fax', zh: '其传真' },
  'Pediatrician': { es: 'Pediatra', zh: '儿科医生' },
  'Name of the doctor or practice': { es: 'Nombre del médico o del consultorio', zh: '医生或诊所名称' },
  "Pediatrician's phone": { es: 'Teléfono del pediatra', zh: '儿科医生电话' },
  "Pediatrician's fax": { es: 'Fax del pediatra', zh: '儿科医生传真' },
  "Any other doctors involved in your child's care": { es: 'Otros médicos que participan en la atención de su hijo o hija', zh: '参与孩子治疗的其他医生' },
  'Name, practice, and a phone or fax number for each, one per line': {
    es: 'Nombre, consultorio y un teléfono o fax de cada uno, uno por línea',
    zh: '每位医生的姓名、诊所及电话或传真，每行一位',
  },
  'Insurance': { es: 'Seguro', zh: '保险' },
  'Policy Holder (if not the patient)': { es: 'Titular de la póliza (si no es el paciente)', zh: '投保人（如非患者本人）' },
  'Usually a parent: the name on the card': { es: 'Normalmente uno de los padres: el nombre que figura en la tarjeta', zh: '通常是家长：保险卡上的姓名' },
  'Relationship to the patient': { es: 'Parentesco con el paciente', zh: '与患者的关系' },
  'e.g., Mother, Father': { es: 'p. ej., madre, padre', zh: '例如：母亲、父亲' },
  'If your child does not have an appointment yet, this is what the office needs to verify benefits and request records before scheduling.': {
    es: 'Si su hijo o hija aún no tiene cita, esto es lo que la oficina necesita para verificar la cobertura y solicitar los registros antes de programarla.',
    zh: '如果孩子还没有预约，办公室需要这些信息来核实保险福利并在安排预约前索取病历。',
  },
  'Another contact (optional)': { es: 'Otro contacto (opcional)', zh: '另一位联系人（可选）' },
  'Another parent or guardian we may call if we cannot reach you.': {
    es: 'Otro padre, madre o tutor a quien podamos llamar si no logramos comunicarnos con usted.',
    zh: '在联系不到您时可以联系的另一位家长或监护人。',
  },
  'Second contact': { es: 'Segundo contacto', zh: '第二联系人' },
  'Contact name': { es: 'Nombre del contacto', zh: '联系人姓名' },
  'e.g., Father, Grandmother': { es: 'p. ej., padre, abuela', zh: '例如：父亲、祖母' },
};

export default function Demographics({ onNext, onBack }) {
  const { data, setField, setNested } = useIntake();
  const service = useService();
  const { US_STATES } = service.constants;
  // A child's visit: the parent or guardian fills the form in about the
  // child. The name, date of birth and sex stay the patient's (the child's);
  // the adult goes under demographics.guardian.
  const child = service.patient === 'child';
  const ortho = service.specialty === 'ortho';
  const d = data.demographics;
  const g = d.guardian || { completedBy: 'parent', name: '', relationship: '' };
  const byParent = child && g.completedBy !== 'patient';
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const isUS = !d.country || /^(us|usa|u\.s\.a?\.?|united states( of america)?)$/i.test(String(d.country).trim());


  const updateField = (field, value) => {
    setField('demographics', field, value);
  };
  const updateGuardian = (field, value) => {
    setField('demographics', 'guardian', { ...g, [field]: value });
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

  const isValid = d.firstName && d.lastName && d.dob && d.sex && (!byParent || (g.name && g.relationship));

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

  // The name, date of birth and sex fields: the same inputs for an adult and
  // a child, under a different card title.
  const personalFields = (
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
  );

  const contactFields = (
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
  );

  const prefsFilled = countFilled([d.preferredLanguage, d.interpreterNeeded, d.culturalPreferences, d.schedulingConsiderations]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Patient Information')}</h2>
        <p className="section-subtitle">
          {child
            ? t('Tell us about the child this visit is for. Fields marked with * are required.')
            : t("Let's start with some basic information. Fields marked with * are required.")}
        </p>
      </div>

      <div className="space-y-6">
        {child ? (
          <>
            {/* Who is filling the form in */}
            <div className="card">
              <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Who is completing this form?')}</h3>
              <div className="flex flex-wrap gap-2">
                {[['parent', 'A parent or guardian'], ['patient', 'The patient']].map(([id, label]) => {
                  const active = (g.completedBy || 'parent') === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateGuardian('completedBy', id)}
                      aria-pressed={active}
                      className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${active ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'}`}
                    >
                      {t(label)}
                    </button>
                  );
                })}
              </div>
              {byParent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="form-label">{t('Your name *')}</label>
                    <input type="text" value={g.name || ''} onChange={(e) => updateGuardian('name', e.target.value)} placeholder={t('First and last name')} autoComplete="name" />
                  </div>
                  <div>
                    <label className="form-label">{t('Relationship to the patient *')}</label>
                    <select value={g.relationship || ''} onChange={(e) => updateGuardian('relationship', e.target.value)}>
                      <option value="">{t('Select...')}</option>
                      {GUARDIAN_RELATIONSHIPS.map((r) => <option key={r} value={r}>{t(r)}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* The child */}
            <div className="card">
              <h3 className="text-lg font-medium text-navy-600 mb-4">{t("The patient's details")}</h3>
              {personalFields}
            </div>

            {/* The family's contact details */}
            <div className="card">
              <h3 className="text-lg font-medium text-navy-600 mb-1">{t('Contact Information')}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t('The phone and email of the parent or guardian the office should contact.')}</p>
              {contactFields}
            </div>
          </>
        ) : (
          <>
            {/* Name */}
            <div className="card">
              <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Personal Details')}</h3>
              {personalFields}
            </div>

            {/* Contact */}
            <div className="card">
              <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Contact Information')}</h3>
              {contactFields}
            </div>
          </>
        )}

        {canRecognize && (
          <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 px-5 py-4">
            <p className="text-base font-medium text-navy-600">{t(child ? 'Has the patient been here before?' : 'Been here before?')}</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t(child
              ? 'If we already have the patient on file, we can send a private link to the email we have for the family that opens this form with the history filled in.'
              : 'If we already have you on file, we can send a private link to the email we have for you that opens this form with your history filled in.')}</p>
            {recog.status === 'sent' ? (
              <p className="text-sm text-teal-800 mt-3">{t('We sent a link to {hint}. Open it on any device to continue with your history filled in. Or simply carry on here.').replace('{hint}', recog.hint)}</p>
            ) : recog.status ? (
              <p className="text-sm text-gray-600 mt-3">{t('We could not match you to a record with these details, or there is no email on file. Please carry on; the office will connect your form to your chart.')}</p>
            ) : (
              <button type="button" onClick={recognize} disabled={recog.busy} className="btn-secondary text-sm mt-3 disabled:opacity-50">{recog.busy ? t('Checking…') : t('Send me my link')}</button>
            )}
          </div>
        )}

        {/* A child's visit: the family's language and preferences */}
        {child && (
          <Collapsible
            title={t('Language, cultural and scheduling preferences (optional)')}
            hint={t('Every family has its own values, traditions and needs; knowing yours helps the office plan a respectful, comfortable visit.')}
            filled={prefsFilled}
            total={4}
          >
            <div className="card">
              <h3 className="text-lg font-medium text-navy-600 mb-1">{t('Language and preferences')}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t('Whether it is scheduling around religious observances, dietary needs during a hospital stay, or anything else that matters to your family, we want to know so we can get it right.')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('Preferred language')}</label>
                  <select
                    value={d.preferredLanguage || ''}
                    onChange={(e) => {
                      updateField('preferredLanguage', e.target.value);
                      if (e.target.value !== 'Other') updateField('otherLanguage', '');
                    }}
                  >
                    <option value="">{t('Select...')}</option>
                    {FAMILY_LANGUAGES.map((l) => <option key={l} value={l}>{t(l)}</option>)}
                    <option value="Other">{t('Other')}</option>
                  </select>
                </div>
                {d.preferredLanguage === 'Other' && (
                  <div>
                    <label className="form-label">{t('Please specify the language')}</label>
                    <input type="text" value={d.otherLanguage || ''} onChange={(e) => updateField('otherLanguage', e.target.value)} placeholder={t('Type the language')} />
                  </div>
                )}
                {d.preferredLanguage && d.preferredLanguage !== 'English' && (
                  <div>
                    <label className="form-label">{t('Will you need an interpreter at the visit?')}</label>
                    <select value={d.interpreterNeeded || ''} onChange={(e) => updateField('interpreterNeeded', e.target.value)}>
                      <option value="">{t('Select...')}</option>
                      {INTERPRETER_OPTIONS.map((o) => <option key={o} value={o}>{t(o)}</option>)}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="form-label">{t('Any religious, cultural or personal preferences we should know about, to give your family the best care?')}</label>
                  <input type="text" value={d.culturalPreferences || ''} onChange={(e) => updateField('culturalPreferences', e.target.value)} placeholder={t('e.g., dietary restrictions, religious observances, how you prefer to be addressed')} />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">{t('Any scheduling considerations we should know about?')}</label>
                  <input type="text" value={d.schedulingConsiderations || ''} onChange={(e) => updateField('schedulingConsiderations', e.target.value)} placeholder={t('e.g., religious observances, a long drive to the office, school hours, other medical appointments')} />
                </div>
              </div>
            </div>
          </Collapsible>
        )}

        <div className="pt-2">
          <h3 className="text-base font-semibold text-navy-600">{t('Address, insurance and referral')}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {t('Already a patient here, or already gave the office this information? If nothing has changed, you can skip this. If you are new to the office or anything has changed, please fill it in so your appointment can be made.')}
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

        {/* A child's visit: the referring doctor and the pediatrician get a
            card of their own, with a line for anyone else involved. */}
        {child && (
          <div className="card">
            <h3 className="text-lg font-medium text-navy-600 mb-1">{t("Your child's other doctors")}</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t('A phone or fax number here saves the office a long search when records need to go back and forth. Fill in what you know.')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('Who referred you')}</label>
                <input type="text" value={d.referringPhysician} onChange={(e) => updateField('referringPhysician', e.target.value)} placeholder={t('Name of the doctor or clinic')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('Their office phone')}</label>
                  <input type="tel" value={d.referringPhone || ''} onChange={(e) => updateField('referringPhone', e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label className="form-label">{t('Their fax')}</label>
                  <input type="tel" value={d.referringFax || ''} onChange={(e) => updateField('referringFax', e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div>
                <label className="form-label">{t('Pediatrician')}</label>
                <input type="text" value={d.primaryCarePhysician} onChange={(e) => updateField('primaryCarePhysician', e.target.value)} placeholder={t('Name of the doctor or practice')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t("Pediatrician's phone")}</label>
                  <input type="tel" value={d.pcpPhone || ''} onChange={(e) => updateField('pcpPhone', e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label className="form-label">{t("Pediatrician's fax")}</label>
                  <input type="tel" value={d.pcpFax || ''} onChange={(e) => updateField('pcpFax', e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
              {ortho && (
                <div className="md:col-span-2">
                  <label className="form-label">{t("Any other doctors involved in your child's care")}</label>
                  <textarea
                    value={d.otherProviders || ''}
                    onChange={(e) => updateField('otherProviders', e.target.value)}
                    placeholder={t('Name, practice, and a phone or fax number for each, one per line')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insurance & Referral */}
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-1">{t(child ? 'Insurance' : 'Insurance & Referral')}</h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t('If the office already has your insurance and nothing has changed, leave this blank.')}</p>
          <UploadToFill section="insurance" />
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
            {!child && (
            <div>
              <label className="form-label">{t('Referring Physician')}</label>
              <input
                type="text"
                value={d.referringPhysician}
                onChange={(e) => updateField('referringPhysician', e.target.value)}
                placeholder={t('Dr. who referred you')}
              />
            </div>
            )}
            {!child && (
            <div>
              <label className="form-label">{t('Primary Care Physician')}</label>
              <input
                type="text"
                value={d.primaryCarePhysician}
                onChange={(e) => updateField('primaryCarePhysician', e.target.value)}
                placeholder={t('Your PCP')}
              />
            </div>
            )}
            <div>
              <label className="form-label">{t('Group Number')}</label>
              <input type="text" value={d.groupNumber || ''} onChange={(e) => updateField('groupNumber', e.target.value)} placeholder={t('Group # on your card')} />
            </div>
            <div>
              <label className="form-label">{t('Insurance Phone')}</label>
              <input type="tel" value={d.insurancePhone || ''} onChange={(e) => updateField('insurancePhone', e.target.value)} placeholder={t('Member services number on the card')} />
            </div>
            <div>
              <label className="form-label">{t(child ? 'Policy Holder (if not the patient)' : 'Policy Holder (if not you)')}</label>
              <input type="text" value={d.policyHolderName || ''} onChange={(e) => updateField('policyHolderName', e.target.value)} placeholder={t(child ? 'Usually a parent: the name on the card' : 'Name of the person who holds the policy')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('Policy Holder Date of Birth')}</label>
                <input type="date" value={d.policyHolderDob || ''} onChange={(e) => updateField('policyHolderDob', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t(child ? 'Relationship to the patient' : 'Relationship to You')}</label>
                <input type="text" value={d.policyHolderRelationship || ''} onChange={(e) => updateField('policyHolderRelationship', e.target.value)} placeholder={t(child ? 'e.g., Mother, Father' : 'e.g., Spouse, Parent')} />
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
            {!child && (
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
            )}
            {!child && (
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
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">{t(child
            ? 'If your child does not have an appointment yet, this is what the office needs to verify benefits and request records before scheduling.'
            : 'If you do not have an appointment yet, this is what the office needs to verify your benefits and request your records before scheduling.')}</p>
        </div>

        {/* Emergency Contact (a second parent or guardian for a child) */}
        <Collapsible
          title={t(child ? 'Another contact (optional)' : 'Emergency contact (optional)')}
          hint={t(child ? 'Another parent or guardian we may call if we cannot reach you.' : 'Someone we may call if we cannot reach you.')}
          filled={countFilled([d.emergencyContactName, d.emergencyContactPhone, d.emergencyContactRelation])}
          total={3}
        >
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t(child ? 'Second contact' : 'Emergency Contact')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">{t('Name')}</label>
              <input
                type="text"
                value={d.emergencyContactName}
                onChange={(e) => updateField('emergencyContactName', e.target.value)}
                placeholder={t(child ? 'Contact name' : 'Emergency contact name')}
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
                placeholder={t(child ? 'e.g., Father, Grandmother' : 'e.g., Spouse, Parent')}
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
