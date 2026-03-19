# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Dev server (port 5173)
npm run build            # Production build
npm test                 # Vitest watch mode
npm run test:ui          # Vitest browser UI
npm run test:coverage    # Coverage report
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
```

To run a single test file: `npx vitest run src/features/CollectionMetrics/tests/ExportMetricsModal.test.js`

## Architecture

Vue 3 SPA (Composition API) + Vite, PrimeVue 4 UI, Vue Router 4. No Pinia, no Axios — uses custom reactive stores and a native-fetch API client.

### Feature Modules (`src/features/`)

Each major view is a self-contained feature module:

```
src/features/FeatureName/
├── api/featureApi.js          # Data fetching functions
├── components/
│   ├── FeatureName.vue        # Container: handles routing + data loading
│   └── ChildTab.vue           # Child: receives data as props
├── composables/               # Feature-level composables (if needed)
└── tests/FeatureName.test.js
```

### API Client Pattern

No Axios. Uses a custom OpenAPI-driven client in `src/shared/api/apiClient.js`:

```javascript
import { apiCall } from '@/shared/api/apiClient.js'

// Resolves operationId from loaded OpenAPI spec → builds URL, injects Bearer token
const data = await apiCall('getCollection', { collectionId: 123 })

// Direct HTTP methods also available:
api.get('/path'), api.post('/path', body), api.del('/path')
```

The OpenAPI spec is fetched from `/op/definition` at app startup. `openApiOps.js` maps operationIds to URL templates.

### Data Fetching: `useAsyncState`

The standard pattern for async data in components (`src/shared/composables/useAsyncState.js`):

```javascript
const { state, isLoading, error, execute } = useAsyncState(
  (signal) => fetchSomething(id, { signal }),
  { immediate: false }
)

// Trigger manually (e.g., watch for route param change):
watch(() => route.params.id, (id) => execute(id), { immediate: true })
```

Features: AbortController integration, race-condition protection via generation counter, errors surfaced reactively (never rethrown).

### State Management

Simple `reactive()` objects exported as composables — no Pinia:

```javascript
// src/shared/stores/globalAppStore.js
const state = reactive({ user: null, classification: null })
export function useGlobalAppStore() {
  return {
    get user() { return state.user },
    setUser(val) { state.user = val }
  }
}
```

Key global stores: `globalAppStore`, `globalAuthStore`, `useEnv`, `selectedCollection`.

### Authentication

OIDC flow managed by a SharedWorker (`src/auth/useOidcWorker.js`). Tokens are shared across browser tabs via BroadcastChannel. `src/init.js` runs before Vue mounts to complete the OIDC redirect callback, fetch the user profile, then call `loadApp()` which boots `main.js`.

### Routing

Routes defined in `src/router/index.js`. Navigation guards in `src/router/navigationGuards.js` enforce `requiresAdmin`, `requiresCollectionGrant`, and `minRoleId` route meta fields.

### Shared vs. Feature Components

- `src/shared/components/` — components reused across multiple features
- `src/features/*/components/` — components only used within that feature
- `src/shared/lib/` — pure utility functions with no Vue dependency

## Testing

Vitest + Testing Library (Vue) + jsdom. Global setup in `src/testUtils/setupTests.js` polyfills ResizeObserver and `window.matchMedia` (required by PrimeVue).

```javascript
import { render } from '@testing-library/vue'

it('renders correctly', async () => {
  const { getByText } = render(MyComponent, { props: { id: 1 } })
  expect(getByText('Expected text')).toBeDefined()
})
```

Use `vi.mock()` for module mocking, `vi.fn()` for spies. The `@` path alias maps to `./src`.

## Code Style

ESLint uses `@antfu/eslint-config` (flat config). Single quotes, no semicolons enforced by the config. `no-console` is disabled (console usage is allowed).
