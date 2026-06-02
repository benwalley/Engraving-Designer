import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { getItem, LOCAL } from '../../helpers/local-storage.js';
import { MODEL_MAP } from '../../models/model-registry.js';
import { exportEngravingTexture } from '../../helpers/engraving-texture.js';
import { ThreeScene } from './three-scene.js';

class Viewer3dModal extends LitElement {
  static properties = {
    _open: { state: true },
    _loading: { state: true },
    _error: { state: true },
  };

  static styles = css`
    :host {
      display: contents;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: var(--color-overlay);
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .modal {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin: 24px;
      background: #1a1a2e;
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.4);
      flex-shrink: 0;
    }

    .modal-title {
      color: #e5e7eb;
      font-size: var(--font-size-normal);
      font-weight: 600;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .btn {
      padding: 6px 14px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.1);
      color: #e5e7eb;
      transition: background var(--duration-fast) var(--easing-default);
    }

    .btn:hover {
      background: rgba(255,255,255,0.2);
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      font-size: 1.25rem;
      line-height: 1;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
    }

    .close-btn:hover {
      background: rgba(255,255,255,0.1);
      color: #e5e7eb;
    }

    .scene-container {
      flex: 1;
      position: relative;
      min-height: 0;
    }

    .scene-container canvas {
      display: block;
    }

    .state-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 12px;
      color: #9ca3af;
      font-size: var(--font-size-sm);
    }

    .hint {
      padding: 8px 16px;
      background: rgba(0,0,0,0.4);
      color: #6b7280;
      font-size: var(--font-size-sm);
      text-align: center;
      flex-shrink: 0;
    }
  `;

  constructor() {
    super();
    this._open = false;
    this._loading = false;
    this._error = null;
    this._scene = null;
    this._fabricCanvas = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._onOpen = () => this._open3d();
    on(EVENTS.VIEW_3D, this._onOpen);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.VIEW_3D, this._onOpen);
    this._disposeScene();
  }

  async _open3d() {
    this._error = null;
    this._open = true;
    this._loading = true;

    await this.updateComplete;

    const modelId = getItem(LOCAL.CURRENT_MODEL_ID);
    const model = modelId ? MODEL_MAP[modelId] : null;
    if (!model) {
      this._error = 'No item selected. Use "Select Item to Engrave" first.';
      this._loading = false;
      return;
    }

    this._fabricCanvas = this._getFabricCanvas();
    const boundaryLayerId = '__boundary__' + model.id;
    const texture = this._fabricCanvas
      ? await exportEngravingTexture(this._fabricCanvas, boundaryLayerId)
      : null;

    const container = this.shadowRoot.querySelector('.scene-container');
    this._scene = new ThreeScene(container, model, texture);

    try {
      await this._scene.load();
    } catch (err) {
      this._error = 'Failed to load 3D model: ' + err.message;
      this._loading = false;
      return;
    }

    this._loading = false;
  }

  _getFabricCanvas() {
    const editorEl = document.querySelector('editor-body-container');
    return editorEl?._canvas ?? null;
  }

  async _refreshPreview() {
    if (!this._scene || !this._fabricCanvas) return;
    const modelId = getItem(LOCAL.CURRENT_MODEL_ID);
    const model = modelId ? MODEL_MAP[modelId] : null;
    if (!model) return;
    const texture = await exportEngravingTexture(this._fabricCanvas, '__boundary__' + model.id);
    this._scene.updateTexture(texture);
  }

  _close() {
    this._disposeScene();
    this._open = false;
    emit(EVENTS.VIEW_3D_CLOSE);
  }

  _disposeScene() {
    this._scene?.dispose();
    this._scene = null;
  }

  render() {
    if (!this._open) return html``;

    return html`
      <div class="overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">3D Preview</h2>
            <div class="header-actions">
              <button class="btn" @click=${this._refreshPreview}>Refresh Preview</button>
              <button class="close-btn" @click=${this._close} aria-label="Close">✕</button>
            </div>
          </div>

          <div class="scene-container">
            ${this._loading ? html`
              <div class="state-overlay">
                <span>Loading 3D model…</span>
              </div>
            ` : this._error ? html`
              <div class="state-overlay">
                <span>${this._error}</span>
              </div>
            ` : ''}
          </div>

          <div class="hint">Drag to orbit · Scroll to zoom · Right-drag to pan</div>
        </div>
      </div>
    `;
  }
}

customElements.define('viewer-3d-modal', Viewer3dModal);
