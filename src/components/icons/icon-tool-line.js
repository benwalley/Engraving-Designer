import { LitElement, html, css } from 'lit';

class IconToolLine extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="3.5" cy="12.5" r="1.5" fill="currentColor" />
        <circle cx="12.5" cy="3.5" r="1.5" fill="currentColor" />
        <path
          d="M4.5 11.5l7-7"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-line', IconToolLine);
