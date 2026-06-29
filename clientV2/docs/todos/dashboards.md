# Dashboards — open TODOs

Rolls up review notes for both metrics dashboards:

- **Collection dashboard** — `src/features/CollectionMetrics/` (`CollectionMetrics.vue`, single collection).
- **Meta-dashboard** — `src/features/MetaCollectionView/` (`MetaCollectionView.vue`, many collections). Its
  sidebar reuses `CollectionMetrics/components/MetaCollectionMetrics.vue`; both grids reuse
  `components/common/MetricsSummaryGrid.vue`.

## Layout

- [ ] **Meta-dash filter sits in the tab bar; move it above the progress panel.**
  `MetaCollectionView.vue` renders `MetricsFilter` inside `<TabList>` (`.tab-filter-container`, ~L149).
  The Collection dash puts it in a `.metrics-filter-row` directly above `<Progress>`
  (`CollectionMetrics.vue` ~L73-81). Move the meta filter into the sidebar above
  `MetaCollectionMetrics` to match.

- [ ] **Progress panel renders at different widths in the two dashes; normalize.**
  `Progress.vue` is shared (`CollectionMetrics.vue` + `MetaCollectionMetrics.vue`) but renders at
  different sizes. Likely the container, not the component: `MetaCollectionMetrics`'s vertical layout
  caps `.stats-column` at `max-width: 400px`, while the Collection dash doesn't. Make the progress
  column the same size in both.

- [ ] **Tighten spacing in both dashes and make them responsive.**
  Squeeze padding/gaps in `CollectionMetrics.vue` and `MetaCollectionMetrics.vue` so the panels
  resize down gracefully in narrow windows *before* falling back to a scrolled view. Currently several
  fixed dims jump straight to scroll — sidebar `min-width: 330px` (`MetaCollectionView.vue` ~L111),
  `.stats-column max-width: 400px`, `Progress.vue` label col `width: 120px`.

- [ ] **Collapsed dash gives no sign a filter is applied.**
  When the progress/dashboard panel is collapsed the filter control is hidden, so there's no cue that
  the view is filtered. In the meta-dash the collapsed sidebar shows only status dots
  (`MetaCollectionView.vue` `.sidebar-dots`, ~L121); add a filter-applied indicator (badge / count of
  active filters) there, and the equivalent in the collection dash. `MetricsFilter` already exposes
  active state to reuse (`is-active` class / `pi-filter-fill` icon, ~L168/L187).

## Visual

- [ ] **CORA grid sprites use a gradient; make them flat like the other sprites.**
  `style.css` `.sm-cora-risk-*` (L150-165) use `linear-gradient(...)`; status sprites are flat fills.
  Shared by the grid CORA column (`CoraColumn` via `MetricsSummaryGrid`), `Cora.vue`, `CoraPctBadge`,
  `CoraTooltip` — swap to a flat `background-color` in one place.

- [ ] **Collection dash label filter shows plain text; render styled label sprites instead.**
  `MetricsFilter.vue`'s `#value` trigger renders applied labels as a comma-joined text string
  (`displayText`, ~L108-120 / template ~L185-190). The dropdown `#option` already styles each label as a
  colored `.label-chip` (~L192-201) — reuse that (or `common/Label.vue` `sm-label-sprite`) in the trigger
  so the closed filter shows the same styled sprites.

## Grid columns (shared `components/common/MetricsSummaryGrid.vue`)

These manifest across the assets/STIGs grids in both dashes and the Collection view tabs.

- [ ] **Assets-tab "Stigs" column is empty; should show the count of assigned STIGs.**
  The `asset` column config reads `field: 'stigCnt'` (~L174), but the data map for `case 'asset'` emits
  `stigs: r.benchmarkIds` (~L254) — no `stigCnt` key, and `benchmarkIds` is an array, not a count. Map
  `stigCnt: r.benchmarkIds?.length`. Surfaces in `CollectionView/CollectionAssetsTab.vue` (agg-type `asset`).

- [ ] **Asset-name column resizes mid-scroll as different-length names load.**
  The grid DataTable is `scrollable`/virtual (~L327) and `AssetColumn.vue` sets no fixed width or
  truncation, so the column re-widths to the longest name currently rendered. Give the asset column a
  fixed width + ellipsis truncation. (Pre-measuring a max width across the dataset is fouled by virtual
  scrolling — only loaded rows are known — so a fixed width is the pragmatic choice.)

- [ ] **No column show/hide controls on the dashboard grids.** `MetricsSummaryGrid` always renders its full
  column set per agg-type; users can't hide columns they don't care about. Add a column-display toggle.
  `Findings/AggregatedFindingsGrid.vue` already does this with a `visibleColumns` Set (~L236+) — a
  reusable pattern to lift.

## Meta-dash

- [ ] **"Go to collection" icon should be persistent, like the review shield.**
  The collection-nav icon (`.collection-icon-action`, gated by `showCollectionIcon` in
  `CollectionColumn.vue`) is hidden until row hover — `MetricsSummaryGrid.vue` ~L393
  (`tr:hover .collection-icon-action { visibility: visible }`). The review shield (`.shield-action`)
  is always shown at `opacity: 0.5`, brightening on hover. Give the collection icon the same
  always-visible treatment.

- [ ] **STIGs tab: rows duplicate on scroll and single rows can't be selected (row-key collision).**
  `MetaStigsTab.vue` passes `data-key="benchmarkId"` to the STIGs `MetricsSummaryGrid` (~L140), but a
  benchmarkId appears more than once when contained collections pin different default revisions, so the
  key isn't unique. The DataTable reuses rows by key on scroll (duplication) and selection can't resolve
  one row. Use a composite key (`benchmarkId` + `revisionStr`).

## See also

- API gap that would back a cross-collection asset search in the meta-dash: `pending-api-enhancements.md` #4.
