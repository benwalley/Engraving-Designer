import { LitElement, html, css } from 'lit';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../helpers/firebase.js';
import { saveLocalDbVersion } from '../../helpers/local-db.js';
import { getItem, setItem, LOCAL } from '../../helpers/local-storage.js';
import { emit, EVENTS } from '../../helpers/events.js';
import { buttonStyles } from '../component-styles/button-styles.js';

class LoadSnapshotButton extends LitElement {
  static styles = [
    buttonStyles,
    css`
      dialog {
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        color: var(--color-text);
        box-shadow: var(--shadow-dropdown);
        padding: 1.5rem;
        min-width: 360px;
      }

      dialog::backdrop {
        background: var(--color-overlay);
      }

      h3 {
        margin: 0 0 1rem;
        font-size: var(--font-size-normal);
        font-weight: 600;
      }

      .id-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 1.25rem;
        font-size: var(--font-size-sm);
      }

      .id-field input {
        padding: 6px 8px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        color: var(--color-text);
        font-size: var(--font-size-sm);
        font-family: monospace;
      }

      .status-message {
        font-size: var(--font-size-sm);
        margin-bottom: 1rem;
        min-height: 1.2em;
      }

      .status-message.error {
        color: var(--color-danger);
      }

      .status-message.success {
        color: var(--color-accent);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
    `,
  ];

  static properties = {
    _idValue: { state: true },
    _status: { state: true },
    _statusMessage: { state: true },
  };

  constructor() {
    super();
    this._idValue = '';
    this._status = 'idle';
    this._statusMessage = '';
  }

  _openDialog() {
    this._idValue = '';
    this._status = 'idle';
    this._statusMessage = '';
    this.shadowRoot.querySelector('dialog').showModal();
  }

  _handleCancel() {
    this.shadowRoot.querySelector('dialog').close();
  }

  async _handleLoad(e) {
    e.preventDefault();
    const id = this._idValue.trim();
    if (!id) return;

    this._status = 'loading';
    this._statusMessage = 'Loading…';

    try {
      const snap = await getDoc(doc(db, 'snapshots', id));

      if (!snap.exists()) {
        this._status = 'error';
        this._statusMessage = 'Snapshot not found. Check the ID and try again.';
        return;
      }

      const snapshot = snap.data();
      const newVersion = {
        id: crypto.randomUUID(),
        name: `Snapshot ${id.slice(0, 6)}`,
        data: typeof snapshot.canvasData === 'string' ? JSON.parse(snapshot.canvasData) : (snapshot.canvasData ?? {}),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveLocalDbVersion(newVersion);
      setItem(LOCAL.CURRENT_VERSION_ID, newVersion.id);
      emit(EVENTS.VERSION_SELECTED, newVersion);

      const currentModelId = getItem(LOCAL.CURRENT_MODEL_ID);
      if (snapshot.modelId && snapshot.modelId !== currentModelId) {
        emit(EVENTS.MODEL_SELECTED, { modelId: snapshot.modelId });
      }

      this._status = 'success';
      this._statusMessage = `Loaded "${snapshot.versionName ?? 'Snapshot'}"`;
      setTimeout(() => this.shadowRoot.querySelector('dialog').close(), 800);
    } catch (err) {
      console.error('Snapshot load failed:', err);
      this._status = 'error';
      this._statusMessage = 'Failed to load snapshot. Check Firebase config.';
    }
  }

  render() {
    return html`
      <button @click=${this._openDialog}>Load Snapshot</button>

      <dialog>
        <form @submit=${this._handleLoad}>
          <h3>Load Snapshot</h3>

          <div class="id-field">
            <label for="snapshot-id">Snapshot ID</label>
            <input
              id="snapshot-id"
              type="text"
              placeholder="Paste snapshot ID here"
              .value=${this._idValue}
              @input=${e => this._idValue = e.target.value}
              autocomplete="off"
              spellcheck="false"
            >
          </div>

          ${this._statusMessage ? html`
            <p class="status-message ${this._status}">${this._statusMessage}</p>
          ` : ''}

          <div class="actions">
            <button type="button" @click=${this._handleCancel}>Cancel</button>
            <button
              type="submit"
              ?disabled=${!this._idValue.trim() || this._status === 'loading'}
            >
              ${this._status === 'loading' ? 'Loading…' : 'Load'}
            </button>
          </div>
        </form>
      </dialog>
    `;
  }
}

customElements.define('load-snapshot-button', LoadSnapshotButton);
