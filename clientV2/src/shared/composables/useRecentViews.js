import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCurrentUser } from './useCurrentUser.js'

// A view is { type, section?, collectionId?, assetId?, benchmarkId?, label, url };
// type picks the nav rail icon, section splits one entity into pages (Findings, Manage, admin pages).
const IDENTITY = ['type', 'section', 'collectionId', 'assetId', 'benchmarkId']
const MAX_ITEMS = 20
// One list for every user of the browser; replaced by per-user keys
const SHARED_STORAGE_KEY = 'stigman:recentViews'

const views = ref([])
let loadedFor = null

const storageKey = userId => `${SHARED_STORAGE_KEY}:${userId}`

function load(userId) {
  if (loadedFor === userId) {
    return
  }
  loadedFor = userId
  try {
    localStorage.removeItem(SHARED_STORAGE_KEY)
    const stored = JSON.parse(localStorage.getItem(storageKey(userId)))
    views.value = Array.isArray(stored) ? stored : []
  }
  catch {
    views.value = []
  }
}

function save() {
  if (loadedFor == null) {
    return
  }
  try {
    localStorage.setItem(storageKey(loadedFor), JSON.stringify(views.value))
  }
  catch {
    // storage full or blocked; the list still works for this session
  }
}

// IDs from route params and API objects may be numbers or strings
function normalize(view) {
  const out = { ...view }
  for (const field of IDENTITY) {
    if (out[field] == null) {
      delete out[field]
    }
    else {
      out[field] = String(out[field])
    }
  }
  return out
}

const sameView = (a, b) => IDENTITY.every(field => a[field] === b[field])

export function useRecentViews() {
  const { user, hasCollectionAccess } = useCurrentUser()
  load(user.value?.userId)

  // Views of collections the user lost (deleted, grant revoked) stay stored but hidden
  const isVisible = v => !v.collectionId || hasCollectionAccess(v.collectionId)
  const recentViews = computed(() => views.value.filter(isVisible))

  function addView(view) {
    if (!view.label || !view.url) {
      return
    }
    const entry = normalize(view)
    // The cap counts visible views only, so hidden ones don't push out views the user can open
    let visible = 0
    views.value = [entry, ...views.value.filter(v => !sameView(v, entry))]
      .filter(v => !isVisible(v) || ++visible <= MAX_ITEMS)
    save()
  }

  // Removes views whose fields equal every given field, e.g. { collectionId: '12' }; an empty match removes nothing
  function forget(match) {
    const fields = Object.entries(normalize(match))
    if (!fields.length) {
      return
    }
    views.value = views.value.filter(v => !fields.every(([field, value]) => v[field] === value))
    save()
  }

  function clearViews() {
    views.value = []
    save()
  }

  return { recentViews, addView, forget, clearViews }
}

// Records the page in Recent whenever describeView() returns a view (without url) or the URL changes
export function useTrackRecentView(describeView) {
  const route = useRoute()
  const { addView } = useRecentViews()
  watch(
    () => {
      const view = describeView()
      return view && { ...view, url: route.fullPath }
    },
    (view) => {
      if (view) {
        addView(view)
      }
    },
    { immediate: true },
  )
}
