'use client';

// ============================================================================
// Diagram sandbox — working prototypes, NOT wired into the intake.
// Purpose: try each concept before committing to build it properly.
// ============================================================================

import { useState } from 'react';
import BodyDiagram from '../../components/BodyDiagram';
import FourView from '../../components/lab/FourView';
import { SYMPTOM_TYPES, EMPTY_PAIN_MAP } from '../../lib/bodyMap';
import { evaluatePainMap, SEVERITY_STYLE } from '../../lib/painMapTriggers';
import dynamic from 'next/dynamic';

// WebGL must not run during SSR.
const Body3D = dynamic(() => import('../../components/lab/Body3D'), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-400">Loading 3D model…</p>,
});

export default function DiagramLab() {
  return (
    <div className="min-h-screen bg-cream-100">
      <header className="bg-navy-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Diagram sandbox</h1>
          <p className="text-sm text-white/60">
            Working prototypes for the spine intake. Nothing here is wired into the real form yet.
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Demo n={1} title="Trigger engine" pitch="The highest-value item, and it needs no new drawing. Mark the body and watch what it sets off — red flags, form branching, surgeon-only pattern hints, and auto-filled answers.">
          <TriggerDemo />
        </Demo>

        <Demo n={'4V'} title="Four flat views — front, back, left, right" pitch="The recommended path. Front and back alone cannot show the lateral calf or lateral forearm, which is exactly where L5 and C6 run, so a patient tracing a real dermatomal stripe had nowhere to draw the middle of it. Two more flat figures close that gap with no WebGL, no download, and no rotating.">
          <FourView />
        </Demo>

        <Demo n={'3D'} title="Rotatable 3D body" pitch="Drag to spin, tap to mark — no mode toggle. The real argument for 3D is not novelty: it reaches the LATERAL surfaces where L5 and C6 actually live, which a front-and-back pair of 2D figures cannot show. Each tap resolves to anatomy from the hit point's local coordinates.">
          <Body3D />
        </Demo>

        <Demo n={2} title="Spine level selector" pitch="Patient taps where on the spine it hurts. The same component, clinician-side, sets the levels for the auth packet — eviCore explicitly requires CPT plus disc level(s). Also doubles as the injection-site map.">
          <SpineLevels />
        </Demo>

        <Demo n={3} title="Position pictograms" pitch="Flexion-relieved plus extension-worsened is the stenosis signature, and right now it's buried in a chip list. Pictograms are also language-independent — useful given the trilingual build.">
          <PositionGrid />
        </Demo>

        <Demo n={4} title="Walking tolerance ladder" pitch="Concrete landmarks beat abstract minutes. Feeds both the claudication questions and the functional-impairment criterion payers score.">
          <WalkingLadder />
        </Demo>

        <Demo n={5} title="Pain timeline" pitch="Drag to draw how it has changed. Captures progression and symptom duration — another payer criterion — far better than a dropdown.">
          <PainTimeline />
        </Demo>

        <Demo n={6} title="Dermatome overlay (surgeon-side only)" pitch="Read-out, not patient input. Toggle standard bands over the patient's drawing to see which pattern their marks actually match.">
          <DermatomeOverlay />
        </Demo>

        <Demo n={7} title="Sagittal posture picker" pitch="For deformity consults. A cheap proxy for sagittal balance that a patient can answer honestly in two seconds.">
          <PosturePicker />
        </Demo>
      </div>
    </div>
  );
}

