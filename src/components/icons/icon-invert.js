import { LitElement, html, css } from 'lit';

class IconInvert extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3" fill="none" />
        <path d="M8 2 A6 6 0 0 1 8 14 Z" fill="currentColor" />
      </svg>
    `;
  }
}

customElements.define('icon-invert', IconInvert);
