import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import cornerNoFiveSvg from '../../decorations/corner-no-five.svg?raw';

const svgContent = cornerNoFiveSvg
  .replace(/<\?xml[\s\S]*?\?>/g, '')
  .replace(/<!DOCTYPE[\s\S]*?>/g, '')
  .trim();

class IconToolDecoration extends LitElement {
  static styles = css`
    :host { display: inline-flex; }
    svg { width: 1em; height: 1em; }
    svg, svg * { fill: currentColor; stroke: none; }
  `;

  render() {
    return html`${unsafeHTML(svgContent)}`;
  }
}

customElements.define('icon-tool-decoration', IconToolDecoration);
