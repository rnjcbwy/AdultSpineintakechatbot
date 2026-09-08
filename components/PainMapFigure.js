'use client';

import { VIEW_BOX, VIEWS, VIEW_LABELS, allTypes, getType, countMarks, summarizePainMap } from '../lib/bodyMap';
import { MarkerGlyph } from './BodyDiagram';
import { useLang, makeT, COMMON } from '../lib/i18n';

const W = VIEW_BOX.width;
const H = VIEW_BOX.height;

const LOCAL = {
  'Body diagram': { es: 'Diagrama corporal', zh: '身体图示' },
  'Drawn by the patient': { es: 'Dibujado por el paciente', zh: '由患者绘制' },
  'In words': { es: 'En palabras', zh: '文字描述' },
  'No body diagram was completed.': {
    es: 'No se completó ningún diagrama corporal.',
    zh: '未完成身体图示。',
  },
};

/**
 * One view of the completed body map, read only.
 *
 * The figure itself is an <image> reference, the same file the interactive
 * diagram uses, so the printed and on-screen versions cannot drift apart.
 */
function StaticView({ view, data, types }) {
  const marks = data?.marks || [];
  const paths = data?.paths || [];
  if (!marks.length && !paths.length) return null;

  // The left lateral figure is drawn mirrored; stored marks are canonical, so
  // they are flipped back at draw time exactly as the interactive view does.
  const sx = (x) => (view === 'left' ? 1 - x : x) * W;

  return (
    <div className="flex-1 min-w-0">
      <p className="text-center text-xs font-medium text-gray-500 mb-1">
        {VIEW_LABELS[view] || view}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto rounded-lg bg-white border border-gray-200"
        role="img"
        aria-label={`${VIEW_LABELS[view] || view} body diagram`}
      >
        <StaticFigure view={view} />
        {paths.map((p) => (
          <polyline
            key={p.id}
            points={p.points.map((pt) => `${sx(pt.x).toFixed(1)},${(pt.y * H).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={getType(p.type, types).color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
        ))}
        {marks.map((m) => (
          <MarkerGlyph key={m.id} type={m.type} x={sx(m.x)} y={m.y * H} types={types} />
        ))}
      </svg>
    </div>
  );
}

/** Only the traced views have artwork; the laterals fall back to a plain box. */
function StaticFigure({ view }) {
  if (view === 'left' || view === 'right') {
    return <rect x={0} y={0} width={W} height={H} fill="#FAFAF8" />;
  }
  return (
    <image
      href={view === 'anterior' ? '/figures/figure-front.svg' : '/figures/figure-back.svg'}
      x={0}
      y={0}
      width={W}
      height={H}
    />
  );
}

/**
 * The patient's completed body map, for the note and the chart.
 *
 * The generated narrative describes the drawing in words, which is what an EMR
 * text field can hold — but words lose the shape of it. A stripe down the
 * lateral calf and a scatter of dots across the low back read very differently
 * on paper than "burning at the left lateral calf; aching at the lumbar
 * region", and the picture is the part a surgeon reads in two seconds.
 *
 * Only views the patient actually marked are rendered, so an untouched lateral
 * figure never pads out the note with an empty body.
 */
export default function PainMapSummary({ painMap, compact = false }) {
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const types = allTypes(painMap);
  const used = VIEWS.filter((v) => (painMap?.[v]?.marks || []).length || (painMap?.[v]?.paths || []).length);

  if (!countMarks(painMap)) {
    return compact ? null : (
      <p className="text-sm text-gray-400 italic">{t('No body diagram was completed.')}</p>
    );
  }

  // Legend covers only the markers actually used — a full key of every symptom
  // type would be mostly noise on a drawing that used two of them.
  const usedTypeIds = new Set();
  for (const v of used) {
    for (const m of painMap[v].marks || []) usedTypeIds.add(m.type);
    for (const p of painMap[v].paths || []) usedTypeIds.add(p.type);
  }
  const legend = types.filter((ty) => usedTypeIds.has(ty.id));

  return (
    <div>
      <div className="flex gap-3 items-start">
        {used.map((v) => (
          <StaticView key={v} view={v} data={painMap[v]} types={types} />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {legend.map((ty) => (
          <span key={ty.id} className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
              <MarkerGlyph type={ty.id} x={10} y={10} scale={0.8} types={types} />
            </svg>
            {ty.custom ? ty.label : t(ty.label)}
          </span>
        ))}
      </div>

      {!compact && (
        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold uppercase tracking-wide text-gray-400">{t('In words')}: </span>
          {summarizePainMap(painMap)}
        </p>
      )}
    </div>
  );
}
