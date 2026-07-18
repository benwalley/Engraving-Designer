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
  HISTORY_CHANGED:        'history:changed',
  UNDO_REQUESTED:         'history:undo',
  REDO_REQUESTED:         'history:redo',
  SELECT_ITEM_TO_ENGRAVE: 'engrave:select-item',
  VIEW_3D:                'viewer:3d',
  MODEL_SELECTED:         'model:selected',
  VIEW_3D_CLOSE:          'viewer:3d-close',
  CANVAS_DATA_REQUESTED:  'canvas:data-requested',
  CANVAS_DATA_READY:      'canvas:data-ready',
  HINT_CHANGED:           'hint:changed',
  CLIP_BOUNDARY_TOGGLED:  'clip:boundary-toggled',
  OPEN_ICONIFY_PICKER:    'iconify:open',
  ICONIFY_ICON_SELECTED:  'iconify:selected',
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
