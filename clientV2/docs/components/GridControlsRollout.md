# Grid Controls Rollout

Plan for adding the grid controls to every table in the app:

- **Search**: `GridSearch.vue`, a quick free-text search over the visible searchable columns.
- **Filter**: `GridFilterButton.vue`, a rule builder (Column, Operator, Value, Aa, whole word).
- **Columns**: `ColumnToggle.vue`, which shows or hides columns.

State lives in `useGridSearch` (search term plus rules). Matching lives in `shared/lib/gridSearch.js` and
`shared/lib/columnFilters.js`. `MetricsSummaryGrid.vue` is the reference implementation.

Inventory taken 2026-09-29: 39 `DataTable` grids.

---

## Step 0: Make the controls cheap to add

`ColumnToggle.vue` is already shared, but the show and hide state behind it is not. Five grids each
wire up their own:

| Grid | How it works | Saves choices |
| --- | --- | --- |
| `MetricsSummaryGrid` | `locked` and `defaultHidden` columns, overrides saved per column set | Yes |
| `CollectionChecklistGrid` | `ref` of selected columns, plus the fields each display mode forces on | No |
| `AssetChecklistGrid` | Same, plus a watch that swaps the title column by display mode | No |
| `RuleTable` | `ref` of selected columns | No |
| `ReportTableBase` | `ref` of selected columns, matched on `field` | No |

**Done.** The `MetricsSummaryGrid` version now lives in `shared/composables/useColumnVisibility.js`, and
the other four grids use it, so they all save choices. Storage keys: `metricsGrid.columns.<agg>`,
`collectionChecklistGrid.columns`, `assetChecklistGrid.columns`, `ruleTable.columns`,
`appinfoReport.columns.<exportFilename>`. `useFindingsColumns` (Findings) is different:
it picks columns from the aggregation, and the user cannot toggle them.

After that, each grid needs:

1. One `useGridSearch(rows, columns, { visibleFields })` call listing its searchable columns as
   `{ field, header }`. Add `searchText(row)` only when the cell shows something other than `row[field]`,
   `filterValues(row)` for pick-from-list columns (labels, CAT), and `quickSearch: false` to keep a
   column out of the search box.
2. Its results wired up: `filteredRows` to the `DataTable`, `filterColumns` and `valueOptions` to
   `GridFilterButton`, `term` to `GridSearch`.
3. Text cells wrapped in `<HighlightText :text="..." :term="highlightTerm('field')" />`. Label chips take
   `:search-term` on `LabelsRow`. Skip badges, icons and numbers.
4. `GridSearch` with `GridFilterButton` right next to it, plus `ColumnToggle` if the grid has columns to hide.
   If the header is already full, put them in a `GridToolbar` row under it.
5. `StatusFooter` getting `:filtered-count` when filtered, and an empty message for "no matches".

---

## Tier A: Main working grids, all three controls

| Grid | Today | Status |
| --- | --- | --- |
| `components/common/MetricsSummaryGrid.vue` | Search, Filter, Columns | Done |
| `features/CollectionReview/components/CollectionChecklistGridTable.vue` | Search, Columns, old header filters | To do |
| `features/AssetReview/components/AssetChecklistGridTable.vue` | Search, Columns, old header filters | To do |
| `features/CollectionReview/components/RuleTableGrid.vue` | Search, Columns, old header filters | To do |
| `features/Findings/components/AggregatedFindingsGrid.vue` | Search, Filter (columns follow the aggregator) | Done |
| `features/Findings/components/IndividualFindingsGrid.vue` | Search, Filter, Columns | Done |

The three checklist and rule grids keep their search and column toggle in separate header components
(`CollectionChecklistGridHeader`, `AssetChecklistGridHeader`, `RuleTableHeader`). They only need the Filter
button, which replaces their old header filters. Findings has tight headers, so its controls sit in a slim `GridToolbar.vue` row under the header.
Reuse that row for any grid whose header is already full.

---

## Tier B: Admin and manage lists, Search and Filter (Columns only if wide)

| Grid | Today | Status |
| --- | --- | --- |
| `features/AppManagement/Users/components/UserList.vue` | Old header filters | To do |
| `features/CollectionManage/components/Asset/ManageAssetsTable.vue` | Old header filters | To do |
| `features/AppManagement/LogStream/components/TransactionGrid.vue` | Old header filters | To do |
| `features/AppManagement/Appinfo/components/common/ReportTableBase.vue` | Column toggle, filter | To do |
| `features/STIGLibrary/components/BenchmarksTable.vue` | Custom search | To do |
| `features/STIGLibrary/components/BenchmarkListTable.vue` | Custom search | To do |
| `features/AppManagement/Collections/components/CollectionList.vue` | Nothing | To do |
| `features/AppManagement/STIGManage/components/StigList.vue` | Nothing | To do |
| `features/AppManagement/UserGroups/components/UserGroupList.vue` | Nothing | To do |
| `features/AppManagement/ServiceJobs/components/JobsTable.vue` | Nothing | To do |
| `features/CollectionManage/components/Stig/ManageStigsTable.vue` | Nothing | To do |
| `features/CollectionManage/components/Label/LabelsTable.vue` | Nothing | To do |
| `features/CollectionManage/components/User/ManageUsers.vue` | Nothing | To do |
| `features/CollectionManage/components/User/AclRulesTable.vue` | Nothing | To do |

---

## Tier C: Detail panels and tabs, Search only (or nothing if small)

| Grid | Today | Status |
| --- | --- | --- |
| `components/common/ReviewResources/ReviewHistoryTab.vue` | Old header filters | To do |
| `components/common/ReviewResources/ReviewOtherAssetsTab.vue` | Old header filters | To do |
| `features/AppManagement/Users/components/EffectiveGrants.vue` | Nothing | To do |
| `components/common/grants/GrantsPanel.vue` | Nothing | To do |
| `features/AppManagement/ServiceJobs/components/runs/RunsTable.vue` | Nothing | To do |
| `features/AppManagement/ServiceJobs/components/runs/RunOutputTable.vue` | Nothing | To do |
| `features/CollectionManage/components/Configuration/TaskOutput.vue` | Nothing | To do |
| `features/CollectionManage/components/Configuration/ReviewAgingRulesTable.vue` | Nothing | To do |
| `features/STIGLibrary/components/DiffRuleTable.vue` | Nothing | To do |
| `features/STIGLibrary/components/ViewRuleTable.vue` | Nothing | To do |

The Tier B and C placements come from each grid's purpose. Confirm row and column counts per grid as each one is done.

---

## Tier D: Skip (wizards, modals, short-lived lists)

- `features/ImportWizard/components/ImportFileQueueStep1.vue`
- `features/ImportWizard/components/ImportErrorsWarningsStep3.vue`
- `features/ImportWizard/components/ImportPreviewStep4.vue`
- `features/ImportWizard/components/ImportProgressStep5.vue`
- `features/AppManagement/STIGManage/components/ImportStigModal.vue`
- `features/AssetStigImport/components/AssetStigPreviewStep.vue`
- `features/CollectionManage/components/Asset/ImportAssetsCsvButton.vue`
- `features/CollectionManage/components/User/EffectiveAclModal.vue`
- `components/common/PickListTable.vue` (has its own search)

---

## Open decisions

1. **Old header filters** (`ColumnFilter.vue`) on seven grids. Replace them with the Filter button, or keep both?
   Recommendation: replace them, so there is one filtering model everywhere.
2. **Order.** Step 0, then Tier A, then Tier B and C in batches.
