import { LitElement, html, css } from 'lit';
import { getLocalDbVersions, saveLocalDbVersion } from '../../helpers/local-db.js';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { getItem, setItem, LOCAL } from '../../helpers/local-storage.js';
import { buttonStyles } from '../component-styles/button-styles.js';
import { scrollbarStyles } from '../component-styles/scrollbar-styles.js';
import { DEFAULT_VERSION } from '../../defaults.js';
import '../icons/icon-chevron-down.js';

class VersionPicker extends LitElement {
  static styles = [
    buttonStyles,
    scrollbarStyles,
    css`
      :host {
        display: block;
        position: relative;
        color: var(--color-text);
      }

      .version-picker-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
      }

      input[type='text'] {
        font-size: var(--font-size-sm);
        padding: 6px 28px 6px 10px;
        border: none;
        color: var(--color-text);
        border-bottom: 1px solid var(--color-border);
        border-radius: 0;
        background: transparent;
        width: 100%;
        text-align: center;
      }

      input[type='text']:hover {
        border-bottom-color: var(--color-border-hover);
      }

      input[type='text']:focus {
        outline: none;
        border-bottom-color: var(--color-accent);
      }

      .chevron-btn {
        position: absolute;
        right: 4px;
        border: none;
        background: transparent;
        padding: 2px 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
      }

      .chevron-btn:hover {
        background: transparent;
        border: none;
      }

      .chevron-btn:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 1px;
        border-radius: var(--radius-sm);
      }

      icon-chevron-down {
        transition: transform var(--duration-fast) var(--easing-default);
        font-size: 1rem;
      }

      icon-chevron-down.open {
        transform: rotate(180deg);
      }

      ul[role='listbox'] {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        min-width: 100%;
        margin: 0;
        padding: 4px;
        list-style: none;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        box-shadow: var(--shadow-dropdown);
        z-index: 100;
        max-height: 70vh;
        overflow: auto;
      }

      ul[role='listbox'][hidden] {
        display: none;
      }

      .option {
        padding: 6px 10px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: var(--font-size-sm);
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }

      .option--active {
        background: var(--color-surface);
        outline: 2px solid var(--color-accent);
        outline-offset: -2px;
      }

      .option--selected {
        font-weight: 500;
        background: var(--color-accent-subtle);
        color: var(--color-accent-text);
      }

      .option--selected.option--active {
        background: var(--color-accent-subtle-active);
      }

      .updatedDate {
        font-size: 8px;
        opacity: .7;
      }
    `,
  ];

  static properties = {
    versions:    { state: true },
    selectedId:  { state: true },
    open:        { state: true },
    activeIndex: { state: true },
    _editName:   { state: true },
  };

  constructor() {
    super();
    this.versions    = [];
    this.selectedId  = null;
    this.open        = false;
    this.activeIndex = -1;
    this._editName   = '';
    this.debounceTimeout = undefined;

    this._boundHandleDelete  = (id) => this.handleDelete(id);
    this._boundClickOutside  = (e) => this._handleClickOutside(e);
    this._boundVersionSelected = async () => {
      this.versions = await getLocalDbVersions();
      const currentId = getItem(LOCAL.CURRENT_VERSION_ID);
      const selected = this.versions.find(v => v.id === currentId);
      if (selected) {
        this.selectedId = selected.id;
        this._editName  = selected.name ?? '';
      }
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.setCurrentVersionBasedOnSavedState();
    on(EVENTS.VERSION_DELETED, this._boundHandleDelete);
    on(EVENTS.VERSION_SELECTED, this._boundVersionSelected);
    document.addEventListener('click', this._boundClickOutside);
  }

  async setCurrentVersionBasedOnSavedState() {
    emit(EVENTS.VERSION_SAVING)
    const saved = await getLocalDbVersions();
    const savedCurrentVersionId = getItem(LOCAL.CURRENT_VERSION_ID);
    if (saved.length > 0) {
      this.versions = saved;
      const match = saved.find(v => v.id === savedCurrentVersionId);
      const selected = match ?? saved[0];
      this.selectedId = selected.id;
      this._editName  = selected.name ?? '';
      setItem(LOCAL.CURRENT_VERSION_ID, selected.id);
      emit(EVENTS.VERSION_SELECTED, selected);
      emit(EVENTS.VERSION_SAVED);
    } else {
      const newVersion = { ...DEFAULT_VERSION, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
      await saveLocalDbVersion(newVersion);
      setItem(LOCAL.CURRENT_VERSION_ID, newVersion.id);
      this.versions   = [newVersion];
      this.selectedId = newVersion.id;
      this._editName  = newVersion.name;
      emit(EVENTS.VERSION_SELECTED, newVersion);
      emit(EVENTS.VERSION_SAVED, newVersion);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.VERSION_DELETED,  this._boundHandleDelete);
    off(EVENTS.VERSION_SELECTED, this._boundVersionSelected);
    document.removeEventListener('click', this._boundClickOutside);
  }

  get _selectedVersion() {
    return this.versions.find(v => v.id === this.selectedId) ?? null;
  }

  get _selectedIndex() {
    for(let i = 0; i < this.versions.length; i++) {
      const version = this.versions[i];
      if(version.id === this.selectedId) return i;
    }
    return -1;
  }

  async handleDelete(id) {
    this.versions = await getLocalDbVersions();
    if (this.versions.length === 0) {
      await this.setCurrentVersionBasedOnSavedState();
      if (this.open) this._closeDropdown(false);
      return;
    }
    if (this.selectedId === id) {
      const first = this.versions[0] ?? null;
      this.selectedId = first?.id ?? null;
      this._editName  = first?.name ?? '';
      if (first) {
        setItem(LOCAL.CURRENT_VERSION_ID, first.id);
        emit(EVENTS.VERSION_SELECTED, first);
      }
    }
    if (this.open) this._closeDropdown(false);
  }

  _selectVersion(versionData) {
    if(!versionData?.id) return;
    this.selectedId = versionData.id;
    setItem(LOCAL.CURRENT_VERSION_ID, versionData.id);
    emit(EVENTS.VERSION_SELECTED, versionData);
    this._editName = versionData?.name || '';

  }

  _openDropdown() {
    this.open = true;
    const idx = this.versions.findIndex(version => version.id === this.selectedId);
    this.activeIndex = idx >= 0 ? idx : 0;
  }

  _closeDropdown(returnFocus = false) {
    this.open        = false;
    this.activeIndex = -1;
    if (returnFocus) {
      this.shadowRoot?.querySelector('input[type="text"]')?.focus();
    }
  }

  _handleClickOutside(e) {
    if (!e.composedPath().includes(this)) {
      this._closeDropdown(false);
    }
  }

  _handleNameInput(e) {
    this._editName = e.target.value;
    this.debouncedSaveName(e.target.value);
  }

  debouncedSaveName(name) {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = window.setTimeout(() => {
      this._saveRename();
    }, 1000);
  }

  _handleNameKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._saveRename();
      e.target.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._editName = this._selectedVersion?.name ?? '';
      e.target.blur();
    }
  }

