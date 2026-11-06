import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Writes in the same tick (e.g. a tab clearing two keys) must build on each other, not on the not-yet-updated route
const pendingQuery = new WeakMap()

function writeQueryKey(router, route, key, value) {
  const pending = pendingQuery.get(router)
  const base = pending && pending.path === route.path ? pending.query : route.query
  if ((base[key] ?? null) === value) {
    return
  }
  const query = { ...base }
  if (value === null) {
    delete query[key]
  }
  else {
    query[key] = value
  }
  const entry = { path: route.path, query }
  pendingQuery.set(router, entry)
  Promise.resolve(router.replace({ query })).finally(() => {
    if (pendingQuery.get(router) === entry) {
      pendingQuery.delete(router)
    }
  })
}

// A selection kept in one URL query key (replace, no history entry), so Back, reload and links restore it.
// Writes only while the route it was created on is current, since collection tabs stay mounted while hidden.
export function useQuerySelection(key) {
  const route = useRoute()
  const router = useRouter()
  const ownRoute = route.name
  const fromUrl = route.query[key]

  const selected = ref(typeof fromUrl === 'string' && fromUrl ? fromUrl : null)

  // route.name is watched too so returning to the tab re-syncs the URL with what it still shows
  watch([selected, () => route.name], ([value, name]) => {
    if (name === ownRoute) {
      writeQueryKey(router, route, key, value == null ? null : String(value))
    }
  })

  return selected
}
