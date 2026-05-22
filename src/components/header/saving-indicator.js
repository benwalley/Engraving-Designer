import { LitElement, html, css } from 'lit';
import { on, off, EVENTS } from '../../helpers/events.js';
import '../icons/icon-spinner.js';
import '../icons/icon-check.js';

class SavingIndicator extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      color: var(--color-success);
      font-size: 1rem;
      margin-left: auto;
      flex-direction: column;
    }

    .text {
      font-size: 8px;
    }
  `;

  static properties = {
    _status: { state: true },
  };

  constructor() {
    super();
    this._status = 'idle';
    this._savedTimeout = null;
    this._boundOnSaving = () => this._onSaving();
    this._boundOnSaved  = () => this._onSaved();
  }

  connectedCallback() {
    super.connectedCallback();
    on(EVENTS.VERSION_SAVING, this._boundOnSaving);
    on(EVENTS.VERSION_SAVED,  this._boundOnSaved);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.VERSION_SAVING, this._boundOnSaving);
    off(EVENTS.VERSION_SAVED,  this._boundOnSaved);
    clearTimeout(this._savedTimeout);
  }

  _onSaving() {
    clearTimeout(this._savedTimeout);
    this._status = 'saving';
  }

  _onSaved() {
    this._status = 'saved';
    this._savedTimeout = setTimeout(() => {
      this._status = 'idle';
    }, 5000);
  }

  render() {
    if (this._status === 'saving') return html`
    <icon-spinner></icon-spinner>
      <span class="text">Saving</span>
    `;
    if (this._status === 'saved')  return html`
    <icon-check></icon-check>
    <span class="text">Saved</span>
    `;
    return html``;
  }
}

customElements.define('saving-indicator', SavingIndicator);
