import { ref } from 'vue'

const STORAGE_KEY = 'stigman:recentViews'
const MAX_ITEMS = 20

const recentViews = ref(loadFromStorage())

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }
  catch {
    return []
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentViews.value))
  }
  catch {
    // localStorage full or unavailable
  }
}

export function useRecentViews() {
  function addView({ key, url, label, type, icon }) {
    if (!key || !url || !label) return

    // Remove existing entry with same key
    const filtered = recentViews.value.filter(v => v.key !== key)

    // Add to front
    filtered.unshift({
      key,
      url,
      label,
      type: type || 'other',
      icon: icon || null,
      timestamp: Date.now(),
    })

    // Trim to max
    recentViews.value = filtered.slice(0, MAX_ITEMS)
    saveToStorage()
  }

  function clearViews() {
    recentViews.value = []
    saveToStorage()
  }

  return {
    recentViews,
    addView,
    clearViews,
  }
}
