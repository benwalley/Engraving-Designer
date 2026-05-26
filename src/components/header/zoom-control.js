import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { MIN_ZOOM, MAX_ZOOM } from '../../canvas/pan-zoom.js';

class ZoomControl extends LitElement {
  static properties = {
    _zoom: { state: true },
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text);
      cursor: pointer;
      border-radius: 4px;
      font-size: 16px;
      line-height: 1;
    }

    button:hover:not(:disabled) {
      background: var(--color-accent-subtle);
      color: var(--color-accent);
      border-color: var(--color-accent);
    }

    button:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .value {
      min-width: 4ch;
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-text);
      font-variant-numeric: tabular-nums;
    }
  `;

  constructor() {
    super();
    this._zoom = 1;
    this._onZoomChanged = ({ zoom }) => { this._zoom = zoom; };
  }

  connectedCallback() {
    super.connectedCallback();
    on(EVENTS.ZOOM_CHANGED, this._onZoomChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.ZOOM_CHANGED, this._onZoomChanged);
  }

  _step(delta) {
    const pct = Math.round(this._zoom * 100);
    const next = delta > 0
      ? Math.ceil((pct + 1) / 10) * 10
      : Math.floor((pct - 1) / 10) * 10;
    const zoom = Math.min(MAX_ZOOM * 100, Math.max(MIN_ZOOM * 100, next)) / 100;
    emit(EVENTS.ZOOM_SET, { zoom });
  }

  render() {
    const pct = Math.round(this._zoom * 100);
    return html`
      <button type="button" ?disabled=${this._zoom <= MIN_ZOOM} @click=${() => this._step(-1)}>−</button>
      <span class="value">${pct}%</span>
      <button type="button" ?disabled=${this._zoom >= MAX_ZOOM} @click=${() => this._step(1)}>+</button>
    `;
  }
}

customElements.define('zoom-control', ZoomControl);
