'use client';

import { useState, useEffect } from 'react';
import { useIntake } from '../../lib/store';
import NoteReview from '../NoteReview';
import PainMapSummary from '../PainMapFigure';
import { countMarks } from '../../lib/bodyMap';
import { fingerprintAnswers, isNoteStale } from '../../lib/noteFingerprint';
import { SYMPTOM_REGIONS } from '../../lib/constants';
import { stepsForVisit, stepIndex, VISIT_LABEL } from '../../lib/flows';
import { sortOperations, describeOperation } from '../../lib/operations';
import { detectRedFlags } from '../../lib/redFlags';
import { ODI, NDI, MJOA, SRS22R } from '../../lib/questionnaires';
import { useLang, makeT, COMMON, tx } from '../../lib/i18n';
import { submitIntake, pollStatus, fetchStatus, finalizeSubmission } from '../../lib/submitClient';
import { IS_PRODUCTION_TIER } from '../../lib/deploymentTier';
import { CONSENT_ITEMS, consentTextVia, consentComplete, signatureDrawn } from '../../lib/consent';
import SignaturePad from '../SignaturePad';

// Patient-facing UI strings for this component (display-only translation).
const LOCAL = {
  // Header
  'Review & Submit': { es: 'Revisar y enviar', zh: '审核并提交' },
  'Please review your information below. You can go back to any section to make changes. When everything looks correct, submit your intake form.': {
    es: 'Revise su información a continuación. Puede volver a cualquier sección para hacer cambios. Cuando todo esté correcto, envíe su formulario de admisión.',
    zh: '请在下方核对您的信息。您可以返回任何部分进行修改。确认无误后，请提交您的入院表。',
  },

  // Section titles
  'Patient Information': { es: 'Información del paciente', zh: '患者信息' },
  'Type of Visit': { es: 'Tipo de visita', zh: '就诊类型' },
  'Work Injury & Claim': { es: 'Lesión laboral y reclamo', zh: '工伤与理赔' },
  'Since Your Last Visit': { es: 'Desde su última visita', zh: '自上次就诊以来' },
  'Your Surgery & Recovery': { es: 'Su cirugía y recuperación', zh: '您的手术与康复' },
  'Visit': { es: 'Visita', zh: '就诊' },
  'Claim number': { es: 'Número de reclamo', zh: '理赔编号' },
  'Date of injury': { es: 'Fecha de la lesión', zh: '受伤日期' },
  'Employer': { es: 'Empleador', zh: '雇主' },
  'Working now': { es: 'Trabaja actualmente', zh: '目前工作状态' },
  'Last visit': { es: 'Última visita', zh: '上次就诊' },
  'Compared with last visit': { es: 'En comparación con la última visita', zh: '与上次就诊相比' },
  'Pain today': { es: 'Dolor hoy', zh: '今日疼痛' },
  'Tried since': { es: 'Probado desde entonces', zh: '期间尝试过' },
  'Operation': { es: 'Operación', zh: '手术' },
  'Date of surgery': { es: 'Fecha de la cirugía', zh: '手术日期' },
  'Incision': { es: 'Incisión', zh: '切口' },
  'Pain vs. before surgery': { es: 'Dolor vs. antes de la cirugía', zh: '与术前相比的疼痛' },
  'Chief Complaint': { es: 'Motivo principal de consulta', zh: '主诉' },
  'Symptom Details & Treatment History': { es: 'Detalles de los síntomas e historial de tratamiento', zh: '症状详情与治疗史' },
  'Past Medical History': { es: 'Antecedentes médicos', zh: '既往病史' },
  'Past Surgical History': { es: 'Antecedentes quirúrgicos', zh: '既往手术史' },
  'Medications': { es: 'Medicamentos', zh: '用药' },
  'Allergies': { es: 'Alergias', zh: '过敏史' },
  'Social History': { es: 'Historia social', zh: '社会史' },
  'Family History': { es: 'Antecedentes familiares', zh: '家族史' },
  'Family history': { es: 'Antecedentes familiares', zh: '家族史' },
  'Review of Systems': { es: 'Revisión por sistemas', zh: '系统回顾' },
  'Outcome Questionnaires': { es: 'Cuestionarios de resultados', zh: '结果问卷' },

  // Field labels
  'Name': { es: 'Nombre', zh: '姓名' },
  'DOB': { es: 'Fecha de nacimiento', zh: '出生日期' },
  'Sex': { es: 'Sexo', zh: '性别' },
  'Phone': { es: 'Teléfono', zh: '电话' },
  'Visit reason': { es: 'Motivo de la visita', zh: '就诊原因' },
  'Main concern': { es: 'Preocupación principal', zh: '主要问题' },
  'Duration': { es: 'Duración', zh: '持续时间' },
  'Symptom areas': { es: 'Áreas de síntomas', zh: '症状部位' },
  'Symptom regions documented': { es: 'Regiones de síntomas documentadas', zh: '已记录的症状区域' },
  'AI conversation messages': { es: 'Mensajes de conversación con IA', zh: 'AI 对话消息数' },
  'Injections recorded': { es: 'Inyecciones registradas', zh: '已记录的注射' },
  'Conditions': { es: 'Afecciones', zh: '疾病状况' },
  'Implanted devices': { es: 'Dispositivos implantados', zh: '植入设备' },
  'Surgeries': { es: 'Cirugías', zh: '手术' },
  'Current medications': { es: 'Medicamentos actuales', zh: '当前用药' },
  'Tobacco': { es: 'Tabaco', zh: '烟草' },
  'Occupation': { es: 'Ocupación', zh: '职业' },
  'Work status': { es: 'Situación laboral', zh: '工作状态' },
  'Completed': { es: 'Completado', zh: '已完成' },
  'Questionnaires': { es: 'Cuestionarios', zh: '问卷' },

  // Field values shown in review
  'None listed': { es: 'Ninguno indicado', zh: '未列出' },
  'None': { es: 'Ninguno', zh: '无' },
  'No medications': { es: 'Sin medicamentos', zh: '无用药' },
  'No Known Drug Allergies (NKDA)': { es: 'Sin alergias a medicamentos conocidas (NKDA)', zh: '无已知药物过敏 (NKDA)' },
  'Not specified': { es: 'No especificado', zh: '未指定' },
  'No relevant history': { es: 'Sin antecedentes relevantes', zh: '无相关病史' },
  'None applicable': { es: 'No aplica', zh: '不适用' },
  'Not completed': { es: 'No completado', zh: '未完成' },
  'Partial': { es: 'Parcial', zh: '部分完成' },

  // Card action
  'Edit': { es: 'Editar', zh: '编辑' },

  // Disclaimer
  'By submitting this form, you confirm that the information provided is accurate to the best of your knowledge. This intake form is for information gathering only and does not constitute medical advice or replace a direct medical evaluation. Your surgeon will review this information and may ask additional questions during your visit.': {
    es: 'Al enviar este formulario, usted confirma que la información proporcionada es precisa según su leal saber y entender. Este formulario de admisión es solo para recopilar información y no constituye asesoramiento médico ni reemplaza una evaluación médica directa. Su cirujano revisará esta información y puede hacer preguntas adicionales durante su visita.',
    zh: '提交本表即表示您确认所提供的信息在您所知范围内准确无误。本入院表仅用于收集信息，不构成医疗建议，也不能替代直接的医疗评估。您的外科医生将审阅这些信息，并可能在就诊时提出更多问题。',
  },

  // Acknowledgments
  'Acknowledgment and signature': { es: 'Reconocimiento y firma', zh: '确认与签名' },
  'Please read and check each statement, then type your name as your signature.': {
    es: 'Lea y marque cada declaración y luego escriba su nombre como firma.',
    zh: '请阅读并勾选每项声明，然后输入您的姓名作为签名。',
  },
  'Type your full name as your signature *': { es: 'Escriba su nombre completo como firma *', zh: '请输入您的全名作为签名 *' },
  'Your full name': { es: 'Su nombre completo', zh: '您的全名' },
  'If you are completing this for the patient': { es: 'Si completa este formulario por el paciente', zh: '如果您是代患者填写' },
  'Your name': { es: 'Su nombre', zh: '您的姓名' },
  'Relationship to the patient': { es: 'Relación con el paciente', zh: '与患者的关系' },
  'Check every statement and type your name to enable Submit.': {
    es: 'Marque todas las declaraciones y escriba su nombre para habilitar Enviar.',
    zh: '勾选所有声明并输入您的姓名后即可提交。',
  },
  'By submitting this form you confirm the acknowledgments above. Your signature, the date and time, and your answers are kept with your record.': {
    es: 'Al enviar este formulario confirma los reconocimientos anteriores. Su firma, la fecha y hora y sus respuestas se guardan en su expediente.',
    zh: '提交本表格即表示您确认上述声明。您的签名、日期时间和回答将保存在您的记录中。',
  },

  // Error / submit
  'Failed to generate summary. Your data has been saved. Please try again.': {
    es: 'No se pudo generar el resumen. Sus datos se han guardado. Por favor, inténtelo de nuevo.',
    zh: '无法生成摘要。您的数据已保存。请重试。',
  },
  'Generating Summary...': { es: 'Generando resumen...', zh: '正在生成摘要...' },
  'Saving your answers…': { es: 'Guardando sus respuestas…', zh: '正在保存您的回答……' },
  'Uploading your records ({done} of {total})…': { es: 'Subiendo sus registros ({done} de {total})…', zh: '正在上传您的记录（第 {done} 个，共 {total} 个）……' },
  'Writing your summary…': { es: 'Redactando su resumen…', zh: '正在撰写您的摘要……' },
  'Your form has been received. Your summary is still being prepared — this page will update by itself.': {
    es: 'Su formulario ha sido recibido. Su resumen todavía se está preparando; esta página se actualizará sola.',
    zh: '您的表格已收到。您的摘要仍在准备中——本页面会自动更新。',
  },
  'The office has received your form.': { es: 'El consultorio ha recibido su formulario.', zh: '诊所已收到您的表格。' },
  'This form gathers information only; it is not medical advice and does not replace an in-person evaluation.': {
    es: 'Este formulario solo recopila información; no es consejo médico ni reemplaza una evaluación en persona.',
    zh: '本表格仅用于收集信息；它不是医疗建议，也不能替代当面评估。',
  },
  'Could not submit the form. Your answers are saved on this device — please try again in a moment.': {
    es: 'No se pudo enviar el formulario. Sus respuestas están guardadas en este dispositivo; inténtelo de nuevo en un momento.',
    zh: '无法提交表格。您的回答已保存在本设备上，请稍后重试。',
  },
  'Submit Intake Form': { es: 'Enviar formulario de admisión', zh: '提交入院表' },

  // Submitted view
  'Thank you so much for completing this.': { es: 'Muchas gracias por completar este formulario.', zh: '非常感谢您完成这份表格。' },
  'We know it took real time and care. Everything you shared is saved, and you are all set for now.': {
    es: 'Sabemos que le tomó tiempo y dedicación. Todo lo que compartió está guardado y, por ahora, no necesita hacer nada más.',
    zh: '我们知道这需要您花费时间和心力。您分享的一切都已保存，目前您无需再做任何事情。',
  },
  'Our office will contact you within two business days to schedule your consultation.': {
    es: 'Nuestra oficina se comunicará con usted en un plazo de dos días hábiles para programar su consulta.',
    zh: '我们的办公室将在两个工作日内与您联系，安排您的会诊。',
  },
  'We look forward to seeing you at your upcoming visit.': {
    es: 'Esperamos verle en su próxima visita.',
    zh: '我们期待在您的下次就诊时见到您。',
  },
  'What you told us': { es: 'Lo que nos contó', zh: '您告诉我们的内容' },
  'We are putting together a summary of what you shared. This usually takes about a minute; this page will update on its own.': {
    es: 'Estamos preparando un resumen de lo que compartió. Suele tardar alrededor de un minuto; esta página se actualizará sola.',
    zh: '我们正在整理您所分享内容的摘要。通常需要大约一分钟，本页面会自动更新。',
  },
  'Start a new form': { es: 'Comenzar un formulario nuevo', zh: '开始新的表格' },
  'Thank You!': { es: '¡Gracias!', zh: '谢谢！' },
  "Your intake form has been submitted successfully. Your surgeon's team will review your information before your visit.": {
    es: 'Su formulario de admisión se ha enviado correctamente. El equipo de su cirujano revisará su información antes de su visita.',
    zh: '您的入院表已成功提交。您的外科团队将在您就诊前审阅您的信息。',
  },
  'Submitted at': { es: 'Enviado el', zh: '提交时间' },
  'Important Reminders': { es: 'Recordatorios importantes', zh: '重要提醒' },
  'Your Clinical Summary': { es: 'Su resumen clínico', zh: '您的临床摘要' },
  'Body diagram you drew': { es: 'Diagrama corporal que dibujó', zh: '您绘制的身体图示' },
  'Clinical Summary (Preview)': { es: 'Resumen clínico (vista previa)', zh: '临床摘要（预览）' },
  'Copied!': { es: '¡Copiado!', zh: '已复制！' },
  'Copy Note': { es: 'Copiar nota', zh: '复制病历' },
  'Open Clinician Dashboard': { es: 'Abrir panel del médico', zh: '打开临床医生面板' },
  'Start New Intake': { es: 'Iniciar nueva admisión', zh: '开始新的入院' },
  'This will clear all data and start a new patient intake form. Are you sure?': {
    es: 'Esto borrará todos los datos e iniciará un nuevo formulario de admisión. ¿Está seguro?',
    zh: '这将清除所有数据并开始一份新的患者入院表。您确定吗？',
  },
  'The clinician dashboard provides a full structured summary for your care team.': {
    es: 'El panel del médico proporciona un resumen estructurado completo para su equipo de atención.',
    zh: '临床医生面板为您的护理团队提供完整的结构化摘要。',
  },
};

