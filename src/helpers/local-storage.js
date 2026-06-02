const STORAGE_KEY = 'engraving-app';
export const LOCAL = {
  CURRENT_VERSION_ID: "current-version-id",
  CURRENT_MODEL_ID: "current-model-id",
  THEME: "theme",
  GRID_SHOW: "grid-show",
  GRID_SNAP: "grid-snap",
}

function getStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getItem(key) {
  return getStore()[key] ?? null;
}

export function setItem(key, value) {
  const store = getStore();
  store[key] = value;
  saveStore(store);
}

export function removeItem(key) {
  const store = getStore();
  delete store[key];
  saveStore(store);
}
