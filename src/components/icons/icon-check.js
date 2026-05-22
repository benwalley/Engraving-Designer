import { LitElement, html, css } from 'lit';

class IconCheck extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
    }
    svg {
      width: 1em;
      height: 1em;
    }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M3 8l4 4 6-6"
          stroke="currentColor"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }
}

customElements.define('icon-check', IconCheck);
