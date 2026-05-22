import { LitElement, html, css } from 'lit';

class IconToolText extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M8 2.5L3 13.5M8 2.5L13 13.5M5.3 8.5h5.4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-text', IconToolText);
