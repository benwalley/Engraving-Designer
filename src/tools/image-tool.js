import { FabricImage, filters } from 'fabric';
import { emit, EVENTS } from '../helpers/events.js';

// Largest share of the visible canvas a newly added image may cover.
const MAX_VIEWPORT_FRACTION = 0.8;

export class ImageTool {
  activate(canvas) {
    this._canvas = canvas;

    canvas.isDrawingMode = false;
    canvas.discardActiveObject();
    canvas.renderAll();

    this._fileInput = document.createElement('input');
    this._fileInput.type = 'file';
    this._fileInput.accept = 'image/*';
    this._fileInput.style.display = 'none';
    this._fileInput.onchange = () => this._load();
    this._fileInput.oncancel = () => this._done();
    document.body.appendChild(this._fileInput);

    // Open the picker straight away — the tool is activated from the toolbar click.
    this._fileInput.click();
  }

  deactivate() {
    this._fileInput?.remove();
    this._fileInput = null;
  }

  _done() {
    emit(EVENTS.TOOL_CHANGED, { id: 'select' });
  }

  async _load() {
    const file = this._fileInput?.files?.[0];
    if (!file) return this._done();
    const canvas = this._canvas;

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const img = await FabricImage.fromURL(dataUrl);

    img.filters.push(new filters.Grayscale());
    img.applyFilters();

    // Shrink oversized images to fit the visible area; never enlarge.
    const zoom = canvas.getZoom();
    const visibleW = canvas.getWidth() / zoom;
    const visibleH = canvas.getHeight() / zoom;
    const scale = Math.min(1, (visibleW * MAX_VIEWPORT_FRACTION) / img.width, (visibleH * MAX_VIEWPORT_FRACTION) / img.height);

    img.set({
      scaleX: scale,
      scaleY: scale,
      lockUniScaling: true,
      strokeWidth: 0,
      selectable: true,
      evented: true,
    });

    this._done();
    canvas.add(img);
    canvas.viewportCenterObject(img);
    img.setCoords();
    canvas.setActiveObject(img);
    canvas.fire('selection:created', { selected: [img] });
    canvas.renderAll();
  }
}
