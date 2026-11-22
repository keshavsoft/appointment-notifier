const STORAGE_KEY = "carecall_v3_dr_key";

export function getSavedKey() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function saveKey(key) {
  localStorage.setItem(STORAGE_KEY, key);
}
