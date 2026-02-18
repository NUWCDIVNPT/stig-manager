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
  function addView({ url, label, type, icon }) {
    if (!url || !label) return

    // Remove existing entry with same URL
    const filtered = recentViews.value.filter(v => v.url !== url)

    // Add to front
    filtered.unshift({
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
