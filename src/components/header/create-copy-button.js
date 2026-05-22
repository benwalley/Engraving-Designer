import { LitElement, html } from 'lit';
import { getLocalDbVersionById, getLocalDbVersions, saveLocalDbVersion } from '../../helpers/local-db.js';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { getItem, LOCAL, setItem } from '../../helpers/local-storage.js';
import { buttonStyles } from '../component-styles/button-styles.js';
import { DEFAULT_VERSION } from '../../defaults.js';

class CreateCopyButton extends LitElement {
  static styles = [buttonStyles];

  static properties = {
    
  };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  async getCurrentVersionData() {
    const currentVersionId = getItem(LOCAL.CURRENT_VERSION_ID);
    if(!currentVersionId) return DEFAULT_VERSION;
    const currentVersionData = getLocalDbVersionById(currentVersionId);
    if(!currentVersionData) return DEFAULT_VERSION;
    return currentVersionData
  }

  async _handleClick() {
    const currentVersionData = await this.getCurrentVersionData();
    const copyId = crypto.randomUUID()
    const copy = {
      ...currentVersionData,
      id: copyId,
      updatedAt: Date.now(),
      name: `${currentVersionData.name ?? currentVersionData.id} (Copy)`,
    };
    await saveLocalDbVersion(copy);
    setItem(LOCAL.CURRENT_VERSION_ID, copyId)
    emit(EVENTS.VERSION_SELECTED)
  }

  render() {
    return html`
      <button @click=${this._handleClick}>
        Create Copy
      </button>
    `;
  }
}

customElements.define('create-copy-button', CreateCopyButton);
