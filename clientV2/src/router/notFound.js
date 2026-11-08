// The 404 page for a route, keeping the URL the user opened (path, query and hash) in the address bar.
// Used by the route guard and by pages that find their URL is bad or not theirs to see.
export function notFoundLocation(route) {
  return { name: 'not-found', params: { pathMatch: route.path.substring(1).split('/') }, query: route.query, hash: route.hash }
}
