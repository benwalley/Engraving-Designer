import { LitElement, html, css } from 'lit';

class AppLogo extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      user-select: none;
    }
    .logo {
      font-family: 'Cinzel', serif;
      font-size: 1.05rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      line-height: 1;
      white-space: nowrap;
    }
    .word-custom {
      color: var(--color-text-muted);
      font-weight: 400;
    }
    .word-engrave {
      color: var(--color-accent);
      margin-left: 0.35em;
    }
  `;

  render() {
    return html`
      <div class="logo">
        <span class="word-custom">Custom</span>
        <span class="word-engrave">Engrave</span>
      </div>
    `;
  }
}

customElements.define('app-logo', AppLogo);
