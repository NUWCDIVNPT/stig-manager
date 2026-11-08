// Pure helpers for the sign-in redirect in init.js.
//
// The OP always returns to one fixed redirect URI, the app root, so a deployment
// registers a single exact URI no matter which page the user opened. The page the
// user asked for is stashed before leaving and restored after the code exchange.

// In history mode the pathname is the route the user landed on, so the root comes
// from the history base. In hash mode the page's directory is the root.
export function appRootUrl({ origin, pathname, historyBase, dev = false }) {
  if (dev) {
    return `${origin}/`
  }
  if (historyBase) {
    return `${origin}${historyBase}client-v2/`
  }
  return `${origin}${pathname.replace(/[^/]*$/, '')}`
}

// History mode puts the app's own query in the real query string, so a query is
// an OIDC response only when it carries code or error and a state. It is ours
// only when that state is the one this tab stashed; any other is stale.
export function classifyCallback(search, expectedState) {
  const params = Object.fromEntries(new URLSearchParams(search))
  if (!(params.code || params.error) || !params.state) {
    return { type: 'none' }
  }
  if (params.state !== expectedState) {
    return { type: 'stale' }
  }
  return { type: 'callback', params }
}

// The stash is a path, query and hash on this origin. Anything else falls back to
// the app root.
export function restoreTarget(stashed, origin, appRoot) {
  if (!stashed) {
    return appRoot
  }
  const url = new URL(stashed, origin)
  return url.origin === origin ? url.href : appRoot
}
