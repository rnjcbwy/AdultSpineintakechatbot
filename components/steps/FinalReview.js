'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import NoteReview from '../NoteReview';
import PainMapSummary from '../PainMapFigure';
import { countMarks } from '../../lib/bodyMap';
import { fingerprintAnswers, isNoteStale } from '../../lib/noteFingerprint';
import { INTAKE_STEPS, SYMPTOM_REGIONS } from '../../lib/constants';
import { detectRedFlags } from '../../lib/redFlags';
import { ODI, NDI, MJOA, SRS22R } from '../../lib/questionnaires';
import { useLang, makeT, COMMON } from '../../lib/i18n';

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

  // Error / submit
  'Failed to generate summary. Your data has been saved. Please try again.': {
    es: 'No se pudo generar el resumen. Sus datos se han guardado. Por favor, inténtelo de nuevo.',
    zh: '无法生成摘要。您的数据已保存。请重试。',
  },
  'Generating Summary...': { es: 'Generando resumen...', zh: '正在生成摘要...' },
  'Submit Intake Form': { es: 'Enviar formulario de admisión', zh: '提交入院表' },

  // Submitted view
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
  const { data, setSubmitted, setSummary, setRedFlags } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitted, setIsSubmittedLocal] = useState(!!data.submittedAt);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Detect red flags
      const flags = detectRedFlags(data);
      setRedFlags(flags);

      // Generate clinical summary
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeData: data }),
      });

      const result = await res.json();

      if (result.error) {
        setError(result.error);
      } else {
        setSummary({
          narrative: result.summary,
          generatedAt: new Date().toISOString(),
          redFlags: flags,
          // Record WHICH answers this note was written from, so a later edit
          // can be detected and the note flagged as out of date.
          sourceFingerprint: fingerprintAnswers(data),
        });
        setSubmitted();
        setIsSubmittedLocal(true);
      }
    } catch (err) {
      setError(t('Failed to generate summary. Your data has been saved. Please try again.'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Red flags detected
  const currentFlags = detectRedFlags(data);

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

      {/* Section summaries */}
      <div className="space-y-4">
        {/* Demographics */}
        <ReviewCard
          t={t}
          title="Patient Information"
          step={1}
          onEdit={() => onGoToStep(1)}
          items={[
            { label: 'Name', value: `${data.demographics?.firstName || ''} ${data.demographics?.lastName || ''}`.trim() },
            { label: 'DOB', value: data.demographics.dob },
            { label: 'Sex', value: data.demographics.sex },
            { label: 'Phone', value: data.demographics.phone },
            { label: 'Visit reason', value: data.demographics.visitReason },
          ]}
        />

        {/* Chief Complaint */}
        <ReviewCard
          t={t}
          title="Chief Complaint"
          step={2}
          onEdit={() => onGoToStep(2)}
          items={[
            { label: 'Main concern', value: data.chiefComplaint.mainReason },
            { label: 'Duration', value: data.chiefComplaint.duration },
            { label: 'Symptom areas', value: data.chiefComplaint.symptomRegions.map(id =>
              t(SYMPTOM_REGIONS.find(r => r.id === id)?.label)).filter(Boolean).join(', ')
            },
          ]}
        />

        {/* HPI Summary */}
        <ReviewCard
          t={t}
          title="Symptom Details & Treatment History"
          step={3}
          onEdit={() => onGoToStep(3)}
          items={[
            { label: 'Symptom regions documented', value: Object.keys(data.hpiData.symptoms || {}).length.toString() },
            { label: 'AI conversation messages', value: (data.hpiData.conversationHistory || []).length.toString() },
            { label: 'Injections recorded', value: (data.hpiData.conservativeTreatments?.injections || []).length.toString() },
          ]}
        />

        {/* PMH */}
        <ReviewCard
          t={t}
          title="Past Medical History"
          step={4}
          onEdit={() => onGoToStep(4)}
          items={[
            { label: 'Conditions', value: (data.pastMedicalHistory.conditions || []).map(c => c.name).join(', ') || t('None listed') },
            { label: 'Implanted devices', value: (data.pastMedicalHistory.implantedDevices || []).join(', ') || t('None') },
          ]}
        />

        {/* PSH */}
        <ReviewCard
          t={t}
          title="Past Surgical History"
          step={5}
          onEdit={() => onGoToStep(5)}
          items={[
            { label: 'Surgeries', value: (data.pastSurgicalHistory.surgeries || []).map(s => s.type).join(', ') || t('None listed') },
          ]}
        />

        {/* Medications */}
        <ReviewCard
          t={t}
          title="Medications"
          step={6}
          onEdit={() => onGoToStep(6)}
          items={[
            {
              label: 'Current medications',
              value: data.medications.noMedications
                ? t('No medications')
                : (data.medications.current || []).map(m => m.name).join(', ') || t('None listed'),
            },
          ]}
        />

        {/* Allergies */}
        <ReviewCard
          t={t}
          title="Allergies"
          step={7}
          onEdit={() => onGoToStep(7)}
          items={[
            {
              label: 'Allergies',
              value: data.allergies.nkda
                ? t('No Known Drug Allergies (NKDA)')
                : (data.allergies.entries || []).map(a => a.allergen).join(', ') || t('None listed'),
            },
          ]}
        />

        {/* Social History */}
        <ReviewCard
          t={t}
          title="Social History"
          step={8}
          onEdit={() => onGoToStep(8)}
          items={[
            { label: 'Tobacco', value: data.socialHistory.tobaccoUse || t('Not specified') },
            { label: 'Occupation', value: data.socialHistory.occupation || t('Not specified') },
            { label: 'Work status', value: data.socialHistory.workStatus || t('Not specified') },
          ]}
        />

        {/* Family History */}
        <ReviewCard
          t={t}
          title="Family History"
          step={9}
          onEdit={() => onGoToStep(9)}
          items={[
            {
              label: 'Family history',
              value: data.familyHistory.noRelevantHistory
                ? t('No relevant history')
                : (data.familyHistory.entries || []).map(e => `${e.relation}: ${e.condition}`).join(', ') || t('None listed'),
            },
          ]}
        />

        {/* ROS */}
        <ReviewCard
          t={t}
          title="Review of Systems"
          step={10}
          onEdit={() => onGoToStep(10)}
          items={[
            { label: 'Completed', value: t('Yes') },
          ]}
        />

        {/* PROMs */}
        <ReviewCard
          t={t}
          title="Outcome Questionnaires"
          step={11}
          onEdit={() => onGoToStep(11)}
          items={getPromsReviewItems(data.proms, t)}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-sm text-gray-600">
          {t('By submitting this form, you confirm that the information provided is accurate to the best of your knowledge. This intake form is for information gathering only and does not constitute medical advice or replace a direct medical evaluation. Your surgeon will review this information and may ask additional questions during your visit.')}
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
          disabled={isGenerating}
          className="btn-teal text-lg px-10 py-4 flex items-center gap-3"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('Generating Summary...')}
            </>
          ) : (
            t('Submit Intake Form')
          )}
        </button>
      </div>
    </div>
  );
}


function ReviewCard({ t, title, step, onEdit, items }) {
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
  const summary = data.generatedSummary;

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
        <h2 className="text-2xl font-bold text-navy-600 mb-2">{t('Thank You!')}</h2>
        <p className="text-gray-500">
          {t("Your intake form has been submitted successfully. Your surgeon's team will review your information before your visit.")}
        </p>
        {data.submittedAt && (
          <p className="text-xs text-gray-400 mt-2">
            {t('Submitted at')} {new Date(data.submittedAt).toLocaleString()}
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
          <h3 className="text-lg font-semibold text-navy-600">{t('Your Clinical Summary')}</h3>
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
        <NoteReview
          narrative={summary.narrative}
          onGoToStep={onGoToStep}
          stale={isNoteStale(data, summary)}
          onRewritten={(text, fingerprint) =>
            setSummary({
              ...summary,
              narrative: text,
              revisedAt: new Date().toISOString(),
              sourceFingerprint: fingerprint,
            })
          }
        />
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
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
        <button
          onClick={handleReset}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('Start New Intake')}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        {t('The clinician dashboard provides a full structured summary for your care team.')}
      </p>
    </div>
  );
}
