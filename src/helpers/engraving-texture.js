/**
 * Exports the Fabric canvas as a PNG and returns the region that should map to
 * UV (0,0)→(1,1) on the 3D mesh, as normalized (0–1) fractions of the canvas.
 *
 * Priority: model.textureRegion (hardcoded) → boundary guide bounding box → null (full canvas).
 *
 * Convention: white = unengraved metal, dark = engraved (deeper, matte).
 *
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {string} boundaryLayerId - _layerId prefix of the boundary guide object
 * @param {{ textureRegion?: {x,y,width,height}|null }} model - product model descriptor
 * @returns {Promise<{ dataUrl: string, textureRegion: {x,y,width,height}|null }>}
 *   textureRegion coords are 0–1 fractions of the canvas (x: 0–1, y: 0–1)
 */
export async function exportEngravingTexture(fabricCanvas, boundaryLayerId, model = {}) {
  const cw = fabricCanvas.width;
  const ch = fabricCanvas.height;

  let textureRegion = null;

  if (model.textureRegion) {
    // Hardcoded per-model region in canvas world coords (0–800 x, 0–600 y) → normalize
    const r = model.textureRegion;
    textureRegion = {
      x:      r.x      / cw,
      y:      r.y      / ch,
      width:  r.width  / cw,
      height: r.height / ch,
    };
  } else {
    // Derive from the boundary guide's world-space bounding box
    const guide = fabricCanvas.getObjects()
      .find(o => o._layerId?.startsWith(boundaryLayerId));
    if (guide) {
      const br = guide.getBoundingRect(true); // world (scene) coords, zoom-independent
      textureRegion = {
        x:      br.left   / cw,
        y:      br.top    / ch,
        width:  br.width  / cw,
        height: br.height / ch,
      };
    }
  }

  // Hide all boundary guides so they don't appear in the texture
  const guides = fabricCanvas.getObjects().filter(o => o._layerId?.startsWith('__boundary__'));
  guides.forEach(g => { g.visible = false; });

  // Reset viewport to identity so toDataURL captures the full scene regardless of
  // current pan/zoom — Fabric applies the viewportTransform during export by default
  const savedVpt = fabricCanvas.viewportTransform.slice();
  fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  fabricCanvas.renderAll();

  const dataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });

  fabricCanvas.setViewportTransform(savedVpt);
  guides.forEach(g => { g.visible = true; });
  fabricCanvas.renderAll();

  return { dataUrl, textureRegion };
}
