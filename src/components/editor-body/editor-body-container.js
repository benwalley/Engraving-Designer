import { LitElement, html, css } from 'lit';
import { Canvas as FabricCanvas, ActiveSelection, Path as FabricPath } from 'fabric';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { TOOL_MAP, DEFAULT_TOOL_ID } from '../../tools/registry.js';
import { SelectTool } from '../../tools/select-tool.js';
import { initPanZoom } from '../../canvas/pan-zoom.js';
import { getItem, LOCAL } from '../../helpers/local-storage.js';
import { getLocalDbVersionById, saveLocalDbVersion } from '../../helpers/local-db.js';
import { gridState } from '../../helpers/grid.js';
import { History } from '../../helpers/history.js';
import { MODEL_MAP } from '../../models/model-registry.js';

class EditorBodyContainer extends LitElement {
  static styles = css`
    :host {
      display: block;
      overflow: hidden;
    }
  `;

  firstUpdated() {
    this._saveTimer = null;
    this._loading = false;
    this._history = new History();
    this._currentSnapshot = null;
    this._isRestoringHistory = false;
    this._textEditing = false;
    this._justExitedTextEditing = false;
    this._preChangeSnapshot = null;
    this._historyDebounceTimer = null;

    const canvasEl = this.shadowRoot.querySelector('canvas');
    const style = getComputedStyle(document.documentElement);
    this._canvas = new FabricCanvas(canvasEl, {
      backgroundColor: style.getPropertyValue('--color-canvas-bg').trim() || '#ffffff',
      skipOffscreen: false,
    });

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this);
    this._resize();
    initPanZoom(this._canvas);

    // Restore grid state from localStorage
    gridState.showGrid   = getItem(LOCAL.GRID_SHOW)   === true;
    gridState.snapToGrid = getItem(LOCAL.GRID_SNAP)   === true;

    this._canvas.on('after:render', ({ ctx }) => {
      if (ctx === this._canvas.getContext()) this._drawGrid();
    });

    this._onGridChanged = ({ showGrid, snapToGrid }) => {
      gridState.showGrid   = showGrid;
      gridState.snapToGrid = snapToGrid;
      this._canvas.requestRenderAll();
    };
    on(EVENTS.GRID_CHANGED, this._onGridChanged);

    this._activeToolId = DEFAULT_TOOL_ID;
    this._activeTool = new SelectTool();
    this._activeTool.activate(this._canvas);

    this._onObjectAdded = ({ target }) => {
      if (!target._layerId) target._layerId = crypto.randomUUID();
      if (this._isRestoringHistory || this._loading) return;
      this._pushHistoryEntry();
      this._emitObjects();
      this._scheduleSave();
    };
    this._onObjectRemoved = () => {
      if (this._isRestoringHistory || this._loading) return;
      this._pushHistoryEntry();
      this._emitObjects();
      this._scheduleSave();
    };
    this._onObjectModified = () => {
      if (this._isRestoringHistory || this._loading || this._textEditing || this._justExitedTextEditing) {
        if (!this._isRestoringHistory && !this._loading) this._scheduleSave();
        return;
      }
      this._pushHistoryEntry();
      this._scheduleSave();
    };
    this._canvas.on('object:added', this._onObjectAdded);
    this._canvas.on('object:removed', this._onObjectRemoved);
    this._canvas.on('object:modified', this._onObjectModified);
    this._canvas.on('text:editing:entered', () => { this._textEditing = true; });
    this._canvas.on('text:editing:exited', () => {
      this._textEditing = false;
      this._justExitedTextEditing = true;
      setTimeout(() => { this._justExitedTextEditing = false; }, 0);
      if (!this._isRestoringHistory) {
        this._pushHistoryEntry();
        this._scheduleSave();
      }
    });

    this._onToolChanged = ({ id }) => this._switchTool(id);
    on(EVENTS.TOOL_CHANGED, this._onToolChanged);

    this._onLayerSelect = ({ id }) => {
      const obj = this._canvas.getObjects().find(o => o._layerId === id);
      if (!obj) return;
      if (this._activeToolId !== 'select') {
        this._switchTool('select');
        emit(EVENTS.TOOL_CHANGED, { id: 'select' });
      }
      this._canvas.setActiveObject(obj);
      this._canvas.renderAll();
    };
    on(EVENTS.LAYER_SELECT, this._onLayerSelect);

