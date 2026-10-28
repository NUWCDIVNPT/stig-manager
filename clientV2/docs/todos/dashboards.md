# Dashboards — open TODOs

Rolls up review notes for both metrics dashboards:

- **Collection dashboard** — `src/features/CollectionMetrics/` (`CollectionMetrics.vue`, single collection).
- **Meta-dashboard** — `src/features/MetaCollectionView/` (`MetaCollectionView.vue`, many collections). Its
  sidebar reuses `CollectionMetrics/components/MetaCollectionMetrics.vue`; both grids reuse
  `components/common/MetricsSummaryGrid.vue`.

## Layout

- [ ] **Confirm the Progress panel renders at the same width in both dashes.** Both
  `CollectionMetrics.vue` and `MetaCollectionMetrics.vue` now share the same `.stats-column` rules
  (`max-width: 400px`, `none` when vertical); check visually, then close.

- [ ] **Tighten spacing in both dashes and make them responsive.**
  Squeeze padding/gaps in `CollectionMetrics.vue` and `MetaCollectionMetrics.vue` so the panels
  resize down gracefully in narrow windows *before* falling back to a scrolled view. Currently several
  fixed dims jump straight to scroll — sidebar `min-width: 380px` (`MetaCollectionView.vue` ~L76),
  `.stats-column max-width: 400px`, `Progress.vue` label col `width: 160px`.

## See also

- API gap that would back a cross-collection asset search in the meta-dash: `pending-api-enhancements.md` #2.
