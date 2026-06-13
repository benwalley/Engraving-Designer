import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { emit, EVENTS } from '../../helpers/events.js';
import { DECORATION_LIST } from '../../tools/decoration-tool.js';
import '../icons/icon-invert.js';

// Strip XML declaration and DOCTYPE before embedding SVG inline in HTML
function cleanSvg(str) {
  return str
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/g, '')
    .trim();
}

const FONTS = [
  // System
  'Arial',
  'Courier New',
  'Georgia',
  'Impact',
  'Times New Roman',
  'Verdana',
  // Classic Serif
  'EB Garamond',
  'Libre Baskerville',
  'Lora',
  'Playfair Display',
  // Modern Sans
  'Montserrat',
  'Open Sans',
  'Raleway',
  // Condensed / Block
  'Bebas Neue',
  'Oswald',
  // Script / Cursive
  'Dancing Script',
  'Great Vibes',
  'Pacifico',
  'Pinyon Script',
  'Satisfy',
  // Display / Decorative
  'Abril Fatface',
  'Lobster',
  // Slab Serif
  'Roboto Slab',
  // Mono
  'Roboto Mono',
  // Handwritten
  'Caveat',
  'Patrick Hand',
  // Historical / Ornate
  'Cinzel',
  'UnifrakturMaguntia',
];