function Demo({ n, title, pitch, children }) {
  return (
    <section className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="w-6 h-6 rounded-full bg-navy-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">{n}</span>
        <h2 className="text-lg font-semibold text-navy-600">{title}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4 ml-9">{pitch}</p>
      <div className="ml-0 sm:ml-9">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------- 1. Triggers
function TriggerDemo() {
  const [map, setMap] = useState(EMPTY_PAIN_MAP);
  const [type, setType] = useState('ache');
  // Zone bounds are fitted to measurements of the traced artwork, but a fit
  // still has to be looked at: guessing them is what once turned a mark on the
  // flank into "left elbow". The overlay plus the running list of resolved
  // labels below makes every box checkable without reading any code.
  const [showZones, setShowZones] = useState(false);
  const fired = evaluatePainMap(map);

  const resolved = ['anterior', 'posterior'].flatMap((v) =>
    (map[v]?.marks || []).map((m) => ({ view: v, zone: m.zone, id: m.id }))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SYMPTOM_TYPES.map((s) => (
            <button key={s.id} onClick={() => setType(s.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${type === s.id ? 'border-navy-600 bg-navy-50 text-navy-700' : 'border-gray-200 text-gray-600'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          {['anterior', 'posterior'].map((v) => (
            <BodyDiagram key={v} view={v} label={v === 'anterior' ? 'Front' : 'Back'}
              data={map[v]} activeType={type} mode="mark" showZones={showZones}
              onChange={(next) => setMap((m) => ({ ...m, [v]: next }))} />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <button onClick={() => setMap(EMPTY_PAIN_MAP)} className="text-xs text-gray-400 hover:text-red-500">Clear</button>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={showZones} onChange={(e) => setShowZones(e.target.checked)} />
            Show zone boxes
          </label>
        </div>
        {resolved.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-lg p-2.5 bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
              What each mark resolved to
            </p>
            <ul className="text-xs text-gray-700 space-y-0.5 max-h-32 overflow-y-auto">
              {resolved.map((r) => (
                <li key={r.id}>
                  <span className="text-gray-400">{r.view === 'anterior' ? 'front' : 'back'}</span>
                  {' \u2192 '}
                  <span className="font-medium">{r.zone}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What the drawing fired</p>
        {!fired.length && <p className="text-sm text-gray-400">Mark the body to see triggers. Try the low back, then the outer calf and big toe.</p>}
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {fired.map((f) => {
            const s = SEVERITY_STYLE[f.severity];
            return (
              <div key={f.id} className={`border rounded-lg p-3 ${s.cls}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{s.label}</span>
                </div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{f.because}</p>
                <p className="text-xs mt-1">→ {f.action}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ 2. Spine levels
const LEVELS = [
  ...Array.from({ length: 7 }, (_, i) => ({ id: `C${i + 1}`, group: 'Cervical' })),
  ...Array.from({ length: 12 }, (_, i) => ({ id: `T${i + 1}`, group: 'Thoracic' })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: `L${i + 1}`, group: 'Lumbar' })),
  { id: 'S1', group: 'Sacrum' },
];

function SpineLevels() {
  const [sel, setSel] = useState(new Set(['L4', 'L5']));
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Gentle S-curve: cervical lordosis, thoracic kyphosis, lumbar lordosis.
  const xAt = (i) => 60 + Math.sin((i / LEVELS.length) * Math.PI * 2.1) * 13;

  return (
    <div className="flex gap-6 items-start flex-wrap">
      <svg viewBox="0 0 120 520" className="w-[150px] h-auto bg-white border border-gray-200 rounded-xl">
        {LEVELS.map((lv, i) => {
          const y = 18 + i * 19.5;
          const on = sel.has(lv.id);
          const w = lv.id.startsWith('C') ? 26 : lv.id.startsWith('T') ? 32 : 38;
          return (
            <g key={lv.id} onClick={() => toggle(lv.id)} style={{ cursor: 'pointer' }}>
              <rect x={xAt(i) - w / 2} y={y} width={w} height={14} rx={4}
                fill={on ? '#2E86AB' : '#F3EFE9'} stroke={on ? '#1C5E7A' : '#8C9BAA'} strokeWidth={1.4} />
              <text x={xAt(i) + w / 2 + 6} y={y + 11} fontSize={9}
                fill={on ? '#0F2B46' : '#9CA3AF'} fontWeight={on ? 700 : 400}>{lv.id}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex-1 min-w-[220px]">
        <p className="text-sm text-gray-600 mb-2">
          Selected: <strong className="text-navy-600">{[...sel].join(', ') || 'none'}</strong>
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Patient-facing prompt would be “point to where it hurts”; clinician-facing it becomes the level
          list on the authorization packet, and the same widget records which level an injection was given at.
        </p>
        <div className="flex gap-2 flex-wrap">
          {['Cervical', 'Thoracic', 'Lumbar', 'Sacrum'].map((g) => (
            <button key={g}
              onClick={() => setSel((s) => { const n = new Set(s); LEVELS.filter((l) => l.group === g).forEach((l) => n.add(l.id)); return n; })}
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-teal-300">
              + {g}
            </button>
          ))}
          <button onClick={() => setSel(new Set())} className="px-2.5 py-1 text-xs text-gray-400 hover:text-red-500">Clear</button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- 3. Positions
const POSITIONS = [
  { id: 'sitting', label: 'Sitting', d: 'M18,34 h10 v-12 h-8 v-8 h-8 v20 z M14,34 v6' },
  { id: 'standing', label: 'Standing', d: 'M20,12 v20 M20,32 l-5,10 M20,32 l5,10 M13,20 h14' },
  { id: 'walking', label: 'Walking', d: 'M20,12 v16 M20,28 l-7,12 M20,28 l7,10 M12,20 l8,-3 8,5' },
  { id: 'bend-fwd', label: 'Bending forward', d: 'M12,14 q10,4 16,14 M28,28 v12 M12,14 l-2,8' },
  { id: 'bend-back', label: 'Bending backward', d: 'M28,14 q-10,4 -16,14 M12,28 v12 M28,14 l2,8' },
  { id: 'lying', label: 'Lying down', d: 'M8,30 h24 M10,30 v-6 M30,30 v-4' },
  { id: 'lifting', label: 'Lifting', d: 'M20,10 v14 M14,24 h12 M13,24 l-3,12 M27,24 l3,12 M12,16 h16' },
  { id: 'coughing', label: 'Coughing', d: 'M20,12 v18 M20,30 l-6,10 M20,30 l6,10 M26,16 l6,-4 M28,20 l6,-2' },
];
const STATES = [
  { id: 'worse', label: 'Worse', cls: 'border-red-400 bg-red-50 text-red-700' },
  { id: 'better', label: 'Better', cls: 'border-green-400 bg-green-50 text-green-700' },
];

function PositionGrid() {
  const [state, setState] = useState({ 'bend-fwd': 'better', 'standing': 'worse', 'walking': 'worse' });
  const cycle = (id) => setState((s) => {
    const cur = s[id];
    const next = cur === undefined ? 'worse' : cur === 'worse' ? 'better' : undefined;
    const n = { ...s };
    if (next === undefined) delete n[id]; else n[id] = next;
    return n;
  });

  const flexionRelieved = state['bend-fwd'] === 'better' || state['sitting'] === 'better';
  const extensionWorse = state['bend-back'] === 'worse' || state['standing'] === 'worse' || state['walking'] === 'worse';

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">Tap once for worse, twice for better, three times to clear.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {POSITIONS.map((p) => {
          const st = STATES.find((s) => s.id === state[p.id]);
          return (
            <button key={p.id} onClick={() => cycle(p.id)}
              className={`p-3 rounded-xl border text-center transition-all ${st ? st.cls : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
              <svg viewBox="0 0 40 46" className="w-10 h-11 mx-auto mb-1">
                <circle cx="20" cy="8" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d={p.d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-medium block leading-tight">{p.label}</span>
              {st && <span className="text-[10px] font-semibold uppercase opacity-70">{st.label}</span>}
            </button>
          );
        })}
      </div>
      {flexionRelieved && extensionWorse && (
        <p className="mt-3 text-sm bg-violet-50 border border-violet-300 text-violet-800 rounded-lg px-3 py-2">
          <strong>Surgeon-only hint:</strong> flexion-relieved and extension-worsened — the classic neurogenic
          claudication / stenosis pattern. Would auto-open the walking-distance and shopping-cart questions.
        </p>
      )}
    </div>
  );
}

// --------------------------------------------------------------- 4. Walking
const RUNGS = [
  { id: 'room', label: 'Across a room', note: 'severe' },
  { id: 'house', label: 'Around the house', note: 'severe' },
  { id: 'mailbox', label: 'To the mailbox', note: 'marked' },
  { id: 'block', label: 'One block', note: 'marked' },
  { id: 'store', label: 'Around a grocery store', note: 'moderate' },
  { id: 'mile', label: 'About a mile', note: 'mild' },
  { id: 'unlimited', label: 'No limit', note: 'none' },
];

function WalkingLadder() {
  const [i, setI] = useState(3);
  const cur = RUNGS[i];
  return (
    <div className="flex flex-col sm:flex-row gap-5 items-start">
      <div className="flex-1 w-full">
        <input type="range" min={0} max={RUNGS.length - 1} value={i}
          onChange={(e) => setI(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between mt-1">
          {RUNGS.map((r, n) => (
            <button key={r.id} onClick={() => setI(n)}
              className={`text-[10px] leading-tight w-12 text-center ${n === i ? 'text-navy-700 font-semibold' : 'text-gray-400'}`}>
              {r.label.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-navy-50 border border-navy-100">
          <p className="text-sm text-navy-700">
            “I can walk <strong>{cur.label.toLowerCase()}</strong> before I have to stop.”
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Maps to <code className="font-mono">walkingTolerance</code> and to functional impairment ={' '}
            <strong>{cur.note}</strong>, which is scored against payer criteria.
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- 5. Timeline
function PainTimeline() {
  const N = 12;
  const [pts, setPts] = useState([3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8]);
  const [drag, setDrag] = useState(false);
  const W = 420, H = 150, PAD = 26;

  const set = (e, el) => {
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    const idx = Math.round(((x - PAD) / (W - PAD * 2)) * (N - 1));
    const val = Math.round(10 - ((y - 10) / (H - 30)) * 10);
    if (idx < 0 || idx >= N) return;
    setPts((p) => p.map((v, i) => (i === idx ? Math.max(0, Math.min(10, val)) : v)));
  };

  const xOf = (i) => PAD + (i / (N - 1)) * (W - PAD * 2);
  const yOf = (v) => 10 + ((10 - v) / 10) * (H - 30);
  const trend = pts[N - 1] - pts[0];

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Drag across the chart to draw how your pain has changed over the past year.</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg bg-white border border-gray-200 rounded-xl"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => { setDrag(true); set(e, e.currentTarget); }}
        onPointerMove={(e) => drag && set(e, e.currentTarget)}
        onPointerUp={() => setDrag(false)} onPointerLeave={() => setDrag(false)}>
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD} y1={yOf(v)} x2={W - PAD} y2={yOf(v)} stroke="#E5E7EB" strokeWidth="1" />
            <text x={6} y={yOf(v) + 3} fontSize="9" fill="#9CA3AF">{v}</text>
          </g>
        ))}
        <polyline points={pts.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ')}
          fill="none" stroke="#2E86AB" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map((v, i) => <circle key={i} cx={xOf(i)} cy={yOf(v)} r="4" fill="#2E86AB" />)}
        <text x={PAD} y={H - 4} fontSize="9" fill="#9CA3AF">12 mo ago</text>
        <text x={W - PAD - 20} y={H - 4} fontSize="9" fill="#9CA3AF">now</text>
      </svg>
      <p className="mt-2 text-sm bg-violet-50 border border-violet-300 text-violet-800 rounded-lg px-3 py-2 max-w-lg">
        Reads as <strong>{trend > 1 ? 'progressive worsening' : trend < -1 ? 'improving' : 'stable / waxing and waning'}</strong>
        {' '}· current {pts[N - 1]}/10 · symptoms ≥ 12 months, which satisfies the duration criterion payers ask for.
      </p>
    </div>
  );
}

// ------------------------------------------------------- 6. Dermatome overlay
const BANDS = [
  { id: 'C6', color: '#F59E0B', d: 'M36,250 L60,250 L54,330 L28,330 Z' },
  { id: 'C8', color: '#8B5CF6', d: 'M60,250 L82,250 L76,330 L54,330 Z' },
  { id: 'L4', color: '#10B981', d: 'M108,420 L130,420 L130,530 L112,530 Z' },
  { id: 'L5', color: '#EF4444', d: 'M78,420 L108,420 L112,530 L86,530 Z' },
  { id: 'S1', color: '#3B82F6', d: 'M74,470 L86,470 L84,548 L72,548 Z' },
];

function DermatomeOverlay() {
  const [on, setOn] = useState(['L5']);
  const toggle = (id) => setOn((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <div className="flex gap-5 items-start flex-wrap">
      <svg viewBox="0 0 260 560" className="w-[190px] h-auto bg-white border border-gray-200 rounded-xl">
        <g fill="#F3EFE9" stroke="#8C9BAA" strokeWidth="2">
          <ellipse cx="130" cy="42" rx="25" ry="30" />
          <rect x="86" y="98" width="88" height="222" rx="20" />
          <rect x="88" y="300" width="36" height="230" rx="18" />
          <rect x="136" y="300" width="36" height="230" rx="18" />
          <rect x="40" y="110" width="30" height="220" rx="15" />
          <rect x="190" y="110" width="30" height="220" rx="15" />
        </g>
        {BANDS.filter((b) => on.includes(b.id)).map((b) => (
          <path key={b.id} d={b.d} fill={b.color} opacity="0.45" stroke={b.color} strokeWidth="1.5" />
        ))}
        {/* a patient's hypothetical marks, for comparison */}
        <circle cx="95" cy="470" r="6" fill="#DC2626" stroke="#fff" strokeWidth="1.5" />
        <circle cx="100" cy="505" r="6" fill="#DC2626" stroke="#fff" strokeWidth="1.5" />
      </svg>
      <div className="flex-1 min-w-[200px]">
        <p className="text-xs text-gray-500 mb-2">Toggle bands to see which the patient's marks (red) line up with.</p>
        <div className="flex flex-wrap gap-2">
          {BANDS.map((b) => (
            <button key={b.id} onClick={() => toggle(b.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${on.includes(b.id) ? 'text-white' : 'text-gray-600 bg-white border-gray-200'}`}
              style={on.includes(b.id) ? { background: b.color, borderColor: b.color } : {}}>
              {b.id}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Bands here are schematic placeholders. A real build would use a proper dermatome atlas.
        </p>
      </div>
    </div>
  );
}

// --------------------------------------------------------------- 7. Posture
const POSTURES = [
  { id: 'neutral', label: 'Standing straight', d: 'M30,10 q0,30 0,60 q0,20 0,30' },
  { id: 'flexed', label: 'Leaning forward', d: 'M30,10 q-10,30 -4,60 q4,20 4,30' },
  { id: 'shifted', label: 'Leaning to one side', d: 'M30,10 q14,30 4,60 q-6,20 -2,30' },
  { id: 'flatback', label: 'Stooped, knees bent', d: 'M30,10 q-14,26 -6,54 q10,18 6,36' },
];

function PosturePicker() {
  const [sel, setSel] = useState('flexed');
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">“Which one looks most like how you stand?”</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {POSTURES.map((p) => (
          <button key={p.id} onClick={() => setSel(p.id)}
            className={`p-3 rounded-xl border text-center ${sel === p.id ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <svg viewBox="0 0 60 110" className="w-14 h-24 mx-auto">
              <line x1="6" y1="104" x2="54" y2="104" stroke="#D1D5DB" strokeWidth="2" />
              <circle cx="30" cy="10" r="7" fill="#F3EFE9" stroke="#8C9BAA" strokeWidth="2" />
              <path d={p.d} fill="none" stroke="#8C9BAA" strokeWidth="7" strokeLinecap="round" />
            </svg>
            <span className={`text-xs font-medium ${sel === p.id ? 'text-teal-700' : 'text-gray-600'}`}>{p.label}</span>
          </button>
        ))}
      </div>
      {sel !== 'neutral' && (
        <p className="mt-3 text-sm bg-violet-50 border border-violet-300 text-violet-800 rounded-lg px-3 py-2">
          <strong>Surgeon-only hint:</strong> patient-reported sagittal/coronal malalignment — worth a standing
          long-cassette film. Not a measurement, just a prompt.
        </p>
      )}
    </div>
  );
}
