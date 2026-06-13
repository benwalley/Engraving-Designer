import { LitElement, html, css } from 'lit';

class IconToolGrab extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M8 1 L6 3.5 H7.25 V7.25 H3.5 V6 L1 8 L3.5 10 V8.75 H7.25 V12.5 H6 L8 15 L10 12.5 H8.75 V8.75 H12.5 V10 L15 8 L12.5 6 V7.25 H8.75 V3.5 H10 Z"
          stroke="currentColor"
          stroke-width="0.8"
          fill="currentColor"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-grab', IconToolGrab);
