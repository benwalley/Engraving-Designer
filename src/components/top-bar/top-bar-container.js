import { LitElement, html, css } from 'lit';
import { on, off, EVENTS } from '../../helpers/events.js';
import { DEFAULT_TOOL_ID } from '../../tools/registry.js';
import './shape-options.js';

class TopBarContainer extends LitElement {
  static properties = {
    _activeTool:    { state: true },
    _hasSelection:  { state: true },
    _selectionData: { state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: calc(var(--spacing-normal) / 2) 0;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
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

  render() {
    return html`
      ${this._showOptions ? html`<shape-options .selectionData=${this._selectionData}></shape-options>` : ''}
    `;
  }
}

customElements.define('top-bar-container', TopBarContainer);
