'use client';

// ============================================================================
// 3D body prototype.
//
// The body is built from NAMED primitives rather than loaded from an
// anatomical mesh, so a raycast hit resolves straight to a body part with no
// UV atlas or vertex-group lookup. Front / back / medial / lateral then come
// from the hit point's LOCAL coordinates on that part — which is the whole
// argument for 3D here: the lateral calf and lateral forearm, where L5 and C6
// actually live, are surfaces a front-and-back pair of 2D figures cannot show.
//
// Interaction: drag anywhere to rotate, tap to place a mark. No mode toggle —
// a drag and a tap are distinguished by distance travelled.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SYMPTOM_TYPES, getType } from '../../lib/bodyMap';

const SKIN = 0xe8ddd2;

/**
 * Sweep an elliptical cross-section along Y, varying its radii.
 *
 * This is the difference between a body and a mannequin: a capsule has ONE
 * radius, so shoulders, waist and hips all come out the same width. Defining
 * the section at intervals gives real taper — deltoid flare, waist, calf belly.
 * `sections` runs bottom to top: { y, rx, rz }.
 */
function sweep(sections, radial = 28) {
  const pos = [];
  const idx = [];
  const n = sections.length;

  for (const { y, rx, rz } of sections) {
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      pos.push(Math.cos(a) * rx, y, Math.sin(a) * rz);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Rounded-off ends so a swept limb does not read as a cut pipe. */
function tapered(len, profile) {
  const y0 = -len / 2;
  const capFrac = 0.05;           // proportion of length given to each rounded end
  const body = len * (1 - capFrac * 2);

  // Linear interpolation through the supplied radius profile.
  const rAt = (u) => {
    const i = Math.min(profile.length - 2, Math.floor(u * (profile.length - 1)));
    const f = u * (profile.length - 1) - i;
    return profile[i] * (1 - f) + profile[i + 1] * f;
  };
  // Quarter-circle falloff, so ends read as rounded rather than cut off.
  const cap = (t, r) => r * Math.sqrt(Math.max(0, 1 - t * t));

  const out = [];
  for (const t of [1, 0.82, 0.55]) {
    out.push({ y: y0 + (1 - t) * capFrac * len, r: cap(t, rAt(0)) });
  }
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    out.push({ y: y0 + capFrac * len + u * body, r: rAt(u) });
  }
  const y1 = y0 + len;
  for (const t of [0.55, 0.82, 1]) {
    out.push({ y: y1 - (1 - t) * capFrac * len, r: cap(t, rAt(1)) });
  }
  return out;
}

/** Build the figure. Every mesh carries the metadata the resolver needs. */
function buildBody() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.92, metalness: 0.0 });

  const add = (geo, [x, y, z], part, opts = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (opts.rotZ) m.rotation.z = opts.rotZ;
    if (opts.rotX) m.rotation.x = opts.rotX;
    if (opts.scale) m.scale.set(...opts.scale);
    m.userData = { part, side: opts.side || null, radius: opts.radius || 0.1 };
    group.add(m);
    return m;
  };

  /** Limb from a radius profile, flattened front-to-back by `depth`. */
  const limb = (len, profile, depth = 0.92) =>
    sweep(tapered(len, profile).map(({ y, r }) => ({ y, rx: r, rz: r * depth })), 22);

  // ---- head, jaw, neck -------------------------------------------------
  const head = new THREE.SphereGeometry(0.108, 28, 22);
  head.scale(0.92, 1.12, 1);
  add(head, [0, 0.75, 0.005], 'head', { radius: 0.11 });
  add(limb(0.165, [0.053, 0.057, 0.063]), [0, 0.640, -0.005], 'neck', { radius: 0.058 });

  // ---- torso: deltoid flare -> waist -> hips ----------------------------
  add(sweep([
    { y: 0.09, rx: 0.150, rz: 0.098 },
    { y: 0.16, rx: 0.143, rz: 0.094 },
    { y: 0.24, rx: 0.139, rz: 0.092 },  // waist
    { y: 0.32, rx: 0.152, rz: 0.099 },
    { y: 0.40, rx: 0.170, rz: 0.107 },
    { y: 0.48, rx: 0.186, rz: 0.112 },  // chest
    { y: 0.545, rx: 0.192, rz: 0.108 },
    { y: 0.585, rx: 0.170, rz: 0.096 },
    { y: 0.605, rx: 0.120, rz: 0.078 },
  ]), [0, 0, 0], 'torso', { radius: 0.17 });

  add(sweep([
    { y: -0.055, rx: 0.128, rz: 0.092 },
    { y: 0.00, rx: 0.152, rz: 0.104 },
    { y: 0.05, rx: 0.158, rz: 0.106 },
    { y: 0.095, rx: 0.150, rz: 0.098 },
  ]), [0, 0, 0], 'pelvis', { radius: 0.155 });

  for (const side of ['right', 'left']) {
    const s = side === 'left' ? 1 : -1; // patient's left is +x

    add(new THREE.SphereGeometry(0.072, 20, 16), [s * 0.176, 0.535, 0], 'shoulder', { side, radius: 0.072 });

    // deltoid bulge at the top, tapering into the elbow
    add(limb(0.310, [0.044, 0.050, 0.057, 0.060, 0.056, 0.050, 0.044]),
      [s * 0.212, 0.398, 0], 'upper arm', { side, rotZ: -s * 0.13, radius: 0.058 });
    // forearm: full near the elbow, narrow at the wrist
    add(limb(0.290, [0.032, 0.038, 0.045, 0.047, 0.044, 0.040]),
      [s * 0.258, 0.170, 0], 'forearm', { side, rotZ: -s * 0.08, radius: 0.047 });
    add(limb(0.150, [0.032, 0.041, 0.044, 0.038], 0.42),
      [s * 0.282, 0.018, 0], 'hand', { side, radius: 0.042 });

    // thigh thickest proximally
    add(limb(0.365, [0.066, 0.078, 0.088, 0.092, 0.088, 0.078]),
      [s * 0.092, -0.135, 0], 'thigh', { side, rotZ: -s * 0.02, radius: 0.09 });
    add(new THREE.SphereGeometry(0.068, 18, 14), [s * 0.098, -0.325, 0.006], 'knee', { side, radius: 0.068 });
    // calf belly high, narrow ankle
    add(limb(0.385, [0.038, 0.046, 0.058, 0.066, 0.060, 0.048]),
      [s * 0.100, -0.487, 0], 'lower leg', { side, radius: 0.066 });

    const foot = limb(0.20, [0.030, 0.044, 0.048, 0.040, 0.028], 0.62);
    add(foot, [s * 0.100, -0.695, 0.045], 'foot',
      { side, rotX: Math.PI / 2.05, scale: [1, 1, 0.75], radius: 0.046 });
  }

  return group;
}

