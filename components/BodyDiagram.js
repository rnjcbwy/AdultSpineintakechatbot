'use client';

import { useRef, useState } from 'react';
import { VIEW_BOX, getType, zoneAt } from '../lib/bodyMap';

const W = VIEW_BOX.width;
const H = VIEW_BOX.height;

const SKIN = '#F3EFE9';
const OUTLINE = '#8C9BAA';

/**
 * Human figure built from simple primitives rather than one hand-tuned path.
 * A clean, diagrammatic silhouette reads better on a clinical form than an
 * attempted realistic outline, and stays predictable at any size.
 */
function Figure({ view }) {
  /**
   * One arm, drawn vertically then rotated about the shoulder so it hangs
   * abducted. Abduction matters: it separates the limb from the trunk and
   * gives the patient room to draw a stripe down the medial or lateral
   * surface, which is what distinguishes C6 from C8 (or L4 from L5).
   * Fingers are individually drawn so a patient can shade just the thumb
   * side or just the little-finger side.
   */
  const arm = (key, pivotX, dir) => {
    const cx = pivotX;
    // Finger x-offsets from the palm centre; the middle finger is longest.
    const fingers = [
      { dx: -15, len: 40 },
      { dx: -7, len: 46 },
      { dx: 1, len: 43 },
      { dx: 9, len: 36 },
    ];
    return (
      <g key={key} transform={`rotate(${15 * dir}, ${pivotX}, 116)`}>
        <ellipse cx={cx} cy={116} rx={22} ry={22} />
        <rect x={cx - 16} y={104} width={32} height={118} rx={16} />
        <rect x={cx - 14} y={214} width={28} height={104} rx={14} />
        {/* palm */}
        <rect x={cx - 16} y={310} width={32} height={40} rx={12} />
        {/* fingers */}
        {fingers.map((f, i) => (
          <rect key={i} x={cx + f.dx * dir - 3.5} y={344} width={7} height={f.len} rx={3.5} />
        ))}
        {/* thumb, laterally placed as in anatomical position */}
        <rect
          x={cx - 20 * dir - 4.5}
          y={316}
          width={9}
          height={30}
          rx={4.5}
          transform={`rotate(${28 * dir}, ${cx - 20 * dir}, 320)`}
        />
      </g>
    );
  };

  /**
   * One leg. `dir` is +1 for the viewer-right leg, -1 for viewer-left, and
   * places the great toe on the MEDIAL side (toward the midline) in the
   * anterior view. The posterior view shows a heel instead of toes.
   */
  const leg = (key, cx, dir) => (
    <g key={key}>
      <rect x={cx - 18} y={296} width={36} height={120} rx={18} />
      <ellipse cx={cx} cy={418} rx={19} ry={17} />
      <rect x={cx - 16} y={410} width={32} height={116} rx={16} />
      {view === 'anterior' ? (
        <>
          {/* dorsum of the foot, seen from above */}
          <ellipse cx={cx} cy={532} rx={18} ry={16} />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              cx={cx + dir * (11 - i * 5.5)}
              cy={546 - Math.abs(i - 0.4) * 1.6}
              r={i === 0 ? 5.2 : 3.6 - i * 0.25}
            />
          ))}
        </>
      ) : (
        <ellipse cx={cx} cy={536} rx={17} ry={19} />
      )}
    </g>
  );

  // Geometry is declared once and painted twice: a dilated stroke pass builds
  // a single merged outline, then a fill pass covers the interior seams.
  const parts = (
    <>
      <ellipse cx={130} cy={42} rx={25} ry={30} />
      <rect x={118} y={62} width={24} height={46} rx={11} />
      <path
        d="M86,118 C86,106 96,100 108,98 L152,98 C164,100 174,106 174,118
           L168,208 L162,258 L170,306 C171,314 164,320 154,320
           L106,320 C96,320 89,314 90,306 L98,258 L92,208 Z"
      />
      {arm('l', 88, 1)}
      {arm('r', 172, -1)}
      {leg('l', 106, 1)}
      {leg('r', 154, -1)}
    </>
  );

  return (
    <g>
      <g fill={OUTLINE} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round">{parts}</g>
      <g fill={SKIN} stroke="none">{parts}</g>

      {/* View-specific detail so the two figures are never confused, plus
          light midline/joint guides that help a patient place a dermatomal
          stripe on the correct surface. */}
      {view === 'posterior' ? (
        <g stroke={OUTLINE} strokeWidth={1.3} fill="none" opacity={0.7}>
          <line x1={130} y1={104} x2={130} y2={300} strokeDasharray="5 4" />
          <path d="M110,126 C102,142 102,162 110,178" />
          <path d="M150,126 C158,142 158,162 150,178" />
          <line x1={130} y1={304} x2={130} y2={334} />
          {/* popliteal creases */}
          <path d="M93,414 C100,419 112,419 119,414" />
          <path d="M141,414 C148,419 160,419 167,414" />
        </g>
      ) : (
        <g stroke={OUTLINE} strokeWidth={1.3} fill="none" opacity={0.55}>
          <path d="M108,110 C118,105 126,105 130,108" />
          <path d="M152,110 C142,105 134,105 130,108" />
          <circle cx={130} cy={244} r={2.4} fill={OUTLINE} stroke="none" />
          {/* patellae */}
          <circle cx={106} cy={418} r={9} />
          <circle cx={154} cy={418} r={9} />
        </g>
      )}
    </g>
  );
}

