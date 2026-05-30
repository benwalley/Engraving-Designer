import { LitElement, html, css } from 'lit';
import { emit, EVENTS } from '../../helpers/events.js';
import { getItem, setItem, LOCAL } from '../../helpers/local-storage.js';
import { gridState } from '../../helpers/grid.js';

class GridControls extends LitElement {
  static properties = {
    _showGrid:   { state: true },
    _snapToGrid: { state: true },
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }

    button {
      display: flex;
      align-items: center;
      gap: 5px;
      height: 28px;
      padding: 0 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-muted);
      font-size: 0.8125rem;
      cursor: pointer;
      white-space: nowrap;
    }

    button:hover {
      border-color: var(--color-border-hover);
      color: var(--color-text);
    }

    button[aria-pressed="true"] {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent);
      color: var(--color-accent-text);
    }

    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    svg {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
    }
  `;

  constructor() {
    super();
    this._showGrid   = gridState.showGrid;
    this._snapToGrid = gridState.snapToGrid;
  }

  _toggleGrid() {
    this._showGrid = !this._showGrid;
    if (!this._showGrid && this._snapToGrid) {
      this._snapToGrid = false;
      gridState.snapToGrid = false;
      setItem(LOCAL.GRID_SNAP, false);
    }
    gridState.showGrid = this._showGrid;
    setItem(LOCAL.GRID_SHOW, this._showGrid);
    emit(EVENTS.GRID_CHANGED, { showGrid: this._showGrid, snapToGrid: this._snapToGrid });
  }

  _toggleSnap() {
    this._snapToGrid = !this._snapToGrid;
    gridState.snapToGrid = this._snapToGrid;
    setItem(LOCAL.GRID_SNAP, this._snapToGrid);
    emit(EVENTS.GRID_CHANGED, { showGrid: this._showGrid, snapToGrid: this._snapToGrid });
  }

  render() {
    return html`
      <button type="button" aria-pressed=${this._showGrid} @click=${this._toggleGrid}>
        ${this._gridIcon()}
        Show Grid
      </button>
      <button type="button" aria-pressed=${this._snapToGrid} ?disabled=${!this._showGrid} @click=${this._toggleSnap}>
        ${this._snapIcon()}
        Snap
      </button>
    `;
  }

  _gridIcon() {
    return html`<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
      <rect x="0.6" y="0.6" width="11.8" height="11.8" rx="1"/>
      <line x1="4.5" y1="0.6" x2="4.5" y2="12.4"/>
      <line x1="8.5" y1="0.6" x2="8.5" y2="12.4"/>
      <line x1="0.6" y1="4.5" x2="12.4" y2="4.5"/>
      <line x1="0.6" y1="8.5" x2="12.4" y2="8.5"/>
    </svg>`;
  }

  _snapIcon() {
    return html`<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="2" fill="currentColor" stroke="none"/>
      <circle cx="1.5" cy="1.5" r="1"/>
      <circle cx="11.5" cy="1.5" r="1"/>
      <circle cx="1.5" cy="11.5" r="1"/>
      <circle cx="11.5" cy="11.5" r="1"/>
      <circle cx="6.5" cy="1.5" r="1"/>
      <circle cx="1.5" cy="6.5" r="1"/>
      <circle cx="11.5" cy="6.5" r="1"/>
      <circle cx="6.5" cy="11.5" r="1"/>
    </svg>`;
  }
}

customElements.define('grid-controls', GridControls);
