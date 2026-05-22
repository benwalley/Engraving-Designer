import { LitElement, html, css } from 'lit';

class TopBarContainer extends LitElement {
  static styles = [
    
      css`
        :host {
          padding: var(--spacing-normal);
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }
      `,
    ];

  render() {
    return html`<div></div>`;
  }
}

customElements.define('top-bar-container', TopBarContainer);