  _formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  sortVersions(versions) {
    return [...versions].sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async reloadVersions() {
    this.versions = await getLocalDbVersions();
  }

  async _saveRename() {
    const selected = this._selectedVersion;
    const newName  = this._editName.trim();
    if (!selected || !newName || newName === selected.name) return;
    const updated = { ...selected, name: newName, updatedAt: new Date() };
    emit(EVENTS.VERSION_SAVING, updated);
    await saveLocalDbVersion(updated);
    await this.reloadVersions();
    emit(EVENTS.VERSION_SAVED, updated);
  }

  _handleChevronClick(e) {
    e.stopPropagation();
    if (this.open) {
      this._closeDropdown(false);
    } else {
      this._openDropdown();
    }
  }

  _handleChevronKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.open) this._openDropdown();
    }
  }

  _handleWrapperKeyDown(e) {
    if (!this.open) return;
    const count = this.versions.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, count - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.activeIndex >= 0) this._selectVersion(this.versions[this.activeIndex]);
        this._closeDropdown(true);
        break;
      case 'Escape':
        e.preventDefault();
        this._closeDropdown(true);
        break;
      case 'Tab':
        this._closeDropdown(false);
        break;
    }
  }

  render() {
    return html`
      <div
        class="version-picker-wrapper"
        @keydown=${this._handleWrapperKeyDown}
      >
        <input
          type="text"
          aria-label="Version name"
          .value=${this._editName}
          @input=${this._handleNameInput}
          @blur=${this._saveRename}
          @keydown=${this._handleNameKeyDown}
        />

        <button
          type="button"
          class="chevron-btn"
          aria-label="Switch version"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-haspopup="listbox"
          aria-controls="vp-listbox"
          @click=${this._handleChevronClick}
          @keydown=${this._handleChevronKeyDown}
        >
          <icon-chevron-down class="${this.open ? 'open' : ''}"></icon-chevron-down>
        </button>

        <ul
          id="vp-listbox"
          role="listbox"
          aria-label="Versions"
          class="scrollbar"
          ?hidden=${!this.open}
        >
          ${this.versions.length === 0
            ? html`<li role="option" aria-selected="false" class="option">No versions</li>`
            : this.sortVersions(this.versions).map(
                (v, i) => html`
                  <li
                    id="vp-opt-${i}"
                    role="option"
                    aria-selected=${v.id === this.selectedId ? 'true' : 'false'}
                    class="option ${i === this.activeIndex ? 'option--active' : ''} ${v.id === this.selectedId ? 'option--selected' : ''}"
                    @click=${(e) => this._selectVersion(v)}
                    @mouseenter=${() => { this.activeIndex = i; }}
                  >
                    <span>${v.name ?? v.id}</span>
                    <span class="updatedDate">${this._formatDate(v.updatedAt)}</span>
                  </li>
                `
              )}
        </ul>
      </div>
`;
  }
}

customElements.define('version-picker', VersionPicker);
