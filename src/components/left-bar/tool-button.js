import { LitElement, html, css } from 'lit';

class ToolButton extends LitElement {
  static properties = {
    label: { type: String },
  };

  static styles = css`
    :host { display: block; }

    button {
      --tool-size: 47px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--tool-size);
      height: var(--tool-size);
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 18px;
    }

    button:hover {
      background: var(--color-accent-subtle);
      color: var(--color-accent);
    }
  `;

  _handleClick() {
    // TODO
  }

  render() {
    return html`
      <button type="button" title=${this.label} @click=${this._handleClick}>
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('tool-button', ToolButton);
