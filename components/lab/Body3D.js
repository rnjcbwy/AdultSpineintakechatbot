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

/** Build the figure. Every mesh carries the metadata the resolver needs. */
function buildBody() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.85, metalness: 0.02 });

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

  add(new THREE.SphereGeometry(0.115, 24, 18), [0, 0.74, 0], 'head', { radius: 0.115 });
  add(new THREE.CylinderGeometry(0.052, 0.058, 0.1, 16), [0, 0.625, 0], 'neck', { radius: 0.055 });

  // Torso: wider than it is deep, like a real trunk.
  add(new THREE.CapsuleGeometry(0.175, 0.34, 8, 24), [0, 0.38, 0], 'torso',
    { scale: [1, 1, 0.6], radius: 0.175 });
  add(new THREE.CapsuleGeometry(0.16, 0.1, 8, 20), [0, 0.09, 0], 'pelvis',
    { scale: [1, 1, 0.68], radius: 0.16 });

  for (const side of ['right', 'left']) {
    const s = side === 'left' ? 1 : -1; // patient's left is +x
    add(new THREE.SphereGeometry(0.075, 18, 14), [s * 0.185, 0.55, 0], 'shoulder', { side, radius: 0.075 });
    add(new THREE.CapsuleGeometry(0.056, 0.2, 8, 16), [s * 0.225, 0.4, 0], 'upper arm',
      { side, rotZ: -s * 0.16, radius: 0.056 });
    add(new THREE.CapsuleGeometry(0.048, 0.2, 8, 16), [s * 0.275, 0.16, 0], 'forearm',
      { side, rotZ: -s * 0.1, radius: 0.048 });
    add(new THREE.CapsuleGeometry(0.042, 0.07, 6, 14), [s * 0.3, -0.01, 0], 'hand',
      { side, scale: [1, 1, 0.55], radius: 0.042 });

    add(new THREE.CapsuleGeometry(0.088, 0.24, 8, 18), [s * 0.095, -0.16, 0], 'thigh',
      { side, radius: 0.088 });
    add(new THREE.SphereGeometry(0.072, 16, 12), [s * 0.098, -0.34, 0], 'knee', { side, radius: 0.072 });
    add(new THREE.CapsuleGeometry(0.062, 0.26, 8, 16), [s * 0.1, -0.52, 0], 'lower leg',
      { side, radius: 0.062 });
    add(new THREE.CapsuleGeometry(0.045, 0.1, 6, 14), [s * 0.1, -0.76, 0.03], 'foot',
      { side, rotX: Math.PI / 2, scale: [1, 1, 0.7], radius: 0.045 });
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
