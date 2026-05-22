import { LitElement, html, css } from 'lit';
import './tool-button.js';
import '../icons/icon-tool-select.js';
import '../icons/icon-tool-move.js';
import '../icons/icon-tool-rectangle.js';
import '../icons/icon-tool-ellipse.js';
import '../icons/icon-tool-text.js';
import '../icons/icon-tool-line.js';
import '../icons/icon-tool-pen.js';
import '../icons/icon-tool-zoom.js';

const TOOLS = [
  { id: 'select',    label: 'Select',    icon: html`<icon-tool-select></icon-tool-select>` },
  { id: 'move',      label: 'Move',      icon: html`<icon-tool-move></icon-tool-move>` },
  { id: 'rectangle', label: 'Rectangle', icon: html`<icon-tool-rectangle></icon-tool-rectangle>` },
  { id: 'ellipse',   label: 'Ellipse',   icon: html`<icon-tool-ellipse></icon-tool-ellipse>` },
  { id: 'text',      label: 'Text',      icon: html`<icon-tool-text></icon-tool-text>` },
  { id: 'line',      label: 'Line',      icon: html`<icon-tool-line></icon-tool-line>` },
  { id: 'pen',       label: 'Pen',       icon: html`<icon-tool-pen></icon-tool-pen>` },
  { id: 'zoom',      label: 'Zoom',      icon: html`<icon-tool-zoom></icon-tool-zoom>` },
];

class LeftBarContainer extends LitElement {
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

  render() {
    return html`
      <div class="tools-container">
        ${TOOLS.map(tool => html`
          <tool-button label=${tool.label}>
            ${tool.icon}
          </tool-button>
        `)}
      </div>
    `;
  }
}

customElements.define('left-bar-container', LeftBarContainer);