/** Marker glyph. Shape AND colour differ so it survives a mono printout. */
export function MarkerGlyph({ type, x = 0, y = 0, scale = 1 }) {
  const t = getType(type);
  const s = 6.5 * scale;
  const stroke = { stroke: '#FFFFFF', strokeWidth: 1.4 };
  switch (t.shape) {
    case 'square':
      return <rect x={x - s} y={y - s} width={s * 2} height={s * 2} rx={1.5} fill={t.color} {...stroke} />;
    case 'diamond':
      return <path d={`M${x},${y - s * 1.2} L${x + s * 1.1},${y} L${x},${y + s * 1.2} L${x - s * 1.1},${y} Z`} fill={t.color} {...stroke} />;
    case 'ring':
      return <circle cx={x} cy={y} r={s} fill="#FFFFFF" stroke={t.color} strokeWidth={3.2} />;
    case 'dots':
      return (
        <g fill={t.color}>
          <circle cx={x} cy={y} r={s} fill="#FFFFFF" stroke={t.color} strokeWidth={1.4} />
          {[[-3, -3], [3, -3], [-3, 3], [3, 3], [0, 0]].map(([dx, dy], i) => (
            <circle key={i} cx={x + dx * scale} cy={y + dy * scale} r={1.3 * scale} />
          ))}
        </g>
      );
    case 'star':
      return (
        <path
          d={starPath(x, y, s * 1.35, s * 0.5, 4)}
          fill={t.color}
          {...stroke}
        />
      );
    default:
      return <circle cx={x} cy={y} r={s} fill={t.color} {...stroke} />;
  }
}

function starPath(cx, cy, outer, inner, points) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)} `;
  }
  return `${d}Z`;
}

/**
 * Interactive body view.
 *
 * mode 'mark'      tap to drop a symptom marker
 * mode 'radiate'   drag to trace where the symptom travels
 * mode 'erase'     tap a marker or path to remove it
 */
export default function BodyDiagram({
  view,
  data,
  activeType,
  mode,
  onChange,
  label,
}) {
  const svgRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const drawing = useRef(false);

  const marks = data?.marks || [];
  const paths = data?.paths || [];

  /** Pointer position in normalized 0..1 viewBox coordinates. */
  const toNorm = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const commit = (next) => onChange({ marks, paths, ...next });

  const handleDown = (e) => {
    if (mode === 'erase') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toNorm(e);
    if (mode === 'radiate') {
      drawing.current = true;
      setDraft([p]);
    } else {
      commit({
        marks: [...marks, { id: rid(), x: p.x, y: p.y, type: activeType, zone: zoneAt(p.x, p.y, view) }],
      });
    }
  };

  const handleMove = (e) => {
    if (!drawing.current) return;
    const p = toNorm(e);
    setDraft((d) => {
      if (!d) return [p];
      const last = d[d.length - 1];
      // Thin the samples so stored paths stay small.
      if (Math.hypot(p.x - last.x, p.y - last.y) < 0.012) return d;
      return [...d, p];
    });
  };

  const handleUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const pts = draft || [];
    setDraft(null);
    if (pts.length < 2) return; // a tap, not a trace
    const from = pts[0];
    const to = pts[pts.length - 1];
    commit({
      paths: [...paths, {
        id: rid(),
        type: activeType,
        points: pts,
        fromZone: zoneAt(from.x, from.y, view),
        toZone: zoneAt(to.x, to.y, view),
      }],
    });
  };

  const removeMark = (id) => commit({ marks: marks.filter((m) => m.id !== id) });
  const removePath = (id) => commit({ paths: paths.filter((p) => p.id !== id) });

  const px = (p) => ({ x: p.x * W, y: p.y * H });
  const toPolyline = (pts) => pts.map((p) => `${(p.x * W).toFixed(1)},${(p.y * H).toFixed(1)}`).join(' ');

  return (
    <div className="flex-1 min-w-0">
      <p className="text-center text-sm font-medium text-navy-600 mb-1">{label}</p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full h-auto select-none rounded-xl bg-white border border-gray-200 ${
          mode === 'erase' ? 'cursor-pointer' : 'cursor-crosshair'
        }`}
        style={{ touchAction: 'none', maxHeight: '70vh' }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={handleUp}
      >
        <Figure view={view} />

        {/* radiation traces */}
        {paths.map((p) => (
          <g key={p.id} onPointerDown={(e) => { if (mode === 'erase') { e.stopPropagation(); removePath(p.id); } }}>
            <polyline
              points={toPolyline(p.points)}
              fill="none"
              stroke={getType(p.type).color}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
            {/* arrowhead at the destination */}
            {p.points.length > 1 && (() => {
              const a = px(p.points[p.points.length - 2]);
              const b = px(p.points[p.points.length - 1]);
              const ang = Math.atan2(b.y - a.y, b.x - a.x);
              const L = 11;
              return (
                <path
                  d={`M${b.x},${b.y} L${b.x - L * Math.cos(ang - 0.42)},${b.y - L * Math.sin(ang - 0.42)}
                      L${b.x - L * Math.cos(ang + 0.42)},${b.y - L * Math.sin(ang + 0.42)} Z`}
                  fill={getType(p.type).color}
                />
              );
            })()}
          </g>
        ))}

        {/* live trace */}
        {draft && draft.length > 1 && (
          <polyline
            points={toPolyline(draft)}
            fill="none"
            stroke={getType(activeType).color}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.55}
          />
        )}

        {/* markers */}
        {marks.map((m) => {
          const { x, y } = px(m);
          return (
            <g
              key={m.id}
              onPointerDown={(e) => { if (mode === 'erase') { e.stopPropagation(); removeMark(m.id); } }}
              style={{ cursor: mode === 'erase' ? 'pointer' : 'inherit' }}
            >
              <MarkerGlyph type={m.type} x={x} y={y} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function rid() {
  return `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
