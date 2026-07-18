import { LitElement, html, css } from 'lit';

class PopupMenu extends LitElement {
  static styles = css`
    .trigger-wrap {
      display: contents;
    }

    dialog {
      border: 1px solid var(--color-border);
      border-radius: 12px;
      background: var(--color-bg);
      color: var(--color-text);
      padding: 0;
      box-shadow: 0 8px 32px rgb(0 0 0 / 0.2);
    }

    dialog::backdrop {
      background: var(--color-overlay);
    }
  `;

  async _open() {
    await this.updateComplete;
    this.shadowRoot.querySelector('dialog').showModal();
  }

  close() {
    this.shadowRoot.querySelector('dialog').close();
  }

  _onDialogClick(e) {
    if (e.target === e.currentTarget) {
      this.close();
    }
  }

  render() {
    return html`
      <span class="trigger-wrap" @click=${this._open}>
        <slot name="trigger"></slot>
      </span>
      <dialog @click=${this._onDialogClick}>
        <slot></slot>
      </dialog>
    `;
  }
}

customElements.define('popup-menu', PopupMenu);
