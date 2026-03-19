export function readStoredValue(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback
  }
  catch {
    return fallback
  }
}

export function storeValue(key, value) {
  try {
    localStorage.setItem(key, value)
  }
  catch {
    // localStorage unavailable
  }
}
