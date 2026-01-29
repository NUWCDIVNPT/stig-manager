# Development Notes

Running analysis and feedback from code review sessions.

## Current Status
- 2025-01-25: Initial architecture analysis complete

---

## Architecture Observations

### What's Working Well

1. **Route-as-state** - URL drives UI state (active tab, review mode, selections). Benefits:
   - Shareable/bookmarkable URLs
   - Browser back/forward works naturally
   - Reduces component state complexity
   - Easy to test

2. **Schema-adaptive MetricsSummaryGrid** - Detecting aggregation type from data shape is clever. One component handles asset/stig/label/unagg views.

3. **Feature-based folder organization** - `features/FeatureName/{components,queries,composables}/` is clean and scales well.

4. **Column component tiers** - Native/Wrapper/Shared distinction is clear and documented.

5. **Composable wrappers for dependency injection** - Thin wrappers that inject the OIDC token keep components clean.

---

## Issues to Address



## Data Fetching Strategy

TanStack Query removed — we didn't need caching and it added complexity. May revisit later if we find appropriate uses (deduplication, optimistic updates, etc.). Current approach: manual `async function` + `ref()` + `watch()`.

### Refactor plan

**1. `smFetch` — centralized HTTP client** (`shared/api/smFetch.js`)

Thin wrapper around `fetch()` that resolves token internally (module-level singleton, same pattern as `useEnv().apiUrl`). Call `setOidcWorker(worker)` once in `main.js` at bootstrap. API functions drop the `token` param entirely. Also the right place for centralized 401/auth-expiry handling — already have `globalAuthStore.noTokenMessage` and `useGlobalError` to wire in.

Current API function (~15 lines each, repeated across all API modules):
```js
export async function fetchCollectionStigSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/stig`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Collection STIG summary ${response.status} ${response.statusText}`)
  }
  const text = await response.text()
  return text ? JSON.parse(text) : null
}
```

With `smFetch`:
```js
export function fetchCollectionStigSummary(collectionId) {
  return smFetch(`/collections/${collectionId}/metrics/summary/stig`)
}
```

Current component boilerplate (every component that fetches):
```js
const oidcWorker = inject('worker')
const token = computed(() => oidcWorker?.token)
// ...then pass token.value to every API call
```
With `smFetch`: removed entirely — components don't touch tokens.

**2. `useAsyncData` composable** (`shared/composables/useAsyncData.js`)

Generic composable returning refs for `{ data, isLoading, errorMessage, execute }`.
Takes any async function, executes it, and returns reactive refs for data, isLoading, errorMessage, plus execute() to call it again. 

Current pattern (~15 lines per query, 5x in CollectionView alone):
```js
const stigs = ref([])
const stigsLoading = ref(false)
const stigsError = ref(null)

async function loadStigs() {
  if (!props.collectionId) return
  stigsLoading.value = true
  stigsError.value = null
  try {
    stigs.value = await fetchCollectionStigSummary({ collectionId: props.collectionId, token: token.value })
  } catch (err) {
    stigsError.value = err.message
  } finally {
    stigsLoading.value = false
  }
}
```

With `useAsyncData`:
```js
const { data: stigs, isLoading: stigsLoading, errorMessage: stigsError, execute: loadStigs }
  = useAsyncData(() => fetchCollectionStigSummary(props.collectionId), { defaultValue: [] })
```

**3. Simplify watches** *(not yet implemented)*

Child watches currently duplicate `collectionId`:
```js
watch([() => props.collectionId, selectedBenchmarkId], loadChecklistAssets, { immediate: true })
```

Could simplify to only watch the selection ref:
```js
watch(selectedBenchmarkId, loadChecklistAssets)
```
The idea: when `collectionId` changes → parent data reloads → selections reset → child watches fire from the cascade.

**Edge case:** The auto-select watches only set the selection when it's currently `null`:
```js
watch(stigs, (newStigs) => {
  if (newStigs?.length > 0 && selectedBenchmarkId.value === null) {
    selectedBenchmarkId.value = newStigs[0].benchmarkId
  }
})
```
If `collectionId` changes but selections are NOT reset to `null`, and the new collection happens to have the same benchmarkId/assetId value as the old one, the selection ref won't change — so a child watch that only watches the selection ref won't fire, leaving stale child data from the previous collection.

To safely remove `collectionId` from child watches, the parent watch must first reset selections:
```js
watch([() => props.collectionId], () => {
  selectedBenchmarkId.value = null
  selectedAssetId.value = null
  loadCollection()
  loadStigs()
  loadAssets()
  // ...
})
```
This ensures the full cascade: collectionId changes → selections reset to null → parent data loads → auto-select fires (selection is null) → selection changes → child watch fires.

---

### Hard-coded Colors
`CollectionView.vue` has explicit hex colors that violate the "no explicit colors" convention:
```css
background-color: #1f1f1f;
border: 1px solid #3a3d40;
color: #60a5fa;
```
**Fix:** Use CSS custom properties: `var(--surface-ground)`, `var(--surface-border)`, or PrimeVue theme tokens.

---
## Questions

### `height: 100%` vs `80vh` on Tabs root (CollectionView.vue `tabsPt`)
There was a concern that `height: 100%` on the Tabs root passthrough would break PrimeVue's virtual scroller in MetricsSummaryGrid. The theory: in a deep flex/percentage chain (7 levels from grid track to DataTable), the browser might not resolve the height before the virtual scroller reads `clientHeight` during mount, causing it to get 0 and render no rows.

**Finding:** PrimeVue's VirtualScroller source (`primevue/virtualscroller/VirtualScroller.vue`) uses three resilience mechanisms:
1. **`ResizeObserver`** on its own DOM element — re-initializes when dimensions change
2. **`updated()` retry** — if `isVisible()` fails at mount, retries on every Vue update cycle
3. **Window resize/orientation listeners** as additional fallbacks

This means even if the initial mount measurement is 0, the scroller self-corrects once layout resolves. `height: 100%` is safe; `80vh` is not needed as a workaround.

---

## Session Notes

### 2025-01-28
- Resolved merge conflicts from new-client branch (TanStack removal)
- Replaced `refetchX()` template calls with `loadX()` equivalents
- Analyzed post-TanStack fetch architecture; documented 4 improvements (smFetch, useAsyncData, watch cleanup, centralized 401)

### 2025-01-25
- Completed initial documentation review
- Identified naming mismatches between docs and implementation
- Documented hard-coded color and console.log issues
- Added missing features to feature-list.md from STIG Manager feature reference
- Updated reusable-components.md with data fetching pattern (replacing TanStack)
- Synced naming across all documentation files
