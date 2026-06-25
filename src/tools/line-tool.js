import { Line } from 'fabric';
import { on, off, emit, EVENTS } from '../helpers/events.js';

const defaults = { stroke: '#000000', strokeWidth: 2 };

export class LineTool {
  activate(canvas) {
    this._canvas = canvas;
    this._drawing = false;
    this._startX = 0;
    this._startY = 0;
    this._line = null;

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.discardActiveObject();
    canvas.getObjects().forEach(obj => {
      obj.selectable = false;
      obj.evented = false;
    });
    canvas.renderAll();

    this._onDown = this._down.bind(this);
    this._onMove = this._move.bind(this);
    this._onUp   = this._up.bind(this);
    canvas.on('mouse:down', this._onDown);
    canvas.on('mouse:move', this._onMove);
    canvas.on('mouse:up',   this._onUp);

    this._onOptionsChanged = (data) => Object.assign(defaults, data);
    on(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);
    emit(EVENTS.SELECTION_CHANGED, { type: 'line', ...defaults });
    emit(EVENTS.HINT_CHANGED, { message: 'Click and drag to draw a line. Hold Shift to snap to 45° angles.' });
  }

  deactivate(canvas) {
    canvas.off('mouse:down', this._onDown);
    canvas.off('mouse:move', this._onMove);
    canvas.off('mouse:up',   this._onUp);
    off(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);

    if (this._line) {
      canvas.remove(this._line);
      this._line = null;
    }
    this._drawing = false;

    canvas.defaultCursor = 'default';
    canvas.selection = true;
    canvas.getObjects().forEach(obj => {
      if (obj._layerId?.startsWith('__boundary__')) return;
      obj.selectable = true;
      obj.evented = true;
    });
    canvas.renderAll();
  }

  _down(opt) {
    if (opt.e.button != null && opt.e.button !== 0) return;
    const { x, y } = opt.scenePoint;
    this._drawing = true;
    this._startX = x;
    this._startY = y;

    this._line = new Line([x, y, x, y], {
      stroke: defaults.stroke,
      strokeWidth: defaults.strokeWidth,
      selectable: false,
      evented: false,
    });
    this._canvas.add(this._line);
  }

  _move(opt) {
    if (!this._drawing || !this._line) return;
    const { x, y } = opt.scenePoint;
    let w = x - this._startX;
    let h = y - this._startY;

    if (opt.e.shiftKey) {
      const angle = Math.round(Math.atan2(h, w) / (Math.PI / 4)) * (Math.PI / 4);
      const dist  = Math.hypot(w, h);
      w = Math.round(Math.cos(angle) * dist);
      h = Math.round(Math.sin(angle) * dist);
    }

    this._line.set({ x2: this._startX + w, y2: this._startY + h });
    this._line.setCoords();
    this._canvas.renderAll();
  }

  _up() {
    if (!this._drawing || !this._line) return;
    this._drawing = false;

    const len = Math.hypot(this._line.x2 - this._line.x1, this._line.y2 - this._line.y1);
    if (len < 2) {
      this._canvas.remove(this._line);
      this._line = null;
      this._canvas.renderAll();
      return;
    }

    const drawn = this._line;
    drawn.set({ selectable: true, evented: true });
    drawn.setCoords();
    this._line = null;
    this._canvas.renderAll();

    emit(EVENTS.TOOL_CHANGED, { id: 'select' });
    this._canvas.setActiveObject(drawn);
    this._canvas.fire('selection:created', { selected: [drawn] });
    this._canvas.renderAll();
  }
}
