import { Ellipse } from 'fabric';
import { on, off, emit, EVENTS } from '../helpers/events.js';
import { snapCoord } from '../helpers/grid.js';

const defaults = { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 };

export class EllipseTool {
  activate(canvas) {
    this._canvas = canvas;
    this._drawing = false;
    this._startX = 0;
    this._startY = 0;
    this._ellipse = null;

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
    emit(EVENTS.SELECTION_CHANGED, { type: 'ellipse', ...defaults });
  }

  deactivate(canvas) {
    canvas.off('mouse:down', this._onDown);
    canvas.off('mouse:move', this._onMove);
    canvas.off('mouse:up',   this._onUp);
    off(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);

    if (this._ellipse) {
      canvas.remove(this._ellipse);
      this._ellipse = null;
    }
    this._drawing = false;

    canvas.defaultCursor = 'default';
    canvas.selection = true;
    canvas.getObjects().forEach(obj => {
      obj.selectable = true;
      obj.evented = true;
    });
    canvas.renderAll();
  }

  _down(opt) {
    if (opt.e.button !== 0) return;
    const { x, y } = opt.scenePoint;
    this._drawing = true;
    this._startX = snapCoord(x);
    this._startY = snapCoord(y);

    this._ellipse = new Ellipse({
      left: x,
      top: y,
      rx: 0,
      ry: 0,
      originX: 'left',
      originY: 'top',
      fill: defaults.fill,
      stroke: defaults.stroke,
      strokeWidth: defaults.strokeWidth,
      selectable: false,
      evented: false,
    });
    this._canvas.add(this._ellipse);
  }

  _move(opt) {
    if (!this._drawing || !this._ellipse) return;
    const { x, y } = opt.scenePoint;
    let w = snapCoord(x) - this._startX;
    let h = snapCoord(y) - this._startY;

    if (opt.e.shiftKey) {
      const size = Math.max(Math.abs(w), Math.abs(h));
      w = w < 0 ? -size : size;
      h = h < 0 ? -size : size;
    }

    this._ellipse.set({
      left: w < 0 ? this._startX + w : this._startX,
      top:  h < 0 ? this._startY + h : this._startY,
      rx: Math.abs(w) / 2,
      ry: Math.abs(h) / 2,
    });
    this._canvas.renderAll();
  }

  _up() {
    if (!this._drawing || !this._ellipse) return;
    this._drawing = false;

    if (this._ellipse.rx < 1 || this._ellipse.ry < 1) {
      this._canvas.remove(this._ellipse);
      this._ellipse = null;
      this._canvas.renderAll();
      return;
    }

    const drawn = this._ellipse;
    drawn.set({ selectable: true, evented: true });
    drawn.setCoords();
    this._ellipse = null;
    this._canvas.renderAll();

    emit(EVENTS.TOOL_CHANGED, { id: 'select' });
    this._canvas.setActiveObject(drawn);
    this._canvas.fire('selection:created', { selected: [drawn] });
    this._canvas.renderAll();
  }
}
