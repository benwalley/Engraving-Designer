import { LitElement, html, css } from 'lit';

class IconSpinner extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
    }
    svg {
      width: 1em;
      height: 1em;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" opacity="0.25"/>
        <path
          d="M14 8a6 6 0 0 0-6-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    `;
  }
}

customElements.define('icon-spinner', IconSpinner);
