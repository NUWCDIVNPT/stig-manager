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

### Hard-coded Colors
`CollectionView.vue` has explicit hex colors that violate the "no explicit colors" convention:
```css
background-color: #1f1f1f;
border: 1px solid #3a3d40;
color: #60a5fa;
```
**Fix:** Use CSS custom properties: `var(--surface-ground)`, `var(--surface-border)`, or PrimeVue theme tokens.

### Console Logs to Remove
`MetricsSummaryGrid.vue` contains debug logs:
```js
console.log('apiMetricsSummary changed')
console.log('Determining aggregation type for metrics summary')
console.log('Computing columns for aggregation type:', aggregationType.value)
```
**Fix:** Remove before shipping, or use a debug flag.

---

## Naming Reconciliation

| Docs Say | Implementation Is | Status |
|----------|-------------------|--------|
| `MetricsDataTable` | `MetricsSummaryGrid` | Docs updated |
| `CollectionDashboard` | `CollectionView` | Docs updated |
| `ChecklistGrid` | (not yet implemented) | N/A |

---

## Data Fetching Strategy

Since metrics must be live (no stale data), we avoid TanStack Query caching. Use simple fetch composables instead:

- Wrap fetch in composable with `ref` for data, loading, error
- Watch dependencies and auto-fetch on change
- Return `refetch()` for manual refresh
- For live updates: consider polling interval or SSE
- Cleanup intervals in `onUnmounted`

See `reusable-components.md` for the documented pattern.

---

## Session Notes

### 2025-01-25
- Completed initial documentation review
- Identified naming mismatches between docs and implementation
- Documented hard-coded color and console.log issues
- Added missing features to feature-list.md from STIG Manager feature reference
- Updated reusable-components.md with data fetching pattern (replacing TanStack)
- Synced naming across all documentation files
