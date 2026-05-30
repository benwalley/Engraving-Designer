import { LitElement, html, css } from 'lit';
import { getLocalDbVersionById, saveLocalDbVersion } from '../../helpers/local-db.js';
import { emit, EVENTS } from '../../helpers/events.js';
import { getItem, LOCAL, setItem } from '../../helpers/local-storage.js';
import { buttonStyles } from '../component-styles/button-styles.js';
import { DEFAULT_VERSION } from '../../defaults.js';

class CreateCopyButton extends LitElement {
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
        min-width: 320px;
      }

      dialog::backdrop {
        background: var(--color-overlay);
      }

      h3 {
        margin: 0 0 1rem;
        font-size: var(--font-size-normal);
        font-weight: 600;
      }

      .options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .options label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }

      .name-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 1.25rem;
        font-size: var(--font-size-sm);
      }

      .name-field input {
        padding: 6px 8px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        color: var(--color-text);
        font-size: var(--font-size-sm);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
    `,
  ];

  static properties = {
    _dialogType: { state: true },
    _nameValue: { state: true },
  };

  constructor() {
    super();
    this._dialogType = 'copy';
    this._nameValue = '';
    this._currentVersionData = null;
  }

  async _handleClick() {
    const currentVersionId = getItem(LOCAL.CURRENT_VERSION_ID);
    this._currentVersionData = currentVersionId
      ? await getLocalDbVersionById(currentVersionId)
      : DEFAULT_VERSION;
    if (!this._currentVersionData) this._currentVersionData = DEFAULT_VERSION;

    this._dialogType = 'copy';
    this._nameValue = `${this._currentVersionData.name ?? this._currentVersionData.id} (copy)`;
    await this.updateComplete;
    this.shadowRoot.querySelector('dialog').showModal();
  }

  _handleTypeChange(e) {
    this._dialogType = e.target.value;
    if (this._dialogType === 'copy') {
      this._nameValue = `${this._currentVersionData.name ?? this._currentVersionData.id} (copy)`;
    } else {
      this._nameValue = 'Untitled';
    }
  }

  async _handleSubmit(e) {
    e.preventDefault();
    const name = this._nameValue.trim() || (this._dialogType === 'copy' ? 'Untitled (copy)' : 'Untitled');
    const newId = crypto.randomUUID();
    const now = Date.now();

    const newVersion = this._dialogType === 'copy'
      ? { ...this._currentVersionData, id: newId, name, updatedAt: now }
      : { id: newId, name, data: {}, createdAt: now, updatedAt: now };

    await saveLocalDbVersion(newVersion);
    setItem(LOCAL.CURRENT_VERSION_ID, newId);
    emit(EVENTS.VERSION_SELECTED, newVersion);
    this.shadowRoot.querySelector('dialog').close();
  }

  _handleCancel() {
    this.shadowRoot.querySelector('dialog').close();
  }

  render() {
    return html`
      <button @click=${this._handleClick}>New</button>

      <dialog>
        <form @submit=${this._handleSubmit}>
          <h3>New Design</h3>

          <div class="options">
            <label>
              <input
                type="radio"
                name="type"
                value="copy"
                ?checked=${this._dialogType === 'copy'}
                @change=${this._handleTypeChange}
              >
              Copy of current
            </label>
            <label>
              <input
                type="radio"
                name="type"
                value="blank"
                ?checked=${this._dialogType === 'blank'}
                @change=${this._handleTypeChange}
              >
              Blank
            </label>
          </div>

          <div class="name-field">
            <label for="design-name">Name</label>
            <input
              id="design-name"
              type="text"
              .value=${this._nameValue}
              @input=${e => this._nameValue = e.target.value}
            >
          </div>

          <div class="actions">
            <button type="button" @click=${this._handleCancel}>Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      </dialog>
    `;
  }
}

customElements.define('create-copy-button', CreateCopyButton);