function parseGray(value) {
  if (!value || typeof value !== 'string') return { dark: 100 };
  const m = value.match(/rgba?\(\s*(\d+)/);
  if (m) {
    return { dark: Math.round((1 - parseInt(m[1]) / 255) * 100) };
  }
  if (value.startsWith('#')) {
    const n = parseInt(value.slice(1, 3), 16);
    return { dark: Math.round((1 - n / 255) * 100) };
  }
  return { dark: 100 };
}

function grayToRgb(dark) {
  const n = Math.round(255 * (1 - dark / 100));
  return `rgb(${n}, ${n}, ${n})`;
}

const SHAPE_LIST = [
  { id: 'circle',    label: 'Circle',
    svg: html`<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>` },
  { id: 'ellipse',   label: 'Ellipse',
    svg: html`<svg viewBox="0 0 16 16"><ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>` },
  { id: 'rectangle', label: 'Rectangle',
    svg: html`<svg viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="13" height="9" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>` },
  { id: 'triangle',  label: 'Triangle',
    svg: html`<svg viewBox="0 0 16 16"><polygon points="8,1.5 15,14.5 1,14.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/></svg>` },
  { id: 'star',      label: 'Star',
    svg: html`<svg viewBox="0 0 16 16"><polygon points="8,1 10.2,5.8 15.5,6.3 11.5,10 12.7,15.2 8,12.5 3.3,15.2 4.5,10 0.5,6.3 5.8,5.8" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>` },
  { id: 'diamond',   label: 'Diamond',
    svg: html`<svg viewBox="0 0 16 16"><polygon points="8,1 15,8 8,15 1,8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/></svg>` },
  { id: 'hexagon',   label: 'Hexagon',
    svg: html`<svg viewBox="0 0 16 16"><polygon points="14,8 11,13.2 5,13.2 2,8 5,2.8 11,2.8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/></svg>` },
  { id: 'arrow',     label: 'Arrow',
    svg: html`<svg viewBox="0 0 16 16"><polygon points="1,5.5 10,5.5 10,2 15,8 10,14 10,10.5 1,10.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/></svg>` },
  { id: 'cross',     label: 'Cross',
    svg: html`<svg viewBox="0 0 16 16"><polygon points="5.5,1 10.5,1 10.5,5.5 15,5.5 15,10.5 10.5,10.5 10.5,15 5.5,15 5.5,10.5 1,10.5 1,5.5 5.5,5.5" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>` },
  { id: 'heart',     label: 'Heart',
    svg: html`<svg viewBox="0 0 16 16"><path d="M8,13.5 C2,9.5 1,6 1,5 C1,2.5 3,1 5,1 C6.5,1 8,2.5 8,3 C8,2.5 9.5,1 11,1 C13,1 15,2.5 15,5 C15,6 14,9.5 8,13.5 Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>` },
  { id: 'banner',    label: 'Banner',
    svg: html`<svg viewBox="0 0 16 16"><polygon points="1,8 3.5,1 12.5,1 15,8 12.5,15 3.5,15" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/></svg>` },
  { id: 'octagon',   label: 'Octagon',
    svg: html`<svg viewBox="0 0 16 16"><polygon points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/></svg>` },
];

class ShapeOptions extends LitElement {
  static properties = {
    selectionData: {},
    _fillDark:          { state: true },
    _strokeDark:        { state: true },
    _strokeWidth:       { state: true },
    _rx:                { state: true },
    _type:              { state: true },
    _shapeType:         { state: true },
    _shapeDropOpen:     { state: true },
    _decorationType:    { state: true },
    _decorationDropOpen:{ state: true },
    _flipX:             { state: true },
    _flipY:             { state: true },
    _fontFamily:        { state: true },
    _fontDropOpen:      { state: true },
    _fontSize:          { state: true },
    _fontWeight:        { state: true },
    _fontStyle:         { state: true },
    _underline:         { state: true },
    _brightness:        { state: true },
    _contrast:          { state: true },
    _gamma:             { state: true },
    _inverted:          { state: true },
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      height: 100%;
    }

    .sep {
      width: 1px;
      height: 20px;
      background: var(--color-border);
      flex-shrink: 0;
      margin: 0 4px;
    }

    .group {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 12px;
    }

    .group-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      user-select: none;
    }

    /* ── Sliders ── */
    .slider-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 72px;
      height: 4px;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      background: linear-gradient(
        to right,
        var(--color-accent) 0%,
        var(--color-accent) var(--pct, 100%),
        var(--color-border) var(--pct, 100%),
        var(--color-border) 100%
      );
    }

    input[type="range"].shade-slider {
      height: 10px;
      border-radius: 5px;
      background: linear-gradient(to right, #fff, #000);
      box-shadow: inset 0 0 0 1px var(--color-border);
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-bg);
      border: 2px solid var(--color-accent);
      cursor: pointer;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
      transition: box-shadow var(--duration-fast) var(--easing-default);
    }

    input[type="range"]::-webkit-slider-thumb:hover {
      box-shadow: 0 0 0 3px var(--color-accent-subtle);
    }

    input[type="range"]::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-bg);
      border: 2px solid var(--color-accent);
      cursor: pointer;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
    }

    input[type="range"].shade-slider::-webkit-slider-thumb {
      width: 6px;
      height: 22px;
      border-radius: 3px;
      background: #ffffff;
      border: 1.5px solid #777777;
      box-shadow: 0 1px 4px rgb(0 0 0 / 0.4);
      transition: box-shadow var(--duration-fast) var(--easing-default);
    }

    input[type="range"].shade-slider::-webkit-slider-thumb:hover {
      box-shadow: 0 1px 6px rgb(0 0 0 / 0.55);
    }

    input[type="range"].shade-slider::-moz-range-thumb {
      width: 6px;
      height: 22px;
      border-radius: 3px;
      background: #ffffff;
      border: 1.5px solid #777777;
      box-shadow: 0 1px 4px rgb(0 0 0 / 0.4);
    }

    .slider-readout {
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      color: var(--color-text-muted);
      width: 30px;
      user-select: none;
    }

    /* ── +/− Stepper ── */
    .stepper {
      display: flex;
      align-items: center;
      height: 26px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      overflow: hidden;
      background: var(--color-bg);
    }

    .stepper-btn {
      width: 24px;
      height: 100%;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 15px;
      line-height: 1;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--duration-fast) var(--easing-default),
                  color var(--duration-fast) var(--easing-default);
      user-select: none;
      flex-shrink: 0;
    }

    .stepper-btn:hover {
      background: var(--color-accent-subtle);
      color: var(--color-accent-text);
    }

    .stepper-btn:active {
      background: var(--color-accent-subtle-active);
    }

    .stepper-value {
      min-width: 28px;
      text-align: center;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      color: var(--color-text);
      border-left: 1px solid var(--color-border);
      border-right: 1px solid var(--color-border);
      padding: 0 3px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    /* ── Font picker ── */
    .font-picker {
      position: relative;
    }

    .font-trigger {
      height: 26px;
      min-width: 160px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: var(--color-bg);
      color: var(--color-text);
      font-size: 13px;
      padding: 0 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      white-space: nowrap;
      overflow: hidden;
      transition: border-color var(--duration-fast) var(--easing-default);
    }

    .font-trigger:hover {
      border-color: var(--color-border-hover);
    }

    .font-trigger.open {
      border-color: var(--color-accent);
    }

    .font-trigger-arrow {
      font-size: 9px;
      color: var(--color-text-muted);
      flex-shrink: 0;
      font-family: sans-serif;
    }

    .font-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 1000;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
      max-height: 280px;
      overflow-y: auto;
      min-width: 200px;
      padding: 4px 0;
    }

    .font-option {
      padding: 7px 12px;
      font-size: 15px;
      cursor: pointer;
      white-space: nowrap;
      color: var(--color-text);
      transition: background var(--duration-fast) var(--easing-default);
    }

    .font-option:hover {
      background: var(--color-accent-subtle);
    }

    .font-option.selected {
      background: var(--color-accent-subtle);
      color: var(--color-accent);
    }

    /* ── Style toggles (B / I / U) ── */
    .toggle-group {
      display: flex;
      gap: 3px;
    }

    /* ── Shape dropdown ── */
    .shape-picker-drop {
      position: relative;
    }

    .shape-trigger {
      height: 26px;
      min-width: 120px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: var(--color-bg);
      color: var(--color-text);
      font-size: 13px;
      padding: 0 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      white-space: nowrap;
      transition: border-color var(--duration-fast) var(--easing-default);
    }

    .shape-trigger:hover {
      border-color: var(--color-border-hover);
    }

    .shape-trigger.open {
      border-color: var(--color-accent);
    }

    .shape-trigger-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .shape-trigger-left svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .shape-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 1000;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
      padding: 6px;
      display: grid;
      grid-template-columns: repeat(4, 26px);
      gap: 3px;
    }

    .decoration-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 1000;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
      padding: 4px 0;
      min-width: 180px;
    }

    .decoration-item {
      width: 100%;
      height: 44px;
      border: none;
      border-radius: 0;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 12px;
      font-size: 13px;
      color: var(--color-text);
      transition: background var(--duration-fast) var(--easing-default);
      user-select: none;
    }

    .decoration-item:hover {
      background: var(--color-accent-subtle);
    }

    .decoration-item.active {
      background: var(--color-accent-subtle);
      color: var(--color-accent);
    }

    .decoration-thumb {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .decoration-thumb svg {
      width: 100%;
      height: 100%;
    }

    .decoration-trigger-thumb {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .decoration-trigger-thumb svg {
      width: 100%;
      height: 100%;
    }

    @media (prefers-color-scheme: dark) {
      .decoration-thumb svg,
      .decoration-trigger-thumb svg {
        filter: invert(1);
      }
    }

    :host-context([data-theme="dark"]) .decoration-thumb svg,
    :host-context([data-theme="dark"]) .decoration-trigger-thumb svg {
      filter: invert(1);
    }

    :host-context([data-theme="light"]) .decoration-thumb svg,
    :host-context([data-theme="light"]) .decoration-trigger-thumb svg {
      filter: none;
    }

    .toggle-btn svg {
      width: 14px;
      height: 14px;
      display: block;
    }

    .toggle-btn {
      width: 26px;
      height: 26px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: var(--color-bg);
      color: var(--color-text-muted);
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--duration-fast) var(--easing-default),
                  color var(--duration-fast) var(--easing-default),
                  border-color var(--duration-fast) var(--easing-default);
      user-select: none;
      flex-shrink: 0;
    }

    .toggle-btn:hover {
      background: var(--color-accent-subtle);
      color: var(--color-accent-text);
      border-color: var(--color-border-hover);
    }

    .toggle-btn.active {
      background: var(--color-accent-subtle);
      color: var(--color-accent);
      border-color: var(--color-accent);
    }
  `;

  constructor() {
    super();
    this._fillDark      = 0;
    this._strokeDark    = 100;
    this._strokeWidth   = 2;
    this._rx            = 0;
    this._type          = '';
    this._shapeType         = 'circle';
    this._shapeDropOpen     = false;
    this._decorationType    = 'corner-no-one';
    this._decorationDropOpen = false;
    this._flipX             = false;
    this._flipY             = false;
    this._fontFamily        = 'Arial';
    this._fontDropOpen  = false;
    this._fontSize      = 24;
    this._fontWeight    = 'normal';
    this._fontStyle     = 'normal';
    this._underline     = false;
    this._brightness    = 0;
    this._contrast      = 0;
    this._gamma         = 100;
    this._inverted      = false;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._closeFontDrop();
    this._closeShapeDrop();
    this._closeDecorationDrop();
  }

  _openShapeDrop() {
    this._shapeDropOpen = true;
    this._outsideShapeClick = (e) => {
      if (!this.renderRoot.contains(e.composedPath()[0])) {
        this._closeShapeDrop();
      }
    };
    setTimeout(() => document.addEventListener('click', this._outsideShapeClick), 0);
  }

  _closeShapeDrop() {
    this._shapeDropOpen = false;
    if (this._outsideShapeClick) {
      document.removeEventListener('click', this._outsideShapeClick);
      this._outsideShapeClick = null;
    }
  }

  _selectShape(id) {
    this._shapeType = id;
    emit(EVENTS.TOOL_OPTIONS_CHANGED, { shapeType: id });
    this._closeShapeDrop();
  }

  _openDecorationDrop() {
    this._decorationDropOpen = true;
    this._outsideDecorationClick = (e) => {
      if (!this.renderRoot.contains(e.composedPath()[0])) {
        this._closeDecorationDrop();
      }
    };
    setTimeout(() => document.addEventListener('click', this._outsideDecorationClick), 0);
  }

  _closeDecorationDrop() {
    this._decorationDropOpen = false;
    if (this._outsideDecorationClick) {
      document.removeEventListener('click', this._outsideDecorationClick);
      this._outsideDecorationClick = null;
    }
  }

  _selectDecoration(id) {
    this._decorationType = id;
    emit(EVENTS.TOOL_OPTIONS_CHANGED, { decorationType: id });
    this._closeDecorationDrop();
  }

  _openFontDrop() {
    this._fontDropOpen = true;
    this._outsideClick = (e) => {
      if (!this.renderRoot.contains(e.composedPath()[0])) {
        this._closeFontDrop();
      }
    };
    setTimeout(() => document.addEventListener('click', this._outsideClick), 0);
  }

  _closeFontDrop() {
    this._fontDropOpen = false;
    if (this._outsideClick) {
      document.removeEventListener('click', this._outsideClick);
      this._outsideClick = null;
    }
  }

  _selectFont(font) {
    this._fontFamily = font;
    this._change('fontFamily', font);
    this._closeFontDrop();
  }

  willUpdate(changedProps) {
    if (!changedProps.has('selectionData') || !this.selectionData) return;
    this._type = this.selectionData.type ?? '';

    if (this._type === 'image') {
      this._brightness = Math.round((this.selectionData.brightness ?? 0) * 100);
      this._contrast   = Math.round((this.selectionData.contrast   ?? 0) * 100);
      this._gamma      = Math.round((this.selectionData.gamma      ?? 1.0) * 100);
      this._inverted   = this.selectionData.inverted ?? false;
      const stroke      = parseGray(this.selectionData.stroke ?? '#000000');
      this._strokeDark  = stroke.dark;
      this._strokeWidth = this.selectionData.strokeWidth ?? 0;
    } else if (this._type === 'i-text') {
      const fill        = parseGray(this.selectionData.fill ?? '#000000');
      this._fillDark    = fill.dark;
      this._fontFamily  = this.selectionData.fontFamily ?? 'Arial';
      this._fontSize    = this.selectionData.fontSize   ?? 24;
      this._fontWeight  = this.selectionData.fontWeight ?? 'normal';
      this._fontStyle   = this.selectionData.fontStyle  ?? 'normal';
      this._underline   = this.selectionData.underline  ?? false;
    } else if (this._type === 'shape-tool') {
      this._shapeType   = this.selectionData.shapeType  ?? 'circle';
      const fill   = parseGray(this.selectionData.fill   ?? '#ffffff');
      const stroke = parseGray(this.selectionData.stroke ?? '#000000');
      this._fillDark    = fill.dark;
      this._strokeDark  = stroke.dark;
      this._strokeWidth = this.selectionData.strokeWidth ?? 2;
    } else if (this._type === 'decoration') {
      this._flipX = this.selectionData.flipX ?? false;
      this._flipY = this.selectionData.flipY ?? false;
    } else if (this._type === 'decoration-tool') {
      this._decorationType = this.selectionData.decorationType ?? 'corner-no-one';
      const fill   = parseGray(this.selectionData.fill   ?? '#000000');
      const stroke = parseGray(this.selectionData.stroke ?? 'none');
      this._fillDark    = fill.dark;
      this._strokeDark  = stroke.dark;
      this._strokeWidth = this.selectionData.strokeWidth ?? 0;
    } else {
      const fill   = parseGray(this.selectionData.fill   ?? '#ffffff');
      const stroke = parseGray(this.selectionData.stroke ?? '#000000');
      this._fillDark    = fill.dark;
      this._strokeDark  = stroke.dark;
      this._strokeWidth = this.selectionData.strokeWidth ?? 2;
      this._rx          = this.selectionData.rx          ?? 0;
    }
  }

  _change(field, value) {
    emit(EVENTS.TOOL_OPTIONS_CHANGED, { [field]: value });
  }

  _step(field, current, delta, min = 0) {
    const next = Math.max(min, current + delta);
    this[field] = next;
    if (field === '_strokeWidth') this._change('strokeWidth', next);
    if (field === '_rx')          this._change('rx',          next);
    if (field === '_fontSize')    this._change('fontSize',    next);
  }

  _renderTextOptions() {
    const bold   = this._fontWeight === 'bold';
    const italic = this._fontStyle  === 'italic';

    return html`
      <div class="group">
        <span class="group-label">Color</span>
        <div class="slider-wrap">
          <input type="range" class="shade-slider" min="0" max="100" step="1"
            .value=${this._fillDark}
            @input=${e => {
              this._fillDark = +e.target.value;
              this._change('fill', grayToRgb(this._fillDark));
            }} />
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Font</span>
        <div class="font-picker">
          <button class="font-trigger ${this._fontDropOpen ? 'open' : ''}"
            style="font-family: '${this._fontFamily}'"
            @click=${() => this._fontDropOpen ? this._closeFontDrop() : this._openFontDrop()}>
            ${this._fontFamily}
            <span class="font-trigger-arrow">▾</span>
          </button>
          ${this._fontDropOpen ? html`
            <div class="font-dropdown">
              ${FONTS.map(f => html`
                <div class="font-option ${f === this._fontFamily ? 'selected' : ''}"
                     style="font-family: '${f}'"
                     @click=${() => this._selectFont(f)}>
                  ${f}
                </div>
              `)}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Size</span>
        <div class="stepper">
          <button class="stepper-btn" @click=${() => this._step('_fontSize', this._fontSize, -1, 1)}>−</button>
          <span class="stepper-value">${this._fontSize}</span>
          <button class="stepper-btn" @click=${() => this._step('_fontSize', this._fontSize, 1, 1)}>+</button>
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <div class="toggle-group">
          <button class="toggle-btn ${bold ? 'active' : ''}"
            title="Bold"
            @click=${() => {
              const next = bold ? 'normal' : 'bold';
              this._fontWeight = next;
              this._change('fontWeight', next);
            }}><b>B</b></button>
          <button class="toggle-btn ${italic ? 'active' : ''}"
            title="Italic"
            @click=${() => {
              const next = italic ? 'normal' : 'italic';
              this._fontStyle = next;
              this._change('fontStyle', next);
            }}><i>I</i></button>
          <button class="toggle-btn ${this._underline ? 'active' : ''}"
            title="Underline"
            @click=${() => {
              this._underline = !this._underline;
              this._change('underline', this._underline);
            }}><u>U</u></button>
        </div>
      </div>
    `;
  }

  _renderShapeOptions() {
    return html`
      ${this._type !== 'line' ? html`
        <div class="group">
          <span class="group-label">Fill Color</span>
          <div class="slider-wrap">
            <input type="range" class="shade-slider" min="0" max="100" step="1"
              .value=${this._fillDark}
              @input=${e => {
                this._fillDark = +e.target.value;
                this._change('fill', grayToRgb(this._fillDark));
              }} />
          </div>
        </div>

        <div class="sep"></div>
      ` : ''}

      <div class="group">
        <span class="group-label">${this._type === 'line' ? 'Color' : 'Border Color'}</span>
        <div class="slider-wrap">
          <input type="range" class="shade-slider" min="0" max="100" step="1"
            .value=${this._strokeDark}
            @input=${e => {
              this._strokeDark = +e.target.value;
              this._change('stroke', grayToRgb(this._strokeDark));
            }} />
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Width</span>
        <div class="stepper">
          <button class="stepper-btn" @click=${() => this._step('_strokeWidth', this._strokeWidth, -1)}>−</button>
          <span class="stepper-value">${this._strokeWidth}</span>
          <button class="stepper-btn" @click=${() => this._step('_strokeWidth', this._strokeWidth, 1)}>+</button>
        </div>
      </div>

      ${this._type === 'rect' ? html`
        <div class="sep"></div>
        <div class="group">
          <span class="group-label">Radius</span>
          <div class="stepper">
            <button class="stepper-btn" @click=${() => this._step('_rx', this._rx, -1)}>−</button>
            <span class="stepper-value">${this._rx}</span>
            <button class="stepper-btn" @click=${() => this._step('_rx', this._rx, 1)}>+</button>
          </div>
        </div>
      ` : ''}
    `;
  }

  _renderShapeToolOptions() {
    const currentShape = SHAPE_LIST.find(s => s.id === this._shapeType) ?? SHAPE_LIST[0];
    return html`
      <div class="group">
        <span class="group-label">Shape</span>
        <div class="shape-picker-drop">
          <button class="shape-trigger ${this._shapeDropOpen ? 'open' : ''}"
            @click=${() => this._shapeDropOpen ? this._closeShapeDrop() : this._openShapeDrop()}>
            <span class="shape-trigger-left">
              ${currentShape.svg}
              ${currentShape.label}
            </span>
            <span class="font-trigger-arrow">▾</span>
          </button>
          ${this._shapeDropOpen ? html`
            <div class="shape-dropdown">
              ${SHAPE_LIST.map(s => html`
                <button
                  class="toggle-btn ${this._shapeType === s.id ? 'active' : ''}"
                  title=${s.label}
                  @click=${() => this._selectShape(s.id)}
                >${s.svg}</button>
              `)}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Fill Color</span>
        <div class="slider-wrap">
          <input type="range" class="shade-slider" min="0" max="100" step="1"
            .value=${this._fillDark}
            @input=${e => {
              this._fillDark = +e.target.value;
              this._change('fill', grayToRgb(this._fillDark));
            }} />
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Border Color</span>
        <div class="slider-wrap">
          <input type="range" class="shade-slider" min="0" max="100" step="1"
            .value=${this._strokeDark}
            @input=${e => {
              this._strokeDark = +e.target.value;
              this._change('stroke', grayToRgb(this._strokeDark));
            }} />
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Width</span>
        <div class="stepper">
          <button class="stepper-btn" @click=${() => this._step('_strokeWidth', this._strokeWidth, -1)}>−</button>
          <span class="stepper-value">${this._strokeWidth}</span>
          <button class="stepper-btn" @click=${() => this._step('_strokeWidth', this._strokeWidth, 1)}>+</button>
        </div>
      </div>
    `;
  }

  _renderDecorationToolOptions() {
    const current = DECORATION_LIST.find(d => d.id === this._decorationType) ?? DECORATION_LIST[0];
    return html`
      <div class="group">
        <span class="group-label">Decoration</span>
        <div class="shape-picker-drop">
          <button class="shape-trigger ${this._decorationDropOpen ? 'open' : ''}"
            @click=${() => this._decorationDropOpen ? this._closeDecorationDrop() : this._openDecorationDrop()}>
            <span class="shape-trigger-left">
              <span class="decoration-trigger-thumb">${unsafeHTML(cleanSvg(current.svgString))}</span>
              ${current.label}
            </span>
            <span class="font-trigger-arrow">▾</span>
          </button>
          ${this._decorationDropOpen ? html`
            <div class="decoration-dropdown">
              ${DECORATION_LIST.map(d => html`
                <button
                  class="decoration-item ${this._decorationType === d.id ? 'active' : ''}"
                  title=${d.label}
                  @click=${() => this._selectDecoration(d.id)}
                >
                  <span class="decoration-thumb">${unsafeHTML(cleanSvg(d.svgString))}</span>
                  ${d.label}
                </button>
              `)}
            </div>
          ` : ''}
        </div>
      </div>

    `;
  }

  _renderSelectedDecorationOptions() {
    return html`
      <div class="group">
        <span class="group-label">Mirror</span>
        <div class="toggle-group">
          <button class="toggle-btn ${this._flipX ? 'active' : ''}" title="Flip Horizontal"
            @click=${() => {
              this._flipX = !this._flipX;
              this._change('flipX', this._flipX);
            }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M8 2 L8 14"/>
              <path d="M2 5 L6 8 L2 11"/>
              <path d="M14 5 L10 8 L14 11"/>
            </svg>
          </button>
          <button class="toggle-btn ${this._flipY ? 'active' : ''}" title="Flip Vertical"
            @click=${() => {
              this._flipY = !this._flipY;
              this._change('flipY', this._flipY);
            }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M2 8 L14 8"/>
              <path d="M5 2 L8 6 L11 2"/>
              <path d="M5 14 L8 10 L11 14"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Rotate</span>
        <button class="toggle-btn" title="Rotate 90°"
          @click=${() => this._change('rotate90', true)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 3 A6 6 0 1 0 14 8"/>
            <path d="M14 3 L14 7 L10 7"/>
          </svg>
        </button>
      </div>
    `;
  }

  render() {
    if (this._type === 'image') return this._renderImageOptions();
    if (this._type === 'shape-tool') return this._renderShapeToolOptions();
    if (this._type === 'decoration-tool') return this._renderDecorationToolOptions();
    if (this._type === 'decoration') return this._renderSelectedDecorationOptions();
    return this._type === 'i-text'
      ? this._renderTextOptions()
      : this._renderShapeOptions();
  }

  _renderImageOptions() {
    const bSign = this._brightness > 0 ? '+' : '';
    const cSign = this._contrast   > 0 ? '+' : '';
    return html`
      <div class="group">
        <span class="group-label">Brightness</span>
        <div class="slider-wrap">
          <input type="range" min="-100" max="100" step="1"
            .value=${this._brightness}
            style="--pct: ${(this._brightness + 100) / 2}%"
            @input=${e => {
              this._brightness = +e.target.value;
              this._change('brightness', this._brightness / 100);
            }} />
          <span class="slider-readout">${bSign}${this._brightness}</span>
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Contrast</span>
        <div class="slider-wrap">
          <input type="range" min="-100" max="100" step="1"
            .value=${this._contrast}
            style="--pct: ${(this._contrast + 100) / 2}%"
            @input=${e => {
              this._contrast = +e.target.value;
              this._change('contrast', this._contrast / 100);
            }} />
          <span class="slider-readout">${cSign}${this._contrast}</span>
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Gamma</span>
        <div class="slider-wrap">
          <input type="range" min="10" max="300" step="1"
            .value=${this._gamma}
            style="--pct: ${((this._gamma - 10) / 290) * 100}%"
            @input=${e => {
              this._gamma = +e.target.value;
              this._change('gamma', this._gamma / 100);
            }} />
          <span class="slider-readout">${(this._gamma / 100).toFixed(1)}</span>
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <button class="toggle-btn ${this._inverted ? 'active' : ''}" title="Invert"
          @click=${() => {
            this._inverted = !this._inverted;
            this._change('inverted', this._inverted);
          }}><icon-invert></icon-invert></button>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Border</span>
        <div class="slider-wrap">
          <input type="range" class="shade-slider" min="0" max="100" step="1"
            .value=${this._strokeDark}
            @input=${e => {
              this._strokeDark = +e.target.value;
              this._change('stroke', grayToRgb(this._strokeDark));
            }} />
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Width</span>
        <div class="stepper">
          <button class="stepper-btn" @click=${() => this._step('_strokeWidth', this._strokeWidth, -1)}>−</button>
          <span class="stepper-value">${this._strokeWidth}</span>
          <button class="stepper-btn" @click=${() => this._step('_strokeWidth', this._strokeWidth, 1)}>+</button>
        </div>
      </div>
    `;
  }
}

customElements.define('shape-options', ShapeOptions);
