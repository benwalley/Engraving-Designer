import { LitElement, html, css } from 'lit';

class IconToolMove extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M8 2v12M2 8h12"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
        />
        <path
          d="M8 2L6.5 4M8 2l1.5 2M8 14l-1.5-2M8 14l1.5-2M2 8l2-1.5M2 8l2 1.5M14 8l-2-1.5M14 8l-2 1.5"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-move', IconToolMove);
