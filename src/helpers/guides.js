import { getItem, setItem, LOCAL } from './local-storage.js';

export const guidesState = {
  verticalGuides: [],    // scene-space X positions
  horizontalGuides: [],  // scene-space Y positions
};

export function drawGuides(ctx, vt) {
  const zoom = vt[0];
  const panX = vt[4];
  const panY = vt[5];
  const dpr = window.devicePixelRatio || 1;
  const w = ctx.canvas.width / dpr;
  const h = ctx.canvas.height / dpr;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.85)';
  ctx.lineWidth = 1;

  for (const sceneX of guidesState.verticalGuides) {
    const screenX = Math.round(sceneX * zoom + panX) + 0.5;
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, h);
    ctx.stroke();
  }

  for (const sceneY of guidesState.horizontalGuides) {
    const screenY = Math.round(sceneY * zoom + panY) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(w, screenY);
    ctx.stroke();
  }

  ctx.restore();
}

export function saveGuides() {
  setItem(LOCAL.GUIDES_DATA, {
    v: guidesState.verticalGuides.slice(),
    h: guidesState.horizontalGuides.slice(),
  });
}

export function loadGuides() {
  const data = getItem(LOCAL.GUIDES_DATA);
  if (data) {
    guidesState.verticalGuides   = Array.isArray(data.v) ? data.v : [];
    guidesState.horizontalGuides = Array.isArray(data.h) ? data.h : [];
  }
}

export function findGuideAtScreenPos(screenX, screenY, vt, threshold = 6) {
  const zoom = vt[0], panX = vt[4], panY = vt[5];
  for (let i = 0; i < guidesState.verticalGuides.length; i++) {
    if (Math.abs(screenX - (guidesState.verticalGuides[i] * zoom + panX)) <= threshold)
      return { type: 'v', index: i };
  }
  for (let i = 0; i < guidesState.horizontalGuides.length; i++) {
    if (Math.abs(screenY - (guidesState.horizontalGuides[i] * zoom + panY)) <= threshold)
      return { type: 'h', index: i };
  }
  return null;
}
