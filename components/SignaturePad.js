'use client';

import { useEffect, useRef, useState } from 'react';

const INK = '#0E3F31';
const TEAL = '#7E756E';

const S = {
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.4rem' },
  label: { fontSize: '0.9rem', fontWeight: 600, color: INK },
  clear: { font: 'inherit', fontSize: '0.85rem', color: TEAL, background: 'none', border: `1px solid ${TEAL}`, borderRadius: 8, padding: '0.3rem 0.75rem', cursor: 'pointer' },
  box: { position: 'relative', width: '100%', background: '#fff', border: '1.5px dashed #A9A197', borderRadius: 10, overflow: 'hidden' },
  canvas: { width: '100%', height: '100%', touchAction: 'none', display: 'block', cursor: 'crosshair' },
  line: { position: 'absolute', left: '6%', right: '6%', bottom: '26%', borderBottom: '1px solid #D9D2C7', pointerEvents: 'none' },
};

/**
 * A signature drawn with a finger, stylus or mouse.
 *
 * Reports a PNG data URL through onChange as soon as a stroke ends, and null
 * when cleared. The bitmap is sized to the element at the device pixel ratio
 * so strokes stay crisp on a phone, and the drawing is restored from `value`
 * if the element is resized (rotating the phone, for instance).
 */
export default function SignaturePad({
  value,
  onChange,
  label = 'Sign here with your finger or mouse',
  clearLabel = 'Clear',
  height = 150,
}) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(!value);

  const context = () => {
    const c = canvasRef.current;
    if (!c) return null;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = INK;
    return ctx;
  };

  // Fit the bitmap to the element; redraw the saved signature after a resize.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return undefined;
    const fit = () => {
      const r = c.getBoundingClientRect();
      if (!r.width) return;
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(height * dpr);
      const ctx = context();
      if (value && ctx) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, r.width, height);
        img.src = value;
      }
    };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(c);
    return () => { if (ro) ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  const point = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const ctx = context();
    if (!ctx) return;
    if (canvasRef.current.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    // A tap leaves a dot, so a short signature still registers.
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = context();
    if (!ctx) return;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    e.preventDefault();
    setEmpty(false);
    try {
      if (onChange) onChange(canvasRef.current.toDataURL('image/png'));
    } catch {
      if (onChange) onChange(null);
    }
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = context();
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    if (onChange) onChange(null);
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={S.head}>
        <span style={S.label}>{label}</span>
        <button type="button" style={{ ...S.clear, opacity: empty ? 0.4 : 1, cursor: empty ? 'default' : 'pointer' }} onClick={clear} disabled={empty}>
          {clearLabel}
        </button>
      </div>
      <div style={{ ...S.box, height }}>
        <canvas
          ref={canvasRef}
          style={S.canvas}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
          aria-label={label}
        />
        <div style={S.line} aria-hidden="true" />
      </div>
    </div>
  );
}
