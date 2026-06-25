import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { DEFAULT_TOOL_ID } from '../../tools/registry.js';
import './shape-options.js';
import '../icons/icon-delete.js';

class TopBarContainer extends LitElement {
  static properties = {
    _activeTool:    { state: true },
    _hasSelection:  { state: true },
    _selectionData: { state: true },
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      padding: calc(var(--spacing-normal) / 2) 0;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      overflow: auto;
      min-height: 45px;
    }
    .delete-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      margin-right: var(--spacing-normal);
      padding: 0.25rem;
      line-height: 0;
      background: transparent;
      border: 1px solid var(--color-danger);
      border-radius: 4px;
      color: var(--color-danger);
      font-size: 13px;
      cursor: pointer;
    }
    .delete-btn:hover {
      background: var(--color-danger);
      color: var(--color-danger-text);
    }
  `;

  constructor() {
    super();
    this._activeTool    = DEFAULT_TOOL_ID;
    this._hasSelection  = false;
    this._selectionData = null;

    this._onToolChanged = ({ id }) => {
      this._activeTool    = id;
      this._hasSelection  = false;
      this._selectionData = null;
    };
    this._onSelectionChanged = (data) => {
      this._hasSelection  = data !== null;
      this._selectionData = data;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    on(EVENTS.TOOL_CHANGED,      this._onToolChanged);
    on(EVENTS.SELECTION_CHANGED, this._onSelectionChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.TOOL_CHANGED,      this._onToolChanged);
    off(EVENTS.SELECTION_CHANGED, this._onSelectionChanged);
  }

  get _showOptions() {
    if (this._activeTool === 'shape')      return true;
    if (this._activeTool === 'decoration') return true;
    if (this._activeTool === 'line')       return true;
    if (this._activeTool === 'text')       return true;
    if (this._activeTool === 'select')     return this._hasSelection;
    return false;
  }

  _toggleSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };

  _deleteLayer() {
    if (this._selectionData?.id) emit(EVENTS.LAYER_DELETED, { id: this._selectionData.id });
  }

  render() {
    return html`
      <shape-options
        .selectionData=${this._selectionData}
        .showOptions=${this._showOptions}
        .onToggleSidebar=${this._toggleSidebar}
      ></shape-options>
      ${this._hasSelection ? html`
        <button class="delete-btn" @click=${this._deleteLayer} title="Delete layer">
          <icon-delete></icon-delete>
        </button>
      ` : ''}
    `;
  }
}

customElements.define('top-bar-container', TopBarContainer);
