# Cross-cutting TODOs

Items that affect multiple features and should get a shared fix, not a local patch.
Most originated from the Findings feature review (2026-06-10) — see
[findings-review.md](findings-review.md) for that feature's remaining items.

## Correctness

- [ ] **Wire up the remaining domain sorts from `shared/lib/gridSorts.js`.**
  `statusSortValue` and `resultSortValue` are implemented (workflow order and badge
  display order respectively) but not yet wired in — both change user-visible sort
  behavior, so deferred. Targets: `statusSortValue` → status columns in
  `AssetReview/AssetChecklistGridTable.vue` and `CollectionReview/RuleTableGrid.vue`
  (currently `sort-field="status.label"`, alphabetical); `resultSortValue` →
  Current/New columns in `AssetStigImport/AssetStigPreviewStep.vue` (currently raw
  result strings, alphabetical) via `:sort-field="r => resultSortValue(r.currentResult)"`.

- [ ] **CSV export gaps.**
  `exportCSV` only exports columns with a `field`: the STIGs column (both Findings
  grids), the engine icon column, and asset labels are absent from exports, while
  decorated internal fields (`_rowKey`, `_engineDisplay`, …) may leak in. Audit actual
  export output; use `exportable` / `exportHeader` on Column. Likely applies to every
  grid using the decorate-rows pattern.

## Hardening (latent — not reachable today)

- [ ] **Manual state clears bypass `useAsyncState`'s race guard.**
  Clearing state directly (e.g. `reviews.value = []` in `useFindingReviews`) does not
  bump the composable's generation counter, so an in-flight response could repopulate
  cleared state. Not reachable today (the findings API returns only the active
  aggregator's key field per row, so no spurious fetch can start), but worth a shared
  fix: add a `reset()` to `useAsyncState` that bumps generation / aborts — other
  features clear state manually the same way. Think about this holistically.

## Behavior / UX

- [ ] **Dashboard tab switches wipe per-tab URL state — fix at the CollectionView
  level.** Tab switching is route navigation (`CollectionView.vue` activeTab setter:
  `router.push({ name, params })` with no query), so leaving Findings for STIGs and
  returning drops `?agg/stig/sel` while the kept-alive component retains its state —
  URL and state desync, and the next navigation away snapshots the bare URL, so
  back-nav lands on the default view. Affects every dashboard tab; STIGs is worse —
  it predates URL state mirroring and keeps nothing, so any back-nav resets it
  entirely. Proposed fix (dash level, one place): CollectionView remembers each tab's
  last `route.query` (save on leave, re-attach on the tab's `router.push`) — safe
  because hidden tabs are inert, so the saved query cannot go stale. Separable
  follow-up: give the STIGs tab Findings-style state→query mirroring so it has
  restorable state at all.
