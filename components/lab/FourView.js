'use client';

import { useState } from 'react';
import BodyDiagram from '../BodyDiagram';
import { SYMPTOM_TYPES, EMPTY_PAIN_MAP, VIEWS, VIEW_LABELS, summarizePainMap, countMarks } from '../../lib/bodyMap';
import { evaluatePainMap, SEVERITY_STYLE } from '../../lib/painMapTriggers';

/**
 * Four flat views instead of two. Front and back cannot show the lateral
 * calf or lateral forearm — the surfaces L5 and C6 actually run down — so a
 * patient tracing a true dermatomal stripe had nowhere to draw the middle of
 * it. Adding left and right closes that gap without WebGL.
 */
export default function FourView() {
  const [map, setMap] = useState(EMPTY_PAIN_MAP);
  const [type, setType] = useState('ache');
  const [mode, setMode] = useState('mark');
  const [view, setView] = useState('anterior');
  const [showAll, setShowAll] = useState(false);

  const fired = evaluatePainMap(map);
  const total = countMarks(map);
  const shown = showAll ? VIEWS : [view];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SYMPTOM_TYPES.map((s) => (
          <button key={s.id} onClick={() => setType(s.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${type === s.id ? 'border-navy-600 bg-navy-50 text-navy-700' : 'border-gray-200 text-gray-600'}`}>
            <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {VIEWS.map((v) => (
            <button key={v} onClick={() => { setView(v); setShowAll(false); }}
              className={`px-3 py-1.5 text-xs font-medium ${!showAll && view === v ? 'bg-navy-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {VIEW_LABELS[v]}
              {countMarks({ [v]: map[v] }) > 0 && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-teal-400 align-middle" />
              )}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAll((s) => !s)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${showAll ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'}`}>
          {showAll ? 'Single view' : 'Show all four'}
        </button>

        <div className="flex gap-1.5 ml-auto">
          {[['mark', 'Mark'], ['radiate', 'Draw radiation'], ['erase', 'Erase']].map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${mode === id
                ? id === 'erase' ? 'border-red-300 bg-red-50 text-red-700' : 'border-teal-400 bg-teal-50 text-teal-700'
                : 'border-gray-200 text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex gap-3 ${showAll ? 'flex-wrap justify-center' : 'justify-center'}`}>
        {shown.map((v) => (
          <div key={v} className={showAll ? 'w-[46%] sm:w-[23%] min-w-[130px]' : 'max-w-[300px] w-full'}>
            <BodyDiagram
              view={v}
              label={VIEW_LABELS[v]}
              data={map[v]}
              activeType={type}
              mode={mode}
              onChange={(next) => setMap((m) => ({ ...m, [v]: next }))}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <p className="text-sm text-gray-500">{total === 0 ? 'Nothing marked yet' : `${total} mark${total === 1 ? '' : 's'}`}</p>
        {total > 0 && (
          <button onClick={() => setMap(EMPTY_PAIN_MAP)} className="text-xs text-gray-400 hover:text-red-500">Clear all</button>
        )}
      </div>

      {total > 0 && (
        <div className="mt-3 rounded-lg bg-teal-50/60 border border-teal-100 px-3 py-2">
          <p className="text-xs font-semibold text-navy-600 mb-1">Reads back as</p>
          <p className="text-sm text-gray-700">{summarizePainMap(map)}</p>
        </div>
      )}

      {fired.length > 0 && (
        <div className="mt-3 space-y-2">
          {fired.map((f) => {
            const s = SEVERITY_STYLE[f.severity];
            return (
              <div key={f.id} className={`border rounded-lg p-2.5 ${s.cls}`}>
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{s.label}</span>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs mt-0.5">→ {f.action}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
