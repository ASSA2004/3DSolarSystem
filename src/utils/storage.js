export function readSetting(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem("orbit:" + key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function saveSetting(key, value) {
  try {
    localStorage.setItem("orbit:" + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
