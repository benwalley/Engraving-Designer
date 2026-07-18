import { LitElement, html, css } from 'lit';

class IconToolIcons extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.4" fill="none"/>
        <line x1="10" y1="10" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <polygon
          points="6.5,3.8 7.2,5.4 9,5.6 7.7,6.8 8.1,8.6 6.5,7.7 4.9,8.6 5.3,6.8 4,5.6 5.8,5.4"
          stroke="currentColor"
          stroke-width="0.8"
          stroke-linejoin="round"
          fill="none"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-icons', IconToolIcons);
