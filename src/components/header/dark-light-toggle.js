import { LitElement, html, css } from 'lit';
import { buttonStyles } from '../component-styles/button-styles.js';
import { getItem, setItem, LOCAL } from '../../helpers/local-storage.js';

class DarkLightToggle extends LitElement {
  static styles = [
    buttonStyles,
    css`
      :host { display: inline-flex; align-items: center; }
      button { display: inline-flex; align-items: center; justify-content: center; padding: 6px; line-height: 0; }
      svg { width: 1rem; height: 1rem; display: block; }
    `,
  ];

  static properties = { _isDark: { state: true } };

  constructor() {
    super();
    const stored = getItem(LOCAL.THEME);
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
      this._isDark = stored === 'dark';
    } else {
      this._isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  _handleClick() {
    this._isDark = !this._isDark;
    const theme = this._isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    setItem(LOCAL.THEME, theme);
  }

  render() {
    return html`
      <button type="button"
        aria-label=${this._isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        @click=${this._handleClick}>
        ${this._isDark ? this._sunIcon() : this._moonIcon()}
      </button>`;
  }

  _sunIcon() {
    return html`<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M11.89 4.11l1.06-1.06M3.05 12.95l1.06-1.06"
        stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  }

  _moonIcon() {
    return html`<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z"
        stroke="currentColor" stroke-width="1.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
}

customElements.define('dark-light-toggle', DarkLightToggle);
