'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useIntake } from '../../lib/store';
import { buildHPIChatContext } from '../../lib/prompts';
import { PAIN_QUALITIES, INJECTION_TYPES, SYMPTOM_REGIONS } from '../../lib/constants';
import StepNavigation from '../ui/StepNavigation';

/**
 * HPI Section — the most advanced and dynamic part of the intake.
 * Combines structured symptom collection with AI-driven conversational follow-up.
 */
export default function HPISection({ onNext, onBack }) {
  const { data, setSection, setNested } = useIntake();
  const [activeTab, setActiveTab] = useState('structured'); // 'structured' | 'chat' | 'treatments'
  const hpi = data.hpiData;

  // Get selected symptom regions from chief complaint
  const selectedRegions = data.chiefComplaint.symptomRegions || [];
  const [activeRegion, setActiveRegion] = useState(selectedRegions[0] || '');

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">History of Present Illness</h2>
        <p className="section-subtitle">
          Now let's go into more detail about your symptoms. You can fill in structured questions,
          chat with our AI assistant for follow-up questions, and record your treatment history.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'structured', label: 'Symptom Details', icon: '📋' },
          { id: 'chat', label: 'AI Follow-up', icon: '💬' },
          { id: 'treatments', label: 'Prior Treatments', icon: '💊' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-navy-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'structured' && (
        <StructuredSymptoms
          selectedRegions={selectedRegions}
          activeRegion={activeRegion}
          setActiveRegion={setActiveRegion}
          hpiData={hpi}
          setNested={setNested}
        />
      )}

      {activeTab === 'chat' && (
        <HPIChat intakeData={data} hpiData={hpi} setSection={setSection} />
      )}

      {activeTab === 'treatments' && (
        <TreatmentHistory hpiData={hpi} setNested={setNested} />
      )}

      <StepNavigation
        onNext={onNext}
        onBack={onBack}
        canGoNext={true}
        nextLabel="Continue to Past Medical History"
        showSkip={true}
        skipLabel="Skip to next section"
      />
    </div>
  );
}


