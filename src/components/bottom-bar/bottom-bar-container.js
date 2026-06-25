import { LitElement, html, css } from 'lit';
import { on, off, EVENTS } from '../../helpers/events.js';

class BottomBarContainer extends LitElement {
  static properties = {
    _message: { state: true },
  };

  constructor() {
    super();
    this._message = '';
    this._onHintChanged = ({ message }) => { this._message = message; };
  }

  connectedCallback() {
    super.connectedCallback();
    on(EVENTS.HINT_CHANGED, this._onHintChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.HINT_CHANGED, this._onHintChanged);
  }

  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      pointer-events: none;
    }
    .pill {
      pointer-events: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 999px;
      box-shadow: var(--shadow-dropdown);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      padding: 0.35rem 1rem;
      white-space: nowrap;
      max-width: 60ch;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  render() {
    return html`<div class="pill">${this._message}</div>`;
  }
}

customElements.define('bottom-bar-container', BottomBarContainer);
