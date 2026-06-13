import { loadSVGFromString, util } from 'fabric';
const { groupSVGElements } = util;
import { on, off, emit, EVENTS } from '../helpers/events.js';

import cornerNoOneSvg   from '../decorations/corner-no-one.svg?raw';
import cornerNoTwoSvg   from '../decorations/corner-no-two.svg?raw';
import cornerNoThreeSvg from '../decorations/corner-no-three.svg?raw';
import cornerNoFourSvg  from '../decorations/corner-no-four.svg?raw';
import cornerNoFiveSvg  from '../decorations/corner-no-five.svg?raw';

const defaults = { fill: '#000000', stroke: 'none', strokeWidth: 0 };

export const DECORATION_LIST = [
  { id: 'corner-no-one',   label: 'Corner 1', svgString: cornerNoOneSvg },
  { id: 'corner-no-two',   label: 'Corner 2', svgString: cornerNoTwoSvg },
  { id: 'corner-no-three', label: 'Corner 3', svgString: cornerNoThreeSvg },
  { id: 'corner-no-four',  label: 'Corner 4', svgString: cornerNoFourSvg },
  { id: 'corner-no-five',  label: 'Corner 5', svgString: cornerNoFiveSvg },
];

let _selectedDecoration = 'corner-no-one';

export class DecorationTool {
  static get selectedDecoration() { return _selectedDecoration; }
  static set selectedDecoration(v) { _selectedDecoration = v; }

  activate(canvas) {
    this._canvas = canvas;
    this._drawing = false;
    this._startX = 0;
    this._startY = 0;
    this._shape = null;
    this._naturalW = 100;
    this._naturalH = 100;

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

    this._onOptionsChanged = (data) => {
      if (data.decorationType !== undefined) {
        _selectedDecoration = data.decorationType;
      } else {
        Object.assign(defaults, data);
      }
    };
    on(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);
    emit(EVENTS.SELECTION_CHANGED, { type: 'decoration-tool', decorationType: _selectedDecoration, ...defaults });
  }

  deactivate(canvas) {
    canvas.off('mouse:down', this._onDown);
    canvas.off('mouse:move', this._onMove);
    canvas.off('mouse:up',   this._onUp);
    off(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);

    if (this._shape) {
      canvas.remove(this._shape);
      this._shape = null;
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

  async _down(opt) {
    if (opt.e.button !== 0) return;
    const { x, y } = opt.scenePoint;
    this._drawing = true;
    this._startX = x;
    this._startY = y;
    this._shape = null;

    const entry = DECORATION_LIST.find(d => d.id === _selectedDecoration) ?? DECORATION_LIST[0];
    const { objects, options } = await loadSVGFromString(entry.svgString);

    if (!this._drawing) return;

    const shape = groupSVGElements(objects, options);
    shape.set({
      left: this._startX,
      top: this._startY,
      originX: 'left',
      originY: 'top',
      scaleX: 0.01,
      scaleY: 0.01,
      selectable: false,
      evented: false,
    });

    this._shape = shape;
    this._naturalW = shape.width  || 100;
    this._naturalH = shape.height || 100;
    this._canvas.add(shape);
    this._canvas.renderAll();
  }

  _move(opt) {
    if (!this._drawing || !this._shape) return;
    const { x, y } = opt.scenePoint;
    let w = x - this._startX;
    let h = y - this._startY;

    if (!opt.e.shiftKey) {
      const scaleW = Math.abs(w) / this._naturalW;
      const scaleH = Math.abs(h) / this._naturalH;
      const scale  = Math.max(scaleW, scaleH);
      w = scale * this._naturalW * (w < 0 ? -1 : 1);
      h = scale * this._naturalH * (h < 0 ? -1 : 1);
    }

    const left = w < 0 ? this._startX + w : this._startX;
    const top  = h < 0 ? this._startY + h : this._startY;
    const absW = Math.abs(w);
    const absH = Math.abs(h);

    this._shape.set({
      left,
      top,
      scaleX: absW / this._naturalW,
      scaleY: absH / this._naturalH,
    });
    this._canvas.renderAll();
  }

  _up() {
    if (!this._drawing) return;
    this._drawing = false;
    if (!this._shape) return;

    this._shape.setCoords();
    const bbox = this._shape.getBoundingRect();
    if (bbox.width < 2 || bbox.height < 2) {
      this._canvas.remove(this._shape);
      this._shape = null;
      this._canvas.renderAll();
      return;
    }

    const drawn = this._shape;
    drawn.set({ selectable: true, evented: true, _isDecoration: true });
    drawn.setCoords();
    this._shape = null;
    this._canvas.renderAll();

    emit(EVENTS.TOOL_CHANGED, { id: 'select' });
    this._canvas.setActiveObject(drawn);
    this._canvas.fire('selection:created', { selected: [drawn] });
    this._canvas.renderAll();
  }
}
