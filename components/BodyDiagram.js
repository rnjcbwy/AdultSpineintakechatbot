'use client';

import { useRef, useState } from 'react';
import { VIEW_BOX, FIGURE_SRC, LATERAL_DX, ZONES, SYMPTOM_TYPES, getType, zoneAt } from '../lib/bodyMap';

const W = VIEW_BOX.width;
const H = VIEW_BOX.height;

const SKIN = '#F3EFE9';
const OUTLINE = '#8C9BAA';

/**
 * Side profile. Both lateral views face the same way so a single zone set
 * serves both — the view name supplies which side of the body it is.
 * The arm hangs slightly forward on purpose: overlapping the trunk would make
 * a tap on the outer arm ambiguous with a tap on the chest wall.
 */
function LateralFigure({ view }) {
  const parts = (
    <>
      {/* head with a brow / nose profile so the facing direction is obvious */}
      <ellipse cx={124} cy={44} rx={25} ry={29} />
      <path d="M146,38 C154,42 156,48 150,52 C146,55 142,54 140,50 Z" />
      <rect x={112} y={64} width={26} height={46} rx={11} />

      {/* trunk: thoracic kyphosis, lumbar lordosis, buttock behind */}
      <path
        d="M110,112 C104,148 106,186 110,214
           C115,238 105,262 103,286
           C101,308 109,324 122,326
           L148,326 C159,320 162,300 158,280
           C154,250 152,220 152,192
           C152,160 154,132 149,114
           C140,104 119,104 110,112 Z"
      />

      {/* leg: lateral thigh, calf belly posteriorly, ankle, foot pointing forward */}
      <path
        d={`M106,318 C102,350 104,378 108,404
            L146,404 C148,376 150,348 148,318 Z`}
      />
      <ellipse cx={127} cy={414} rx={19} ry={16} />
      <path
        d={`M110,410 C100,440 100,474 110,500
            L114,524 L140,524 L142,498
            C146,472 146,440 144,410 Z`}
      />
      {/* foot: heel behind, dorsum sloping forward to the toes */}
      <path
        d={`M112,520 C102,530 98,542 102,550
            L172,550 C180,548 180,538 172,534
            C158,530 148,526 140,518 Z`}
      />
    </>
  );

  // Facing the patient's LEFT side, their nose points to the viewer's left, so
  // that figure is mirrored. Pointer input is mirrored to match (see toNorm),
  // which lets a single canonical zone set serve both lateral views.
  const mirror = view === 'left';

  // The arm is drawn ON TOP of the finished trunk rather than merged into it.
  // In a true lateral the arm overlaps the ribcage, and if it joins the same
  // silhouette the patient cannot see where the limb is at all.
  const arm = (
    <g fill={SKIN} stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round">
      <ellipse cx={146} cy={122} rx={21} ry={21} />
      <rect x={150} y={114} width={31} height={112} rx={15.5} />
      <rect x={155} y={216} width={27} height={102} rx={13.5} />
      <ellipse cx={170} cy={332} rx={14} ry={21} />
    </g>
  );

  // Drawn for a 260-wide box; LATERAL_DX centres that space in the wider one
  // the traced front and back views need. The zone boxes carry the same shift.
  return (
    <g>
      <g transform={mirror ? `translate(${W},0) scale(-1,1)` : undefined}>
       <g transform={`translate(${LATERAL_DX},0)`}>
        <g fill={OUTLINE} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round">{parts}</g>
        <g fill={SKIN} stroke="none">{parts}</g>
        <g stroke={OUTLINE} strokeWidth={1.3} fill="none" opacity={0.5}>
          {/* iliac crest and knee guide, to orient the patient */}
          <path d="M108,286 C120,282 136,284 150,290" />
          <circle cx={127} cy={414} r={9} />
        </g>
        {arm}
       </g>
      </g>
      <text x={mirror ? 14 : W - 14} y={26} textAnchor={mirror ? 'start' : 'end'}
        fontSize={13} fill="#8C9BAA">
        {mirror ? '◀ front' : 'front ▶'}
      </text>
    </g>
  );
}

/**
 * The figure for one view.
 *
 * Anterior and posterior are the supplied line drawing, traced to SVG and put
 * on this viewBox by scripts/normalize-figures.js. It is referenced rather
 * than inlined: the two paths are ~45KB each, and nothing here needs to
 * hit-test them — zoneAt() resolves a tap by coordinate, not by geometry.
 * The lateral views have no artwork and are still drawn in code.
 */
function Figure({ view }) {
  if (view === 'left' || view === 'right') return <LateralFigure view={view} />;
  return (
    <image
      href={FIGURE_SRC[view]}
      x={0}
      y={0}
      width={W}
      height={H}
      style={{ pointerEvents: 'none' }}
    />
  );
}

/**
 * Debug overlay: every zone box, drawn over the figure.
 *
 * Zone bounds used to be guessed, which is how a mark on the flank once came
 * back as "left elbow". They are now fitted to measurements of the traced
 * artwork — and this makes that fit checkable by eye instead of by trusting it.
 */
