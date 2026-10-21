'use client';

import { useIntake, useService } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import StepNavigation from '../ui/StepNavigation';
import { Chips, TextField, TextArea } from '../ui/Fields';

const WORK_STATUS = ['Working full duty', 'Working light duty', 'Out of work because of this injury', 'Not working for another reason'];
const YES_NO = ['Yes', 'No'];
const MECHANISM_HINTS = [
  'Lifting a heavy object at work',
  'Fell at work',
  'Repetitive bending and twisting',
  'Motor vehicle accident while working',
  'Struck by an object',
];

const LOCAL = {
  'I do not have the claim number or the date of injury with me': {
    es: 'No tengo conmigo el número de reclamación ni la fecha de la lesión',
    zh: '我身边没有索赔编号或受伤日期',
  },
  'You can continue without them. The office will ask for them before your visit.': {
    es: 'Puede continuar sin ellos. La oficina se los pedirá antes de su cita.',
    zh: '您可以先继续。诊所会在您就诊前向您索取。',
  },
  "Have you had a previous workers' compensation claim for your back or neck?": {
    es: '¿Ha tenido una reclamación de compensación laboral anterior por la espalda o el cuello?',
    zh: '您以前是否因背部或颈部提出过工伤赔偿申请？',
  },
  "Have you had a previous workers' compensation claim for this bone or joint?": {
    es: '¿Ha tenido una reclamación de compensación laboral anterior por este hueso o articulación?',
    zh: '您以前是否因这个骨骼或关节提出过工伤赔偿申请？',
  },
};

/**
 * The claim and the injury. Everything here goes into its own section of the
 * note: a workers' compensation case is adjudicated on these facts (date,
 * mechanism, who it was reported to, work status), so they are gathered
 * before the ordinary history. That there IS a claim was settled on the
 * triage step, so it is not asked again. The claim number and the date are
 * asked for, but a patient without them to hand can say so and continue.
 */
export default function WorkInjury({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const svc = useService();
  const ortho = svc.specialty === 'ortho';
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const wc = data.visit?.wc || {};
  const set = (k, v) => setNested(`visit.wc.${k}`, v);
  const hasClaimDetails = String(wc.claimNumber || '').trim().length >= 3 && !!wc.dateOfInjury;
  const canGoNext = hasClaimDetails || wc.claimNotAvailable === true;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Work Injury & Claim')}</h2>
        <p className="section-subtitle">
          {t("These details are needed to document a work-related injury and to communicate with the claim's administrator. Fields marked with * are required.")}
        </p>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('The claim')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Claim number" required value={wc.claimNumber} onChange={(v) => set('claimNumber', v)} placeholder="As shown on your claim paperwork" />
            <TextField label="Date of injury" required type="date" value={wc.dateOfInjury} onChange={(v) => set('dateOfInjury', v)} />
          </div>
          {!hasClaimDetails && (
            <label className="flex items-start gap-3 cursor-pointer mt-3 p-3 rounded-xl bg-gray-50">
              <input type="checkbox" checked={wc.claimNotAvailable === true} onChange={(e) => set('claimNotAvailable', e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{t('I do not have the claim number or the date of injury with me')}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{t('You can continue without them. The office will ask for them before your visit.')}</span>
              </span>
            </label>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextField label="Employer" value={wc.employer} onChange={(v) => set('employer', v)} placeholder="Company name" />
            <TextField label="Your job title" value={wc.jobTitle} onChange={(v) => set('jobTitle', v)} placeholder="e.g., Warehouse associate" />
            <TextField label="Insurance carrier / claim administrator" value={wc.carrier} onChange={(v) => set('carrier', v)} placeholder="e.g., Travelers, NJM" />
            <TextField label="Adjuster name" value={wc.adjusterName} onChange={(v) => set('adjusterName', v)} />
            <TextField label="Adjuster phone or email" value={wc.adjusterContact} onChange={(v) => set('adjusterContact', v)} />
            <TextField label="Nurse case manager (if any)" value={wc.caseManager} onChange={(v) => set('caseManager', v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Chips label="Do you have an attorney for this claim?" options={YES_NO} value={wc.attorney} onChange={(v) => set('attorney', v)} />
            {wc.attorney === 'Yes' && (
              <TextField label="Attorney name and firm" value={wc.attorneyName} onChange={(v) => set('attorneyName', v)} />
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('How the injury happened')}</h3>
          <div className="space-y-4">
            <TextArea
              label="Describe what you were doing and what happened, in your own words"
              value={wc.mechanism}
              onChange={(v) => set('mechanism', v)}
              placeholder="e.g., I was lifting a 60-pound box from the floor and felt a sharp pain in my low back that went into my right leg."
              rows={4}
            />
            <Chips label="Common examples (tap to use, then edit)" options={MECHANISM_HINTS} value={MECHANISM_HINTS.includes(wc.mechanism) ? wc.mechanism : ''} onChange={(v) => v && set('mechanism', v)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Chips label="Was the injury reported to your employer?" options={YES_NO} value={wc.reported} onChange={(v) => set('reported', v)} />
              <TextField label="Date reported (if known)" type="date" value={wc.reportedDate} onChange={(v) => set('reportedDate', v)} />
            </div>
            <TextField
              label="Other doctors or clinics seen for this injury"
              value={wc.otherProviders}
              onChange={(v) => set('otherProviders', v)}
              placeholder="e.g., Urgent care on the day of injury; occupational medicine clinic"
            />
            {/* Worded for the service; translated here, so the field kit shows it as given. */}
            <Chips
              label={t(ortho
                ? "Have you had a previous workers' compensation claim for this bone or joint?"
                : "Have you had a previous workers' compensation claim for your back or neck?")}
              options={YES_NO} value={wc.priorClaims} onChange={(v) => set('priorClaims', v)} />
            {wc.priorClaims === 'Yes' && (
              <TextField label="Briefly, when and for what" value={wc.priorClaimsDetails} onChange={(v) => set('priorClaimsDetails', v)} />
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-navy-600 mb-4">{t('Work status')}</h3>
          <div className="space-y-4">
            <Chips label="Are you working right now?" options={WORK_STATUS} value={wc.workStatus} onChange={(v) => set('workStatus', v)} />
            {(wc.workStatus === 'Out of work because of this injury' || wc.workStatus === 'Working light duty') && (
              <TextField label="Since when?" type="date" value={wc.workStatusSince} onChange={(v) => set('workStatusSince', v)} />
            )}
            <TextField
              label="Current restrictions, if any"
              value={wc.restrictions}
              onChange={(v) => set('restrictions', v)}
              placeholder="e.g., No lifting over 10 lbs, no bending"
            />
            <TextArea
              label="What does your job require physically?"
              value={wc.jobDemands}
              onChange={(v) => set('jobDemands', v)}
              placeholder="e.g., Lifting up to 50 lbs repeatedly, standing 8 hours, driving a forklift"
              rows={2}
            />
          </div>
        </div>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}
