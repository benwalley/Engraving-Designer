import { LitElement, html, css } from "lit";
import { emit, EVENTS } from "../../helpers/events.js";

class RightBarContainer extends LitElement {
  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        padding: var(--spacing-normal);
        background: var(--color-surface);
        border-left: 1px solid var(--color-border);
        overflow: hidden;
      }

      layers-panel {
        flex: 1;
        min-height: 0;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: var(--spacing-normal);
        border-top: 1px solid var(--color-border);
        margin-top: var(--spacing-normal);
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
    `,
  ];

  render() {
    return html`
      <layers-panel></layers-panel>
      <div class="action-buttons">
        <button class="action-btn btn-primary" @click=${() => emit(EVENTS.SELECT_ITEM_TO_ENGRAVE)}>
          Select Item to Engrave
        </button>
        <button class="action-btn btn-secondary" @click=${() => emit(EVENTS.VIEW_3D)}>
          3D Viewer
        </button>
      </div>
    `;
  }
}

customElements.define("right-bar-container", RightBarContainer);