// ===========================================================================
// STRUCTURED SYMPTOM COLLECTION
// ===========================================================================
function StructuredSymptoms({ selectedRegions, activeRegion, setActiveRegion, hpiData, setNested }) {
  const regionData = hpiData.symptoms?.[activeRegion] || {};

  const updateSymptom = (field, value) => {
    setNested(`hpiData.symptoms.${activeRegion}.${field}`, value);
  };

  const regionInfo = SYMPTOM_REGIONS.find(r => r.id === activeRegion);
  const isCervical = regionInfo?.area === 'cervical';
  const isLumbar = regionInfo?.area === 'lumbar';
  const isDeformity = regionInfo?.area === 'deformity';

  if (selectedRegions.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No symptom regions selected. Please go back to select your symptom areas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Region selector tabs */}
      {selectedRegions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedRegions.map((regionId) => {
            const region = SYMPTOM_REGIONS.find(r => r.id === regionId);
            const hasData = hpiData.symptoms?.[regionId] && Object.keys(hpiData.symptoms[regionId]).length > 0;
            return (
              <button
                key={regionId}
                onClick={() => setActiveRegion(regionId)}
                className={`chip ${
                  activeRegion === regionId ? 'chip-selected' : 'chip-unselected'
                }`}
              >
                {hasData && <span className="w-2 h-2 rounded-full bg-teal-400 mr-1.5" />}
                {region?.label || regionId}
              </button>
            );
          })}
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-navy-600 mb-1">
          {regionInfo?.label || activeRegion}
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Tell us about this symptom in detail. Skip any questions that don't apply.
        </p>

        <div className="space-y-6">
          {/* Onset */}
          <div>
            <label className="form-label">When did this start?</label>
            <input
              type="text"
              value={regionData.onset || ''}
              onChange={(e) => updateSymptom('onset', e.target.value)}
              placeholder="e.g., About 6 months ago, After a fall in March 2024"
            />
          </div>

          {/* Onset type */}
          <div>
            <label className="form-label">How did it start?</label>
            <div className="flex flex-wrap gap-2">
              {['Gradually over time', 'Suddenly', 'After an injury', 'After surgery', "I'm not sure"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateSymptom('onsetType', opt)}
                  className={`chip ${regionData.onsetType === opt ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Progression */}
          <div>
            <label className="form-label">Over time, has this symptom been...</label>
            <div className="flex flex-wrap gap-2">
              {['Getting worse', 'Staying about the same', 'Getting better', 'Comes and goes'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateSymptom('progression', opt)}
                  className={`chip ${regionData.progression === opt ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Side */}
          <div>
            <label className="form-label">Which side?</label>
            <div className="flex flex-wrap gap-2">
              {['Right', 'Left', 'Both sides', 'Midline/center', 'Varies'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateSymptom('side', opt)}
                  className={`chip ${regionData.side === opt ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Radiation */}
          <div>
            <label className="form-label">Does the pain travel or spread to other areas?</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {['No', 'Yes'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateSymptom('radiation', opt === 'Yes')}
                  className={`chip ${regionData.radiation === (opt === 'Yes') ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {regionData.radiation && (
              <input
                type="text"
                value={regionData.radiationTo || ''}
                onChange={(e) => updateSymptom('radiationTo', e.target.value)}
                placeholder="Where does it travel to? e.g., Down my left leg to the foot"
              />
            )}
          </div>

          {/* Pain quality */}
          <div>
            <label className="form-label">How would you describe the pain? (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {PAIN_QUALITIES.map((q) => {
                const selected = (regionData.quality || []).includes(q);
                return (
                  <button
                    key={q}
                    onClick={() => {
                      const current = regionData.quality || [];
                      updateSymptom('quality', selected
                        ? current.filter(x => x !== q)
                        : [...current, q]
                      );
                    }}
                    className={`chip ${selected ? 'chip-selected' : 'chip-unselected'}`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="form-label">
              Pain severity (0 = no pain, 10 = worst imaginable): <strong className="text-teal-600">{regionData.severity ?? 5}</strong>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={regionData.severity ?? 5}
              onChange={(e) => updateSymptom('severity', parseInt(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 — No pain</span>
              <span>5 — Moderate</span>
              <span>10 — Worst possible</span>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="form-label">How often do you experience this?</label>
            <div className="flex flex-wrap gap-2">
              {['Constant (always there)', 'Most of the day', 'Intermittent (comes and goes)',
                'Only with certain activities', 'Mainly at night', 'Mainly in the morning',
                'Worse as the day goes on'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateSymptom('frequency', opt)}
                  className={`chip ${regionData.frequency === opt ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Aggravating factors */}
          <div>
            <label className="form-label">What makes it worse? (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {['Sitting', 'Standing', 'Walking', 'Bending forward', 'Bending backward',
                'Twisting', 'Lifting', 'Coughing/sneezing', 'Lying down', 'Getting up from a chair',
                'Driving', 'Exercise', 'Stairs'].map((opt) => {
                const selected = (regionData.aggravatingFactors || []).includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      const current = regionData.aggravatingFactors || [];
                      updateSymptom('aggravatingFactors', selected
                        ? current.filter(x => x !== opt)
                        : [...current, opt]
                      );
                    }}
                    className={`chip ${selected ? 'chip-selected' : 'chip-unselected'}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Relieving factors */}
          <div>
            <label className="form-label">What makes it better? (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {['Rest', 'Lying down', 'Sitting', 'Leaning forward', 'Walking', 'Ice', 'Heat',
                'Medication', 'Stretching', 'Position changes', 'Nothing helps'].map((opt) => {
                const selected = (regionData.relievingFactors || []).includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      const current = regionData.relievingFactors || [];
                      updateSymptom('relievingFactors', selected
                        ? current.filter(x => x !== opt)
                        : [...current, opt]
                      );
                    }}
                    className={`chip ${selected ? 'chip-selected' : 'chip-unselected'}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Associated neurologic symptoms */}
          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-base font-medium text-navy-600 mb-4">Associated Symptoms</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <YesNoQuestion
                label="Numbness?"
                sublabel="Loss of sensation or feeling"
                value={regionData.numbness}
                onChange={(v) => updateSymptom('numbness', v)}
              />
              <YesNoQuestion
                label="Tingling or pins-and-needles?"
                value={regionData.tingling}
                onChange={(v) => updateSymptom('tingling', v)}
              />
              <YesNoQuestion
                label="Weakness?"
                sublabel="Difficulty moving or muscle feels weak"
                value={regionData.weakness}
                onChange={(v) => updateSymptom('weakness', v)}
              />
              <YesNoQuestion
                label="Does it disrupt your sleep?"
                value={regionData.sleepDisruption}
                onChange={(v) => updateSymptom('sleepDisruption', v)}
              />
            </div>
          </div>

          {/* Cervical-specific questions */}
          {isCervical && (
            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-base font-medium text-navy-600 mb-4">
                Neck & Upper Body Specific
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <YesNoQuestion
                  label="Trouble with buttons, writing, or small objects?"
                  sublabel="Fine motor difficulty"
                  value={regionData.handDexterity}
                  onChange={(v) => updateSymptom('handDexterity', v)}
                />
                <YesNoQuestion
                  label="Dropping objects more than usual?"
                  value={regionData.droppingObjects}
                  onChange={(v) => updateSymptom('droppingObjects', v)}
                />
                <YesNoQuestion
                  label="Balance or coordination problems?"
                  value={regionData.gaitChanges}
                  onChange={(v) => updateSymptom('gaitChanges', v)}
                />
                <YesNoQuestion
                  label="Electric shock feeling with neck movement?"
                  sublabel="Sensation down your spine when bending neck"
                  value={regionData.lhermittes}
                  onChange={(v) => updateSymptom('lhermittes', v)}
                />
              </div>
            </div>
          )}

          {/* Lumbar-specific questions */}
          {isLumbar && (
            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-base font-medium text-navy-600 mb-4">
                Lower Body Specific
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <YesNoQuestion
                  label="Pain below the knee?"
                  value={regionData.painBelowKnee}
                  onChange={(v) => updateSymptom('painBelowKnee', v)}
                />
                <YesNoQuestion
                  label="Symptoms improve when you sit or lean forward?"
                  value={regionData.reliefLeaningForward}
                  onChange={(v) => updateSymptom('reliefLeaningForward', v)}
                />
                <YesNoQuestion
                  label="Difficulty with stairs or foot feels floppy?"
                  sublabel="Foot drop or leg weakness"
                  value={regionData.footDrop}
                  onChange={(v) => updateSymptom('footDrop', v)}
                />
                <YesNoQuestion
                  label="Changes in bowel or bladder control?"
                  sublabel="New incontinence or difficulty with urination"
                  value={regionData.bowelBladder}
                  onChange={(v) => updateSymptom('bowelBladder', v)}
                />
                <YesNoQuestion
                  label="Numbness in the groin or inner thigh area?"
                  value={regionData.saddleAnesthesia}
                  onChange={(v) => updateSymptom('saddleAnesthesia', v)}
                />
              </div>

              <div className="mt-4">
                <label className="form-label">How far can you walk before needing to stop?</label>
                <div className="flex flex-wrap gap-2">
                  {['Unlimited', 'More than 30 minutes', '15-30 minutes', '5-15 minutes',
                    'Less than 5 minutes', 'Less than 1 block', 'Need a wheelchair/scooter'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateSymptom('walkingTolerance', opt)}
                      className={`chip ${regionData.walkingTolerance === opt ? 'chip-selected' : 'chip-unselected'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Functional impact */}
          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-base font-medium text-navy-600 mb-4">Impact on Daily Life</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Impact on work</label>
                <select
                  value={regionData.workImpact || ''}
                  onChange={(e) => updateSymptom('workImpact', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="No impact">No impact</option>
                  <option value="Mild - can still work">Mild — can still work</option>
                  <option value="Moderate - work is difficult">Moderate — work is difficult</option>
                  <option value="Severe - missing work">Severe — missing work</option>
                  <option value="Unable to work">Unable to work</option>
                  <option value="Retired/Not working">Retired/Not working</option>
                </select>
              </div>
              <div>
                <label className="form-label">Impact on exercise/activities</label>
                <select
                  value={regionData.exerciseImpact || ''}
                  onChange={(e) => updateSymptom('exerciseImpact', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="No impact">No impact</option>
                  <option value="Mild limitation">Mild limitation</option>
                  <option value="Moderate limitation">Moderate limitation</option>
                  <option value="Severe limitation">Severe limitation</option>
                  <option value="Unable to exercise">Unable to exercise</option>
                </select>
              </div>
              <div>
                <label className="form-label">How long can you sit comfortably?</label>
                <select
                  value={regionData.sittingTolerance || ''}
                  onChange={(e) => updateSymptom('sittingTolerance', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="No limitation">No limitation</option>
                  <option value="More than 1 hour">More than 1 hour</option>
                  <option value="30-60 minutes">30-60 minutes</option>
                  <option value="15-30 minutes">15-30 minutes</option>
                  <option value="Less than 15 minutes">Less than 15 minutes</option>
                </select>
              </div>
              <div>
                <label className="form-label">How long can you stand comfortably?</label>
                <select
                  value={regionData.standingTolerance || ''}
                  onChange={(e) => updateSymptom('standingTolerance', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="No limitation">No limitation</option>
                  <option value="More than 30 minutes">More than 30 minutes</option>
                  <option value="15-30 minutes">15-30 minutes</option>
                  <option value="5-15 minutes">5-15 minutes</option>
                  <option value="Less than 5 minutes">Less than 5 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Most bothersome symptom type */}
          <div>
            <label className="form-label">For this area, what bothers you the most?</label>
            <div className="flex flex-wrap gap-2">
              {['Pain', 'Numbness', 'Weakness', 'Stiffness', 'Imbalance/unsteadiness', 'Fatigue/endurance'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateSymptom('mostBothersomeSymptom', opt)}
                  className={`chip ${regionData.mostBothersomeSymptom === opt ? 'chip-selected' : 'chip-unselected'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Completion hint */}
      <div className="card bg-blue-50 border-blue-200 mt-4">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> After filling in the structured details, switch to the{' '}
          <strong>AI Follow-up</strong> tab. Our assistant will ask targeted questions about
          anything that might be missing from your history.
        </p>
      </div>
    </div>
  );
}


// ===========================================================================
// AI CHAT FOR HPI FOLLOW-UP
// ===========================================================================
function HPIChat({ intakeData, hpiData, setSection }) {
  const [messages, setMessages] = useState(hpiData.conversationHistory || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(messages.length > 0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save messages to store
  useEffect(() => {
    if (messages.length > 0) {
      setSection('hpiData', { ...hpiData, conversationHistory: messages });
    }
  }, [messages]);

  const startChat = async () => {
    setChatStarted(true);
    setIsLoading(true);

    try {
      const context = buildHPIChatContext(intakeData);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Please begin the intake interview based on my information.' }],
          context,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages([{ role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages([{
        role: 'assistant',
        content: "I'm ready to help gather more details about your symptoms. Could you start by telling me more about when your symptoms first began and what happened?",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildHPIChatContext(intakeData);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I had trouble processing that. Could you please try again?",
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!chatStarted) {
    return (
      <div className="card text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-400 to-navy-500 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-navy-600 mb-2">AI Intake Assistant</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Our assistant will ask you follow-up questions about your symptoms to make sure we have
          a complete picture. It works like a conversation with a clinic intake coordinator.
        </p>
        <button onClick={startChat} className="btn-teal">
          Start Conversation
        </button>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Chat header */}
      <div className="bg-navy-600 text-white px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">Intake Assistant</p>
          <p className="text-xs text-white/60">Gathering your symptom history</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} chat-message-enter`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-navy-600 text-white rounded-br-md'
                : 'bg-white text-gray-700 border border-gray-100 rounded-bl-md shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-400 p-4 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your response..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="btn-primary px-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Answer in your own words. There are no wrong answers.
        </p>
      </div>
    </div>
  );
}


// ===========================================================================
// TREATMENT HISTORY
// ===========================================================================
function TreatmentHistory({ hpiData, setNested }) {
  const tx = hpiData.conservativeTreatments;

  const updateTx = (path, value) => {
    setNested(`hpiData.conservativeTreatments.${path}`, value);
  };

  const [newInjection, setNewInjection] = useState({ type: '', when: '', helped: '', count: '' });

  const addInjection = () => {
    if (newInjection.type) {
      const current = tx.injections || [];
      setNested('hpiData.conservativeTreatments.injections', [...current, { ...newInjection }]);
      setNewInjection({ type: '', when: '', helped: '', count: '' });
    }
  };

  const removeInjection = (index) => {
    const current = tx.injections || [];
    setNested('hpiData.conservativeTreatments.injections', current.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-lg font-semibold text-navy-600 mb-1">Conservative Treatment History</h3>
        <p className="text-sm text-gray-400 mb-6">
          What treatments have you already tried for your spine symptoms?
          This helps your surgeon understand what's been done so far.
        </p>

        <div className="space-y-6">
          {/* Physical Therapy */}
          <TreatmentToggle
            label="Physical therapy"
            tried={tx.physicalTherapy?.tried}
            onToggle={(v) => updateTx('physicalTherapy.tried', v)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">When / how long?</label>
                <input type="text" value={tx.physicalTherapy?.duration || ''}
                  onChange={(e) => updateTx('physicalTherapy.duration', e.target.value)}
                  placeholder="e.g., 3 months in 2024" />
              </div>
              <div>
                <label className="form-label text-sm">Did it help?</label>
                <select value={tx.physicalTherapy?.helped || ''}
                  onChange={(e) => updateTx('physicalTherapy.helped', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Helped a lot">Helped a lot</option>
                  <option value="Helped somewhat">Helped somewhat</option>
                  <option value="Helped temporarily">Helped temporarily</option>
                  <option value="Did not help">Did not help</option>
                  <option value="Made it worse">Made it worse</option>
                </select>
              </div>
            </div>
          </TreatmentToggle>

          {/* Home Exercise */}
          <TreatmentToggle
            label="Home exercise program"
            tried={tx.homeExercise?.tried}
            onToggle={(v) => updateTx('homeExercise.tried', v)}
          >
            <div className="mt-3">
              <label className="form-label text-sm">Details</label>
              <input type="text" value={tx.homeExercise?.details || ''}
                onChange={(e) => updateTx('homeExercise.details', e.target.value)}
                placeholder="e.g., Stretching, core exercises" />
            </div>
          </TreatmentToggle>

          {/* Chiropractic */}
          <TreatmentToggle
            label="Chiropractic care"
            tried={tx.chiropracticCare?.tried}
            onToggle={(v) => updateTx('chiropracticCare.tried', v)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">Duration</label>
                <input type="text" value={tx.chiropracticCare?.duration || ''}
                  onChange={(e) => updateTx('chiropracticCare.duration', e.target.value)}
                  placeholder="How long did you go?" />
              </div>
              <div>
                <label className="form-label text-sm">Did it help?</label>
                <select value={tx.chiropracticCare?.helped || ''}
                  onChange={(e) => updateTx('chiropracticCare.helped', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Helped a lot">Helped a lot</option>
                  <option value="Helped somewhat">Helped somewhat</option>
                  <option value="Helped temporarily">Helped temporarily</option>
                  <option value="Did not help">Did not help</option>
                </select>
              </div>
            </div>
          </TreatmentToggle>

          {/* Acupuncture */}
          <TreatmentToggle
            label="Acupuncture"
            tried={tx.acupuncture?.tried}
            onToggle={(v) => updateTx('acupuncture.tried', v)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">Duration</label>
                <input type="text" value={tx.acupuncture?.duration || ''}
                  onChange={(e) => updateTx('acupuncture.duration', e.target.value)}
                  placeholder="How long?" />
              </div>
              <div>
                <label className="form-label text-sm">Did it help?</label>
                <select value={tx.acupuncture?.helped || ''}
                  onChange={(e) => updateTx('acupuncture.helped', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Helped a lot">Helped a lot</option>
                  <option value="Helped somewhat">Helped somewhat</option>
                  <option value="Helped temporarily">Helped temporarily</option>
                  <option value="Did not help">Did not help</option>
                </select>
              </div>
            </div>
          </TreatmentToggle>

          {/* Braces */}
          <TreatmentToggle
            label="Back brace or cervical collar"
            tried={tx.braces?.tried}
            onToggle={(v) => updateTx('braces.tried', v)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-sm">Type</label>
                <input type="text" value={tx.braces?.type || ''}
                  onChange={(e) => updateTx('braces.type', e.target.value)}
                  placeholder="What kind?" />
              </div>
              <div>
                <label className="form-label text-sm">Did it help?</label>
                <select value={tx.braces?.helped || ''}
                  onChange={(e) => updateTx('braces.helped', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Helped a lot">Helped a lot</option>
                  <option value="Helped somewhat">Helped somewhat</option>
                  <option value="Did not help">Did not help</option>
                </select>
              </div>
            </div>
          </TreatmentToggle>

          {/* Injections */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-base font-medium text-navy-600 mb-3">Injections</h4>
            <p className="text-sm text-gray-400 mb-3">Have you had any spine injections?</p>

            {(tx.injections || []).map((inj, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-teal-50 rounded-lg text-sm">
                <span className="flex-1 text-teal-700">
                  {inj.type} {inj.when && `(${inj.when})`} — {inj.helped || 'unknown response'}
                  {inj.count && `, ${inj.count}x`}
                </span>
                <button onClick={() => removeInjection(i)} className="text-gray-400 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <select value={newInjection.type}
                onChange={(e) => setNewInjection(prev => ({ ...prev, type: e.target.value }))}>
                <option value="">Injection type...</option>
                {INJECTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input type="text" value={newInjection.when}
                onChange={(e) => setNewInjection(prev => ({ ...prev, when: e.target.value }))}
                placeholder="When? (e.g., June 2024)" />
              <select value={newInjection.helped}
                onChange={(e) => setNewInjection(prev => ({ ...prev, helped: e.target.value }))}>
                <option value="">Did it help?</option>
                <option value="Helped a lot">Helped a lot</option>
                <option value="Helped temporarily">Helped temporarily</option>
                <option value="Helped somewhat">Helped somewhat</option>
                <option value="Did not help">Did not help</option>
              </select>
              <input type="text" value={newInjection.count}
                onChange={(e) => setNewInjection(prev => ({ ...prev, count: e.target.value }))}
                placeholder="How many? (e.g., 3)" />
            </div>
            <button onClick={addInjection} disabled={!newInjection.type}
              className="btn-secondary text-sm mt-3">
              + Add Injection
            </button>
          </div>

          {/* Prior Imaging */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-base font-medium text-navy-600 mb-3">Prior Imaging</h4>
            <p className="text-sm text-gray-400 mb-3">What imaging studies have you had for your spine?</p>
            <div className="flex flex-wrap gap-2">
              {['X-rays', 'MRI', 'CT scan', 'Myelogram', 'Bone density scan (DEXA)', 'None'].map((img) => {
                const selected = (tx.priorImaging || []).includes(img);
                return (
                  <button
                    key={img}
                    onClick={() => {
                      const current = tx.priorImaging || [];
                      setNested('hpiData.conservativeTreatments.priorImaging',
                        selected ? current.filter(x => x !== img) : [...current, img]
                      );
                    }}
                    className={`chip ${selected ? 'chip-selected' : 'chip-unselected'}`}
                  >
                    {img}
                  </button>
                );
              })}
            </div>
          </div>

          {/* EMG */}
          <TreatmentToggle
            label="EMG or nerve conduction study"
            tried={tx.priorEMG?.done}
            onToggle={(v) => updateTx('priorEMG.done', v)}
          >
            <div className="mt-3">
              <label className="form-label text-sm">Results (if known)</label>
              <input type="text" value={tx.priorEMG?.results || ''}
                onChange={(e) => updateTx('priorEMG.results', e.target.value)}
                placeholder="What did it show? (if you know)" />
            </div>
          </TreatmentToggle>
        </div>
      </div>
    </div>
  );
}


// ===========================================================================
// HELPER COMPONENTS
// ===========================================================================
function YesNoQuestion({ label, sublabel, value, onChange }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mb-2">{sublabel}</p>}
      <div className="flex gap-2">
        {['Yes', 'No'].map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt === 'Yes')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              value === (opt === 'Yes')
                ? opt === 'Yes'
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TreatmentToggle({ label, tried, onToggle, children }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-gray-700">{label}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onToggle(true)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              tried === true
                ? 'bg-teal-100 text-teal-700 border border-teal-300'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => onToggle(false)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              tried === false
                ? 'bg-gray-100 text-gray-700 border border-gray-300'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            No
          </button>
        </div>
      </div>
      {tried && children}
    </div>
  );
}
