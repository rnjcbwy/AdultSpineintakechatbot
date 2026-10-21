'use client';

import { useIntake, useService } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import StepNavigation from '../ui/StepNavigation';
import { Chips, CheckChips, TextField, TextArea } from '../ui/Fields';

const ACCIDENT_TYPES = ['Motor vehicle crash', 'Slip, trip or fall', 'Struck by or against something', 'Assault', 'Sports or recreation', 'Other'];
const ROLES = ['Driver', 'Passenger', 'Pedestrian or cyclist', 'Not a vehicle accident'];
const YES_NO = ['Yes', 'No'];
const YES_NO_UNSURE = ['Yes', 'No', 'Not sure'];
const ONSET = ['Right away', 'Within hours', 'The next day', 'Within a week', 'More than a week later'];
const WORK_STATUS = ['Working as before', 'Working with limits', 'Out of work because of the injury', 'Was not working before the injury'];
const RECEIVED = ['Ambulance to the hospital', 'Went to an emergency room', 'Urgent care', 'Saw my own doctor', 'No care that day'];

const LOCAL = {
  'Have you had any earlier injury claim or lawsuit for your neck or back?': {
    es: '¿Ha tenido alguna reclamación por lesión o demanda anterior por el cuello o la espalda?',
    zh: '您以前是否因颈部或背部提出过伤害索赔或诉讼？',
  },
  'Have you had any earlier injury claim or lawsuit for this bone or joint?': {
    es: '¿Ha tenido alguna reclamación por lesión o demanda anterior por este hueso o articulación?',
    zh: '您以前是否因这个骨骼或关节提出过伤害索赔或诉讼？',
  },
  'Any spine surgery or spine injections before this injury?': {
    es: '¿Alguna cirugía o inyección en la columna antes de esta lesión?',
    zh: '在这次受伤之前，是否做过脊柱手术或脊柱注射？',
  },
  'Any surgery or injections on this bone or joint before this injury?': {
    es: '¿Alguna cirugía o inyección en este hueso o articulación antes de esta lesión?',
    zh: '在这次受伤之前，是否对这个骨骼或关节做过手术或注射？',
  },
  'The treatment you have had since the injury is asked on the Prior Treatments and Records pages.': {
    es: 'El tratamiento que ha recibido desde la lesión se pregunta en las páginas de Tratamientos previos y Registros.',
    zh: '您受伤后接受的治疗将在"既往治疗"和"记录"页面询问。',
  },
};

/**
 * An injury with a legal claim (a crash, a fall, an assault). The record made
 * at the first visit is what the claim is argued on later, so this gathers
 * the event, what happened right after it, the state of the same body region
 * BEFORE the injury, everything since, and the parties: in the patient's own
 * words wherever it matters. The treatment since the injury is NOT asked
 * here: the Prior Treatments and Records steps collect it in detail. Nothing
 * here is a legal opinion; the two acknowledgments at the end are the only
 * legal text, and they are marked for the surgeon's attorney to approve.
 */
