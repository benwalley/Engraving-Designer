import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';

class ClipToggleButton extends LitElement {
  static properties = {
    _active: { state: true },
  };

  constructor() {
    super();
    this._active = false;
    this._onToggle = ({ active }) => { this._active = active; };
  }

  connectedCallback() {
    super.connectedCallback();
    on(EVENTS.CLIP_BOUNDARY_TOGGLED, this._onToggle);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.CLIP_BOUNDARY_TOGGLED, this._onToggle);
  }

  _toggle() {
    const next = !this._active;
    this._active = next;
    emit(EVENTS.CLIP_BOUNDARY_TOGGLED, { active: next });
  }

  static styles = css`
    :host {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 100;
    }
    button {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      border: 1.5px solid var(--color-border, #d1d5db);
      background: var(--color-surface, #ffffff);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
      color: var(--color-text-muted, #6b7280);
      padding: 0;
    }
    button:hover {
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
    }
    button.active {
      background: #6366f1;
      border-color: #4f46e5;
      color: #ffffff;
    }
    svg {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }
    .tooltip {
      position: absolute;
      bottom: calc(100% + 0.5rem);
      right: 0;
      width: max-content;
      max-width: 14rem;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      background: #1f2937;
      color: #ffffff;
      font-size: 0.75rem;
      line-height: 1.35;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      pointer-events: none;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.15s, transform 0.15s;
    }
    button:hover + .tooltip,
    button:focus-visible + .tooltip {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  render() {
    const tip = this._active
      ? 'Show all content, including areas outside the boundary'
      : 'Clip to boundary — hides the sections that won’t get engraved';
    return html`
      <button
        class=${this._active ? 'active' : ''}
        aria-label=${tip}
        @click=${this._toggle}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2v4M6 18v4M18 2v4M18 18v4M2 6h4M18 6h4M2 18h4M18 18h4"/>
          <rect x="6" y="6" width="12" height="12" rx="1"/>
        </svg>
      </button>
      <div class="tooltip" role="tooltip">${tip}</div>
    `;
  }
}

customElements.define('clip-toggle-button', ClipToggleButton);
