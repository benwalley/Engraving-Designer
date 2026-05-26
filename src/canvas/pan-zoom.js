import { Point } from 'fabric';
import { on, emit, EVENTS } from '../helpers/events.js';

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;

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
    let zoom = canvas.getZoom() * (0.999 ** e.deltaY);
    zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
    canvas.zoomToPoint(new Point(e.offsetX, e.offsetY), zoom);
    emit(EVENTS.ZOOM_CHANGED, { zoom: canvas.getZoom() });
  });

  on(EVENTS.ZOOM_SET, ({ zoom }) => {
    canvas.zoomToPoint(new Point(canvas.width / 2, canvas.height / 2), zoom);
    emit(EVENTS.ZOOM_CHANGED, { zoom: canvas.getZoom() });
  });
}
