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

function parseColor(value) {
  if (!value || typeof value !== 'string') return { hex: '#000000', alpha: 1 };
  const m = value.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/);
  if (m) {
    const hex = '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    return { hex, alpha: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  }
  if (value.startsWith('#')) return { hex: value.slice(0, 7), alpha: 1 };
  return { hex: '#000000', alpha: 1 };
}

function toRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

class ShapeOptions extends LitElement {
  static properties = {
    selectionData: {},
    _fillHex:     { state: true },
    _fillAlpha:   { state: true },
    _strokeHex:   { state: true },
    _strokeAlpha: { state: true },
    _strokeWidth: { state: true },
    _rx:          { state: true },
    _type:        { state: true },
    _fontFamily:  { state: true },
    _fontSize:    { state: true },
    _fontWeight:  { state: true },
    _fontStyle:   { state: true },
    _underline:   { state: true },
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

    /* ── Color swatch ── */
    .color-btn {
      position: relative;
      width: 22px;
      height: 22px;
      border-radius: 5px;
      border: 1.5px solid var(--color-border);
      cursor: pointer;
      overflow: hidden;
      flex-shrink: 0;
      background-image:
        linear-gradient(45deg, #b0b0b0 25%, transparent 25%),
        linear-gradient(-45deg, #b0b0b0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #b0b0b0 75%),
        linear-gradient(-45deg, transparent 75%, #b0b0b0 75%);
      background-size: 6px 6px;
      background-position: 0 0, 0 3px, 3px -3px, -3px 0;
      background-color: #fff;
      transition: border-color var(--duration-fast) var(--easing-default),
                  box-shadow var(--duration-fast) var(--easing-default);
    }

    .color-btn:hover {
      border-color: var(--color-border-hover);
      box-shadow: 0 0 0 2px var(--color-accent-subtle);
    }

    .color-fill {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    input[type="color"] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      padding: 0;
      border: none;
    }

    /* ── Opacity slider ── */
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
    this._fillHex     = '#ffffff';
    this._fillAlpha   = 1;
    this._strokeHex   = '#2563eb';
    this._strokeAlpha = 1;
    this._strokeWidth = 2;
    this._rx          = 0;
    this._type        = '';
    this._fontFamily  = 'Arial';
    this._fontSize    = 24;
    this._fontWeight  = 'normal';
    this._fontStyle   = 'normal';
    this._underline   = false;
  }

  willUpdate(changedProps) {
    if (!changedProps.has('selectionData') || !this.selectionData) return;
    this._type = this.selectionData.type ?? '';

    if (this._type === 'i-text') {
      const fill        = parseColor(this.selectionData.fill ?? '#000000');
      this._fillHex     = fill.hex;
      this._fillAlpha   = fill.alpha;
      this._fontFamily  = this.selectionData.fontFamily ?? 'Arial';
      this._fontSize    = this.selectionData.fontSize   ?? 24;
      this._fontWeight  = this.selectionData.fontWeight ?? 'normal';
      this._fontStyle   = this.selectionData.fontStyle  ?? 'normal';
      this._underline   = this.selectionData.underline  ?? false;
    } else {
      const fill   = parseColor(this.selectionData.fill   ?? '#ffffff');
      const stroke = parseColor(this.selectionData.stroke ?? '#2563eb');
      this._fillHex     = fill.hex;
      this._fillAlpha   = fill.alpha;
      this._strokeHex   = stroke.hex;
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
    const fillPct = Math.round(this._fillAlpha * 100);
    const bold      = this._fontWeight === 'bold';
    const italic    = this._fontStyle  === 'italic';

    return html`
      <div class="group">
        <span class="group-label">Color</span>
        <div class="color-btn">
          <div class="color-fill" style="background:${toRgba(this._fillHex, this._fillAlpha)}"></div>
          <input type="color" .value=${this._fillHex}
            @input=${e => {
              this._fillHex = e.target.value;
              this._change('fill', toRgba(e.target.value, this._fillAlpha));
            }} />
        </div>
        <div class="slider-wrap">
          <input type="range" min="0" max="100" step="1"
            .value=${fillPct}
            style="--pct: ${fillPct}%"
            @input=${e => {
              const a = Number(e.target.value) / 100;
              this._fillAlpha = a;
              this._change('fill', toRgba(this._fillHex, a));
            }} />
          <span class="slider-readout">${fillPct}%</span>
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
    const fillPct  = Math.round(this._fillAlpha   * 100);
    const strkPct  = Math.round(this._strokeAlpha * 100);

    return html`
      ${this._type !== 'line' ? html`
        <div class="group">
          <span class="group-label">Fill</span>
          <div class="color-btn">
            <div class="color-fill" style="background:${toRgba(this._fillHex, this._fillAlpha)}"></div>
            <input type="color" .value=${this._fillHex}
              @input=${e => {
                this._fillHex = e.target.value;
                this._change('fill', toRgba(e.target.value, this._fillAlpha));
              }} />
          </div>
          <div class="slider-wrap">
            <input type="range" min="0" max="100" step="1"
              .value=${fillPct}
              style="--pct: ${fillPct}%"
              @input=${e => {
                const a = Number(e.target.value) / 100;
                this._fillAlpha = a;
                this._change('fill', toRgba(this._fillHex, a));
              }} />
            <span class="slider-readout">${fillPct}%</span>
          </div>
        </div>

        <div class="sep"></div>
      ` : ''}

      <div class="group">
        <span class="group-label">Stroke</span>
        <div class="color-btn">
          <div class="color-fill" style="background:${toRgba(this._strokeHex, this._strokeAlpha)}"></div>
          <input type="color" .value=${this._strokeHex}
            @input=${e => {
              this._strokeHex = e.target.value;
              this._change('stroke', toRgba(e.target.value, this._strokeAlpha));
            }} />
        </div>
        <div class="slider-wrap">
          <input type="range" min="0" max="100" step="1"
            .value=${strkPct}
            style="--pct: ${strkPct}%"
            @input=${e => {
              const a = Number(e.target.value) / 100;
              this._strokeAlpha = a;
              this._change('stroke', toRgba(this._strokeHex, a));
            }} />
          <span class="slider-readout">${strkPct}%</span>
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
    return this._type === 'i-text'
      ? this._renderTextOptions()
      : this._renderShapeOptions();
  }
}

customElements.define('shape-options', ShapeOptions);
