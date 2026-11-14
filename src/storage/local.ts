// localStorage wrapper. Every read and write is wrapped in try/catch so the
// game still works if storage is blocked or full. No data ever leaves the
// device.

const PREFIX = "solwatch:";

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage blocked or full. The game keeps working without saving.
  }
}
