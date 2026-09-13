/** JSON helpers that never throw (private mode, blocked storage, bad JSON all fall back). */
export function readJson(store, key, fallback) {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(store, key, value) {
  try {
    store?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(store, key) {
  try {
    store?.removeItem(key);
  } catch {
    /* storage unavailable: nothing to remove */
  }
}
