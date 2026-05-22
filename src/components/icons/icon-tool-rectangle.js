import { LitElement, html, css } from 'lit';

class IconToolRectangle extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect
          x="3" y="3" width="10" height="10" rx="1"
          stroke="currentColor"
          stroke-width="1.5"
          fill="none"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-rectangle', IconToolRectangle);
