import { LitElement, html, css } from 'lit';

class IconToolShape extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <polygon
          points="8,1 10.2,5.5 15.2,6.1 11.5,9.6 12.4,14.6 8,12.2 3.6,14.6 4.5,9.6 0.8,6.1 5.8,5.5"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linejoin="round"
          fill="none"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-shape', IconToolShape);
