export const gridState = {
  size: 20,
  showGrid: false,
  snapToGrid: false,
};

export function snapCoord(value) {
  if (!gridState.snapToGrid) return value;
  return Math.round(value / gridState.size) * gridState.size;
}
