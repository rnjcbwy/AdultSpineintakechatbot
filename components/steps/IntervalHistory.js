'use client';

import { useIntake, useService } from '../../lib/store';
import { useLang, makeT, COMMON } from '../../lib/i18n';
import StepNavigation from '../ui/StepNavigation';
import { Chips, CheckChips, TextField, TextArea, PainScale } from '../ui/Fields';

const LAST_VISIT = ['About 2 weeks ago', 'About 6 weeks ago', 'About 3 months ago', 'About 6 months ago', 'About a year ago', 'Longer than a year ago'];
const CHANGE = ['Much better', 'Somewhat better', 'About the same', 'Somewhat worse', 'Much worse'];
const TREATMENTS = ['Physical therapy', 'An injection', 'New or changed medication', 'Chiropractic or acupuncture', 'New imaging (MRI, CT, X-ray)', 'Surgery elsewhere', 'Nothing new'];
const YES_NO = ['Yes', 'No'];

/**
 * The interval history for an established patient: what has changed since the
 * last visit, what was tried in between and how it went, where it hurts now.
 * The full history is already on file, so none of it is asked again.
 */
export default function IntervalHistory({ onNext, onBack }) {
  const { data, setNested, setField } = useIntake();
  const svc = useService();
  const { SYMPTOM_REGIONS } = svc.constants;
  const ortho = svc.specialty === 'ortho';
  const lang = useLang();
  const t = makeT(COMMON, lang);
  const f = data.visit?.followup || {};
  const set = (k, v) => setNested(`visit.followup.${k}`, v);
  const regions = data.chiefComplaint?.symptomRegions || [];
  const toggleRegion = (id) => {
    const next = regions.includes(id) ? regions.filter((r) => r !== id) : [...regions, id];
    setField('chiefComplaint', 'symptomRegions', next);
    if (!data.chiefComplaint?.mainReason) setField('chiefComplaint', 'mainReason', ortho ? 'Follow-up of a known bone or joint problem' : 'Follow-up of a known spine problem');
  };
  const canGoNext = !!f.overallChange;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="section-title">{t('Since Your Last Visit')}</h2>
        <p className="section-subtitle">
          {t('Your history is already on file. This visit is about what has changed and what has been tried in between.')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4">
          <Chips label="When was your last visit for this problem?" options={LAST_VISIT} value={f.lastVisitWhen} onChange={(v) => set('lastVisitWhen', v)} />
          <Chips label="Overall, compared with your last visit, you are:" options={CHANGE} value={f.overallChange} onChange={(v) => set('overallChange', v)} />
          <TextArea
            label="What has changed? Tell us in your own words"
            value={f.whatChanged}
            onChange={(v) => set('whatChanged', v)}
            placeholder="e.g., The leg pain is mostly gone but the back still aches after an hour of standing."
            rows={4}
          />
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Where it is now')}</h3>
          <div>
            <label className="form-label">{t('Which areas are you here about today?')}</label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_REGIONS.map((r) => {
                const active = regions.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRegion(r.id)}
                    aria-pressed={active}
                    className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
                      active ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    {t(r.label)}
                  </button>
                );
              })}
            </div>
          </div>
          <PainScale label="Your pain today, on average (0 to 10)" value={f.painNow} onChange={(v) => set('painNow', v)} />
          <PainScale label="Your pain at your last visit, as best you remember" value={f.painThen} onChange={(v) => set('painThen', v)} />
          <Chips label="Any new symptoms since last time (new numbness, weakness, a new area of pain)?" options={YES_NO} value={f.newSymptoms} onChange={(v) => set('newSymptoms', v)} />
          {f.newSymptoms === 'Yes' && (
            <TextArea label="Describe the new symptoms" value={f.newSymptomsDetails} onChange={(v) => set('newSymptomsDetails', v)} rows={2} />
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-medium text-navy-600">{t('Tried since your last visit')}</h3>
          <CheckChips options={TREATMENTS} value={f.treatments || []} onChange={(v) => set('treatments', v)} exclusive="Nothing new" />
          {(f.treatments || []).includes('Physical therapy') && (
            <TextField label="Physical therapy: where, how many visits, and did it help?" value={f.ptDetails} onChange={(v) => set('ptDetails', v)} placeholder="e.g., 8 visits at Teaneck PT; helped the leg, not the back" />
          )}
          {(f.treatments || []).includes('An injection') && (
            <TextField label="Injection: what kind, when, and how long did it help?" value={f.injectionDetails} onChange={(v) => set('injectionDetails', v)} placeholder="e.g., Epidural at L4-5 in March; 3 weeks of relief" />
          )}
          {(f.treatments || []).includes('New or changed medication') && (
            <TextField label="Medication: what changed and did it help?" value={f.medicationDetails} onChange={(v) => set('medicationDetails', v)} placeholder="e.g., Started gabapentin 300 mg at night; less burning" />
          )}
          {(f.treatments || []).includes('New imaging (MRI, CT, X-ray)') && (
            <TextField label="Imaging: what, when, and where (please bring the report)" value={f.imagingDetails} onChange={(v) => set('imagingDetails', v)} placeholder={ortho ? 'e.g., Right knee MRI, May 2026, Holy Name Imaging' : 'e.g., Lumbar MRI, May 2026, Holy Name Imaging'} />
          )}
          {(f.treatments || []).includes('Surgery elsewhere') && (
            <TextField label="Surgery elsewhere: what, when and where" value={f.surgeryDetails} onChange={(v) => set('surgeryDetails', v)} />
          )}
          {(f.treatments || []).includes('Chiropractic or acupuncture') && (
            <TextField label="Chiropractic or acupuncture: how many visits and did it help?" value={f.otherDetails} onChange={(v) => set('otherDetails', v)} />
          )}
        </div>

        <div className="card space-y-4">
          <TextArea
            label="What would you like addressed at this visit?"
            value={f.goals}
            onChange={(v) => set('goals', v)}
            placeholder="e.g., Whether I should have the injection repeated; whether I can return to running"
            rows={3}
          />
        </div>
      </div>

      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={canGoNext} />
    </div>
  );
}
