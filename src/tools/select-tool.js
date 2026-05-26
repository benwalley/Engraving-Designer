import { on, off, emit, EVENTS } from '../helpers/events.js';

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

    canvas.on('selection:created', this._emitSelection);
    canvas.on('selection:updated', this._emitSelection);
    canvas.on('selection:cleared', this._clearSelection);
    on(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);
  }

  deactivate(canvas) {
    canvas.off('selection:created', this._emitSelection);
    canvas.off('selection:updated', this._emitSelection);
    canvas.off('selection:cleared', this._clearSelection);
    off(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);
    canvas.discardActiveObject();
    canvas.renderAll();
  }
}
