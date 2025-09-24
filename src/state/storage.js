export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveString(key, value) {
  try { localStorage.setItem(key, String(value)); } catch {}
}

export function loadInt(key, fallback = 0) {
  try {
    const v = Number.parseInt(localStorage.getItem(key) ?? "", 10);
    return Number.isFinite(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
