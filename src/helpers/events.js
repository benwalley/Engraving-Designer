export const EVENTS = {
  VERSION_SELECTED: 'version:selected',
  VERSION_SAVING:   'version:saving',
  VERSION_SAVED:    'version:saved',
  VERSION_DELETED:  'version:deleted',
  TOOL_CHANGED:     'tool:changed',
  ZOOM_CHANGED:         'zoom:changed',
  ZOOM_SET:             'zoom:set',
  SELECTION_CHANGED:    'selection:changed',
  TOOL_OPTIONS_CHANGED: 'tool-options:changed',
  CANVAS_OBJECTS_UPDATED: 'canvas:objects-updated',
  LAYER_SELECT:           'layer:select',
  LAYER_REORDER:          'layer:reorder',
  LAYER_RENAME:           'layer:rename',
  LAYER_DELETED:          'layer:deleted',
  GRID_CHANGED:           'grid:changed',
  HISTORY_CHANGED:        'history:changed',
  UNDO_REQUESTED:         'history:undo',
  REDO_REQUESTED:         'history:redo',
};

const listeners = new Map();

export function on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
}

export function off(event, callback) {
  listeners.get(event)?.delete(callback);
}

export function emit(event, data) {
  listeners.get(event)?.forEach(cb => cb(data));
}