/**
 * Turn a hit into clinical language.
 * localPoint is in the hit mesh's own space: +z front, -z back, x outward.
 */
function resolveZone(mesh, localPoint, worldPoint) {
  const { part, side } = mesh.userData;
  const front = localPoint.z >= 0;

  // Which aspect of a limb was struck: front, back, or the sides.
  const aspect = () => {
    const lateralness = Math.abs(localPoint.x) / (mesh.userData.radius || 0.1);
    if (lateralness > 0.55) {
      // patient's left limb: +x is lateral; right limb: -x is lateral
      const outward = side === 'left' ? localPoint.x > 0 : localPoint.x < 0;
      return outward ? 'lateral' : 'medial';
    }
    return front ? 'anterior' : 'posterior';
  };

  switch (part) {
    case 'head': return front ? 'face / head' : 'back of head';
    case 'neck': return front ? 'front of neck' : 'cervical spine';
    case 'torso': {
      const y = worldPoint.y;
      if (front) return y > 0.42 ? 'chest' : 'abdomen';
      return y > 0.42 ? 'thoracic spine' : 'lumbar spine';
    }
    case 'pelvis':
      return front ? 'groin' : (Math.abs(localPoint.x) < 0.05 ? 'sacrum / tailbone' : `${side || ''} buttock`.trim());
    case 'shoulder': return `${side} shoulder`;
    case 'hand': return `${side} hand`;
    case 'knee': return `${side} ${front ? 'knee' : 'back of knee'}`;
    case 'foot': return `${side} foot`;
    case 'lower leg': {
      const a = aspect();
      if (a === 'posterior') return `${side} calf`;
      if (a === 'anterior') return `${side} shin`;
      return `${side} ${a} lower leg`;
    }
    case 'thigh': {
      const a = aspect();
      if (a === 'posterior') return `${side} back of thigh`;
      return `${side} ${a} thigh`;
    }
    default: {
      const a = aspect();
      return `${side ? side + ' ' : ''}${a} ${part}`;
    }
  }
}

