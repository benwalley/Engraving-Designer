const DB_NAME = 'engraving-designer';
const DB_VERSION = 1;
const STORE = 'versions';

let db;

function openDB() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveVersion(version) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE, 'readwrite')
      .objectStore(STORE)
      .put(version);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getVersions() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE, 'readonly')
      .objectStore(STORE)
      .getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteVersion(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE, 'readwrite')
      .objectStore(STORE)
      .delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
