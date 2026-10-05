import { LitElement, html, css } from 'lit';

class IconToolWaveform extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="2"  y1="7"  x2="2"  y2="9"/>
          <line x1="5"  y1="4"  x2="5"  y2="12"/>
          <line x1="8"  y1="2"  x2="8"  y2="14"/>
          <line x1="11" y1="5"  x2="11" y2="11"/>
          <line x1="14" y1="7"  x2="14" y2="9"/>
        </g>
      </svg>
    `;
  }
}

customElements.define('icon-tool-waveform', IconToolWaveform);
