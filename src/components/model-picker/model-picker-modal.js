import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { setItem, getItem, LOCAL } from '../../helpers/local-storage.js';
import { PRODUCT_MODELS } from '../../models/model-registry.js';

class ModelPickerModal extends LitElement {
  static properties = {
    _open: { state: true },
    _selectedId: { state: true },
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
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-dropdown);
      width: min(1100px, 95vw);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border);
    }

    .modal-title {
      font-size: var(--font-size-normal);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      font-size: 1.25rem;
      line-height: 1;
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: var(--color-hover);
      color: var(--color-text);
    }

    .model-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      padding: 24px;
      overflow-y: auto;
    }

    .model-card {
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      overflow: hidden;
      transition: border-color var(--duration-fast) var(--easing-default),
                  background var(--duration-fast) var(--easing-default);
      display: flex;
      flex-direction: column;
    }

    .model-card:hover {
      border-color: var(--color-accent);
      background: var(--color-accent-subtle);
    }

    .model-card.selected {
      border-color: var(--color-accent);
      background: var(--color-accent-subtle);
    }

    .model-thumbnail {
      width: 100%;
      aspect-ratio: 4 / 3;
      background: var(--color-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    .model-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .model-name {
      padding: 8px 10px;
      font-size: var(--font-size-sm);
      color: var(--color-text);
      font-weight: 500;
    }

    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn {
      padding: 7px 16px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      cursor: pointer;
      border: 1px solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text);
      transition: background var(--duration-fast) var(--easing-default);
    }

    .btn:hover {
      background: var(--color-hover);
    }

    .btn-primary {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent);
      color: var(--color-accent-text);
      font-weight: 600;
    }

    .btn-primary:hover {
      background: var(--color-accent-subtle-active);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this._open = false;
    this._selectedId = getItem(LOCAL.CURRENT_MODEL_ID) ?? null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._onOpen = () => {
      this._selectedId = getItem(LOCAL.CURRENT_MODEL_ID) ?? null;
      this._open = true;
    };
    on(EVENTS.SELECT_ITEM_TO_ENGRAVE, this._onOpen);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.SELECT_ITEM_TO_ENGRAVE, this._onOpen);
  }

  _select(id) {
    this._selectedId = id;
  }

  _confirm() {
    if (!this._selectedId) return;
    setItem(LOCAL.CURRENT_MODEL_ID, this._selectedId);
    emit(EVENTS.MODEL_SELECTED, { modelId: this._selectedId });
    this._open = false;
  }

  _close() {
    this._open = false;
  }

  render() {
    if (!this._open) return html``;

    return html`
      <div class="overlay" @click=${(e) => { if (e.target === e.currentTarget) this._close(); }}>
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Select Item to Engrave</h2>
            <button class="close-btn" @click=${this._close} aria-label="Close">✕</button>
          </div>

          <div class="model-grid">
            ${PRODUCT_MODELS.map(model => html`
              <div
                class="model-card ${this._selectedId === model.id ? 'selected' : ''}"
                @click=${() => this._select(model.id)}
              >
                <div class="model-thumbnail">
                  ${model.thumbnail
                    ? html`<img src=${model.thumbnail} alt=${model.name} />`
                    : html`<span>No preview</span>`
                  }
                </div>
              </div>
            `)}
          </div>

          <div class="modal-footer">
            <button class="btn" @click=${this._close}>Cancel</button>
            <button
              class="btn btn-primary"
              ?disabled=${!this._selectedId}
              @click=${this._confirm}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('model-picker-modal', ModelPickerModal);
