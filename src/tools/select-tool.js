import { filters } from 'fabric';
import { on, off, emit, EVENTS } from '../helpers/events.js';

function readImageFilters(obj) {
  const result = { brightness: 0, contrast: 0, gamma: 1.0, inverted: false };
  for (const f of obj.filters ?? []) {
    if (f.type === 'Brightness') result.brightness = f.brightness ?? 0;
    if (f.type === 'Contrast')   result.contrast   = f.contrast   ?? 0;
    if (f.type === 'Gamma')      result.gamma      = f.gamma?.[0] ?? 1.0;
    if (f.type === 'Invert')     result.inverted   = true;
  }
  return result;
}

function applyImageFilters(obj, canvas, { brightness, contrast, gamma, inverted }) {
  obj.filters = [new filters.Grayscale()];
  if (brightness !== 0) obj.filters.push(new filters.Brightness({ brightness }));
  if (contrast !== 0)   obj.filters.push(new filters.Contrast({ contrast }));
  if (gamma !== 1.0)    obj.filters.push(new filters.Gamma({ gamma: [gamma, gamma, gamma] }));
  if (inverted)         obj.filters.push(new filters.Invert());
  obj.applyFilters();
  canvas.renderAll();
}

export class SelectTool {
  activate(canvas) {
    this._canvas = canvas;
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.getObjects().forEach(obj => {
      obj.selectable = true;
      obj.evented = true;
      obj.setCoords();
    });
    canvas.renderAll();

    this._emitSelection = (opt) => {
      const obj = opt?.selected?.[0] ?? canvas.getActiveObject();
      if (!obj) return;
      if (obj.type === 'i-text') {
        emit(EVENTS.SELECTION_CHANGED, {
          id:         obj._layerId,
          type:       obj.type,
          fill:       obj.fill       ?? '#000000',
          fontFamily: obj.fontFamily ?? 'Arial',
          fontSize:   obj.fontSize   ?? 24,
          fontWeight: obj.fontWeight ?? 'normal',
          fontStyle:  obj.fontStyle  ?? 'normal',
          underline:  obj.underline  ?? false,
        });
      } else if (obj.type === 'image') {
        const f = readImageFilters(obj);
        emit(EVENTS.SELECTION_CHANGED, {
          id:         obj._layerId,
          type:       'image',
          brightness: f.brightness,
          contrast:   f.contrast,
          gamma:      f.gamma,
          inverted:   f.inverted,
        });
      } else {
        emit(EVENTS.SELECTION_CHANGED, {
          id:          obj._layerId,
          type:        obj.type,
          fill:        obj.fill        ?? '#ffffff',
          stroke:      obj.stroke      ?? '#000000',
          strokeWidth: obj.strokeWidth ?? 1,
          rx:          obj.rx          ?? 0,
        });
      }
    };

    this._onOptionsChanged = (data) => {
      const obj = canvas.getActiveObject();
      if (!obj) return;
      if (obj.type === 'image') {
        applyImageFilters(obj, canvas, { ...readImageFilters(obj), ...data });
        return;
      }
      if (data.fill        !== undefined) obj.set('fill',        data.fill);
      if (data.stroke      !== undefined) obj.set('stroke',      data.stroke);
      if (data.strokeWidth !== undefined) obj.set('strokeWidth', data.strokeWidth);
      if (data.rx          !== undefined) { obj.set('rx', data.rx); obj.set('ry', data.rx); }
      if (data.fontFamily  !== undefined) obj.set('fontFamily',  data.fontFamily);
      if (data.fontSize    !== undefined) obj.set('fontSize',    data.fontSize);
      if (data.fontWeight  !== undefined) obj.set('fontWeight',  data.fontWeight);
      if (data.fontStyle   !== undefined) obj.set('fontStyle',   data.fontStyle);
      if (data.underline   !== undefined) obj.set('underline',   data.underline);
      canvas.renderAll();
    };

    this._clearSelection = () => emit(EVENTS.SELECTION_CHANGED, null);

    this._onKeyDown = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (e.target.closest('input, textarea, [contenteditable]')) return;
      const obj = canvas.getActiveObject();
      if (!obj || obj.isEditing) return;
      canvas.remove(obj);
      canvas.discardActiveObject();
    };
    document.addEventListener('keydown', this._onKeyDown);

    canvas.on('selection:created', this._emitSelection);
    canvas.on('selection:updated', this._emitSelection);
    canvas.on('selection:cleared', this._clearSelection);
    on(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);
  }

  deactivate(canvas) {
    document.removeEventListener('keydown', this._onKeyDown);
    canvas.off('selection:created', this._emitSelection);
    canvas.off('selection:updated', this._emitSelection);
    canvas.off('selection:cleared', this._clearSelection);
    off(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);
    canvas.discardActiveObject();
    canvas.renderAll();
  }
}
