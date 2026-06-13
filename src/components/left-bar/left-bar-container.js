import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { TOOLS, DEFAULT_TOOL_ID } from '../../tools/registry.js';
import './tool-button.js';
import '../right-bar/layers-panel.js';

class LeftBarContainer extends LitElement {
  static properties = {
    _activeTool: { state: true },
  };

  constructor() {
    super();
    this._activeTool = DEFAULT_TOOL_ID;
    this._onToolChanged = ({ id }) => { this._activeTool = id; };
  }

  connectedCallback() {
    super.connectedCallback();
    on(EVENTS.TOOL_CHANGED, this._onToolChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.TOOL_CHANGED, this._onToolChanged);
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      padding: 2px;
    }

    .tools-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      align-items: center;
      gap: 2px;
    }

    .panel-divider {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: var(--spacing-normal) 0 0;
    }

    layers-panel {
      flex: 1;
      min-height: 0;
      margin-top: var(--spacing-normal);
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: var(--spacing-normal);
      border-top: 1px solid var(--color-border);
      margin-top: var(--spacing-normal);
      padding-left: var(--spacing-normal);
      padding-right: var(--spacing-normal);
      padding-bottom: var(--spacing-normal);
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 7px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg);
      color: var(--color-text);
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: background var(--duration-fast) var(--easing-default),
                  border-color var(--duration-fast) var(--easing-default),
                  color var(--duration-fast) var(--easing-default);
    }

    .action-btn:hover {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent);
      color: var(--color-accent-text);
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
  `;

  _selectTool(id) {
    this._activeTool = id;
    emit(EVENTS.TOOL_CHANGED, { id });
  }

  render() {
    return html`
      <div class="tools-container">
        ${TOOLS.map(tool => html`
          <tool-button
            label=${tool.label}
            ?active=${this._activeTool === tool.id}
            @click=${() => this._selectTool(tool.id)}
          >
            ${tool.icon}
          </tool-button>
        `)}
      </div>
      <hr class="panel-divider" />
      <layers-panel></layers-panel>
      <div class="action-buttons">
        <button class="action-btn btn-primary" @click=${() => emit(EVENTS.SELECT_ITEM_TO_ENGRAVE)}>
          Select Item to Engrave
        </button>
        <button class="action-btn" @click=${() => emit(EVENTS.VIEW_3D)}>
          3D Viewer
        </button>
      </div>
    `;
  }
}

customElements.define('left-bar-container', LeftBarContainer);
