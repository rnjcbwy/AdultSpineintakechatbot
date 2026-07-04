'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { INJECTION_TYPES } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';

/**
 * Prior Treatments — its own full step (previously a small tab within HPI).
 * Captures the conservative treatment history the surgeon needs to know about.
 */
export default function PriorTreatments({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const tx = data.hpiData.conservativeTreatments;

  const updateTx = (path, value) => setNested(`hpiData.conservativeTreatments.${path}`, value);

  const [newInjection, setNewInjection] = useState({
    type: '', location: '', provider: '', when: '', count: '', reliefDuration: '', helped: '',
  });

  const addInjection = () => {
    if (newInjection.type) {
      const current = tx.injections || [];
      setNested('hpiData.conservativeTreatments.injections', [...current, { ...newInjection }]);
      setNewInjection({ type: '', location: '', provider: '', when: '', count: '', reliefDuration: '', helped: '' });
    }
  };

  const removeInjection = (index) => {
    const current = tx.injections || [];
    setNested('hpiData.conservativeTreatments.injections', current.filter((_, i) => i !== index));
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">Prior Treatments</h2>
        <p className="section-subtitle">
          What treatments have you already tried for your spine symptoms? This helps your surgeon
          understand what's been done so far. Answer what applies and skip the rest.
        </p>
      </div>

      <div className="space-y-4">
        <div className="card space-y-6">
          <TreatmentToggle label="Physical therapy" tried={tx.physicalTherapy?.tried} onToggle={(v) => updateTx('physicalTherapy.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <TextField label="Where? (clinic name & city)" value={tx.physicalTherapy?.facility}
                onChange={(v) => updateTx('physicalTherapy.facility', v)} placeholder="e.g., ProCare PT, Denver" />
              <TextField label="Who referred or performed it?" value={tx.physicalTherapy?.provider}
                onChange={(v) => updateTx('physicalTherapy.provider', v)} placeholder="e.g., Dr. Smith / therapist name" />
              <TextField label="When / for how long?" value={tx.physicalTherapy?.duration}
                onChange={(v) => updateTx('physicalTherapy.duration', v)} placeholder="e.g., 3 months in 2024" />
              <TextField label="How often?" value={tx.physicalTherapy?.frequency}
                onChange={(v) => updateTx('physicalTherapy.frequency', v)} placeholder="e.g., 2x per week" />
              <HelpedSelect value={tx.physicalTherapy?.helped} onChange={(v) => updateTx('physicalTherapy.helped', v)} includeWorse />
            </div>
            <RecordsNote text="If you have PT visit notes or a discharge summary, please bring them to your visit." />
          </TreatmentToggle>

          <TreatmentToggle label="Home exercise program" tried={tx.homeExercise?.tried} onToggle={(v) => updateTx('homeExercise.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">Was it guided?</label>
                <select value={tx.homeExercise?.guided || ''} onChange={(e) => updateTx('homeExercise.guided', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="On my own">On my own</option>
                  <option value="Guided by a therapist">Guided by a therapist</option>
                  <option value="App or online program">App or online program</option>
                  <option value="Handout / printed exercises">Handout / printed exercises</option>
                </select>
              </div>
              <TextField label="What app or service? (if any)" value={tx.homeExercise?.appService}
                onChange={(v) => updateTx('homeExercise.appService', v)} placeholder="e.g., Sword Health, YouTube, none" />
              <TextField label="For how long?" value={tx.homeExercise?.duration}
                onChange={(v) => updateTx('homeExercise.duration', v)} placeholder="e.g., 2 months" />
              <TextField label="How frequent?" value={tx.homeExercise?.frequency}
                onChange={(v) => updateTx('homeExercise.frequency', v)} placeholder="e.g., Daily, 3x per week" />
              <div className="sm:col-span-2">
                <TextField label="What did you work on?" value={tx.homeExercise?.details}
                  onChange={(v) => updateTx('homeExercise.details', v)} placeholder="e.g., Core strengthening, stretching, walking program" />
              </div>
            </div>
          </TreatmentToggle>

          <TreatmentToggle label="Chiropractic care" tried={tx.chiropracticCare?.tried} onToggle={(v) => updateTx('chiropracticCare.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">Duration</label>
                <input type="text" value={tx.chiropracticCare?.duration || ''}
                  onChange={(e) => updateTx('chiropracticCare.duration', e.target.value)} placeholder="How long did you go?" />
              </div>
              <HelpedSelect value={tx.chiropracticCare?.helped} onChange={(v) => updateTx('chiropracticCare.helped', v)} />
            </div>
          </TreatmentToggle>

          <TreatmentToggle label="Acupuncture" tried={tx.acupuncture?.tried} onToggle={(v) => updateTx('acupuncture.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">Duration</label>
                <input type="text" value={tx.acupuncture?.duration || ''}
                  onChange={(e) => updateTx('acupuncture.duration', e.target.value)} placeholder="How long?" />
              </div>
              <HelpedSelect value={tx.acupuncture?.helped} onChange={(v) => updateTx('acupuncture.helped', v)} />
            </div>
          </TreatmentToggle>

          <TreatmentToggle label="Back brace or cervical collar" tried={tx.braces?.tried} onToggle={(v) => updateTx('braces.tried', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">Type</label>
                <input type="text" value={tx.braces?.type || ''}
                  onChange={(e) => updateTx('braces.type', e.target.value)} placeholder="What kind?" />
              </div>
              <HelpedSelect value={tx.braces?.helped} onChange={(v) => updateTx('braces.helped', v)} />
            </div>
          </TreatmentToggle>

          {/* Injections */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-base font-medium text-navy-600 mb-1">Injections</h4>
            <p className="text-sm text-gray-400 mb-3">
              Have you had any spine injections? Add each one with as much detail as you can —
              this is important for insurance authorization.
            </p>

            {(tx.injections || []).map((inj, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 p-2 bg-teal-50 rounded-lg text-sm">
                <span className="flex-1 text-teal-700">
                  {inj.type}{inj.location && ` — ${inj.location}`} {inj.when && `(${inj.when})`}
                  {' — '}{inj.helped || 'unknown response'}
                  {inj.reliefDuration && `, relief lasted ${inj.reliefDuration}`}
                  {inj.count && `, ${inj.count}x`}
                  {inj.provider && ` · by ${inj.provider}`}
                </span>
                <button onClick={() => removeInjection(i)} className="text-gray-400 hover:text-red-500 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <select value={newInjection.type} onChange={(e) => setNewInjection((p) => ({ ...p, type: e.target.value }))}>
                <option value="">Injection type...</option>
                {INJECTION_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
              <input type="text" value={newInjection.location}
                onChange={(e) => setNewInjection((p) => ({ ...p, location: e.target.value }))} placeholder="Where? (e.g., L4-L5, left side)" />
              <input type="text" value={newInjection.provider}
                onChange={(e) => setNewInjection((p) => ({ ...p, provider: e.target.value }))} placeholder="Who did it? (doctor / clinic)" />
              <input type="text" value={newInjection.when}
                onChange={(e) => setNewInjection((p) => ({ ...p, when: e.target.value }))} placeholder="When? (e.g., June 2024)" />
              <input type="text" value={newInjection.count}
                onChange={(e) => setNewInjection((p) => ({ ...p, count: e.target.value }))} placeholder="How many? (e.g., 3)" />
              <input type="text" value={newInjection.reliefDuration}
                onChange={(e) => setNewInjection((p) => ({ ...p, reliefDuration: e.target.value }))} placeholder="How long did relief last? (e.g., 2 weeks)" />
              <select value={newInjection.helped} onChange={(e) => setNewInjection((p) => ({ ...p, helped: e.target.value }))} className="sm:col-span-2">
                <option value="">Did it help?</option>
                <option value="Helped a lot">Helped a lot</option>
                <option value="Helped temporarily">Helped temporarily</option>
                <option value="Helped somewhat">Helped somewhat</option>
                <option value="Did not help">Did not help</option>
              </select>
            </div>
            <button onClick={addInjection} disabled={!newInjection.type} className="btn-secondary text-sm mt-3">
              + Add Injection
            </button>
            <RecordsNote text="If you have injection records or procedure notes, please bring them to your visit." />
          </div>

          {/* Prior Imaging */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-base font-medium text-navy-600 mb-3">Prior Imaging</h4>
            <p className="text-sm text-gray-400 mb-3">What imaging studies have you had for your spine?</p>
            <div className="flex flex-wrap gap-2">
              {['X-rays', 'MRI', 'CT scan', 'Myelogram', 'Bone density scan (DEXA)', 'None'].map((img) => {
                const selected = (tx.priorImaging || []).includes(img);
                return (
                  <button key={img}
                    onClick={() => {
                      const current = tx.priorImaging || [];
                      setNested('hpiData.conservativeTreatments.priorImaging',
                        selected ? current.filter((x) => x !== img) : [...current, img]);
                    }}
                    className={`chip ${selected ? 'chip-selected' : 'chip-unselected'}`}>
                    {img}
                  </button>
                );
              })}
            </div>
          </div>

          {/* EMG */}
          <TreatmentToggle label="EMG or nerve conduction study" tried={tx.priorEMG?.done} onToggle={(v) => updateTx('priorEMG.done', v)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <TextField label="When?" value={tx.priorEMG?.when}
                onChange={(v) => updateTx('priorEMG.when', v)} placeholder="e.g., March 2024" />
              <TextField label="Where? (facility & city)" value={tx.priorEMG?.facility}
                onChange={(v) => updateTx('priorEMG.facility', v)} placeholder="e.g., Denver Neuro Clinic" />
              <TextField label="Who did it?" value={tx.priorEMG?.provider}
                onChange={(v) => updateTx('priorEMG.provider', v)} placeholder="Physician / provider name" />
              <TextField label="Results (if known)" value={tx.priorEMG?.results}
                onChange={(v) => updateTx('priorEMG.results', v)} placeholder="What did it show?" />
            </div>
            <RecordsNote text="Please bring a copy of your EMG/nerve study report to your visit." />
          </TreatmentToggle>
        </div>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel="Continue to Additional Details" />
    </div>
  );
}


function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="form-label text-sm">{label}</label>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function RecordsNote({ text }) {
  return (
    <p className="flex items-start gap-2 text-xs text-teal-700 bg-teal-50 rounded-lg px-3 py-2 mt-3">
      <span aria-hidden="true">📄</span>
      <span>{text}</span>
    </p>
  );
}

function HelpedSelect({ value, onChange, includeWorse }) {
  return (
    <div>
      <label className="form-label text-sm">Did it help?</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select...</option>
        <option value="Helped a lot">Helped a lot</option>
        <option value="Helped somewhat">Helped somewhat</option>
        <option value="Helped temporarily">Helped temporarily</option>
        <option value="Did not help">Did not help</option>
        {includeWorse && <option value="Made it worse">Made it worse</option>}
      </select>
    </div>
  );
}

function TreatmentToggle({ label, tried, onToggle, children }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-gray-700">{label}</span>
        <div className="flex gap-2">
          <button onClick={() => onToggle(true)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              tried === true ? 'bg-teal-100 text-teal-700 border border-teal-300' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>Yes</button>
          <button onClick={() => onToggle(false)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              tried === false ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>No</button>
        </div>
      </div>
      {tried && children}
    </div>
  );
}
