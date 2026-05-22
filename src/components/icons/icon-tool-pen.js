import { LitElement, html, css } from 'lit';

class IconToolPen extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M11 2.5l2.5 2.5-8 8L3 14l.5-2.5 8-8z"
          stroke="currentColor"
          stroke-width="1.3"
          fill="none"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <path
          d="M9.5 4l2.5 2.5"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linecap="round"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-pen', IconToolPen);
