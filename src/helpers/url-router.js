import { LOCAL, setItem } from './local-storage.js';
import { MODEL_MAP } from '../models/model-registry.js';

const params = new URLSearchParams(window.location.search);

const modelId = params.get('model');
if (modelId) {
  if (MODEL_MAP[modelId]) {
    setItem(LOCAL.CURRENT_MODEL_ID, modelId);
  } else {
    console.warn(`[url-router] Unknown model ID: ${modelId}`);
  }
}