    this._onLayerReorder = ({ draggedId, targetId }) => {
      const objects = this._canvas.getObjects();
      const dragged = objects.find(o => o._layerId === draggedId);
      const target = objects.find(o => o._layerId === targetId);
      if (!dragged || !target) return;
      const targetIndex = this._canvas.getObjects().indexOf(target);
      this._canvas.moveObjectTo(dragged, targetIndex);
      this._canvas.renderAll();
      this._pushHistoryEntry();
      this._emitObjects();
      this._scheduleSave();
    };
    on(EVENTS.LAYER_REORDER, this._onLayerReorder);

    this._onLayerRename = ({ id, name }) => {
      const obj = this._canvas.getObjects().find(o => o._layerId === id);
      if (!obj) return;
      obj._layerName = name.trim() || null;
      this._debouncedHistoryEntry();
      this._emitObjects();
      this._scheduleSave();
    };
    on(EVENTS.LAYER_RENAME, this._onLayerRename);

    this._onLayerDeleted = ({ id }) => {
      const obj = this._canvas.getObjects().find(o => o._layerId === id);
      if (obj) this._canvas.remove(obj);
    };
    on(EVENTS.LAYER_DELETED, this._onLayerDeleted);

    this._onToolOptionsChanged = () => {
      this._debouncedHistoryEntry();
      this._scheduleSave();
    };
    on(EVENTS.TOOL_OPTIONS_CHANGED, this._onToolOptionsChanged);

    this._onVersionSelected = (version) => this._loadVersion(version);
    on(EVENTS.VERSION_SELECTED, this._onVersionSelected);

    this._onModelSelected = ({ modelId }) => {
      const model = MODEL_MAP[modelId];
      if (model) this._applyBoundaryGuide(model).catch(console.error);
    };
    on(EVENTS.MODEL_SELECTED, this._onModelSelected);

    // Restore boundary guide if a model was previously selected
    const savedModelId = getItem(LOCAL.CURRENT_MODEL_ID);
    if (savedModelId && MODEL_MAP[savedModelId]) {
      this._applyBoundaryGuide(MODEL_MAP[savedModelId]).catch(console.error);
    }

    this._onUndoRequested = () => this._undo();
    this._onRedoRequested = () => this._redo();
    on(EVENTS.UNDO_REQUESTED, this._onUndoRequested);
    on(EVENTS.REDO_REQUESTED, this._onRedoRequested);

