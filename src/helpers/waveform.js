// Audio → waveform helpers. Pure functions apart from decoding, which needs an AudioContext.

// Design units of the generated SVG — it is rescaled when placed on the canvas.
const SVG_WIDTH  = 1000;
const SVG_HEIGHT = 200;
const MID = SVG_HEIGHT / 2;

export async function decodeMediaFile(file, audioCtx) {
  const buf = await file.arrayBuffer();
  return audioCtx.decodeAudioData(buf);
}

// Splits [startSec, endSec) into `count` equal sample ranges and calls fn(data, s, e, i)
// for each range of each channel.
function forEachBucket(audioBuffer, startSec, endSec, count, fn) {
  const rate = audioBuffer.sampleRate;
  const from = Math.max(0, Math.floor(startSec * rate));
  const to   = Math.min(audioBuffer.length, Math.ceil(endSec * rate));
  const span = Math.max(1, to - from);
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    const data = audioBuffer.getChannelData(c);
    for (let i = 0; i < count; i++) {
      const s = from + Math.floor(i * span / count);
      const e = Math.min(to, Math.max(s + 1, from + Math.floor((i + 1) * span / count)));
      fn(data, s, e, i);
    }
  }
}

function normalizeInPlace(values) {
  let max = 0;
  for (const v of values) if (Math.abs(v) > max) max = Math.abs(v);
  if (max > 0) for (let i = 0; i < values.length; i++) values[i] /= max;
  return values;
}

// RMS loudness of `count` equal buckets across [startSec, endSec), loudest channel wins.
// With `normalize`, values are scaled so the loudest bucket in the range is 1.
export function computePeaks(audioBuffer, startSec, endSec, count, { normalize = true } = {}) {
  const peaks = new Float32Array(count);
  forEachBucket(audioBuffer, startSec, endSec, count, (data, s, e, i) => {
    let sum = 0;
    for (let j = s; j < e; j++) sum += data[j] * data[j];
    const rms = Math.sqrt(sum / Math.max(1, e - s));
    if (rms > peaks[i]) peaks[i] = rms;
  });
  return Array.from(normalize ? normalizeInPlace(peaks) : peaks);
}

// Signed extremes per bucket (the "real" waveform), normalized together to -1..1.
export function computeMinMax(audioBuffer, startSec, endSec, count) {
  const min = new Float32Array(count);
  const max = new Float32Array(count);
  forEachBucket(audioBuffer, startSec, endSec, count, (data, s, e, i) => {
    let lo = min[i], hi = max[i];
    for (let j = s; j < e; j++) {
      const v = data[j];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    min[i] = lo;
    max[i] = hi;
  });
  let peak = 0;
  for (let i = 0; i < count; i++) peak = Math.max(peak, -min[i], max[i]);
  if (peak > 0) for (let i = 0; i < count; i++) { min[i] /= peak; max[i] /= peak; }
  return { min: Array.from(min), max: Array.from(max) };
}

const r1 = n => Math.round(n * 10) / 10;
const r2 = n => Math.round(n * 100) / 100;

function roundedRectPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0) return `M${r2(x)},${r2(y)}h${r2(w)}v${r2(h)}h${r2(-w)}z`;
  return `M${r2(x + r)},${r2(y)}h${r2(w - 2 * r)}a${r2(r)},${r2(r)} 0 0 1 ${r2(r)},${r2(r)}`
    + `v${r2(h - 2 * r)}a${r2(r)},${r2(r)} 0 0 1 ${r2(-r)},${r2(r)}`
    + `h${r2(-(w - 2 * r))}a${r2(r)},${r2(r)} 0 0 1 ${r2(-r)},${r2(-r)}`
    + `v${r2(-(h - 2 * r))}a${r2(r)},${r2(r)} 0 0 1 ${r2(r)},${r2(-r)}z`;
}

function barsPath(peaks, { gap, rounded }) {
  const slot = SVG_WIDTH / peaks.length;
  const w = slot * (1 - gap);
  const minH = rounded ? w : SVG_HEIGHT * 0.02;
  return peaks.map((p, i) => {
    const h = Math.max(minH, p * SVG_HEIGHT);
    const x = i * slot + (slot - w) / 2;
    const y = (SVG_HEIGHT - h) / 2;
    return roundedRectPath(x, y, w, h, rounded ? w / 2 : 0);
  }).join('');
}

