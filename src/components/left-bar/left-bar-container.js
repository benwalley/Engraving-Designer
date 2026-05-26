import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { TOOLS, DEFAULT_TOOL_ID } from '../../tools/registry.js';
import './tool-button.js';

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
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      padding: 2px;
    }

    .tools-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 2px;
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
    `;
  }
}

customElements.define('left-bar-container', LeftBarContainer);
