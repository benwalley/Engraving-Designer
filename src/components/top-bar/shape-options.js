import { LitElement, html, css } from 'lit';
import { emit, EVENTS } from '../../helpers/events.js';

const FONTS = [
  'Arial',
  'Arial Narrow',
  'Courier New',
  'Georgia',
  'Impact',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
];

function parseGray(value) {
  if (!value || typeof value !== 'string') return { dark: 100, alpha: 100 };
  const m = value.match(/rgba?\(\s*(\d+).*?(?:,\s*([\d.]+))?\s*\)/);
  if (m) {
    return {
      dark:  Math.round((1 - parseInt(m[1]) / 255) * 100),
      alpha: Math.round((m[2] !== undefined ? parseFloat(m[2]) : 1) * 100),
    };
  }
  if (value.startsWith('#')) {
    const n = parseInt(value.slice(1, 3), 16);
    return { dark: Math.round((1 - n / 255) * 100), alpha: 100 };
  }
  return { dark: 100, alpha: 100 };
}

function grayToRgba(dark, alpha) {
  const n = Math.round(255 * (1 - dark / 100));
  return `rgba(${n}, ${n}, ${n}, ${alpha / 100})`;
}

class ShapeOptions extends LitElement {
  static properties = {
    selectionData: {},
    _fillDark:    { state: true },
    _fillAlpha:   { state: true },
    _strokeDark:  { state: true },
    _strokeAlpha: { state: true },
    _strokeWidth: { state: true },
    _rx:          { state: true },
    _type:        { state: true },
    _fontFamily:  { state: true },
    _fontSize:    { state: true },
    _fontWeight:  { state: true },
    _fontStyle:   { state: true },
    _underline:   { state: true },
    _brightness:  { state: true },
    _contrast:    { state: true },
    _gamma:       { state: true },
    _inverted:    { state: true },
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

    /* ── Font select ── */
    .font-select {
      height: 26px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: var(--color-bg);
      color: var(--color-text);
      font-size: 12px;
      padding: 0 6px;
      cursor: pointer;
      outline: none;
      transition: border-color var(--duration-fast) var(--easing-default);
    }

    .font-select:hover {
      border-color: var(--color-border-hover);
    }

    .font-select:focus {
      border-color: var(--color-accent);
    }

    /* ── Style toggles (B / I / U) ── */
    .toggle-group {
      display: flex;
      gap: 3px;
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
    this._fillDark    = 0;
    this._fillAlpha   = 100;
    this._strokeDark  = 100;
    this._strokeAlpha = 100;
    this._strokeWidth = 2;
    this._rx          = 0;
    this._type        = '';
    this._fontFamily  = 'Arial';
    this._fontSize    = 24;
    this._fontWeight  = 'normal';
    this._fontStyle   = 'normal';
    this._underline   = false;
    this._brightness  = 0;
    this._contrast    = 0;
    this._gamma       = 100;
    this._inverted    = false;
  }

  willUpdate(changedProps) {
    if (!changedProps.has('selectionData') || !this.selectionData) return;
    this._type = this.selectionData.type ?? '';

    if (this._type === 'image') {
      this._brightness = Math.round((this.selectionData.brightness ?? 0) * 100);
      this._contrast   = Math.round((this.selectionData.contrast   ?? 0) * 100);
      this._gamma      = Math.round((this.selectionData.gamma      ?? 1.0) * 100);
      this._inverted   = this.selectionData.inverted ?? false;
    } else if (this._type === 'i-text') {
      const fill        = parseGray(this.selectionData.fill ?? '#000000');
      this._fillDark    = fill.dark;
      this._fillAlpha   = fill.alpha;
      this._fontFamily  = this.selectionData.fontFamily ?? 'Arial';
      this._fontSize    = this.selectionData.fontSize   ?? 24;
      this._fontWeight  = this.selectionData.fontWeight ?? 'normal';
      this._fontStyle   = this.selectionData.fontStyle  ?? 'normal';
      this._underline   = this.selectionData.underline  ?? false;
    } else {
      const fill   = parseGray(this.selectionData.fill   ?? '#ffffff');
      const stroke = parseGray(this.selectionData.stroke ?? '#000000');
      this._fillDark    = fill.dark;
      this._fillAlpha   = fill.alpha;
      this._strokeDark  = stroke.dark;
      this._strokeAlpha = stroke.alpha;
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
        <span class="group-label">Shade</span>
        <div class="slider-wrap">
          <input type="range" class="shade-slider" min="0" max="100" step="1"
            .value=${this._fillDark}
            @input=${e => {
              this._fillDark = +e.target.value;
              this._change('fill', grayToRgba(this._fillDark, this._fillAlpha));
            }} />
          <span class="slider-readout">${this._fillDark}%</span>
        </div>
        <span class="group-label">Opacity</span>
        <div class="slider-wrap">
          <input type="range" min="0" max="100" step="1"
            .value=${this._fillAlpha}
            style="--pct: ${this._fillAlpha}%"
            @input=${e => {
              this._fillAlpha = +e.target.value;
              this._change('fill', grayToRgba(this._fillDark, this._fillAlpha));
            }} />
          <span class="slider-readout">${this._fillAlpha}%</span>
        </div>
      </div>

      <div class="sep"></div>

      <div class="group">
        <span class="group-label">Font</span>
        <select class="font-select"
          .value=${this._fontFamily}
          @change=${e => {
            this._fontFamily = e.target.value;
            this._change('fontFamily', e.target.value);
          }}>
          ${FONTS.map(f => html`<option value=${f} ?selected=${f === this._fontFamily}>${f}</option>`)}
        </select>
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
          <span class="group-label">Fill</span>
          <div class="slider-wrap">
            <input type="range" class="shade-slider" min="0" max="100" step="1"
              .value=${this._fillDark}
              @input=${e => {
                this._fillDark = +e.target.value;
                this._change('fill', grayToRgba(this._fillDark, this._fillAlpha));
              }} />
            <span class="slider-readout">${this._fillDark}%</span>
          </div>
          <span class="group-label">Opacity</span>
          <div class="slider-wrap">
            <input type="range" min="0" max="100" step="1"
              .value=${this._fillAlpha}
              style="--pct: ${this._fillAlpha}%"
              @input=${e => {
                this._fillAlpha = +e.target.value;
                this._change('fill', grayToRgba(this._fillDark, this._fillAlpha));
              }} />
            <span class="slider-readout">${this._fillAlpha}%</span>
          </div>
        </div>

        <div class="sep"></div>
      ` : ''}

      <div class="group">
        <span class="group-label">Stroke</span>
        <div class="slider-wrap">
          <input type="range" class="shade-slider" min="0" max="100" step="1"
            .value=${this._strokeDark}
            @input=${e => {
              this._strokeDark = +e.target.value;
              this._change('stroke', grayToRgba(this._strokeDark, this._strokeAlpha));
            }} />
          <span class="slider-readout">${this._strokeDark}%</span>
        </div>
        <span class="group-label">Opacity</span>
        <div class="slider-wrap">
          <input type="range" min="0" max="100" step="1"
            .value=${this._strokeAlpha}
            style="--pct: ${this._strokeAlpha}%"
            @input=${e => {
              this._strokeAlpha = +e.target.value;
              this._change('stroke', grayToRgba(this._strokeDark, this._strokeAlpha));
            }} />
          <span class="slider-readout">${this._strokeAlpha}%</span>
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

  render() {
    if (this._type === 'image') return this._renderImageOptions();
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
          }}>Inv</button>
      </div>
    `;
  }
}

customElements.define('shape-options', ShapeOptions);
