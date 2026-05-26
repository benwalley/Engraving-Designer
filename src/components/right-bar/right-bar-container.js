import { LitElement, html, css } from "lit";

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
    `,
  ];

  render() {
    return html`<layers-panel></layers-panel>`;
  }
}

customElements.define("right-bar-container", RightBarContainer);
