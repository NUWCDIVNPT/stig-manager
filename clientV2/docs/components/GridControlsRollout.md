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
| `features/CollectionReview/components/CollectionChecklistGridTable.vue` | Search, Filter, Columns | Done |
| `features/AssetReview/components/AssetChecklistGridTable.vue` | Search, Filter, Columns | Done |
| `features/CollectionReview/components/RuleTableGrid.vue` | Search, Filter, Columns | Done |
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
| `features/AppManagement/Users/components/UserList.vue` | Search, Columns (no Filter) | Done |
| `features/CollectionManage/components/Asset/ManageAssetsTable.vue` | Search, Filter, Columns | Done |
| `features/AppManagement/LogStream/components/TransactionGrid.vue` | Search, Filter, Columns (in the title bar) | Done |
| `features/AppManagement/Appinfo/components/common/ReportTableBase.vue` | Search, Columns where enabled (no Filter) | Done |
| `features/STIGLibrary/components/BenchmarksTable.vue` | Own title/ID filter box | Done |
| `features/STIGLibrary/components/BenchmarkListTable.vue` | Search, Filter, Columns (in the panel header) | Done |
| `features/AppManagement/Collections/components/CollectionList.vue` | Search, Columns (no Filter) | Done |
| `features/AppManagement/STIGManage/components/StigList.vue` | Search, Columns (no Filter) | Done |
| `features/AppManagement/UserGroups/components/UserGroupList.vue` | Search, Columns (no Filter) | Done |
| `features/AppManagement/ServiceJobs/components/JobsTable.vue` | Search, Columns (no Filter) | Done |
| `features/CollectionManage/components/Stig/ManageStigsTable.vue` | Search, Filter, Columns | Done |
| `features/CollectionManage/components/Label/LabelsTable.vue` | Search, Filter, Columns | Done |
| `features/CollectionManage/components/User/ManageUsers.vue` | Filter only (in its panel title bar) | Done |
| `features/CollectionManage/components/User/AclRulesTable.vue` | Filter only (in `GrantAclModal`'s rules header) | Done |

The three Collection Manage tabs (Assets, STIGs, Labels) put their controls in a `GridToolbar` row
above the table, because their action toolbars are already full. Their old header filters are gone,
and so is the filtering that `useAssetTable` and `useStigTable` used to do. Assets can also be filtered
by assigned STIG, which is filter-only and not shown as a column. Storage keys: `manageAssets.columns`,
`manageStigs.columns`, `manageLabels.columns`.

The Collection Manage Users tab and its ACL tables get the Filter button only, with no search box or column toggle.
`GrantAclModal` owns the ACL filter. It clears on open and deselects rules the filter hides, so Remove never acts
on rows you can't see.

The STIG Library list (`BenchmarkListTable`) puts its controls in its panel header, next to the
"Full search…" button, which is a placeholder for content search and stays. Storage key: `stigLibrary.columns`.

---

## Tier C: Detail panels and tabs, Search only (or nothing if small)

| Grid | Today | Status |
| --- | --- | --- |
| `components/common/ReviewResources/ReviewHistoryTab.vue` | Filter only (right end of the tab bar) | Done |
| `components/common/ReviewResources/ReviewOtherAssetsTab.vue` | Filter only (right end of the tab bar) | Done |
| `features/AppManagement/Users/components/EffectiveGrants.vue` | Filter only (in a new panel title bar) | Done |
| `components/common/grants/GrantsPanel.vue` | Filter only (right of Add Grants in its toolbar) | Done |
| `features/AppManagement/ServiceJobs/components/runs/RunsTable.vue` | No controls by choice | Done |
| `features/AppManagement/ServiceJobs/components/runs/RunOutputTable.vue` | No controls by choice | Done |
| `features/CollectionManage/components/Configuration/TaskOutput.vue` | No controls by choice | Done |
| `features/CollectionManage/components/Configuration/ReviewAgingRulesTable.vue` | Filter only (toolbar; reorder off while filtered) | Done |
| `features/STIGLibrary/components/DiffRuleTable.vue` | Search, Filter (in `RulePaneToolbar`) | Done |
| `features/STIGLibrary/components/ViewRuleTable.vue` | Search, Filter (in `RulePaneToolbar`) | Done |

The two STIG Library rule tables share one `useGridSearch` in `RulePane`. It follows the view or
diff mode, and its Search and Filter sit in `RulePaneToolbar` next to density. They have no column toggle.

The Tier B and C placements come from each grid's purpose. Confirm row and column counts per grid as each one is done.

---

## Tier D: Skip (wizards, modals, short-lived lists)

- `features/ImportWizard/components/ImportFileQueueStep1.vue` (has a Filter in its queue toolbar anyway)
- `features/ImportWizard/components/ImportErrorsWarningsStep3.vue` (has a Filter on each section title anyway)
- `features/ImportWizard/components/ImportPreviewStep4.vue` (has a Filter in its panel title bar anyway)
- `features/ImportWizard/components/ImportProgressStep5.vue` (has Search and Filter in a results header anyway)
- `features/AppManagement/STIGManage/components/ImportStigModal.vue` (has a Filter in its Files header anyway)
- `features/AssetStigImport/components/AssetStigPreviewStep.vue` (has Search and Filter in a panel title bar anyway)
- `features/CollectionManage/components/Asset/ImportAssetsCsvButton.vue`
- `features/CollectionManage/components/User/EffectiveAclModal.vue` (has a Filter in its header anyway)
- `components/common/PickListTable.vue` (has its own search)

---

## Decisions

1. **Old header filters** (`ColumnFilter.vue`, `ColumnSearchFilter.vue`). **Done:** replaced by the Filter button everywhere they were used,
   and both components are deleted.
2. **Order.** Step 0, then Tier A, then Tier B and C in batches.
