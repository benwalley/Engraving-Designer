import { Point } from 'fabric';

export class GrabTool {
  activate(canvas) {
    this._canvas = canvas;
    this._panning = false;
    this._lastX = 0;
    this._lastY = 0;

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'grab';
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
  }

  deactivate(canvas) {
    canvas.off('mouse:down', this._onDown);
    canvas.off('mouse:move', this._onMove);
    canvas.off('mouse:up',   this._onUp);

    this._panning = false;
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
    if (opt.e.button !== 0) return;
    opt.e.preventDefault();
    this._panning = true;
    this._lastX = opt.e.clientX;
    this._lastY = opt.e.clientY;
    this._canvas.defaultCursor = 'grabbing';
  }

  _move(opt) {
    if (!this._panning) return;
    const dx = opt.e.clientX - this._lastX;
    const dy = opt.e.clientY - this._lastY;
    this._lastX = opt.e.clientX;
    this._lastY = opt.e.clientY;
    this._canvas.relativePan(new Point(dx, dy));
  }

  _up(opt) {
    if (opt.e.button !== 0) return;
    this._panning = false;
    this._canvas.defaultCursor = 'grab';
  }
}