export default function FinalReview({ onBack, onGoToStep }) {
  const { data, setSubmitted, setSummary, setRedFlags, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitted, setIsSubmittedLocal] = useState(!!data.submittedAt);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const consentOk = consentComplete(data.consent) && signatureDrawn(data.consent);

  /**
   * Submit for real: store the answers server-side, upload the attached
   * records, then wait for the office's worker to write the note. The
   * answers are safe as soon as the first call returns, so a closed tab or a
   * slow model never loses the patient's work.
   */
  const handleSubmit = async () => {
    if (!consentOk) return;
    setIsGenerating(true);
    setError('');
    const flags = detectRedFlags(data);
    setRedFlags(flags);
    const fingerprint = fingerprintAnswers(data);
    // The signature is dated the moment the patient submits.
    const signedAt = data.consent?.signedAt || new Date().toISOString();
    const signed = { ...data, consent: { ...(data.consent || {}), signedAt } };
    setNested('consent.signedAt', signedAt);

    try {
      let sub = data.submission;
      if (!sub?.id) {
        setProgress(t('Saving your answers…'));
        const r = await submitIntake(signed, {
          onProgress: (p) => {
            if (p.phase === 'uploading') {
              setProgress(t('Uploading your records ({done} of {total})…').replace('{done}', String(Math.min(p.done + 1, p.total))).replace('{total}', String(p.total)));
            } else setProgress(t('Writing your summary…'));
          },
        });
        sub = { id: r.id, token: r.token, submittedAt: new Date().toISOString(), uploaded: r.uploaded, skipped: r.skipped };
        setNested('submission', sub);
      } else {
        // A previous attempt stored the answers but did not get to the end;
        // finishing is idempotent, so just ask again.
        await finalizeSubmission(sub.id, sub.token).catch(() => {});
      }
      setProgress(t('Writing your summary…'));
      const st = await pollStatus(sub.id, sub.token, {
        until: (x) => !!x.note || (x.error && x.error.step === 'note'),
        timeoutMs: 180_000,
      });
      if (st?.note) {
        setSummary({ narrative: st.note.narrative, generatedAt: st.note.generatedAt, redFlags: flags, sourceFingerprint: fingerprint, pending: false });
      } else {
        // Received, note still on its way: the submitted view keeps polling.
        setSummary({ narrative: '', generatedAt: null, redFlags: flags, sourceFingerprint: fingerprint, pending: true });
      }
      setSubmitted();
      setIsSubmittedLocal(true);
      setIsGenerating(false);
      setProgress('');
      return;
    } catch (err) {
      // Keep the id of a submission whose answers were stored, so a retry
      // finishes it rather than filing the patient a second time.
      if (err?.submission) setNested('submission', { ...err.submission, submittedAt: new Date().toISOString() });
      if (IS_PRODUCTION_TIER) {
        setError(err?.message || t('Could not submit the form. Your answers are saved on this device — please try again in a moment.'));
        setIsGenerating(false);
        setProgress('');
        return;
      }
      // Prototype hosting without a writable store (the Vercel demo): fall
      // back to generating the note directly, as before.
    }

    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeData: signed }),
      });
      const result = await res.json();
      if (result.error || !result.summary) {
        setError(result.error || t('Failed to generate summary. Your data has been saved. Please try again.'));
      } else {
        setSummary({ narrative: result.summary, generatedAt: new Date().toISOString(), redFlags: flags, sourceFingerprint: fingerprint });
        setSubmitted();
        setIsSubmittedLocal(true);
      }
    } catch (err) {
      setError(t('Failed to generate summary. Your data has been saved. Please try again.'));
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  // Red flags detected
  const currentFlags = detectRedFlags(data);

  // The steps this kind of visit went through; cards and "Edit" links are
  // looked up by step id, since the position depends on the visit type.
  const visitType = data.visit?.type || '';
  const steps = stepsForVisit(visitType);
  const has = (id) => stepIndex(steps, id) >= 0;
  const go = (id) => onGoToStep(Math.max(0, stepIndex(steps, id)));
  const wc = data.visit?.wc || {};
  const fu = data.visit?.followup || {};
  const po = data.visit?.postop || {};
  const regionsLabel = (data.chiefComplaint.symptomRegions || []).map(id =>
    t(SYMPTOM_REGIONS.find(r => r.id === id)?.label)).filter(Boolean).join(', ');

  if (isSubmitted && data.generatedSummary) {
    return <SubmittedView data={data} onGoToStep={onGoToStep} />;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Review & Submit')}</h2>
        <p className="section-subtitle">
          {t('Please review your information below. You can go back to any section to make changes. When everything looks correct, submit your intake form.')}
        </p>
      </div>

      {/* Red flag alerts */}
      {currentFlags.length > 0 && (
        <div className="mb-6 space-y-3">
          {currentFlags.filter(f => f.severity === 'urgent').map((flag) => (
            <div key={flag.id} className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">{flag.label}</p>
                  <p className="text-sm text-red-700 mt-1">{flag.patientMessage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section summaries: one card per step this kind of visit went through */}
      <div className="space-y-4">
        <ReviewCard
          t={t}
          title="Type of Visit"
          onEdit={() => go('visit-type')}
          items={[{ label: 'Visit', value: t(VISIT_LABEL[visitType] || data.demographics.visitReason) }]}
        />

        {/* Demographics */}
        <ReviewCard
          t={t}
          title="Patient Information"
          onEdit={() => go('demographics')}
          items={[
            { label: 'Name', value: `${data.demographics?.firstName || ''} ${data.demographics?.lastName || ''}`.trim() },
            { label: 'DOB', value: data.demographics.dob },
            { label: 'Sex', value: data.demographics.sex },
            { label: 'Phone', value: data.demographics.phone },
          ]}
        />

        {has('work-injury') && (
          <ReviewCard
            t={t}
            title="Work Injury & Claim"
            onEdit={() => go('work-injury')}
            items={[
              { label: 'Claim number', value: wc.claimNumber },
              { label: 'Date of injury', value: wc.dateOfInjury },
              { label: 'Employer', value: wc.employer },
              { label: 'Working now', value: t(wc.workStatus) },
            ]}
          />
        )}

        {has('interval') && (
          <ReviewCard
            t={t}
            title="Since Your Last Visit"
            onEdit={() => go('interval')}
            items={[
              { label: 'Last visit', value: t(fu.lastVisitWhen) },
              { label: 'Compared with last visit', value: t(fu.overallChange) },
              { label: 'Pain today', value: fu.painNow ? `${fu.painNow} / 10` : '' },
              { label: 'Tried since', value: (fu.treatments || []).map((x) => t(x)).join(', ') },
              { label: 'Symptom areas', value: regionsLabel },
            ]}
          />
        )}

        {has('postop') && (
          <ReviewCard
            t={t}
            title="Your Surgery & Recovery"
            onEdit={() => go('postop')}
            items={[
              ...sortOperations(po.operations || []).map((o, i, all) => ({ label: all.length > 1 ? `${t('Operation')} ${i + 1}` : 'Operation', value: describeOperation(o) })),
              { label: 'Incision', value: (po.wound || []).map((x) => t(x)).join(', ') },
              { label: 'Pain vs. before surgery', value: t(po.painVsBefore) },
              { label: 'Pain today', value: po.painNow ? `${po.painNow} / 10` : '' },
            ]}
          />
        )}

        {has('chief-complaint') && (
          <ReviewCard
            t={t}
            title="Chief Complaint"
            onEdit={() => go('chief-complaint')}
            items={[
              { label: 'Main concern', value: data.chiefComplaint.mainReason },
              { label: 'Duration', value: data.chiefComplaint.duration },
              { label: 'Symptom areas', value: regionsLabel },
            ]}
          />
        )}

        {has('symptom-details') && (
          <ReviewCard
            t={t}
            title="Symptom Details & Treatment History"
            onEdit={() => go('symptom-details')}
            items={[
              { label: 'Symptom regions documented', value: Object.keys(data.hpiData.symptoms || {}).length.toString() },
              { label: 'AI conversation messages', value: (data.hpiData.conversationHistory || []).length.toString() },
              ...(has('treatments') ? [{ label: 'Injections recorded', value: (data.hpiData.conservativeTreatments?.injections || []).length.toString() }] : []),
            ]}
          />
        )}

        {has('pmh') && (
          <ReviewCard
            t={t}
            title="Past Medical History"
            onEdit={() => go('pmh')}
            items={[
              { label: 'Conditions', value: (data.pastMedicalHistory.conditions || []).map(c => c.name).join(', ') || t('None listed') },
              { label: 'Implanted devices', value: (data.pastMedicalHistory.implantedDevices || []).join(', ') || t('None') },
            ]}
          />
        )}

        {has('psh') && (
          <ReviewCard
            t={t}
            title="Past Surgical History"
            onEdit={() => go('psh')}
            items={[
              { label: 'Surgeries', value: (data.pastSurgicalHistory.surgeries || []).map(s => s.type).join(', ') || t('None listed') },
            ]}
          />
        )}

        {has('medications') && (
          <ReviewCard
            t={t}
            title="Medications"
            onEdit={() => go('medications')}
            items={[
              {
                label: 'Current medications',
                value: data.medications.noMedications
                  ? t('No medications')
                  : (data.medications.current || []).map(m => m.name).join(', ') || t('None listed'),
              },
            ]}
          />
        )}

        {has('allergies') && (
          <ReviewCard
            t={t}
            title="Allergies"
            onEdit={() => go('allergies')}
            items={[
              {
                label: 'Allergies',
                value: data.allergies.nkda
                  ? t('No Known Drug Allergies (NKDA)')
                  : (data.allergies.entries || []).map(a => a.allergen).join(', ') || t('None listed'),
              },
            ]}
          />
        )}

        {has('social') && (
          <ReviewCard
            t={t}
            title="Social History"
            onEdit={() => go('social')}
            items={[
              { label: 'Tobacco', value: data.socialHistory.tobaccoUse || t('Not specified') },
              { label: 'Occupation', value: data.socialHistory.occupation || t('Not specified') },
              { label: 'Work status', value: data.socialHistory.workStatus || t('Not specified') },
            ]}
          />
        )}

        {has('family') && (
          <ReviewCard
            t={t}
            title="Family History"
            onEdit={() => go('family')}
            items={[
              {
                label: 'Family history',
                value: data.familyHistory.noRelevantHistory
                  ? t('No relevant history')
                  : (data.familyHistory.entries || []).map(e => `${e.relation}: ${e.condition}`).join(', ') || t('None listed'),
              },
            ]}
          />
        )}

        {has('ros') && (
          <ReviewCard
            t={t}
            title="Review of Systems"
            onEdit={() => go('ros')}
            items={[
              { label: 'Completed', value: t('Yes') },
            ]}
          />
        )}

        {has('proms') && (
          <ReviewCard
            t={t}
            title="Outcome Questionnaires"
            onEdit={() => go('proms')}
            items={getPromsReviewItems(data.proms, t)}
          />
        )}
      </div>

      {/* Acknowledgments and signature: the paper packet's signature pages, online */}
      <ConsentCard t={t} lang={lang} consent={data.consent || {}} setNested={setNested} />

      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-sm text-gray-600">
          {t('By submitting this form you confirm the acknowledgments above. Your signature, the date and time, and your answers are kept with your record.')}
          {' '}
          {t('This form gathers information only; it is not medical advice and does not replace an in-person evaluation.')}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit button */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-100 gap-4">
        <button onClick={onBack} className="btn-secondary">
          {t('Back')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isGenerating || !consentOk}
          title={consentOk ? undefined : t('Check every statement and type your name to enable Submit.')}
          className="btn-teal text-lg px-10 py-4 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {progress || t('Generating Summary...')}
            </>
          ) : (
            t('Submit Intake Form')
          )}
        </button>
      </div>
    </div>
  );
}


/**
 * The signature pages of a paper new-patient packet, as checkboxes and a typed
 * signature. Every statement must be checked and a name typed before the form
 * can be submitted; the server checks the same thing.
 */
function ConsentCard({ t, lang, consent, setNested }) {
  const set = (key, value) => setNested(`consent.${key}`, value);
  return (
    <div className="card mt-6 border-teal-100">
      <h3 className="text-base font-semibold text-navy-600 mb-1">{t('Acknowledgment and signature')}</h3>
      <p className="text-sm text-gray-500 mb-4">{t('Please read and check each statement, then print your name and sign below.')}</p>
      <div className="space-y-3">
        {CONSENT_ITEMS.map((item) => (
          <label key={item.key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!consent[item.key]}
              onChange={(e) => set(item.key, e.target.checked)}
              className="mt-1 w-5 h-5 flex-shrink-0"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              {consentTextVia(item, lang, tx)}
              {item.link && (
                <>
                  {' '}
                  <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-semibold text-teal-600 underline">
                    {t('Read the Notice of Privacy Practices (PDF)')}
                  </a>
                </>
              )}
            </span>
          </label>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <div className="md:col-span-2">
          <label className="form-label">{t('Your full name (printed) *')}</label>
          <input
            type="text"
            value={consent.signatureName || ''}
            onChange={(e) => set('signatureName', e.target.value)}
            placeholder={t('Your full name')}
            className="font-serif text-lg"
            autoComplete="name"
          />
        </div>
        <div className="md:col-span-2">
          <SignaturePad
            value={consent.signatureImage || null}
            onChange={(png) => set('signatureImage', png)}
            label={t('Sign here with your finger or mouse *')}
            clearLabel={t('Clear')}
          />
        </div>
        <div className="md:col-span-2 text-xs font-medium text-gray-500 mt-1">{t('If you are completing this for the patient')}</div>
        <div>
          <label className="form-label">{t('Your name')}</label>
          <input type="text" value={consent.representativeName || ''} onChange={(e) => set('representativeName', e.target.value)} />
        </div>
        <div>
          <label className="form-label">{t('Relationship to the patient')}</label>
          <input type="text" value={consent.representativeRelationship || ''} onChange={(e) => set('representativeRelationship', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ t, title, onEdit, items }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-navy-600">{t(title)}</h3>
        <button onClick={onEdit} className="text-sm text-teal-500 hover:text-teal-600 font-medium">
          {t('Edit')}
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-36 flex-shrink-0 pt-0.5">{t(item.label)}:</span>
            <span className="text-sm text-gray-700">{item.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


const PROM_NAMES = { odi: 'ODI', ndi: 'NDI', mjoa: 'mJOA', srs22r: 'SRS-22r' };

function getPromsReviewItems(proms, t = (x) => x) {
  if (!proms || Object.keys(proms).length === 0) {
    return [{ label: 'Questionnaires', value: t('None applicable') }];
  }
  return Object.entries(proms).map(([id, entry]) => {
    const name = PROM_NAMES[id] || id;
    if (!entry.score) return { label: name, value: t('Not completed') };
    if (id === 'odi' || id === 'ndi') {
      return { label: name, value: `${entry.score.percentage}% — ${entry.score.interpretation}` };
    }
    if (id === 'mjoa') {
      return { label: name, value: `${entry.score.totalScore}/18 — ${entry.score.interpretation}` };
    }
    if (id === 'srs22r') {
      return { label: name, value: entry.score.totalScore ? `${entry.score.totalScore}/5.0 mean` : t('Partial') };
    }
    return { label: name, value: t('Completed') };
  });
}


function SubmittedView({ data, onGoToStep }) {
  const { resetIntake, setSummary } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [copied, setCopied] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const summary = data.generatedSummary;
  const sub = data.submission;

  // The note is written in the background after the answers are stored. If
  // it was not ready when the patient submitted, keep asking until it is.
  useEffect(() => {
    if (!sub?.id || !sub?.token) return undefined;
    let live = true;
    let timer = null;
    const tick = async () => {
      try {
        const st = await fetchStatus(sub.id, sub.token);
        if (!live) return;
        if (st.delivered) setDelivered(true); // kept for polling cadence; not shown to the patient
        if (summary?.pending && st.note) {
          setSummary({ ...summary, narrative: st.note.narrative, generatedAt: st.note.generatedAt, pending: false });
          return;
        }
        if (summary?.pending || !st.delivered) timer = setTimeout(tick, 5000);
      } catch {
        if (live) timer = setTimeout(tick, 8000);
      }
    };
    tick();
    return () => { live = false; if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub?.id, summary?.pending]);

  const handleReset = () => {
    if (confirm(t('This will clear all data and start a new patient intake form. Are you sure?'))) {
      resetIntake();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary.narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = summary.narrative;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-serif text-[1.9rem] md:text-[2.3rem] font-semibold text-navy-600 mb-3 leading-tight">{t('Thank you so much for completing this.')}</h2>
        <p className="text-base md:text-lg text-gray-500 max-w-md mx-auto">
          {t('We know it took real time and care. Everything you shared is saved, and you are all set for now.')}
        </p>
        <p className="text-base md:text-lg text-navy-600 font-medium max-w-md mx-auto mt-3">
          {visitType && visitType !== 'new' ? t('We look forward to seeing you at your upcoming visit.') : t('Our office will contact you within two business days to schedule your consultation.')}
        </p>
        {data.submittedAt && (
          <p className="text-xs text-gray-400 mt-3">
            {new Date(data.submittedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Red flags summary for patient */}
      {(summary.redFlags || []).filter(f => f.severity === 'urgent').length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-left">
          <p className="text-sm font-medium text-amber-800 mb-2">{t('Important Reminders')}</p>
          {summary.redFlags.filter(f => f.severity === 'urgent').map((flag) => (
            <p key={flag.id} className="text-sm text-amber-700 mt-1">{flag.patientMessage}</p>
          ))}
        </div>
      )}

      {/* Generated summary preview */}
      <div className="card text-left mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy-600">{t('What you told us')}</h3>
          {!summary.pending && !IS_PRODUCTION_TIER && (
          <button
            onClick={copyToClipboard}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('Copied!')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('Copy Note')}
              </>
            )}
          </button>
          )}
        </div>
        {/* The drawing itself, above the prose. The narrative describes it in
            words because that is what an EMR text field can hold, but the
            shape of a stripe down one calf is the part read in two seconds. */}
        {countMarks(data.painMap) > 0 && (
          <div className="mb-5 pb-5 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              {t('Body diagram you drew')}
            </p>
            <PainMapSummary painMap={data.painMap} />
          </div>
        )}

        {/* The note is generated prose, so it can misread an answer. The
            patient is the only one who can catch that before the visit — and
            making them redo the form to fix one sentence would mean nobody
            ever does. */}
        {summary.pending ? (
          <div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-100 rounded-xl">
            <svg className="animate-spin w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-teal-800 leading-relaxed">
              {t('We are putting together a summary of what you shared. This usually takes about a minute; this page will update on its own.')}
            </p>
          </div>
        ) : (
        <NoteReview
          narrative={summary.narrative}
          onGoToStep={onGoToStep}
          stale={isNoteStale(data, summary)}
          onRewritten={(text, fingerprint, generatedAt) =>
            setSummary({
              ...summary,
              narrative: text,
              revisedAt: new Date().toISOString(),
              generatedAt: generatedAt || summary.generatedAt,
              sourceFingerprint: fingerprint,
            })
          }
        />
        )}
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        {!IS_PRODUCTION_TIER && (
        <a
          href="/clinician"
          target="_blank"
          className="btn-primary flex items-center gap-2"
        >
          {t('Open Clinician Dashboard')}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        )}
        <button
          onClick={handleReset}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-2 py-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('Start a new form')}
        </button>
      </div>

      {!IS_PRODUCTION_TIER && (
        <p className="text-xs text-gray-400 mt-8">
          {t('The clinician dashboard provides a full structured summary for your care team.')}
        </p>
      )}
    </div>
  );
}
