// Router has been deprecated in SPA mode. Keep a minimal `routes` export for
// tests and legacy imports, but do NOT create an actual vue-router instance.
export const routes = [
  { path: '/', name: 'home', component: () => import('../pages/StigmanSPA.vue') },
  { path: '/hello', name: 'hello', component: () => import('../pages/HelloWorldPage.vue') },
  {
    path: '/sse-test',
    name: 'sse-test',
    component: () => import('../features/SSETest/components/SseTest.vue'),
  },
]

export const deprecated = true

// Note: do not create or export a `router` instance — the app now runs as a
// single-page application without vue-router. Remove any runtime imports of
// `router` and update tests to render components directly.
