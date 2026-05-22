import { LitElement, html, css } from 'lit';

class IconToolSelect extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M4 2v9.5l2-2 1.5 3.5 1.5-.7-1.5-3.3 3-.5z"
          stroke="currentColor"
          stroke-width="1.3"
          fill="none"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </svg>
    `;
  }
}

customElements.define('icon-tool-select', IconToolSelect);
