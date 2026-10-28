# Cross-cutting TODOs

Items that affect multiple features and should get a shared fix, not a local patch.
Most originated from the Findings feature review (2026-06-10).

## Correctness

- [ ] **Wire up the remaining domain sorts from `shared/lib/gridSorts.js`.**
  `statusSortValue` and `resultSortValue` are implemented (workflow order and badge
  display order respectively) but not yet wired in — both change user-visible sort
  behavior, so deferred. Targets: `statusSortValue` → status columns in
  `AssetReview/AssetChecklistGridTable.vue` and `CollectionReview/RuleTableGrid.vue`
  (currently `sort-field="status.label"`, alphabetical); `resultSortValue` →
  Current/New columns in `AssetStigImport/AssetStigPreviewStep.vue` (currently raw
  result strings, alphabetical) via `:sort-field="r => resultSortValue(r.currentResult)"`.

- [ ] **CSV export fidelity audit.**
  Every exporting grid now declares fields/export headers and cells go through
  `exportDisplayValue` (see reusable-components.md, CSV export). Remaining work is a
  grid-by-grid comparison of actual output against the legacy client's export for the
  same screen; `git grep -l ':dt=' -- '*.vue'` lists the tables.

- [ ] **CSV exports omit the classification "Marking" column.**
  The legacy client prepends a `Marking` header with `(${apiConfig.classification})`
  in every row (`client/src/js/ExportButton.js:134`); `exportDataTableCsv` has no such
  column. Product decision needed, then a single fix in `shared/csv.js`.

## Hardening (latent — not reachable today)

- [ ] **Manual state clears bypass `useAsyncState`'s race guard.**
  Clearing state directly (e.g. `reviews.value = []` in `useFindingReviews`) does not
  bump the composable's generation counter, so an in-flight response could repopulate
  cleared state. Not reachable today (the findings API returns only the active
  aggregator's key field per row, so no spurious fetch can start), but worth a shared
  fix: add a `reset()` to `useAsyncState` that bumps generation / aborts — other
  features clear state manually the same way. Think about this holistically.

- [ ] **`useAsyncState`'s abort signal is positional.** Factories that want the
  signal must declare it in slot 0, which only holds while `execute()` is called with
  no arguments — see [async-state-abort-signal.md](async-state-abort-signal.md).

- [ ] **STIG import's zip walker has no nesting limit.** `expandZipRow` in
  `features/AppManagement/STIGManage/stores/stigImportStore.js` recurses into nested
  zips unbounded (a zip quine would spin forever). The Import Wizard's walker,
  `shared/lib/zipFiles.js`, caps at `MAX_ZIP_DEPTH` and reports skipped archives via
  `onSkip`; give the store the same guard — track depth on the row (or count `→` in
  `row.source`) and mark the row as an error past the limit, so the user sees why.

## Consistency

- [ ] **Pills-picker style near-duplicates.** `PillsTrigger.vue` chevron copies
  `BreadcrumbSelect.vue`'s `.p-select-dropdown` box (padding differs by a hair);
  `.trigger-pills__chip--neutral` restates the `--color-chip-default-*` tokens with a
  different bg; `pillsPicker.js` overlay sizes echo `GridFilterButton.vue` `valuesPt`
  (280 vs 250px). Each merge nudges one side a few px, so decide the canonical values
  together rather than one at a time.

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

- [ ] **Label filter is lost on any round trip through Asset Review.** Carry is
  per-site today (`grep -rn "pickLabelFilterQuery\|labelFilterParams.value" src`), and
  the links into `collection-asset-review` (`grep -rn "collection-asset-review" src`)
  plus the asset-review crumb back do not spread it. If the filter should survive
  that drill-down, replace the per-site spreads with one `router.beforeEach` that
  copies the label keys when `to.params.collectionId === from.params.collectionId`
  and `to.query` has none, skipping routes with `meta.labelFilter: false` (Management
  drops the filter on purpose; see the tab setter in `CollectionView.vue`). Costs: keys
  ride along on Asset Review URLs and recent-view entries; the nav-rail link to the
  current collection would keep the filter instead of resetting. Pairs with the tab-URL-state item above (same
  mechanism could restore both).