    this._clipboard = null;
    this._pasteOffset = 0;
    this._onCopyPaste = (e) => this._handleCopyPaste(e);
    document.addEventListener('keydown', this._onCopyPaste);
  }

  _drawGrid() {
    if (!gridState.showGrid) return;
    const ctx  = this._canvas.contextContainer;
    const vt   = this._canvas.viewportTransform;
    const zoom = vt[0];
    const step = gridState.size * zoom;
    const startX = ((vt[4] % step) + step) % step;
    const startY = ((vt[5] % step) + step) % step;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-grid').trim() || '#dddddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = startY; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  _emitObjects() {
    const items = this._canvas.getObjects()
      .filter(o => !o._layerId?.startsWith('__boundary__'))
      .map(o => ({ id: o._layerId, type: o.type, name: o._layerName ?? null }))
      .reverse();
    emit(EVENTS.CANVAS_OBJECTS_UPDATED, items);
  }

  async _applyBoundaryGuide(model) {
    // Remove any existing boundary guide
    const existing = this._canvas.getObjects().find(o => o._layerId?.startsWith('__boundary__'));
    if (existing) this._canvas.remove(existing);

    // Resolve path string: SVG file takes precedence over inline string
    let pathString = model.boundaryPath ?? null;
    if (model.boundarySvgPath) {
      try {
        const res = await fetch(model.boundarySvgPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const svgText = await res.text();
        const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
        if (doc.querySelector('parsererror')) throw new Error('Invalid SVG');
        const ds = Array.from(doc.querySelectorAll('path'))
          .map(p => p.getAttribute('d'))
          .filter(Boolean);
        if (!ds.length) throw new Error('No <path> elements found in SVG');
        pathString = ds.join(' ');
      } catch (err) {
        console.warn('[BoundaryGuide] SVG load failed, falling back to boundaryPath:', err.message);
      }
    }

    if (!pathString) return;

    const guide = new FabricPath(pathString, {
      selectable: false,
      evented: false,
      excludeFromExport: true,
      fill: 'rgba(99,102,241,0.07)',
      fillRule: 'evenodd',
      stroke: '#6366f1',
      strokeDashArray: [6, 4],
      strokeWidth: 1.5,
      strokeUniform: true,
      _layerId: '__boundary__' + model.id,
    });

    // Scale the guide to fill ~90% of the visible canvas area (centered)
    const vt = this._canvas.viewportTransform;
    const zoom = vt[0];
    const panX = vt[4];
    const panY = vt[5];
    const visibleWidth  = this._canvas.width  / zoom;
    const visibleHeight = this._canvas.height / zoom;
    const centerX = (this._canvas.width  / 2 - panX) / zoom;
    const centerY = (this._canvas.height / 2 - panY) / zoom;

    const scale = Math.min(
      (visibleWidth  * 0.9) / guide.width,
      (visibleHeight * 0.9) / guide.height,
    );

    guide.set({
      originX: 'center',
      originY: 'center',
      left: centerX,
      top:  centerY,
      scaleX: scale,
      scaleY: scale,
    });
    guide.setCoords();

    this._canvas.add(guide);
    this._canvas.renderAll();
  }

  _scheduleSave() {
    if (this._loading || this._isRestoringHistory) return;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(async () => {
      const id = getItem(LOCAL.CURRENT_VERSION_ID);
      if (!id) return;
      let version;
      try { version = await getLocalDbVersionById(id); } catch { return; }
      if (!version) return;
      emit(EVENTS.VERSION_SAVING);
      version.data = this._canvas.toJSON(['_layerId', '_layerName']);
      version.updatedAt = new Date();
      try { await saveLocalDbVersion(version); } catch { return; }
      emit(EVENTS.VERSION_SAVED, version);
    }, 1000);
  }

  async _loadVersion(version) {
    this._loading = true;
    clearTimeout(this._historyDebounceTimer);
    this._preChangeSnapshot = null;
    if (version?.data && Object.keys(version.data).length > 0) {
      await this._canvas.loadFromJSON(version.data);
      this._canvas.renderAll();
    } else {
      this._canvas.clear();
      this._canvas.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--color-canvas-bg').trim() || '#ffffff';
      this._canvas.renderAll();
    }
    this._loading = false;
    this._history.clear();
    this._currentSnapshot = this._canvas.toJSON(['_layerId', '_layerName']);
    this._emitHistory();
    this._emitObjects();

    // Boundary guide is excluded from JSON; re-draw it after load
    const modelId = getItem(LOCAL.CURRENT_MODEL_ID);
    if (modelId && MODEL_MAP[modelId]) {
      await this._applyBoundaryGuide(MODEL_MAP[modelId]);
    }
  }

  _switchTool(id) {
    this._activeTool?.deactivate(this._canvas);
    const ToolClass = TOOL_MAP[id] ?? TOOL_MAP[DEFAULT_TOOL_ID];
    this._activeTool = new ToolClass();
    this._activeTool.activate(this._canvas);
    this._activeToolId = id;
  }

  _resize() {
    const { width, height } = this.getBoundingClientRect();
    this._canvas.setDimensions({ width, height });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    off(EVENTS.TOOL_CHANGED,        this._onToolChanged);
    off(EVENTS.LAYER_SELECT,        this._onLayerSelect);
    off(EVENTS.LAYER_REORDER,       this._onLayerReorder);
    off(EVENTS.LAYER_RENAME,        this._onLayerRename);
    off(EVENTS.LAYER_DELETED,       this._onLayerDeleted);
    off(EVENTS.GRID_CHANGED,        this._onGridChanged);
    off(EVENTS.TOOL_OPTIONS_CHANGED, this._onToolOptionsChanged);
    off(EVENTS.VERSION_SELECTED,    this._onVersionSelected);
    off(EVENTS.MODEL_SELECTED,      this._onModelSelected);
    off(EVENTS.UNDO_REQUESTED,      this._onUndoRequested);
    off(EVENTS.REDO_REQUESTED,      this._onRedoRequested);
    document.removeEventListener('keydown', this._onCopyPaste);
    clearTimeout(this._saveTimer);
    clearTimeout(this._historyDebounceTimer);
    this._canvas?.dispose();
  }

  _handleCopyPaste(e) {
    const isC = e.key === 'c' && (e.ctrlKey || e.metaKey);
    const isV = e.key === 'v' && (e.ctrlKey || e.metaKey);
    const isZ = e.key === 'z' && (e.ctrlKey || e.metaKey);
    const isY = e.key === 'y' && (e.ctrlKey || e.metaKey);
    if (!isC && !isV && !isZ && !isY) return;
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    const active = this._canvas.getActiveObject();
    if (active?.isEditing) return;
    if (isC) this._copy(active);
    if (isV) this._paste();
    if (isZ && e.shiftKey) { e.preventDefault(); this._redo(); }
    else if (isZ) { e.preventDefault(); this._undo(); }
    if (isY) { e.preventDefault(); this._redo(); }
  }

  _copy(active) {
    if (!active) return;
    this._clipboard = active.type === 'ActiveSelection' ? active.getObjects() : active;
    this._pasteOffset = 1;
  }

  async _paste() {
    if (!this._clipboard) return;
    const offset = this._pasteOffset * 20;
    this._pasteOffset++;
    const sources = Array.isArray(this._clipboard) ? this._clipboard : [this._clipboard];
    const canvasObjects = new Set(this._canvas.getObjects());
    const valid = sources.filter(o => canvasObjects.has(o));
    if (valid.length === 0) {
      this._clipboard = null;
      this._pasteOffset = 0;
      return;
    }
    const clones = await Promise.all(valid.map(o => o.clone(['_layerId', '_layerName'])));
    clones.forEach(clone => {
      clone._layerId = crypto.randomUUID();
      clone._layerName = null;
      clone.set({ left: clone.left + offset, top: clone.top + offset, selectable: true, evented: true });
      clone.setCoords();
      this._canvas.add(clone);
    });
    if (clones.length === 1) {
      this._canvas.setActiveObject(clones[0]);
      this._canvas.fire('selection:created', { selected: clones });
    } else {
      const selection = new ActiveSelection(clones, { canvas: this._canvas });
      this._canvas.setActiveObject(selection);
      this._canvas.fire('selection:created', { selected: clones });
    }
    this._canvas.renderAll();
  }

  _emitHistory() {
    emit(EVENTS.HISTORY_CHANGED, { canUndo: this._history.canUndo, canRedo: this._history.canRedo });
  }

  _pushHistoryEntry() {
    if (this._isRestoringHistory || this._loading) return;
    this._history.push(this._currentSnapshot);
    this._currentSnapshot = this._canvas.toJSON(['_layerId', '_layerName']);
    this._emitHistory();
  }

  _debouncedHistoryEntry() {
    if (this._isRestoringHistory || this._loading) return;
    if (!this._preChangeSnapshot) this._preChangeSnapshot = this._currentSnapshot;
    clearTimeout(this._historyDebounceTimer);
    this._historyDebounceTimer = setTimeout(() => {
      this._history.push(this._preChangeSnapshot);
      this._currentSnapshot = this._canvas.toJSON(['_layerId', '_layerName']);
      this._preChangeSnapshot = null;
      this._emitHistory();
    }, 800);
  }

  async _undo() {
    if (!this._history.canUndo) return;
    this._isRestoringHistory = true;
    const prev = this._history.undo(this._currentSnapshot);
    this._currentSnapshot = prev;
    await this._canvas.loadFromJSON(prev);
    this._canvas.renderAll();
    this._emitObjects();
    this._isRestoringHistory = false;
    this._emitHistory();
    this._scheduleSave();
  }

  async _redo() {
    if (!this._history.canRedo) return;
    this._isRestoringHistory = true;
    const next = this._history.redo(this._currentSnapshot);
    this._currentSnapshot = next;
    await this._canvas.loadFromJSON(next);
    this._canvas.renderAll();
    this._emitObjects();
    this._isRestoringHistory = false;
    this._emitHistory();
    this._scheduleSave();
  }

  render() {
    return html`<div><canvas></canvas></div>`;
  }
}

customElements.define('editor-body-container', EditorBodyContainer);
