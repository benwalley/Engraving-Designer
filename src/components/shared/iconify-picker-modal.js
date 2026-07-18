import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';

const ICONIFY_API = 'https://api.iconify.design';
const SEARCH_LIMIT = 60;
const DEBOUNCE_MS = 350;

class IconifyPickerModal extends LitElement {
  static properties = {
    _open:     { state: true },
    _query:    { state: true },
    _icons:    { state: true },
    _loading:  { state: true },
    _selected: { state: true },
    _error:    { state: true },
  };

  static styles = css`
    :host { display: contents; }

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
      width: min(720px, 95vw);
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
      flex-shrink: 0;
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

    .search-row {
      padding: 12px 20px;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--font-size-normal);
      box-sizing: border-box;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--color-accent);
    }

    .grid-area {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      min-height: 200px;
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
      gap: 8px;
    }

    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 4px 8px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      cursor: pointer;
      transition: border-color var(--duration-fast) var(--easing-default),
                  background var(--duration-fast) var(--easing-default);
    }

    .icon-item:hover {
      border-color: var(--color-accent);
      background: var(--color-accent-subtle);
    }

    .icon-item.selected {
      border-color: var(--color-accent);
      background: var(--color-accent-subtle);
    }

    .icon-thumb-wrap {
      width: 36px;
      height: 36px;
      background: #fff;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .icon-thumb-wrap img {
      width: 28px;
      height: 28px;
    }

    .icon-label {
      font-size: 10px;
      color: var(--color-text-muted);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 64px;
      line-height: 1.2;
    }

    .state-msg {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 120px;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 8px;
    }

    .powered-by {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .footer-actions {
      display: flex;
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

    .btn:hover { background: var(--color-hover); }

    .btn-primary {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent);
      color: var(--color-accent-text);
      font-weight: 600;
    }

    .btn-primary:hover { background: var(--color-accent-subtle-active); }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this._open = false;
    this._query = '';
    this._icons = [];
    this._loading = false;
    this._selected = null;
    this._error = false;
    this._debounceTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._onOpen = () => {
      this._open = true;
      this._query = '';
      this._icons = [];
      this._selected = null;
      this._error = false;
    };
    on(EVENTS.OPEN_ICONIFY_PICKER, this._onOpen);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.OPEN_ICONIFY_PICKER, this._onOpen);
  }

  updated(changedProps) {
    if (changedProps.has('_open') && this._open) {
      this.updateComplete.then(() => {
        this.shadowRoot?.querySelector('.search-input')?.focus();
      });
    }
  }

  _onInput(e) {
    this._query = e.target.value;
    this._selected = null;
    clearTimeout(this._debounceTimer);
    if (this._query.trim().length < 2) {
      this._icons = [];
      this._loading = false;
      return;
    }
    this._loading = true;
    this._debounceTimer = setTimeout(() => this._search(), DEBOUNCE_MS);
  }

  async _search() {
    const q = this._query.trim();
    if (!q) return;
    this._error = false;
    try {
      const res = await fetch(
        `${ICONIFY_API}/search?query=${encodeURIComponent(q)}&limit=${SEARCH_LIMIT}`
      );
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      this._icons = data.icons ?? [];
    } catch {
      this._error = true;
      this._icons = [];
    }
    this._loading = false;
  }

  _thumbUrl(icon) {
    const [prefix, name] = icon.split(':');
    return `${ICONIFY_API}/${prefix}/${name}.svg?width=28&height=28&color=%23000000`;
  }

  async _confirm() {
    if (!this._selected) return;
    const [prefix, name] = this._selected.split(':');
    const url = `${ICONIFY_API}/${prefix}/${name}.svg?color=%23000000`;
    try {
      const res = await fetch(url);
      const svgString = await res.text();
      emit(EVENTS.ICONIFY_ICON_SELECTED, { svgString, iconId: this._selected });
    } catch {
      console.error('Failed to fetch Iconify SVG');
    }
    this._open = false;
  }

  _close() {
    this._open = false;
  }

  render() {
    if (!this._open) return html``;

    let content;
    if (this._loading) {
      content = html`<div class="state-msg">Searching…</div>`;
    } else if (this._error) {
      content = html`<div class="state-msg">Search failed — please try again.</div>`;
    } else if (this._icons.length === 0 && this._query.trim().length >= 2) {
      content = html`<div class="state-msg">No icons found for "${this._query}"</div>`;
    } else if (this._icons.length === 0) {
      content = html`<div class="state-msg">Type to search 200,000+ icons</div>`;
    } else {
      content = html`
        <div class="icon-grid">
          ${this._icons.map(icon => html`
            <button
              class="icon-item ${this._selected === icon ? 'selected' : ''}"
              title=${icon}
              @click=${() => { this._selected = icon; }}
              @dblclick=${() => { this._selected = icon; this._confirm(); }}
            >
              <div class="icon-thumb-wrap">
                <img src=${this._thumbUrl(icon)} alt="" loading="lazy" />
              </div>
              <span class="icon-label">${icon.split(':')[1]}</span>
            </button>
          `)}
        </div>
      `;
    }

    return html`
      <div
        class="overlay"
        @click=${(e) => { if (e.target === e.currentTarget) this._close(); }}
        @keydown=${(e) => { if (e.key === 'Escape') this._close(); }}
      >
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Search Icons</h2>
            <button class="close-btn" @click=${this._close} aria-label="Close">✕</button>
          </div>
          <div class="search-row">
            <input
              class="search-input"
              type="search"
              placeholder="Search 200,000+ icons (star, arrow, leaf, crown…)"
              .value=${this._query}
              @input=${this._onInput}
              @keydown=${(e) => { if (e.key === 'Enter' && this._selected) this._confirm(); }}
            />
          </div>
          <div class="grid-area">${content}</div>
          <div class="modal-footer">
            <span class="powered-by">Powered by Iconify</span>
            <div class="footer-actions">
              <button class="btn" @click=${this._close}>Cancel</button>
              <button
                class="btn btn-primary"
                ?disabled=${!this._selected}
                @click=${this._confirm}
              >Add to Canvas</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('iconify-picker-modal', IconifyPickerModal);
