import { Point } from 'fabric';
import { on, emit, EVENTS } from '../helpers/events.js';

// Interactive zoom is bounded RELATIVE to the fitted "base" zoom
// (canvas._baseZoom, set when the editor fits the fixed canvas to the window),
// so zooming feels the same at any window size. MIN_ZOOM/MAX_ZOOM are loose
// absolute backstops (also imported by zoom-control.js).
export const MIN_ZOOM_FACTOR = 0.5;   // out to 50% of the fitted view
export const MAX_ZOOM_FACTOR = 4;     // in to 4× the fitted view
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;

function clampZoom(canvas, zoom) {
  const base = canvas._baseZoom || 1;
  const lo = Math.max(MIN_ZOOM, base * MIN_ZOOM_FACTOR);
  const hi = Math.min(MAX_ZOOM, base * MAX_ZOOM_FACTOR);
  return Math.min(hi, Math.max(lo, zoom));
}

export function initPanZoom(canvas) {
  let panning = false;
  let lastX = 0;
  let lastY = 0;
  let prevCursor = 'default';

  canvas.on('mouse:down', (opt) => {
    if (opt.e.button !== 1) return;
    opt.e.preventDefault();
    panning = true;
    lastX = opt.e.clientX;
    lastY = opt.e.clientY;
    prevCursor = canvas.defaultCursor;
    canvas.defaultCursor = 'grabbing';
  });

  canvas.on('mouse:move', (opt) => {
    if (!panning) return;
    const dx = opt.e.clientX - lastX;
    const dy = opt.e.clientY - lastY;
    lastX = opt.e.clientX;
    lastY = opt.e.clientY;
    canvas.relativePan(new Point(dx, dy));
  });

  canvas.on('mouse:up', (opt) => {
    if (opt.e.button !== 1) return;
    panning = false;
    canvas.defaultCursor = prevCursor;
  });

  canvas.on('mouse:wheel', (opt) => {
    const e = opt.e;
    if (!e.metaKey && !e.ctrlKey) return;
    e.preventDefault();
    const zoom = clampZoom(canvas, canvas.getZoom() * (0.999 ** e.deltaY));
    canvas.zoomToPoint(new Point(e.offsetX, e.offsetY), zoom);
    emit(EVENTS.ZOOM_CHANGED, { zoom: canvas.getZoom() });
  });

  on(EVENTS.ZOOM_SET, ({ zoom }) => {
    canvas.zoomToPoint(new Point(canvas.width / 2, canvas.height / 2), clampZoom(canvas, zoom));
    emit(EVENTS.ZOOM_CHANGED, { zoom: canvas.getZoom() });
  });

  // Two-finger pinch-to-zoom and pan
  let touchDist = null;
  let touchMidX = null;
  let touchMidY = null;
  const el = canvas.upperCanvasEl;

  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const [t1, t2] = e.touches;
    touchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    touchMidX = (t1.clientX + t2.clientX) / 2;
    touchMidY = (t1.clientY + t2.clientY) / 2;
  }, { passive: false });

  el.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 2 || touchDist === null) return;
    e.preventDefault();
    const [t1, t2] = e.touches;
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const midX = (t1.clientX + t2.clientX) / 2;
    const midY = (t1.clientY + t2.clientY) / 2;
    canvas.relativePan(new Point(midX - touchMidX, midY - touchMidY));
    const rect = el.getBoundingClientRect();
    const zoom = clampZoom(canvas, canvas.getZoom() * (dist / touchDist));
    canvas.zoomToPoint(new Point(midX - rect.left, midY - rect.top), zoom);
    emit(EVENTS.ZOOM_CHANGED, { zoom: canvas.getZoom() });
    touchDist = dist;
    touchMidX = midX;
    touchMidY = midY;
  }, { passive: false });

  el.addEventListener('touchend', () => {
    touchDist = null;
    touchMidX = null;
    touchMidY = null;
  });
}
