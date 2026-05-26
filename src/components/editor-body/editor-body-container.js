import { LitElement, html, css } from 'lit';
import { Canvas as FabricCanvas } from 'fabric';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { TOOL_MAP, DEFAULT_TOOL_ID } from '../../tools/registry.js';
import { SelectTool } from '../../tools/select-tool.js';
import { initPanZoom } from '../../canvas/pan-zoom.js';

class EditorBodyContainer extends LitElement {
  static styles = css`
    :host {
      display: block;
      overflow: hidden;
    }
  `;

  firstUpdated() {
    const canvasEl = this.shadowRoot.querySelector('canvas');
    this._canvas = new FabricCanvas(canvasEl, {
      backgroundColor: '#ffffff',
      skipOffscreen: false,
    });

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this);
    this._resize();
    initPanZoom(this._canvas);

    this._activeToolId = DEFAULT_TOOL_ID;
    this._activeTool = new SelectTool();
    this._activeTool.activate(this._canvas);

    this._onObjectAdded = ({ target }) => {
      target._layerId = crypto.randomUUID();
      this._emitObjects();
    };
    this._onObjectRemoved = () => this._emitObjects();
    this._canvas.on('object:added', this._onObjectAdded);
    this._canvas.on('object:removed', this._onObjectRemoved);

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
      this._emitObjects();
    };
    on(EVENTS.LAYER_REORDER, this._onLayerReorder);

    this._onLayerRename = ({ id, name }) => {
      const obj = this._canvas.getObjects().find(o => o._layerId === id);
      if (!obj) return;
      obj._layerName = name.trim() || null;
      this._emitObjects();
    };
    on(EVENTS.LAYER_RENAME, this._onLayerRename);
  }

  _emitObjects() {
    const items = this._canvas.getObjects()
      .map(o => ({ id: o._layerId, type: o.type, name: o._layerName ?? null }))
      .reverse();
    emit(EVENTS.CANVAS_OBJECTS_UPDATED, items);
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
    off(EVENTS.TOOL_CHANGED, this._onToolChanged);
    off(EVENTS.LAYER_SELECT, this._onLayerSelect);
    off(EVENTS.LAYER_REORDER, this._onLayerReorder);
    off(EVENTS.LAYER_RENAME, this._onLayerRename);
    this._canvas?.dispose();
  }

  render() {
    return html`<div><canvas></canvas></div>`;
  }
}

customElements.define('editor-body-container', EditorBodyContainer);
