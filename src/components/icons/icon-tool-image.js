import { LitElement, html, css } from 'lit';

class IconToolImage extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1.5" y="3" width="13" height="10" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <circle cx="5.5" cy="6.5" r="1" fill="currentColor"/>
        <polyline points="1.5,11 5,7.5 7.5,10 10,7.5 14.5,12" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      </svg>
    `;
  }
}

customElements.define('icon-tool-image', IconToolImage);
