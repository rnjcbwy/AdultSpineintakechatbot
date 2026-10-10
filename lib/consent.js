// ============================================================================
// Acknowledgments the patient makes before submitting.
//
// These mirror the signatures on a paper new-patient packet (assignment of
// benefits, financial responsibility, receipt of the privacy notice, consent
// to be contacted) so the online intake stands in for those pages. Shared by
// the final step, the server-side check and the transcript PDF, so the words
// the patient agreed to are exactly the words that get filed.
// ============================================================================

export const CONSENT_ITEMS = [
  {
    key: 'accurate',
    label: 'Accuracy',
    text: 'The information I have provided is true and complete to the best of my knowledge. I am the patient, or I am completing this form as the patient\'s parent, guardian or authorized representative.',
    es: 'La información que he proporcionado es verdadera y completa según mi leal saber y entender. Soy el paciente, o completo este formulario como padre, madre, tutor o representante autorizado del paciente.',
    zh: '我所提供的信息在我所知范围内真实完整。我是患者本人，或作为患者的父母、监护人或授权代表填写本表格。',
  },
  {
    key: 'financial',
    label: 'Financial responsibility and assignment of benefits',
    text: 'I understand that any services not covered by my insurance, and any copayments or deductibles, are my responsibility. I authorize the release of the information needed to process my insurance claims, and I authorize payment from my insurance company to be made directly to Dr. Wey.',
    es: 'Entiendo que los servicios no cubiertos por mi seguro, así como los copagos y deducibles, son mi responsabilidad. Autorizo la divulgación de la información necesaria para procesar mis reclamaciones de seguro y autorizo que mi compañía de seguros pague directamente al Dr. Wey.',
    zh: '我了解保险不承保的任何服务以及自付额和免赔额均由我本人承担。我授权披露处理保险理赔所需的信息，并授权我的保险公司直接向 Wey 医生付款。',
  },
  {
    key: 'privacy',
    label: 'Notice of Privacy Practices',
    text: 'I understand that my health information is used to plan and provide my care and to arrange payment for it, and that Dr. Wey\'s Notice of Privacy Practices, which explains how my information may be used and shared, is available to me on request.',
    es: 'Entiendo que mi información de salud se utiliza para planificar y brindar mi atención y para gestionar su pago, y que el Aviso de Prácticas de Privacidad del Dr. Wey, que explica cómo puede usarse y compartirse mi información, está disponible a mi solicitud.',
    zh: '我了解我的健康信息用于规划和提供我的医疗服务并安排相关付款；Wey 医生的《隐私实践声明》说明了我的信息可能如何被使用和共享，我可以随时索取。',
  },
  {
    key: 'contact',
    label: 'Contact and emergencies',
    text: 'Dr. Wey\'s office may contact me by phone, text message or email using the details I have provided, to schedule and coordinate my care. This form is not an emergency service: if I have an emergency I will call 911 or my local emergency number.',
    es: 'El consultorio del Dr. Wey puede comunicarse conmigo por teléfono, mensaje de texto o correo electrónico usando los datos que proporcioné, para programar y coordinar mi atención. Este formulario no es un servicio de emergencia: en caso de emergencia llamaré al 911 o al número de emergencias local.',
    zh: 'Wey 医生的办公室可以通过我提供的电话、短信或电子邮件与我联系，以安排和协调我的诊疗。本表格不是紧急服务：如遇紧急情况，我会拨打 911 或当地急救电话。',
  },
];

export function consentText(item, lang) {
  return (lang && item[lang]) || item.text;
}

/** For the languages served from lib/translations, pass the loaded lookup in. */
export function consentTextVia(item, lang, tx) {
  return (lang && item[lang]) || (tx ? tx(lang, item.text) : item.text);
}

/** True when every acknowledgment is checked and a signature was typed. */
export function consentComplete(consent) {
  if (!consent) return false;
  return CONSENT_ITEMS.every((i) => consent[i.key] === true) && String(consent.signatureName || '').trim().length >= 3;
}
