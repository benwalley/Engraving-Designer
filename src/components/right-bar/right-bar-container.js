import { LitElement, html, css } from "lit";

class RightBarContainer extends LitElement {
  static styles = [
    css`
      :host {
        padding: var(--spacing-normal);
        background: var(--color-surface);
        border-left: 1px solid var(--color-border);
      }
    `,
  ];

  render() {
    return html`<div></div>`;
  }
}

customElements.define("right-bar-container", RightBarContainer);