export default function LegalInjury({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const svc = useService();
  const ortho = svc.specialty === 'ortho';
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const pi = data.visit?.pi || {};
  const set = (k, v) => setNested(`visit.pi.${k}`, v);
  const canGoNext = !!pi.dateOfInjury && !!pi.accidentType && !!pi.mechanism && pi.ackRelease === true && pi.ackRecords === true;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('The Accident and Your Claim')}</h2>
        <p className="section-subtitle">
          {t('Please describe the injury in your own words. These details become part of your medical record for this claim, so the more exact you can be about dates and what happened, the better. Fields marked with * are required.')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('The event')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Date of the injury" required type="date" value={pi.dateOfInjury} onChange={(v) => set('dateOfInjury', v)} />
            <TextField label="Time of day, if you know it" value={pi.timeOfInjury} onChange={(v) => set('timeOfInjury', v)} placeholder="e.g., About 5:30 pm" />
            <TextField label="Where it happened" value={pi.place} onChange={(v) => set('place', v)} placeholder="e.g., Route 4 westbound in Paramus; the stairs at work" />
          </div>
          <Chips label="What kind of accident or injury was it? *" options={ACCIDENT_TYPES} value={pi.accidentType} onChange={(v) => set('accidentType', v)} />
          {pi.accidentType === 'Motor vehicle crash' && (
            <>
              <Chips label="You were the:" options={ROLES} value={pi.role} onChange={(v) => set('role', v)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Chips label="Were you wearing a seat belt?" options={YES_NO_UNSURE} value={pi.seatBelt} onChange={(v) => set('seatBelt', v)} />
                <Chips label="Did the airbags go off?" options={YES_NO_UNSURE} value={pi.airbags} onChange={(v) => set('airbags', v)} />
              </div>
              <TextField label="How were you hit? (from behind, head-on, from the side, rollover)" value={pi.impact} onChange={(v) => set('impact', v)} placeholder="e.g., Rear-ended while stopped at a light" />
            </>
          )}
          <TextArea
            label="Describe exactly what happened, in your own words *"
            value={pi.mechanism}
            onChange={(v) => set('mechanism', v)}
            placeholder="e.g., I was stopped at a red light and was hit from behind. My head snapped back and I felt pain in my neck right away."
            rows={4}
          />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Right after the injury')}</h3>
          <Chips label="Did you lose consciousness or black out?" options={YES_NO_UNSURE} value={pi.lostConsciousness} onChange={(v) => set('lostConsciousness', v)} />
          <CheckChips label="What care did you get that day? (tap all that apply)" options={RECEIVED} value={pi.careThatDay || []} onChange={(v) => set('careThatDay', v)} exclusive="No care that day" />
          {(pi.careThatDay || []).some((c) => c !== 'No care that day') && (
            <TextField label="Where? (hospital, urgent care or clinic name)" value={pi.careWhere} onChange={(v) => set('careWhere', v)} placeholder="e.g., Hackensack University Medical Center ER" />
          )}
          <Chips label="Were X-rays, a CT or an MRI done that day or soon after?" options={YES_NO_UNSURE} value={pi.imagingSoonAfter} onChange={(v) => set('imagingSoonAfter', v)} />
          <Chips label="When did your pain or symptoms start, compared with the injury?" options={ONSET} value={pi.onsetTiming} onChange={(v) => set('onsetTiming', v)} />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Before the injury')}</h3>
          <p className="text-sm text-gray-500">{t('Please answer these honestly, even if the answer is yes. A complete record protects you.')}</p>
          <Chips label="Before this injury, did you have pain or problems in the same part of your body?" options={YES_NO} value={pi.priorSameRegion} onChange={(v) => set('priorSameRegion', v)} />
          {pi.priorSameRegion === 'Yes' && (
            <TextArea label="What, and when? Any treatment for it?" value={pi.priorSameRegionDetails} onChange={(v) => set('priorSameRegionDetails', v)} rows={2} placeholder="e.g., Occasional low back pain after lifting, saw a chiropractor in 2022, no imaging" />
          )}
          {/* Worded for the service; translated here, so the field kit shows them as given. */}
          <Chips
            label={t(ortho
              ? 'Have you had any earlier injury claim or lawsuit for this bone or joint?'
              : 'Have you had any earlier injury claim or lawsuit for your neck or back?')}
            options={YES_NO} value={pi.priorClaims} onChange={(v) => set('priorClaims', v)} />
          {pi.priorClaims === 'Yes' && (
            <TextField label="Briefly, when and for what" value={pi.priorClaimsDetails} onChange={(v) => set('priorClaimsDetails', v)} />
          )}
          <Chips
            label={t(ortho
              ? 'Any surgery or injections on this bone or joint before this injury?'
              : 'Any spine surgery or spine injections before this injury?')}
            options={YES_NO} value={pi.priorSpineTreatment} onChange={(v) => set('priorSpineTreatment', v)} />
          {pi.priorSpineTreatment === 'Yes' && (
            <TextField label="What and when" value={pi.priorSpineTreatmentDetails} onChange={(v) => set('priorSpineTreatmentDetails', v)} />
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Since the injury')}</h3>
          <TextArea
            label="Every doctor, clinic or therapist you have seen for this injury"
            value={pi.providersSince}
            onChange={(v) => set('providersSince', v)}
            placeholder="e.g., ER at Hackensack the same day; Dr. Patel (primary care) a week later; physical therapy at Teaneck PT since August"
            rows={3}
          />
          <p className="text-xs text-gray-400">{t('The treatment you have had since the injury is asked on the Prior Treatments and Records pages.')}</p>
          <Chips label="Work" options={WORK_STATUS} value={pi.workStatus} onChange={(v) => set('workStatus', v)} />
          {(pi.workStatus === 'Out of work because of the injury' || pi.workStatus === 'Working with limits') && (
            <TextField label="Since when, and what are the limits?" value={pi.workDetails} onChange={(v) => set('workDetails', v)} />
          )}
          <TextArea
            label="What can you no longer do, or do only with difficulty, that you did before?"
            value={pi.activitiesLost}
            onChange={(v) => set('activitiesLost', v)}
            placeholder="e.g., Cannot sit through a movie; stopped running; need help with groceries; sleep interrupted every night"
            rows={3}
          />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('The claim')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Attorney name" value={pi.attorneyName} onChange={(v) => set('attorneyName', v)} />
            <TextField label="Law firm" value={pi.attorneyFirm} onChange={(v) => set('attorneyFirm', v)} />
            <TextField label="Attorney phone or email" value={pi.attorneyContact} onChange={(v) => set('attorneyContact', v)} />
            <TextField label="Claim or case number, if you have one" value={pi.claimNumber} onChange={(v) => set('claimNumber', v)} />
            <TextField label="Insurance company handling the claim" value={pi.insurer} onChange={(v) => set('insurer', v)} placeholder="e.g., GEICO (the other driver); my own auto policy" />
          </div>
          <Chips label="Is your care being paid under a letter of protection from your attorney?" options={YES_NO_UNSURE} value={pi.letterOfProtection} onChange={(v) => set('letterOfProtection', v)} />
          <Chips label="Has your attorney asked for a written report from the doctor?" options={YES_NO_UNSURE} value={pi.reportRequested} onChange={(v) => set('reportRequested', v)} />
        </div>

        <div className="card space-y-4 border-teal-100">
          <h3 className="text-lg font-medium text-navy-600">{t('Acknowledgments')}</h3>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={pi.ackRelease === true} onChange={(e) => set('ackRelease', e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0" />
            <span className="text-sm text-gray-700 leading-relaxed">
              {t('I authorize the practice to communicate with the attorney named above about this injury and to release my records relating to it to that attorney and to the insurer handling the claim, on request. *')}
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={pi.ackRecords === true} onChange={(e) => set('ackRecords', e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0" />
            <span className="text-sm text-gray-700 leading-relaxed">
              {t('I understand that because this injury is the subject of a legal claim, my medical records from this practice, including this form, may be requested by the parties to the claim or by a court, and that the practice must respond to a valid subpoena. *')}
            </span>
          </label>
        </div>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}
