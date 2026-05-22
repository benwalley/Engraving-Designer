import { LitElement, html, css } from 'lit';

class IconToolZoom extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle
          cx="7" cy="7" r="4.5"
          stroke="currentColor"
          stroke-width="1.5"
          fill="none"
        />
        <path
          d="M10.5 10.5l3 3"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-zoom', IconToolZoom);
