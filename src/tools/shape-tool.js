import { Ellipse, Rect, Triangle, Path } from 'fabric';
import { on, off, emit, EVENTS } from '../helpers/events.js';
import { snapCoord } from '../helpers/grid.js';

const defaults = { fill: '#ffffff', stroke: '#000000', strokeWidth: 2, rx: 0 };

const SHAPE_PATHS = {
  star:    'M 50,0 L 61.8,34 L 97.6,34.5 L 69,56.2 L 79.4,90.5 L 50,70 L 20.6,90.5 L 31,56.2 L 2.4,34.5 L 38.2,34 Z',
  diamond: 'M 50,0 L 100,50 L 50,100 L 0,50 Z',
  hexagon: 'M 100,50 L 75,93 L 25,93 L 0,50 L 25,7 L 75,7 Z',
  arrow:   'M 0,30 L 65,30 L 65,5 L 100,50 L 65,95 L 65,70 L 0,70 Z',
  cross:   'M 35,0 L 65,0 L 65,35 L 100,35 L 100,65 L 65,65 L 65,100 L 35,100 L 35,65 L 0,65 L 0,35 L 35,35 Z',
  heart:   'M 50,85 C 10,60 0,40 0,30 C 0,10 15,0 30,0 C 40,0 50,10 50,15 C 50,10 60,0 70,0 C 85,0 100,10 100,30 C 100,40 90,60 50,85 Z',
  banner:  'M 0,50 L 20,0 L 80,0 L 100,50 L 80,100 L 20,100 Z',
  octagon: 'M 30,0 L 70,0 L 100,30 L 100,70 L 70,100 L 30,100 L 0,70 L 0,30 Z',
};

let _selectedShape = 'circle';

export class ShapeTool {
  static get selectedShape() { return _selectedShape; }
  static set selectedShape(v) { _selectedShape = v; }

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
      if (data.shapeType !== undefined) {
        _selectedShape = data.shapeType;
      } else {
        Object.assign(defaults, data);
      }
    };
    on(EVENTS.TOOL_OPTIONS_CHANGED, this._onOptionsChanged);
    emit(EVENTS.SELECTION_CHANGED, { type: 'shape-tool', shapeType: _selectedShape, ...defaults });
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

  _createFabricShape(x, y) {
    const shared = {
      left: x,
      top: y,
      originX: 'left',
      originY: 'top',
      fill: defaults.fill,
      stroke: defaults.stroke,
      strokeWidth: defaults.strokeWidth,
      selectable: false,
      evented: false,
    };

    if (_selectedShape === 'circle' || _selectedShape === 'ellipse') {
      return new Ellipse({ ...shared, rx: 0, ry: 0 });
    }
    if (_selectedShape === 'rectangle') {
      return new Rect({ ...shared, width: 0, height: 0, rx: defaults.rx, ry: defaults.rx });
    }
    if (_selectedShape === 'triangle') {
      return new Triangle({ ...shared, width: 0, height: 0 });
    }
    const pathStr = SHAPE_PATHS[_selectedShape];
    if (pathStr) {
      return new Path(pathStr, { ...shared, scaleX: 0.01, scaleY: 0.01 });
    }
    return new Rect({ ...shared, width: 0, height: 0 });
  }

  _down(opt) {
    if (opt.e.button !== 0) return;
    const { x, y } = opt.scenePoint;
    this._drawing = true;
    this._startX = snapCoord(x);
    this._startY = snapCoord(y);

    this._shape = this._createFabricShape(x, y);
    this._canvas.add(this._shape);

    this._naturalW = this._shape.width  || 100;
    this._naturalH = this._shape.height || 100;
  }

  _move(opt) {
    if (!this._drawing || !this._shape) return;
    const { x, y } = opt.scenePoint;
    let w = snapCoord(x) - this._startX;
    let h = snapCoord(y) - this._startY;

    if (_selectedShape === 'circle') {
      const size = Math.max(Math.abs(w), Math.abs(h));
      w = w < 0 ? -size : size;
      h = h < 0 ? -size : size;
    } else if (opt.e.shiftKey) {
      const size = Math.max(Math.abs(w), Math.abs(h));
      w = w < 0 ? -size : size;
      h = h < 0 ? -size : size;
    }

    const left = w < 0 ? this._startX + w : this._startX;
    const top  = h < 0 ? this._startY + h : this._startY;
    const absW = Math.abs(w);
    const absH = Math.abs(h);

    if (_selectedShape === 'circle' || _selectedShape === 'ellipse') {
      this._shape.set({ left, top, rx: absW / 2, ry: absH / 2 });
    } else if (_selectedShape === 'rectangle') {
      this._shape.set({ left, top, width: absW, height: absH });
    } else if (_selectedShape === 'triangle') {
      this._shape.set({ left, top, width: absW, height: absH });
    } else {
      this._shape.set({
        left,
        top,
        scaleX: absW / this._naturalW,
        scaleY: absH / this._naturalH,
      });
    }
    this._canvas.renderAll();
  }

  _up() {
    if (!this._drawing || !this._shape) return;
    this._drawing = false;

    this._shape.setCoords();
    const bbox = this._shape.getBoundingRect();
    if (bbox.width < 2 || bbox.height < 2) {
      this._canvas.remove(this._shape);
      this._shape = null;
      this._canvas.renderAll();
      return;
    }

    const drawn = this._shape;
    drawn.set({ selectable: true, evented: true });
    drawn.setCoords();
    this._shape = null;
    this._canvas.renderAll();

    emit(EVENTS.TOOL_CHANGED, { id: 'select' });
    this._canvas.setActiveObject(drawn);
    this._canvas.fire('selection:created', { selected: [drawn] });
    this._canvas.renderAll();
  }
}