function ZoneOverlay({ view }) {
  const zones = ZONES[view] || [];
  return (
    <g style={{ pointerEvents: 'none' }}>
      {zones.map((z, i) => {
        const [x0, y0, x1, y1] = z.box;
        const hue = (i * 47) % 360;
        return (
          <g key={`${z.name}-${i}`}>
            <rect
              x={x0}
              y={y0}
              width={x1 - x0}
              height={y1 - y0}
              fill={`hsl(${hue} 80% 55% / 0.10)`}
              stroke={`hsl(${hue} 75% 42%)`}
              strokeWidth={0.7}
            />
            <text
              x={x0 + 1.5}
              y={y0 + 7}
              fontSize={5}
              fill={`hsl(${hue} 75% 32%)`}
            >
              {z.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Marker glyph. Shape AND colour differ so it survives a mono printout. */
export function MarkerGlyph({ type, x = 0, y = 0, scale = 1, types = SYMPTOM_TYPES }) {
  const t = getType(type, types);
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
    case 'triangle':
      return (
        <path
          d={`M${x},${y - s * 1.2} L${x + s * 1.1},${y + s * 0.85} L${x - s * 1.1},${y + s * 0.85} Z`}
          fill={t.color}
          {...stroke}
        />
      );
    case 'cross':
      return (
        <path
          d={`M${x - s * 1.2},${y - s * 0.42} h${s * 0.78} v-${s * 0.78} h${s * 0.84} v${s * 0.78}
              h${s * 0.78} v${s * 0.84} h-${s * 0.78} v${s * 0.78} h-${s * 0.84} v-${s * 0.78}
              h-${s * 0.78} Z`}
          fill={t.color}
          {...stroke}
        />
      );
    case 'hexagon':
      return (
        <path
          d={starPath(x, y, s * 1.15, s * 1.15, 3)}
          fill={t.color}
          {...stroke}
        />
      );
    case 'droplet':
      return (
        <path
          d={`M${x},${y - s * 1.3} C${x + s * 1.15},${y - s * 0.1} ${x + s * 0.85},${y + s * 1.15} ${x},${y + s * 1.15}
              C${x - s * 0.85},${y + s * 1.15} ${x - s * 1.15},${y - s * 0.1} ${x},${y - s * 1.3} Z`}
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
  showZones = false,
  types = SYMPTOM_TYPES,
}) {
  const svgRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const drawing = useRef(false);

  const marks = data?.marks || [];
  const paths = data?.paths || [];

  /**
   * Pointer position in normalized 0..1 viewBox coordinates.
   *
   * This goes through the SVG's own screen matrix rather than dividing by the
   * element's bounding box. The two are NOT equivalent: the figure is capped at
   * 70vh, so on most screens the element is wider than the drawing it contains,
   * and preserveAspectRatio centres the artwork inside it. Measuring against
   * the element box therefore lands every mark to the right of the actual tap —
   * the offset grows with the width of the empty margin. getScreenCTM knows
   * where the viewBox truly sits, so the mark lands under the cursor at any
   * size or aspect ratio.
   *
   * The left-lateral figure is drawn mirrored, so its input is mirrored back
   * before storage — marks and zone lookups then share one coordinate space.
   */
  const toNorm = (e) => {
    const svg = svgRef.current;
    const clamp = (v) => Math.min(1, Math.max(0, v));
    let nx;
    let ny;

    const ctm = svg.getScreenCTM?.();
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const local = pt.matrixTransform(ctm.inverse());
      nx = local.x / W;
      ny = local.y / H;
    } else {
      // Only reached if the SVG is not rendered (jsdom, print). Keeps the
      // handler total rather than throwing.
      const rect = svg.getBoundingClientRect();
      nx = (e.clientX - rect.left) / rect.width;
      ny = (e.clientY - rect.top) / rect.height;
    }

    const raw = clamp(nx);
    return { x: view === 'left' ? 1 - raw : raw, y: clamp(ny) };
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

  // Stored coordinates are canonical; the mirrored figure needs them flipped
  // back at draw time so glyphs land where the patient tapped.
  const sx = (x) => (view === 'left' ? 1 - x : x) * W;
  const px = (p) => ({ x: sx(p.x), y: p.y * H });
  const toPolyline = (pts) => pts.map((p) => `${sx(p.x).toFixed(1)},${(p.y * H).toFixed(1)}`).join(' ');

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
        {showZones && <ZoneOverlay view={view} />}

        {/* radiation traces */}
        {paths.map((p) => (
          <g key={p.id} onPointerDown={(e) => { if (mode === 'erase') { e.stopPropagation(); removePath(p.id); } }}>
            <polyline
              points={toPolyline(p.points)}
              fill="none"
              stroke={getType(p.type, types).color}
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
                  fill={getType(p.type, types).color}
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
            stroke={getType(activeType, types).color}
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
              <MarkerGlyph type={m.type} x={x} y={y} types={types} />
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
