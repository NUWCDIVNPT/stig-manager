import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Writes in the same update (e.g. a tab clearing two keys) must build on each other, not on the not-yet-updated route.
// Only for that update: a later write starts from the URL again, so another navigation's query isn't overwritten.
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
  queueMicrotask(() => {
    if (pendingQuery.get(router) === entry) {
      pendingQuery.delete(router)
    }
  })
  router.replace({ query, hash: route.hash })
}

// A selection kept in one URL query key (replace, no history entry), so Back, reload and links restore it.
// Writes only while the route it was created on is current, since collection tabs stay mounted while hidden.
export function useQuerySelection(key) {
  const route = useRoute()
  const router = useRouter()
  const ownRoute = route.name
  const readUrl = () => (typeof route.query[key] === 'string' && route.query[key]) || null
  const toQueryValue = value => (value == null ? null : String(value))

  const selected = ref(readUrl())

  watch(selected, (value) => {
    if (route.name === ownRoute) {
      writeQueryKey(router, route, key, toQueryValue(value))
    }
  })

  // Returning to a hidden tab, or a link to the same page that leaves the key out (the collection breadcrumb,
  // a Recent view): the URL catches up with what is shown.
  // Any other URL change while on this route (Back/Forward, links, another collection): the selection follows the URL.
  watch(() => [route.name, route.path, readUrl()], ([name, path, urlValue], [prevName, prevPath]) => {
    if (name !== ownRoute) {
      return
    }
    if (prevName !== ownRoute || (urlValue === null && path === prevPath)) {
      writeQueryKey(router, route, key, toQueryValue(selected.value))
    }
    else if (urlValue !== toQueryValue(selected.value)) {
      selected.value = urlValue
    }
  })

  return selected
}
