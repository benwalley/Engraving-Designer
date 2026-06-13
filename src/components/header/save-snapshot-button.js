import { LitElement, html, css } from 'lit';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../helpers/firebase.js';
import { getLocalDbVersionById } from '../../helpers/local-db.js';
import { getItem, LOCAL } from '../../helpers/local-storage.js';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { buttonStyles } from '../component-styles/button-styles.js';

class SaveSnapshotButton extends LitElement {
  static styles = [
    buttonStyles,
    css`
      :host {
        position: relative;
        display: inline-flex;
      }

      .success-popup {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-dropdown);
        padding: 0.75rem 1rem;
        min-width: 280px;
        z-index: 100;
      }

      .success-popup p {
        margin: 0 0 0.5rem;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .id-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .snapshot-id {
        flex: 1;
        font-family: monospace;
        font-size: var(--font-size-sm);
        color: var(--color-text);
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 4px 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        user-select: all;
      }

      .error-text {
        font-size: var(--font-size-sm);
        color: var(--color-danger);
        margin-top: 0.25rem;
      }
    `,
  ];

  static properties = {
    _status: { state: true },
    _snapshotId: { state: true },
    _error: { state: true },
    _copied: { state: true },
  };

  constructor() {
    super();
    this._status = 'idle';
    this._snapshotId = null;
    this._error = null;
    this._copied = false;
    this._closeOnOutsideClick = this._closeOnOutsideClick.bind(this);
  }

  async _handleClick() {
    if (this._status === 'saving') return;

    this._status = 'saving';
    this._snapshotId = null;
    this._error = null;

    try {
      const canvasData = await this._requestCanvasData();

      if (!canvasData) {
        this._error = 'No active design to snapshot.';
        this._status = 'error';
        return;
      }

      const versionId = getItem(LOCAL.CURRENT_VERSION_ID);
      const version = versionId ? await getLocalDbVersionById(versionId) : null;
      const modelId = getItem(LOCAL.CURRENT_MODEL_ID);

      const docRef = await addDoc(collection(db, 'snapshots'), {
        canvasData,
        modelId: modelId ?? null,
        versionName: version?.name ?? 'Untitled',
        createdAt: serverTimestamp(),
      });

      this._snapshotId = docRef.id;
      this._status = 'success';
      document.addEventListener('click', this._closeOnOutsideClick);
    } catch (err) {
      console.error('Snapshot save failed:', err);
      this._error = 'Failed to save snapshot. Check Firebase config.';
      this._status = 'error';
    }
  }

  _requestCanvasData() {
    return new Promise((resolve) => {
      const handler = ({ canvasData }) => {
        off(EVENTS.CANVAS_DATA_READY, handler);
        resolve(canvasData && Object.keys(canvasData).length ? canvasData : null);
      };
      on(EVENTS.CANVAS_DATA_READY, handler);
      emit(EVENTS.CANVAS_DATA_REQUESTED);
    });
  }

  get _snapshotUrl() {
    if (!this._snapshotId) return '';
    return `${window.location.origin}${window.location.pathname}?snapshot=${this._snapshotId}`;
  }

  async _handleCopy() {
    await navigator.clipboard.writeText(this._snapshotUrl);
    this._copied = true;
    setTimeout(() => { this._copied = false; }, 2000);
  }

  _handleClose() {
    this._status = 'idle';
    this._snapshotId = null;
    this._error = null;
    this._copied = false;
    document.removeEventListener('click', this._closeOnOutsideClick);
  }

  _closeOnOutsideClick(e) {
    if (!this.shadowRoot.contains(e.composedPath()[0])) {
      this._handleClose();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._closeOnOutsideClick);
  }

  render() {
    return html`
      <button
        @click=${this._handleClick}
        ?disabled=${this._status === 'saving'}
      >
        ${this._status === 'saving' ? 'Saving…' : 'Save Snapshot'}
      </button>

      ${this._status === 'success' ? html`
        <div class="success-popup">
          <p>Snapshot saved. Copy the link to share:</p>
          <div class="id-row">
            <span class="snapshot-id" title=${this._snapshotUrl}>${this._snapshotUrl}</span>
            <button type="button" @click=${this._handleCopy}>
              ${this._copied ? 'Copied!' : 'Copy URL'}
            </button>
            <button type="button" @click=${this._handleClose}>✕</button>
          </div>
        </div>
      ` : ''}

      ${this._status === 'error' ? html`
        <div class="success-popup">
          <p class="error-text">${this._error}</p>
          <div class="id-row">
            <button type="button" @click=${this._handleClose}>Dismiss</button>
          </div>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('save-snapshot-button', SaveSnapshotButton);
