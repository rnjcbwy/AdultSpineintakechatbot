'use client';

import { useState } from 'react';
import { useIntake } from '../../lib/store';
import { PAIN_QUALITIES, SYMPTOM_REGIONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';

/**
 * Symptom Details — consolidated structured symptom collection.
 *
 * Instead of forcing the patient to fill out an entire page of questions for
 * EACH symptom region, this step is completed all at once:
 *   - Per-symptom cards ask only what genuinely varies by symptom
 *     (onset, trend, side, severity, quality, radiation).
 *   - Shared questions (aggravating/relieving factors, associated symptoms,
 *     region-specific screening, functional impact) are asked a single time.
 */
export default function SymptomDetails({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const hpi = data.hpiData;
  const selectedRegions = data.chiefComplaint.symptomRegions || [];

  const overall = hpi.overall || {};
  const updateOverall = (field, value) => setNested(`hpiData.overall.${field}`, value);
  const setPrimary = (regionId) => setNested('hpiData.primaryRegion', regionId);

  // Which body areas are involved (drives conditional screening sections)
  const areas = new Set(
    selectedRegions
      .map((id) => SYMPTOM_REGIONS.find((r) => r.id === id)?.area)
      .filter(Boolean)
  );
  const hasCervical = areas.has('cervical');
  const hasLumbar = areas.has('lumbar');

  if (selectedRegions.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            No symptom areas were selected yet. Please go back and choose where you have symptoms.
          </p>
          <button onClick={onBack} className="btn-secondary">Go Back</button>
        </div>
        <StepNavigation onNext={onNext} onBack={onBack} canGoNext nextLabel="Continue to Prior Treatments" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">Symptom Details</h2>
        <p className="section-subtitle">
          Let's go through the symptoms you told us about. You can fill this out for all of your
          symptoms on this one page — answer what you can and skip anything that doesn't apply.
        </p>
      </div>

      {/* Which bothers you most */}
      {selectedRegions.length > 1 && (
        <div className="card mb-4">
          <label className="form-label text-base">Which symptom bothers you the most?</label>
          <p className="text-sm text-gray-400 mb-3">This helps your surgeon focus on what matters most to you.</p>
          <div className="flex flex-wrap gap-2">
            {selectedRegions.map((id) => {
              const region = SYMPTOM_REGIONS.find((r) => r.id === id);
              return (
                <button
                  key={id}
                  onClick={() => setPrimary(id)}
                  className={`chip ${hpi.primaryRegion === id ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {region?.label || id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-symptom cards */}
      <div className="space-y-4">
        {selectedRegions.map((id, idx) => {
          const region = SYMPTOM_REGIONS.find((r) => r.id === id);
          return (
            <SymptomCard
              key={id}
              index={idx}
              total={selectedRegions.length}
              region={region || { id, label: id }}
              isPrimary={hpi.primaryRegion === id}
              regionData={hpi.symptoms?.[id] || {}}
              update={(field, value) => setNested(`hpiData.symptoms.${id}.${field}`, value)}
            />
          );
        })}
      </div>

      {/* ================= Shared questions (asked once) ================= */}
      <div className="mt-6 mb-2">
        <h3 className="text-lg font-semibold text-navy-600">A Few Questions About Your Symptoms Overall</h3>
        <p className="text-sm text-gray-400">These apply to all of the symptoms above — you only need to answer them once.</p>
      </div>

      {/* Aggravating / relieving */}
      <div className="card mb-4">
        <MultiChip
          label="What makes your symptoms worse? (select all that apply)"
          options={['Sitting', 'Standing', 'Walking', 'Bending forward', 'Bending backward',
            'Twisting', 'Lifting', 'Coughing/sneezing', 'Lying down', 'Getting up from a chair',
            'Driving', 'Exercise', 'Stairs']}
          selected={overall.aggravatingFactors || []}
          onChange={(v) => updateOverall('aggravatingFactors', v)}
        />
        <div className="mt-6">
          <MultiChip
            label="What makes your symptoms better? (select all that apply)"
            options={['Rest', 'Lying down', 'Sitting', 'Leaning forward', 'Walking', 'Ice', 'Heat',
              'Medication', 'Stretching', 'Position changes', 'Nothing helps']}
            selected={overall.relievingFactors || []}
            onChange={(v) => updateOverall('relievingFactors', v)}
          />
        </div>
      </div>

      {/* Associated symptoms */}
      <div className="card mb-4">
        <h4 className="text-base font-medium text-navy-600 mb-4">Associated Symptoms</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <YesNoQuestion label="Numbness?" sublabel="Loss of sensation or feeling"
            value={overall.numbness} onChange={(v) => updateOverall('numbness', v)} />
          <YesNoQuestion label="Tingling or pins-and-needles?"
            value={overall.tingling} onChange={(v) => updateOverall('tingling', v)} />
          <YesNoQuestion label="Weakness?" sublabel="Difficulty moving or muscle feels weak"
            value={overall.weakness} onChange={(v) => updateOverall('weakness', v)} />
          <YesNoQuestion label="Does it disrupt your sleep?"
            value={overall.sleepDisruption} onChange={(v) => updateOverall('sleepDisruption', v)} />
        </div>
      </div>

      {/* Cervical screening (shown once if any neck/arm/balance/hand region) */}
      {hasCervical && (
        <div className="card mb-4">
          <h4 className="text-base font-medium text-navy-600 mb-1">Neck &amp; Upper Body</h4>
          <p className="text-sm text-gray-400 mb-4">A few specific questions related to your neck/arm symptoms.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <YesNoQuestion label="Trouble with buttons, writing, or small objects?" sublabel="Fine motor difficulty"
              value={overall.handDexterity} onChange={(v) => updateOverall('handDexterity', v)} />
            <YesNoQuestion label="Dropping objects more than usual?"
              value={overall.droppingObjects} onChange={(v) => updateOverall('droppingObjects', v)} />
            <YesNoQuestion label="Balance or coordination problems?"
              value={overall.gaitChanges} onChange={(v) => updateOverall('gaitChanges', v)} />
            <YesNoQuestion label="Electric shock feeling with neck movement?" sublabel="Sensation down your spine when bending the neck"
              value={overall.lhermittes} onChange={(v) => updateOverall('lhermittes', v)} />
          </div>
        </div>
      )}

      {/* Lumbar screening (shown once if any low-back/leg/walking region) */}
      {hasLumbar && (
        <div className="card mb-4">
          <h4 className="text-base font-medium text-navy-600 mb-1">Lower Body</h4>
          <p className="text-sm text-gray-400 mb-4">A few specific questions related to your back/leg symptoms.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <YesNoQuestion label="Pain below the knee?"
              value={overall.painBelowKnee} onChange={(v) => updateOverall('painBelowKnee', v)} />
            <YesNoQuestion label="Symptoms improve when you sit or lean forward?"
              value={overall.reliefLeaningForward} onChange={(v) => updateOverall('reliefLeaningForward', v)} />
            <YesNoQuestion label="Difficulty with stairs or foot feels floppy?" sublabel="Foot drop or leg weakness"
              value={overall.footDrop} onChange={(v) => updateOverall('footDrop', v)} />
            <YesNoQuestion label="Changes in bowel or bladder control?" sublabel="New incontinence or difficulty with urination"
              value={overall.bowelBladder} onChange={(v) => updateOverall('bowelBladder', v)} />
            <YesNoQuestion label="Numbness in the groin or inner thigh area?"
              value={overall.saddleAnesthesia} onChange={(v) => updateOverall('saddleAnesthesia', v)} />
          </div>
          <div className="mt-4">
            <label className="form-label">How far can you walk before needing to stop?</label>
            <div className="flex flex-wrap gap-2">
              {['Unlimited', 'More than 30 minutes', '15-30 minutes', '5-15 minutes',
                'Less than 5 minutes', 'Less than 1 block', 'Need a wheelchair/scooter'].map((opt) => (
                <button key={opt} onClick={() => updateOverall('walkingTolerance', opt)}
                  className={`chip ${overall.walkingTolerance === opt ? 'chip-selected' : 'chip-unselected'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Functional impact (once) */}
      <div className="card mb-4">
        <h4 className="text-base font-medium text-navy-600 mb-4">Impact on Daily Life</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Impact on work" value={overall.workImpact} onChange={(v) => updateOverall('workImpact', v)}
            options={['No impact', 'Mild — can still work', 'Moderate — work is difficult', 'Severe — missing work', 'Unable to work', 'Retired/Not working']} />
          <SelectField label="Impact on exercise/activities" value={overall.exerciseImpact} onChange={(v) => updateOverall('exerciseImpact', v)}
            options={['No impact', 'Mild limitation', 'Moderate limitation', 'Severe limitation', 'Unable to exercise']} />
          <SelectField label="How long can you sit comfortably?" value={overall.sittingTolerance} onChange={(v) => updateOverall('sittingTolerance', v)}
            options={['No limitation', 'More than 1 hour', '30-60 minutes', '15-30 minutes', 'Less than 15 minutes']} />
          <SelectField label="How long can you stand comfortably?" value={overall.standingTolerance} onChange={(v) => updateOverall('standingTolerance', v)}
            options={['No limitation', 'More than 30 minutes', '15-30 minutes', '5-15 minutes', 'Less than 5 minutes']} />
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext
        nextLabel="Continue to Prior Treatments"
      />
    </div>
  );
}


// ===========================================================================
// Per-symptom card — compact, only the fields that vary per symptom
// ===========================================================================
function SymptomCard({ region, regionData, update, isPrimary, index, total }) {
  const [open, setOpen] = useState(index === 0 || total <= 3);

  return (
    <div className={`card ${isPrimary ? 'ring-2 ring-teal-300' : ''}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg font-semibold text-navy-600">{region.label}</span>
          {isPrimary && (
            <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              Bothers me most
            </span>
          )}
        </span>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-5 mt-5">
          {/* Onset */}
          <div>
            <label className="form-label">When did this start?</label>
            <input type="text" value={regionData.onset || ''}
              onChange={(e) => update('onset', e.target.value)}
              placeholder="e.g., About 6 months ago, After a fall in March 2024" />
          </div>

          <ChipRow label="How did it start?" value={regionData.onsetType} onChange={(v) => update('onsetType', v)}
            options={['Gradually over time', 'Suddenly', 'After an injury', 'After surgery', "I'm not sure"]} />

          <ChipRow label="Over time, has this symptom been..." value={regionData.progression} onChange={(v) => update('progression', v)}
            options={['Getting worse', 'Staying about the same', 'Getting better', 'Comes and goes']} />

          <ChipRow label="Which side?" value={regionData.side} onChange={(v) => update('side', v)}
            options={['Right', 'Left', 'Both sides', 'Midline/center', 'Varies']} />

          {/* Severity */}
          <div>
            <label className="form-label">
              How severe is it? (0 = none, 10 = worst imaginable):{' '}
              <strong className="text-teal-600">{regionData.severity ?? 5}</strong>
            </label>
            <input type="range" min="0" max="10" value={regionData.severity ?? 5}
              onChange={(e) => update('severity', parseInt(e.target.value))} />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 — None</span><span>5 — Moderate</span><span>10 — Worst</span>
            </div>
          </div>

          <MultiChip label="How would you describe it? (select all that apply)"
            options={PAIN_QUALITIES} selected={regionData.quality || []}
            onChange={(v) => update('quality', v)} />

          {/* Radiation */}
          <div>
            <label className="form-label">Does it travel or spread to other areas?</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {['No', 'Yes'].map((opt) => (
                <button key={opt} onClick={() => update('radiation', opt === 'Yes')}
                  className={`chip ${regionData.radiation === (opt === 'Yes') ? 'chip-selected' : 'chip-unselected'}`}>
                  {opt}
                </button>
              ))}
            </div>
            {regionData.radiation && (
              <input type="text" value={regionData.radiationTo || ''}
                onChange={(e) => update('radiationTo', e.target.value)}
                placeholder="Where does it travel to? e.g., Down my left leg to the foot" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ===========================================================================
// Small reusable field helpers
// ===========================================================================
function ChipRow({ label, value, onChange, options }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`chip ${value === opt ? 'chip-selected' : 'chip-unselected'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiChip({ label, options, selected, onChange }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isOn = selected.includes(opt);
          return (
            <button key={opt}
              onClick={() => onChange(isOn ? selected.filter((x) => x !== opt) : [...selected, opt])}
              className={`chip ${isOn ? 'chip-selected' : 'chip-unselected'}`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function YesNoQuestion({ label, sublabel, value, onChange }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mb-2">{sublabel}</p>}
      <div className="flex gap-2">
        {['Yes', 'No'].map((opt) => (
          <button key={opt} onClick={() => onChange(opt === 'Yes')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              value === (opt === 'Yes')
                ? opt === 'Yes'
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
