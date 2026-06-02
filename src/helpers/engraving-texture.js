/**
 * Exports the portion of the Fabric canvas that corresponds to the engravable
 * area (the boundary guide object) as a PNG data URL for use as a Three.js texture.
 *
 * Convention: white = unengraved metal, dark = engraved (deeper, matte).
 *
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {string} boundaryLayerId - _layerId prefix of the boundary guide object
 * @returns {Promise<string>} PNG data URL
 */
export async function exportEngravingTexture(fabricCanvas, boundaryLayerId) {
  const guide = fabricCanvas.getObjects()
    .find(o => o._layerId?.startsWith(boundaryLayerId));

  if (!guide) {
    return fabricCanvas.toDataURL({ format: 'png', multiplier: 1 });
  }

  // getBoundingRect(true) returns world (absolute) coordinates — before viewport transform.
  // toDataURL left/top/width/height are screen pixel coordinates, so convert: screen = world * zoom + pan.
  const vt   = fabricCanvas.viewportTransform;
  const zoom = vt[0];
  const panX = vt[4];
  const panY = vt[5];
  const br   = guide.getBoundingRect(true); // true = world/absolute coords

  const left   = Math.round(br.left   * zoom + panX);
  const top    = Math.round(br.top    * zoom + panY);
  const width  = Math.round(br.width  * zoom);
  const height = Math.round(br.height * zoom);

  if (width <= 0 || height <= 0) {
    return fabricCanvas.toDataURL({ format: 'png', multiplier: 1 });
  }

  // Stage 1: capture the rectangular bounding region without the boundary guide
  guide.visible = false;
  fabricCanvas.renderAll();
  const rectDataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 1, left, top, width, height });
  guide.visible = true;
  fabricCanvas.renderAll();

  // Stage 2: clip the captured image to the exact boundary shape using Path2D.
  // Transform chain: guide-local → world (calcTransformMatrix) → screen → texture coords (offset by left/top).
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width  = width;
      maskCanvas.height = height;
      const ctx = maskCanvas.getContext('2d');

      // White background = unengraved metal
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      // Build the combined local→texture transform
      const [ga, gb, gc, gd, ge, gf] = guide.calcTransformMatrix();
      const guideMat = new DOMMatrix([ga, gb, gc, gd, ge, gf]);
      const vpMat    = new DOMMatrix([zoom, 0, 0, zoom, panX - left, panY - top]);
      const texMat   = vpMat.multiply(guideMat);

      // guide.path is an array of SVG command arrays: [['M', x, y], ['L', x, y], ...]
      const pathStr = guide.path.map(cmd => cmd.join(' ')).join(' ');

      ctx.save();
      ctx.setTransform(texMat);
      ctx.clip(new Path2D(pathStr), 'evenodd');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      resolve(maskCanvas.toDataURL('image/png'));
    };
    img.src = rectDataUrl;
  });
}
