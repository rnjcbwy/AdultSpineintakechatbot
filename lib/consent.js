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
    text: 'I understand that any services not covered by my insurance, and any copayments or deductibles, are my responsibility. I authorize the release of the information needed to process my insurance claims, and I authorize payment from my insurance company to be made directly to the practice.',
    es: 'Entiendo que los servicios no cubiertos por mi seguro, así como los copagos y deducibles, son mi responsabilidad. Autorizo la divulgación de la información necesaria para procesar mis reclamaciones de seguro y autorizo que mi compañía de seguros pague directamente al consultorio.',
    zh: '我了解保险不承保的任何服务以及自付额和免赔额均由我本人承担。我授权披露处理保险理赔所需的信息，并授权我的保险公司直接向诊所付款。',
  },
  {
    key: 'sharing',
    label: 'Sharing with other providers',
    text: 'I agree that the practice may share my health information with the other providers, facilities, imaging centers and therapists involved in my care, and may request my records from them, so that my care can be coordinated.',
    es: 'Acepto que el consultorio comparta mi información de salud con los demás proveedores, centros, centros de imágenes y terapeutas que participan en mi atención, y que solicite mis registros a ellos, para poder coordinar mi atención.',
    zh: '我同意诊所可以与参与我诊疗的其他医疗机构、设施、影像中心和治疗师共享我的健康信息，并向他们索取我的病历，以便协调我的诊疗。',
  },
  {
    key: 'privacy',
    label: 'Notice of Privacy Practices',
    text: 'I have been given the opportunity to read the Notice of Privacy Practices of Holy Name Medical Partners, which explains how my health information may be used and shared and the rights I have over it, and I acknowledge receipt of it. A copy is available at the link beside this statement and in the office.',
    es: 'Se me ha dado la oportunidad de leer el Aviso de Prácticas de Privacidad de Holy Name Medical Partners, que explica cómo puede usarse y compartirse mi información de salud y los derechos que tengo sobre ella, y confirmo haberlo recibido. Hay una copia en el enlace junto a esta declaración y en el consultorio.',
    zh: '我已获得机会阅读 Holy Name Medical Partners 的《隐私实践声明》，该声明说明了我的健康信息可能如何被使用和共享以及我对此享有的权利，我确认已收到该声明。本声明旁的链接和诊所均备有副本。',
    /** The notice itself (PDF), served by the site. */
    link: '/notice-of-privacy-practices.pdf',
  },
  {
    key: 'contact',
    label: 'Contact and emergencies',
    text: 'The office may contact me by phone, text message or email using the details I have provided, to schedule and coordinate my care. This form is not an emergency service: if I have an emergency I will call 911 or my local emergency number.',
    es: 'El consultorio puede comunicarse conmigo por teléfono, mensaje de texto o correo electrónico usando los datos que proporcioné, para programar y coordinar mi atención. Este formulario no es un servicio de emergencia: en caso de emergencia llamaré al 911 o al número de emergencias local.',
    zh: '诊所可以通过我提供的电话、短信或电子邮件与我联系，以安排和协调我的诊疗。本表格不是紧急服务：如遇紧急情况，我会拨打 911 或当地急救电话。',
  },
];

export function consentText(item, lang) {
  return (lang && item[lang]) || item.text;
}

/** For the languages served from lib/translations, pass the loaded lookup in. */
export function consentTextVia(item, lang, tx) {
  return (lang && item[lang]) || (tx ? tx(lang, item.text) : item.text);
}

/** True when a signature was drawn (a PNG from the signature pad). Required in the browser; the server accepts a typed name alone so a page loaded before the pad existed can still submit. */
export function signatureDrawn(consent) {
  return !!(consent && typeof consent.signatureImage === 'string' && consent.signatureImage.startsWith('data:image/png;base64,'));
}

/** True when every acknowledgment is checked and a signature was typed. */
export function consentComplete(consent) {
  if (!consent) return false;
  return CONSENT_ITEMS.every((i) => consent[i.key] === true) && String(consent.signatureName || '').trim().length >= 3;
}
