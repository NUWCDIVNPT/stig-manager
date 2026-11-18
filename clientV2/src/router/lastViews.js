import { omitLabelFilterQuery } from '../shared/lib/labelFilters.js'
import { isNotFoundFor } from './notFound.js'

// Where the user last was in each view, so a link back can reopen it. In memory for the session.
// Routes opt in with meta.viewGroup; only the view's own keys are kept, never the label filter.
const lastByRoute = new Map() // 'route name|collectionId' → { name, params, query }
const lastByGroup = new Map() // 'view group|collectionId' → the route key last seen in that group

const routeKey = route => `${route.name}|${route.params?.collectionId ?? ''}`
const groupKey = route => `${route.meta.viewGroup}|${route.params?.collectionId ?? ''}`

// router.afterEach
export function rememberView(to, from, failure) {
  if (failure) {
    return
  }
  // A page that finds its own URL bad (e.g. an unknown STIG) replaces it with the 404 page; don't link back to it.
  // A 404 for any other URL (e.g. a link to a collection with no grant) says nothing about the page that was left.
  if (to.name === 'not-found') {
    if (from?.meta?.viewGroup && isNotFoundFor(to, from)) {
      forgetView(from)
    }
    return
  }
  if (!to.meta.viewGroup) {
    return
  }
  const key = routeKey(to)
  lastByRoute.set(key, { name: to.name, params: { ...to.params }, query: omitLabelFilterQuery(to.query) })
  lastByGroup.set(groupKey(to), key)
}

function forgetView(route) {
  const key = routeKey(route)
  lastByRoute.delete(key)
  if (lastByGroup.get(groupKey(route)) === key) {
    lastByGroup.delete(groupKey(route))
  }
}

// The query a route was last left with, e.g. a collection tab's selection
export function lastQuery(route) {
  return lastByRoute.get(routeKey(route))?.query ?? {}
}

// The last page seen in a view group (for a collection group, pass its collectionId), or null
export function lastViewIn(group, params = {}) {
  return lastByRoute.get(lastByGroup.get(`${group}|${params.collectionId ?? ''}`)) ?? null
}

// After a collection is deleted, so nothing links back into it
export function forgetCollection(collectionId) {
  for (const map of [lastByRoute, lastByGroup]) {
    for (const key of map.keys()) {
      if (key.endsWith(`|${collectionId}`)) {
        map.delete(key)
      }
    }
  }
}

// Test reset
export function forgetViews() {
  lastByRoute.clear()
  lastByGroup.clear()
}
