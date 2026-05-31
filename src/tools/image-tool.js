import { FabricImage, filters } from 'fabric';
import { emit, EVENTS } from '../helpers/events.js';
import { snapCoord } from '../helpers/grid.js';

export class ImageTool {
  activate(canvas) {
    this._canvas = canvas;

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.discardActiveObject();
    canvas.getObjects().forEach(obj => {
      obj.selectable = false;
      obj.evented = false;
    });
    canvas.renderAll();

    this._fileInput = document.createElement('input');
    this._fileInput.type = 'file';
    this._fileInput.accept = 'image/*';
    this._fileInput.style.display = 'none';
    document.body.appendChild(this._fileInput);

    this._pendingPoint = null;

    this._onDown = this._down.bind(this);
    canvas.on('mouse:down', this._onDown);
  }

  deactivate(canvas) {
    canvas.off('mouse:down', this._onDown);
    this._fileInput?.remove();
    this._fileInput = null;

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
    this._pendingPoint = { x: snapCoord(x), y: snapCoord(y) };

    this._fileInput.value = '';
    this._fileInput.onchange = () => this._load();
    this._fileInput.click();
  }

  async _load() {
    const file = this._fileInput?.files?.[0];
    if (!file) return;

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const img = await FabricImage.fromURL(dataUrl);

    img.filters.push(new filters.Grayscale());
    img.applyFilters();

    const { x, y } = this._pendingPoint;
    img.set({
      left: x,
      top: y,
      originX: 'left',
      originY: 'top',
      lockUniScaling: true,
      strokeWidth: 0,
      selectable: true,
      evented: true,
    });

    this._canvas.add(img);
    img.setCoords();
    this._canvas.renderAll();

    emit(EVENTS.TOOL_CHANGED, { id: 'select' });
    this._canvas.setActiveObject(img);
    this._canvas.fire('selection:created', { selected: [img] });
    this._canvas.renderAll();
  }
}
