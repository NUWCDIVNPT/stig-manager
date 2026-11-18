// The 404 page for a route, keeping the URL the user opened (path, query and hash) in the address bar.
// Used by the route guard and by pages that find their URL is bad or not theirs to see.
export function notFoundLocation(route) {
  return { name: 'not-found', params: { pathMatch: route.path.substring(1).split('/') }, query: route.query, hash: route.hash }
}

// Whether `to` is the 404 page standing in for `route`'s own URL (see notFoundLocation)
export function isNotFoundFor(to, route) {
  return to.name === 'not-found' && [to.params.pathMatch ?? []].flat().join('/') === route.path.substring(1)
}
