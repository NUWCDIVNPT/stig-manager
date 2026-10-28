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

## Collection dash

- [ ] **Every visited tab refetches on each label-filter change.** `CollectionView.vue`
  passes `selectedLabelNames` to `CollectionMetrics` and all kept-alive tab panels, each
  of which watches it and refetches (STIGs and Assets cascade into their selection
  fetches; Findings fires three). Up to ~9 requests per change, only the active pane
  visible. Predates the breadcrumb filter but is felt more now that changing it is one
  click. Refetch the active tab only and mark the others stale, fetching on activation.

## See also

- API gap that would back a cross-collection asset search in the meta-dash: `pending-api-enhancements.md` #2.