export default function Body3D({ onMarksChange }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [marks, setMarks] = useState([]);
  const [type, setType] = useState('ache');
  const typeRef = useRef(type);
  typeRef.current = type;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.18, 3.0);
    camera.lookAt(0, 0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8e0, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(1.5, 2, 2.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-2, 1, -2);
    scene.add(rim);

    const body = buildBody();
    scene.add(body);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let frame;
    const loop = () => { renderer.render(scene, camera); frame = requestAnimationFrame(loop); };
    loop();

    Object.assign(stateRef.current, { scene, camera, renderer, body, raycaster, pointer, mount });

    // ---- pointer: drag rotates, tap marks ----
    let dragging = false, moved = 0, lastX = 0, lastY = 0;
    const onDown = (e) => {
      dragging = true; moved = 0;
      lastX = e.clientX; lastY = e.clientY;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX; lastY = e.clientY;
      body.rotation.y += dx * 0.01;
      body.rotation.x = Math.max(-0.6, Math.min(0.6, body.rotation.x + dy * 0.006));
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      if (moved > 6) return; // it was a rotate, not a tap

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(body.children, false);
      if (!hits.length) return;

      const hit = hits[0];
      const local = hit.object.worldToLocal(hit.point.clone());
      const zone = resolveZone(hit.object, local, hit.point);

      // Marker is parented to the part it landed on, so it travels with the
      // body when the patient keeps rotating.
      const t = getType(typeRef.current);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 14, 10),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(t.color), roughness: 0.5 })
      );
      dot.position.copy(local).multiplyScalar(1.06);
      hit.object.add(dot);

      setMarks((m) => {
        const next = [...m, { id: `${Date.now()}`, zone, type: typeRef.current }];
        onMarksChange?.(next);
        return next;
      });
    };

    const el = renderer.domElement;
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', () => { dragging = false; });

    const onResize = () => {
      const w = mount.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = (rad) => { if (stateRef.current.body) stateRef.current.body.rotation.y += rad; };
  const clear = () => {
    const b = stateRef.current.body;
    if (b) b.children.forEach((m) => [...m.children].forEach((c) => m.remove(c)));
    setMarks([]); onMarksChange?.([]);
  };

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

      <div ref={mountRef} className="w-full rounded-xl overflow-hidden border border-gray-200 bg-white" />

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <button onClick={() => spin(-Math.PI / 2)} className="btn-secondary text-xs py-1.5 px-3">⟲ Turn left</button>
        <button onClick={() => spin(Math.PI)} className="btn-secondary text-xs py-1.5 px-3">Show back</button>
        <button onClick={() => spin(Math.PI / 2)} className="btn-secondary text-xs py-1.5 px-3">Turn right ⟳</button>
        <span className="text-xs text-gray-400 ml-1">Drag to spin · tap to mark</span>
        {marks.length > 0 && (
          <button onClick={clear} className="text-xs text-gray-400 hover:text-red-500 ml-auto">Clear</button>
        )}
      </div>

      {marks.length > 0 && (
        <ul className="mt-3 space-y-1">
          {marks.map((m) => (
            <li key={m.id} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: getType(m.type).color }} />
              {getType(m.type).label} — <strong className="text-navy-600">{m.zone}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