// Filled shape whose top edge traces each bucket's max and bottom edge its min.
// `minHalf` keeps silence visible as a thin centre line.
function wavePath({ min, max }, { boost, minHalf }) {
  const n = max.length;
  const step = SVG_WIDTH / (n - 1);
  const top = (v) => MID - Math.max(minHalf, Math.min(1, v * boost) * MID);
  const bot = (v) => MID + Math.max(minHalf, Math.min(1, -v * boost) * MID);
  let d = `M0,${r1(top(max[0]))}`;
  for (let i = 1; i < n; i++) d += `L${r1(i * step)},${r1(top(max[i]))}`;
  for (let i = n - 1; i >= 0; i--) d += `L${r1(i * step)},${r1(bot(min[i]))}`;
  return d + 'z';
}

// A single line through the signal itself: alternately each bucket's max and min, so the
// trace zigzags like an ECG while every spike's height comes from the audio. Anything below
// `gate` sits on the baseline; `contrast` > 1 exaggerates loud spikes over quieter ones.
function heartbeatPath({ min, max }, { gate, contrast, rounded }) {
  const n = max.length;
  const step = SVG_WIDTH / (n - 1);
  const amp = MID * 0.85; // headroom for curve overshoot and stroke width
  const pts = max.map((hi, i) => {
    const v = i % 2 ? min[i] : hi;
    const m = Math.max(0, (Math.abs(v) - gate) / (1 - gate)) ** contrast;
    return [i * step, MID - Math.sign(v) * m * amp];
  });
  if (rounded) return monotoneCurve(pts);
  return 'M' + simplify(pts, 0.05).map(([x, y]) => `${r1(x)},${r1(y)}`).join('L');
}

// Smooth curve through evenly spaced points that never overshoots them (monotone cubic
// Hermite, harmonic-mean tangents): peaks land exactly on their value with rounded tops,
// and flat runs stay flat, collapsing into single line segments.
function monotoneCurve(pts) {
  const n = pts.length;
  const h = pts[1][0] - pts[0][0];
  const slope = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / h);
  const tangent = pts.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    const [s0, s1] = [slope[i - 1], slope[i]];
    return s0 * s1 > 0 ? (2 * s0 * s1) / (s0 + s1) : 0;
  });

  let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
  let inFlat = false;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (slope[i] === 0 && tangent[i] === 0 && tangent[i + 1] === 0) {
      inFlat = true;
      continue;
    }
    if (inFlat) {
      d += `L${r1(x0)},${r1(y0)}`;
      inFlat = false;
    }
    d += `C${r1(x0 + h / 3)},${r1(y0 + tangent[i] * h / 3)} ${r1(x1 - h / 3)},${r1(y1 - tangent[i + 1] * h / 3)} ${r1(x1)},${r1(y1)}`;
  }
  if (inFlat) d += `L${r1(pts[n - 1][0])},${r1(pts[n - 1][1])}`;
  return d;
}

// Ramer–Douglas–Peucker: drops points within `eps` of the line through their neighbours,
// so flat baseline runs collapse to a single segment without flattening the curves.
function simplify(pts, eps) {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let worst = -1, worstDist = eps;
    for (let i = a + 1; i < b; i++) {
      const dist = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len;
      if (dist > worstDist) { worst = i; worstDist = dist; }
    }
    if (worst > 0) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

function svgDoc(body, pad = 0) {
  const vb = `${-pad} ${-pad} ${SVG_WIDTH + pad * 2} ${SVG_HEIGHT + pad * 2}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${SVG_WIDTH + pad * 2}" height="${SVG_HEIGHT + pad * 2}">${body}</svg>`;
}

const strokeAttrs = (thickness) =>
  `fill="none" stroke="#000000" stroke-width="${thickness}" stroke-linejoin="round" stroke-linecap="round"`;

// Builds the SVG for the selection. style: 'bars' | 'wave' | 'heartbeat'
export function buildWaveformSvg(audioBuffer, startSec, endSec, {
  style = 'bars',
  detail = 80,       // bar, column or point count
  gap = 0.4,         // bars
  rounded = true,    // bars: rounded ends; heartbeat: curved peaks
  boost = 1,         // wave
  gate = 0.1,        // heartbeat
  contrast = 1.5,    // heartbeat
  thickness = 4,     // heartbeat
} = {}) {
  if (style === 'wave') {
    const mm = computeMinMax(audioBuffer, startSec, endSec, Math.max(2, detail));
    return svgDoc(`<path d="${wavePath(mm, { boost, minHalf: 0.75 })}" fill="#000000"/>`);
  }

  if (style === 'heartbeat') {
    const mm = computeMinMax(audioBuffer, startSec, endSec, Math.max(2, detail));
    const d = heartbeatPath(mm, { gate, contrast, rounded });
    return svgDoc(`<path d="${d}" ${strokeAttrs(thickness)}/>`, thickness / 2);
  }

  const peaks = computePeaks(audioBuffer, startSec, endSec, Math.max(2, detail));
  return svgDoc(`<path d="${barsPath(peaks, { gap, rounded })}" fill="#000000"/>`);
}
