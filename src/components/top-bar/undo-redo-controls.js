import { LitElement, html, css } from 'lit';
import { on, off, emit, EVENTS } from '../../helpers/events.js';

class UndoRedoControls extends LitElement {
  static properties = {
    _canUndo: { state: true },
    _canRedo: { state: true },
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text);
      cursor: pointer;
      border-radius: var(--radius-sm);
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

    svg {
      width: 14px;
      height: 14px;
    }
  `;

  constructor() {
    super();
    this._canUndo = false;
    this._canRedo = false;
    this._onHistoryChanged = ({ canUndo, canRedo }) => {
      this._canUndo = canUndo;
      this._canRedo = canRedo;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    on(EVENTS.HISTORY_CHANGED, this._onHistoryChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.HISTORY_CHANGED, this._onHistoryChanged);
  }

  render() {
    return html`
      <button
        type="button"
        title="Undo (⌘Z)"
        ?disabled=${!this._canUndo}
        @click=${() => emit(EVENTS.UNDO_REQUESTED)}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2.5 5h6a3 3 0 0 1 0 6H6"/>
          <path d="M5 3L2.5 5L5 7"/>
        </svg>
      </button>
      <button
        type="button"
        title="Redo (⌘⇧Z)"
        ?disabled=${!this._canRedo}
        @click=${() => emit(EVENTS.REDO_REQUESTED)}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11.5 5H5.5a3 3 0 0 0 0 6H8"/>
          <path d="M9 3L11.5 5L9 7"/>
        </svg>
      </button>
    `;
  }
}

customElements.define('undo-redo-controls', UndoRedoControls);
