'use client';

import { useIntake } from '../lib/store';
import { useLang, makeT } from '../lib/i18n';
import { INTAKE_STEPS } from '../lib/constants';

const CHROME = {
  'Spine Surgery Intake': { es: 'Admisión de cirugía de columna', zh: '脊柱外科登记' },
  'Save & Exit': { es: 'Guardar y salir', zh: '保存并退出' },
  'Your progress is automatically saved. You can return later to continue.': {
    es: 'Su progreso se guarda automáticamente. Puede regresar más tarde para continuar.',
    zh: '您的进度会自动保存。您可以稍后返回继续。',
  },
  'This intake form is for information gathering only and does not replace direct medical evaluation. Your responses are saved automatically. If you need urgent medical attention, please call 911 or go to the nearest emergency room.': {
    es: 'Este formulario es solo para recopilar información y no reemplaza una evaluación médica directa. Sus respuestas se guardan automáticamente. Si necesita atención médica urgente, llame al 911 o acuda a la sala de emergencias más cercana.',
    zh: '此表格仅用于收集信息，不能替代直接的医疗评估。您的回答会自动保存。如需紧急医疗救助，请拨打 911 或前往最近的急诊室。',
  },
  // Step labels (shown in the header)
  'Demographics': { es: 'Datos demográficos', zh: '基本信息' },
  'Chief Complaint': { es: 'Motivo de consulta', zh: '主诉' },
  'Symptom Details': { es: 'Detalles de los síntomas', zh: '症状详情' },
  'Prior Treatments': { es: 'Tratamientos previos', zh: '既往治疗' },
  'Additional Details': { es: 'Detalles adicionales', zh: '补充信息' },
  'Past Medical History': { es: 'Antecedentes médicos', zh: '既往病史' },
  'Past Surgical History': { es: 'Antecedentes quirúrgicos', zh: '既往手术史' },
  'Medications': { es: 'Medicamentos', zh: '药物' },
  'Allergies': { es: 'Alergias', zh: '过敏史' },
  'Social History': { es: 'Historia social', zh: '社会史' },
  'Family History': { es: 'Antecedentes familiares', zh: '家族史' },
  'Review of Systems': { es: 'Revisión por sistemas', zh: '系统回顾' },
  'Outcome Questionnaires': { es: 'Cuestionarios de resultados', zh: '结果问卷' },
  'Review & Submit': { es: 'Revisar y enviar', zh: '检查并提交' },
  'Before We Begin': { es: 'Antes de comenzar', zh: '开始之前' },
};

const STEP_OF = {
  es: (c, n) => `Paso ${c} de ${n}`,
  zh: (c, n) => `第 ${c} 步，共 ${n} 步`,
  en: (c, n) => `Step ${c} of ${n}`,
};
import ProgressBar from './ProgressBar';
import Welcome from './steps/Welcome';
import BeforeWeBegin from './steps/BeforeWeBegin';
import Demographics from './steps/Demographics';
import ChiefComplaint from './steps/ChiefComplaint';
import SymptomDetails from './steps/SymptomDetails';
import PriorTreatments from './steps/PriorTreatments';
import AdditionalConcerns from './steps/AdditionalConcerns';
import PastMedicalHistory from './steps/PastMedicalHistory';
import PastSurgicalHistory from './steps/PastSurgicalHistory';
import Medications from './steps/Medications';
import Allergies from './steps/Allergies';
import SocialHistory from './steps/SocialHistory';
import FamilyHistory from './steps/FamilyHistory';
import ReviewOfSystems from './steps/ReviewOfSystems';
import PROMs from './steps/PROMs';
import FinalReview from './steps/FinalReview';

// Map step index to component
const STEP_COMPONENTS = [
  Welcome,
  BeforeWeBegin,
  Demographics,
  ChiefComplaint,
  SymptomDetails,
  PriorTreatments,
  AdditionalConcerns,
  PastMedicalHistory,
  PastSurgicalHistory,
  Medications,
  Allergies,
  SocialHistory,
  FamilyHistory,
  ReviewOfSystems,
  PROMs,
  FinalReview,
];

export default function IntakeWizard() {
  const { data, setStep, completeStep } = useIntake();
  const lang = useLang();
  const t = makeT(CHROME, lang);
  const stepOf = STEP_OF[lang] || STEP_OF.en;
  const currentStep = data.currentStep;
  const StepComponent = STEP_COMPONENTS[currentStep];
  const stepId = INTAKE_STEPS[currentStep]?.id;
  // Welcome (0) and the consent gate show a clean full-page card with no progress header
  const showChrome = currentStep > 0 && stepId !== 'consent';

  const goNext = () => {
    completeStep(currentStep);
    if (currentStep < INTAKE_STEPS.length - 1) {
      setStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step) => {
    // Allow going back to completed steps or current step
    if (step <= currentStep || data.completedSteps.includes(step)) {
      setStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      {showChrome && (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-navy-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-navy-600">{t('Spine Surgery Intake')}</h1>
                  <p className="text-xs text-gray-400">
                    {stepOf(currentStep, INTAKE_STEPS.length - 1)}
                    {' · '}
                    {t(INTAKE_STEPS[currentStep]?.label)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(t('Your progress is automatically saved. You can return later to continue.'))) {
                    // Just close or show saved message
                  }
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t('Save & Exit')}
              </button>
            </div>
            <ProgressBar current={currentStep} total={INTAKE_STEPS.length - 1} steps={INTAKE_STEPS} />
          </div>
        </header>
      )}

      {/* Main content area */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="step-enter">
          <StepComponent
            onNext={goNext}
            onBack={goBack}
            onGoToStep={goToStep}
          />
        </div>
      </main>

      {/* Footer disclaimer */}
      {showChrome && currentStep < INTAKE_STEPS.length - 1 && (
        <footer className="max-w-4xl mx-auto px-4 pb-8">
          <p className="text-xs text-gray-400 text-center">
            {t('This intake form is for information gathering only and does not replace direct medical evaluation. Your responses are saved automatically. If you need urgent medical attention, please call 911 or go to the nearest emergency room.')}
          </p>
        </footer>
      )}
    </div>
  );
}
