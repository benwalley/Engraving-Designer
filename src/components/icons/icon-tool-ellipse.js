import { LitElement, html, css } from 'lit';

class IconToolEllipse extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle
          cx="8" cy="8" r="5.5"
          stroke="currentColor"
          stroke-width="1.5"
          fill="none"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-ellipse', IconToolEllipse);
