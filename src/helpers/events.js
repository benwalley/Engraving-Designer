export const EVENTS = {
  VERSION_SELECTED: 'version:selected',
  VERSION_SAVING:   'version:saving',
  VERSION_SAVED:    'version:saved',
  VERSION_DELETED:  'version:deleted',
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
