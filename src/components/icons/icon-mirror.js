import { LitElement, html, css } from 'lit';

class IconMirror extends LitElement {
  static properties = {
    rotate: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host { display: inline-flex; }
    svg {
      width: 1em;
      height: 1em;
      transition: transform 0.15s ease;
    }
    :host([rotate]) svg {
      transform: rotate(90deg);
    }
  `;

  constructor() {
    super();
    this.rotate = false;
  }

  render() {
    return html`
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="M13 13v2h-1v-2zm0-10V1h-1v2zm0 16v-2h-1v2zM12 9v2h1V9zm0-4v2h1V5zm0 16v2h1v-2zm11-2V6l-9 6.5zm-12-6.5L2 19V6zm-8 4.544L9.292 12.5 3 7.956z"/>
      </svg>
    `;
  }
}

customElements.define('icon-mirror', IconMirror);
