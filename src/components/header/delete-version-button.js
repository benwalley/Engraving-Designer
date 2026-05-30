import { LitElement, html, css } from 'lit';
import { deleteLocalDbVersion, getLocalDbVersions } from '../../helpers/local-db.js';
import { emit, EVENTS } from '../../helpers/events.js';
import { getItem, LOCAL } from '../../helpers/local-storage.js';
import { buttonStyles } from '../component-styles/button-styles.js';

class DeleteVersionButton extends LitElement {
  static styles = [
    buttonStyles,
    css`
      button.danger {
        color: var(--color-danger);
        border-color: var(--color-danger);
      }

      button.danger:hover:not(:disabled) {
        background: var(--color-danger);
        color: var(--color-danger-text);
      }

      dialog {
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        color: var(--color-text);
        box-shadow: var(--shadow-dropdown);
        padding: 1.5rem;
        min-width: 300px;
      }

      dialog::backdrop {
        background: var(--color-overlay);
      }

      p {
        margin: 0 0 1.25rem;
        font-size: var(--font-size-sm);
        line-height: 1.5;
      }

      strong {
        font-weight: 600;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
    `,
  ];

  static properties = {
    _versionName: { state: true },
  };

  constructor() {
    super();
    this._versionName = '';
  }

  async _handleClick() {
    const currentVersionId = getItem(LOCAL.CURRENT_VERSION_ID);
    if (!currentVersionId) return;
    const versions = await getLocalDbVersions();
    const current = versions.find(v => v.id === currentVersionId);
    this._versionName = current?.name ?? 'this design';
    await this.updateComplete;
    this.shadowRoot.querySelector('dialog').showModal();
  }

  async _handleConfirm() {
    const currentVersionId = getItem(LOCAL.CURRENT_VERSION_ID);
    if (!currentVersionId) return;
    await deleteLocalDbVersion(currentVersionId);
    emit(EVENTS.VERSION_DELETED, currentVersionId);
    this.shadowRoot.querySelector('dialog').close();
  }

  _handleCancel() {
    this.shadowRoot.querySelector('dialog').close();
  }

  render() {
    return html`
      <button
        class="danger"
        @click=${this._handleClick}
      >Delete</button>

      <dialog>
        <p>Delete <strong>${this._versionName}</strong>? This cannot be undone.</p>
        <div class="actions">
          <button type="button" @click=${this._handleCancel}>Cancel</button>
          <button type="button" class="danger" @click=${this._handleConfirm}>Delete</button>
        </div>
      </dialog>
    `;
  }
}

customElements.define('delete-version-button', DeleteVersionButton);
