import { LitElement, html, css } from 'lit';

class LeftBarContainer extends LitElement {
  static styles = [
      css`
        :host {
          padding: var(--spacing-normal);
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
        }
      `,
    ];

  render() {
    return html`<div></div>`;
  }
}

customElements.define('left-bar-container', LeftBarContainer);
