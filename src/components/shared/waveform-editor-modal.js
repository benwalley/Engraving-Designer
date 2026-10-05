import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { on, off, emit, EVENTS } from '../../helpers/events.js';
import { decodeMediaFile, computePeaks, buildWaveformSvg } from '../../helpers/waveform.js';
import '../icons/icon-spinner.js';

const OVERVIEW_PEAKS  = 400;
const HANDLE_HIT_PX   = 10;
const MIN_SELECTION_S = 0.1;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
}

class WaveformEditorModal extends LitElement {
  static properties = {
    _open:      { state: true },
    _loading:   { state: true },
    _error:     { state: true },
    _fileName:  { state: true },
    _start:     { state: true },
    _end:       { state: true },
    _playing:   { state: true },
    _style:     { state: true },
    _detail:    { state: true },
    _waveDetail: { state: true },
    _boost:     { state: true },
    _hbDetail:  { state: true },
    _gate:      { state: true },
    _contrast:  { state: true },
    _curved:    { state: true },
    _gap:       { state: true },
    _rounded:   { state: true },
    _thickness: { state: true },
    _svg:       { state: true },
  };

  static styles = css`
    :host { display: contents; }

    .overlay {
      position: fixed;
      inset: 0;
      background: var(--color-overlay);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-dropdown);
      width: min(720px, 95vw);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .modal-title {
      font-size: var(--font-size-normal);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      font-size: 1.25rem;
      line-height: 1;
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: var(--color-hover);
      color: var(--color-text);
    }

    .body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      margin-bottom: 6px;
    }

    .overview {
      display: block;
      width: 100%;
      height: 96px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      cursor: pointer;
      touch-action: none;
    }

    .transport {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      font-variant-numeric: tabular-nums;
    }

    .transport .times { margin-left: auto; }

    .preview {
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 12px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview svg {
      width: 100%;
      height: 100%;
    }

    .options {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px 20px;
      font-size: var(--font-size-sm);
      color: var(--color-text);
    }

    .option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .option.inline {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }

    .option.full { grid-column: 1 / -1; }

    .option input[type="range"] { width: 100%; }

    .segmented {
      display: inline-flex;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      align-self: flex-start;
    }

    .segmented button {
      padding: 5px 14px;
      font-size: var(--font-size-sm);
      border: none;
      background: var(--color-bg);
      color: var(--color-text);
      cursor: pointer;
    }

    .segmented button + button { border-left: 1px solid var(--color-border); }

    .segmented button.active {
      background: var(--color-accent-subtle);
      color: var(--color-accent-text);
      font-weight: 600;
    }

    .state-msg {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 160px;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      text-align: center;
    }

    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-shrink: 0;
      gap: 8px;
    }

    .btn {
      padding: 7px 16px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      cursor: pointer;
      border: 1px solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text);
      transition: background var(--duration-fast) var(--easing-default);
    }

    .btn:hover { background: var(--color-hover); }

    .btn-primary {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent);
      color: var(--color-accent-text);
      font-weight: 600;
    }

    .btn-primary:hover { background: var(--color-accent-subtle-active); }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this._open = false;
    this._loading = false;
    this._error = false;
    this._fileName = '';
    this._start = 0;
    this._end = 0;
    this._playing = false;
    this._style = 'bars';
    this._detail = 80;
    this._waveDetail = 1200;
    this._boost = 1;
    this._hbDetail = 250;
    this._gate = 0.1;
    this._contrast = 1.5;
    this._curved = true;
    this._gap = 0.4;
    this._rounded = true;
    this._thickness = 4;
    this._svg = '';

    this._audioCtx = null;
    this._buffer = null;
    this._overviewPeaks = null;
    this._source = null;
    this._playOffset = 0;   // seconds into the selection where playback resumes
    this._playStartedAt = 0;
    this._rafId = null;
    this._previewRaf = null;
    this._drag = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._onOpen = () => this._pickFile();
    on(EVENTS.OPEN_WAVEFORM_PICKER, this._onOpen);
    this._onKeyDown = (e) => { if (this._open && e.key === 'Escape') this._close(); };
    document.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    off(EVENTS.OPEN_WAVEFORM_PICKER, this._onOpen);
    document.removeEventListener('keydown', this._onKeyDown);
    this._teardown();
  }

  updated(changedProps) {
    if (!this._open || !this._buffer) return;
    this._drawOverview();
    const previewKeys = ['_start', '_end', '_style', '_detail', '_waveDetail', '_boost', '_hbDetail', '_gate', '_contrast', '_curved', '_gap', '_rounded', '_thickness', '_loading'];
    if (previewKeys.some(k => changedProps.has(k))) this._schedulePreview();
  }

  // ── File loading ──────────────────────────────────────────────────────────

  _pickFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*,video/*';
    input.style.display = 'none';
    input.onchange = () => {
      const file = input.files?.[0];
      input.remove();
      if (file) this._load(file);
    };
    input.oncancel = () => input.remove();
    document.body.appendChild(input);
    // Open the picker straight away — this runs from the toolbar click.
    input.click();
  }

  async _load(file) {
    this._teardown();
    this._open = true;
    this._loading = true;
    this._error = false;
    this._fileName = file.name;
    this._svg = '';
    try {
      this._audioCtx = new AudioContext();
      this._buffer = await decodeMediaFile(file, this._audioCtx);
      this._overviewPeaks = computePeaks(this._buffer, 0, this._buffer.duration, OVERVIEW_PEAKS);
      this._start = 0;
      this._end = this._buffer.duration;
      this._playOffset = 0;
    } catch {
      this._error = true;
    }
    this._loading = false;
  }

  _teardown() {
    this._stop();
    cancelAnimationFrame(this._previewRaf);
    this._audioCtx?.close();
    this._audioCtx = null;
    this._buffer = null;
    this._overviewPeaks = null;
  }

  _close() {
    this._open = false;
    this._teardown();
  }

  // ── Playback ──────────────────────────────────────────────────────────────

  async _play() {
    if (!this._buffer) return;
    await this._audioCtx.resume();
    if (this._playOffset >= this._end - this._start) this._playOffset = 0;
    const source = this._audioCtx.createBufferSource();
    source.buffer = this._buffer;
    source.connect(this._audioCtx.destination);
    source.onended = () => {
      if (this._source !== source) return;
      this._source = null;
      this._playing = false;
      this._playOffset = 0;
      cancelAnimationFrame(this._rafId);
      this._drawOverview();
    };
    source.start(0, this._start + this._playOffset, this._end - this._start - this._playOffset);
    this._source = source;
    this._playStartedAt = this._audioCtx.currentTime - this._playOffset;
    this._playing = true;
    const tick = () => {
      this._drawOverview();
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _pause() {
    if (!this._source) return;
    this._playOffset = this._audioCtx.currentTime - this._playStartedAt;
    this._stopSource();
  }

  _stop() {
    this._stopSource();
    this._playOffset = 0;
  }

  _stopSource() {
    cancelAnimationFrame(this._rafId);
    if (this._source) {
      const source = this._source;
      this._source = null;
      source.onended = null;
      try { source.stop(); } catch { /* already stopped */ }
    }
    this._playing = false;
  }

  _togglePlay() {
    if (this._playing) this._pause();
    else this._play();
  }

  _playheadTime() {
    const offset = this._source
      ? this._audioCtx.currentTime - this._playStartedAt
      : this._playOffset;
    return this._start + Math.min(offset, this._end - this._start);
  }

  // ── Overview canvas (trim) ────────────────────────────────────────────────

  get _overviewEl() {
    return this.shadowRoot?.querySelector('.overview');
  }

  _timeToX(t, width) {
    return (t / this._buffer.duration) * width;
  }

  _xToTime(x, width) {
    return Math.min(this._buffer.duration, Math.max(0, (x / width) * this._buffer.duration));
  }

  _drawOverview() {
    const el = this._overviewEl;
    if (!el || !this._overviewPeaks) return;
    const dpr = window.devicePixelRatio || 1;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
    }
    const ctx = el.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const styles = getComputedStyle(this);
    const accent = styles.getPropertyValue('--color-accent').trim() || '#3b82f6';
    const muted  = styles.getPropertyValue('--color-text-muted').trim() || '#888';
    const overlay = styles.getPropertyValue('--color-overlay').trim() || 'rgba(0,0,0,0.4)';

    const x0 = this._timeToX(this._start, w);
    const x1 = this._timeToX(this._end, w);
    const peaks = this._overviewPeaks;
    const slot = w / peaks.length;
    const mid = h / 2;
    for (let i = 0; i < peaks.length; i++) {
      const x = i * slot;
      const bh = Math.max(1, peaks[i] * (h - 8));
      ctx.fillStyle = (x + slot / 2 >= x0 && x + slot / 2 <= x1) ? accent : muted;
      ctx.fillRect(x, mid - bh / 2, Math.max(1, slot - 0.5), bh);
    }

    // Dim the trimmed-away regions.
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, x0, h);
    ctx.fillRect(x1, 0, w - x1, h);

    // Trim handles.
    ctx.fillStyle = accent;
    for (const x of [x0, x1]) {
      ctx.fillRect(x - 1.5, 0, 3, h);
      ctx.fillRect(x - 5, 0, 10, 10);
      ctx.fillRect(x - 5, h - 10, 10, 10);
    }

    // Playhead.
    if (this._playing || this._playOffset > 0) {
      const px = this._timeToX(this._playheadTime(), w);
      ctx.fillStyle = styles.getPropertyValue('--color-text').trim() || '#000';
      ctx.fillRect(px - 1, 0, 2, h);
    }
  }

  _onPointerDown(e) {
    const el = this._overviewEl;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = this._xToTime(x, rect.width);
    const x0 = this._timeToX(this._start, rect.width);
    const x1 = this._timeToX(this._end, rect.width);

    let handle = null;
    if (Math.abs(x - x0) <= HANDLE_HIT_PX && Math.abs(x - x0) <= Math.abs(x - x1)) handle = 'start';
    else if (Math.abs(x - x1) <= HANDLE_HIT_PX) handle = 'end';

    if (!handle && t > this._start && t < this._end) {
      // Seek within the selection.
      const wasPlaying = this._playing;
      this._stopSource();
      this._playOffset = t - this._start;
      if (wasPlaying) this._play();
      else this._drawOverview();
      return;
    }

    // Outside the selection: grab the nearest handle and jump it here.
    if (!handle) handle = t <= this._start ? 'start' : 'end';
    this._stop();
    this._drag = handle;
    el.setPointerCapture(e.pointerId);
    this._moveHandle(t);
  }

  _onPointerMove(e) {
    if (!this._drag) return;
    const rect = this._overviewEl.getBoundingClientRect();
    this._moveHandle(this._xToTime(e.clientX - rect.left, rect.width));
  }

  _onPointerUp() {
    this._drag = null;
  }

  _moveHandle(t) {
    if (this._drag === 'start') this._start = Math.min(t, this._end - MIN_SELECTION_S);
    else this._end = Math.max(t, this._start + MIN_SELECTION_S);
    this._start = Math.max(0, this._start);
    this._end = Math.min(this._buffer.duration, this._end);
  }

  // ── Preview / output ──────────────────────────────────────────────────────

  _schedulePreview() {
    cancelAnimationFrame(this._previewRaf);
    this._previewRaf = requestAnimationFrame(() => {
      if (!this._buffer) return;
      this._svg = this._buildSvg();
    });
  }

  _buildSvg() {
    return buildWaveformSvg(this._buffer, this._start, this._end, {
      style: this._style,
      detail: { bars: this._detail, wave: this._waveDetail, heartbeat: this._hbDetail }[this._style],
      gap: this._gap,
      rounded: this._style === 'heartbeat' ? this._curved : this._rounded,
      boost: this._boost,
      gate: this._gate,
      contrast: this._contrast,
      thickness: this._thickness,
    });
  }

  _confirm() {
    if (!this._buffer) return;
    emit(EVENTS.WAVEFORM_SELECTED, { svgString: this._buildSvg() });
    this._close();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  _renderOptions() {
    const range = (label, value, min, max, step, set) => html`
      <label class="option">
        <span>${label}</span>
        <input type="range" min=${min} max=${max} step=${step} .value=${String(value)}
          @input=${e => set(Number(e.target.value))} />
      </label>
    `;

    let styleOptions;
    switch (this._style) {
      case 'bars':
        styleOptions = html`
          ${range(`Bars (${this._detail})`, this._detail, 20, 200, 1, v => { this._detail = v; })}
          ${range('Gap', this._gap, 0, 0.8, 0.05, v => { this._gap = v; })}
          <label class="option inline">
            <input type="checkbox" .checked=${this._rounded}
              @change=${e => { this._rounded = e.target.checked; }} />
            <span>Rounded ends</span>
          </label>
        `;
        break;
      case 'wave':
        styleOptions = html`
          ${range(`Detail (${this._waveDetail})`, this._waveDetail, 200, 3000, 50, v => { this._waveDetail = v; })}
          ${range(`Boost (${this._boost.toFixed(1)}×)`, this._boost, 1, 3, 0.1, v => { this._boost = v; })}
        `;
        break;
      case 'heartbeat':
        styleOptions = html`
          ${range(`Detail (${this._hbDetail})`, this._hbDetail, 50, 1000, 10, v => { this._hbDetail = v; })}
          ${range('Noise gate', this._gate, 0, 0.6, 0.02, v => { this._gate = v; })}
          ${range(`Spikiness (${this._contrast.toFixed(1)})`, this._contrast, 0.5, 3, 0.1, v => { this._contrast = v; })}
          ${range('Line thickness', this._thickness, 1, 20, 1, v => { this._thickness = v; })}
          <label class="option inline">
            <input type="checkbox" .checked=${this._curved}
              @change=${e => { this._curved = e.target.checked; }} />
            <span>Rounded peaks</span>
          </label>
        `;
        break;
    }

    const styles = [['bars', 'Bars'], ['wave', 'Wave'], ['heartbeat', 'Heartbeat']];
    return html`
      <div class="options">
        <div class="option full">
          <span>Style</span>
          <div class="segmented">
            ${styles.map(([id, label]) => html`
              <button class=${this._style === id ? 'active' : ''} @click=${() => { this._style = id; }}>${label}</button>
            `)}
          </div>
        </div>
        ${styleOptions}
      </div>
    `;
  }

  render() {
    if (!this._open) return html``;

    let content;
    if (this._loading) {
      content = html`<div class="state-msg"><icon-spinner></icon-spinner> Reading audio…</div>`;
    } else if (this._error) {
      content = html`<div class="state-msg">Couldn't read audio from this file. Try an mp3, wav, m4a or mp4.</div>`;
    } else {
      const playhead = this._playing || this._playOffset > 0 ? this._playheadTime() : this._start;
      content = html`
        <div>
          <div class="section-label">Drag the handles to trim. Click inside the selection to jump there.</div>
          <canvas
            class="overview"
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
          ></canvas>
          <div class="transport">
            <button class="btn" @click=${this._togglePlay}>${this._playing ? 'Pause' : 'Play'}</button>
            <span>${this._playing ? '' : formatTime(playhead)}</span>
            <span class="times">
              ${formatTime(this._start)} – ${formatTime(this._end)}
              (${formatTime(this._end - this._start)})
            </span>
          </div>
        </div>
        <div>
          <div class="section-label">Preview</div>
          <div class="preview">${unsafeHTML(this._svg)}</div>
        </div>
        ${this._renderOptions()}
      `;
    }

    return html`
      <div class="overlay" @click=${(e) => { if (e.target === e.currentTarget) this._close(); }}>
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Waveform — ${this._fileName}</h2>
            <button class="close-btn" @click=${this._close} aria-label="Close">✕</button>
          </div>
          <div class="body">${content}</div>
          <div class="modal-footer">
            <button class="btn" @click=${this._close}>Cancel</button>
            <button
              class="btn btn-primary"
              ?disabled=${!this._buffer || this._loading}
              @click=${this._confirm}
            >Add to Canvas</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('waveform-editor-modal', WaveformEditorModal);
