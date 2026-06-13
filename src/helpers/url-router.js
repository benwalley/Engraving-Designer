import { LOCAL, setItem } from './local-storage.js';
import { saveLocalDbVersion } from './local-db.js';
import { MODEL_MAP } from '../models/model-registry.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const params = new URLSearchParams(window.location.search);

const modelId = params.get('model');
if (modelId) {
  if (MODEL_MAP[modelId]) {
    setItem(LOCAL.CURRENT_MODEL_ID, modelId);
  } else {
    console.warn(`[url-router] Unknown model ID: ${modelId}`);
  }
}

const snapshotId = params.get('snapshot');
if (snapshotId) {
  try {
    const snap = await getDoc(doc(db, 'snapshots', snapshotId));
    if (snap.exists()) {
      const snapshot = snap.data();
      const newVersion = {
        id: crypto.randomUUID(),
        name: `Snapshot ${snapshotId.slice(0, 6)}`,
        data: snapshot.canvasData ?? {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveLocalDbVersion(newVersion);
      setItem(LOCAL.CURRENT_VERSION_ID, newVersion.id);
      if (snapshot.modelId) {
        setItem(LOCAL.CURRENT_MODEL_ID, snapshot.modelId);
      }
    } else {
      console.warn(`[url-router] Snapshot not found: ${snapshotId}`);
    }
  } catch (err) {
    console.error('[url-router] Snapshot load failed:', err);
  }
}
