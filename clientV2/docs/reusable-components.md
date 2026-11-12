# Reusable Components

Where shared UI lives in the new client, and the conventions that keep grids consistent.

**Legend:**
- **Native** - PrimeVue handles this; just use `#body` template + helper function
- **Wrapper** - Custom component wrapping PrimeVue Column
- **Shared** - Sub-component used by multiple columns/features

---

## Structure

```
src/
├── components/
│   ├── common/          # Shared pieces used by more than one feature
│   │   ├── Label.vue            # Shared: one label chip (LabelChip); every chip renders through it
│   │   ├── CatBadge.vue         # Shared: CAT I/II/III badge
│   │   ├── CoraPctBadge.vue     # Shared: CORA risk rating with color
│   │   ├── ResultBadge.vue, StatusBadge.vue, EngineBadge.vue, ...
│   │   ├── GridToolbar.vue, GridSearch.vue, GridFilterButton.vue, ColumnToggle.vue, StatusFooter.vue
│   │   ├── PickList*.vue        # Dual-pane assignment UI (grants, labels, STIGs, group membership)
│   │   ├── BreadcrumbFilter.vue, PillsTrigger.vue, LabelFilterPicker.vue, LabelFilterPills.vue
│   │   └── pillsPicker.css / pillsPicker.js
│   └── columns/         # Reusable table columns
│       ├── CountColumn.vue, DurationColumn.vue, PercentageColumn.vue, TextColumn.vue
│       ├── AssetColumn.vue, BenchmarkColumn.vue, CollectionColumn.vue
│       ├── CatColumn.vue, CoraColumn.vue, LabelsColumn.vue
│       └── LabelsRow.vue        # Shared: label chips with overflow, built from LabelChip
└── shared/
    ├── lib.js           # formatPercent and other small helpers
    └── lib/             # numberFormat.js (dashZero), exportCells.js, csv.js, textWidth.js, ...
```

Feature-specific components stay inside their feature (see [FeatureStructure](components/FeatureStructure.md)); a component moves to `components/common` or `components/columns` once a second feature needs it.

---

## Column Components

### Native (PrimeVue `#body` template + helper)

These don't need wrapper components—just inline templates with helper functions.

| Pattern | Template Example | Helper Needed |
|---------|------------------|---------------|
| Count with own header slot | `{{ dashZero(data.count) }}` (use `CountColumn` when the column has no custom slots) | `dashZero()` |
| IconColumn | `<i :class="getIcon(data)" v-tooltip="label" />` | per-feature |
| BadgeColumn | `<Tag v-for="item in items" ...>` | none |
| DataWithBadgeColumn | `{{ name }} <Tag>{{ classification }}</Tag>` | none |
| ListInline | `{{ items.join(', ') }}` | none |
| ListNewline | `<div v-for="item in items">{{ item }}</div>` | none |
| ActionColumn | `<Button icon="pi pi-pencil" @click="edit" />...` | none |

### Wrapper Components (`src/components/columns/`)

| Column | Why Wrapper | Shared Sub-components |
|--------|-------------|----------------------|
| **CountColumn** | Zero/missing counts render as `-` so tallies of nothing read as blank; accepts dotted field paths. Needs a `key` when used directly (DataTable finds wrapped Columns by vnode key) | `dashZero()` helper |
| **DurationColumn** | Relative time logic ("5 d", "2 h", "now") | none |
| **PercentageColumn** | Thermometer visualization | none |
| **TextColumn** | Plain text that highlights the grid's search term | `HighlightText` |
| **AssetColumn**, **BenchmarkColumn**, **CollectionColumn** | Entity name with search highlighting and, where the grid needs it, an inline per-row action (e.g. the shield link on `AssetColumn`) | `HighlightText` |
| **CatColumn** | CAT badge | `CatBadge` |
| **CoraColumn** | CORA badge with color + explanatory tooltip | `CoraPctBadge` |
| **LabelsColumn** | Label chips with "+N" overflow tooltip | `LabelsRow` |

---

## Shared Sub-Components

Small pieces used inside columns AND in other contexts (dashboards, panels).

| Component | Description | Used By |
|-----------|-------------|---------|
| **LabelsRow** | Label chips, "+N" overflow with tooltip; chip geometry derives from rem so it tracks the root font-size | LabelsColumn, asset grids, dashboard panels |
| **LabelChip** (`Label.vue`) | One label chip: normalises the hex colour, picks contrast text, highlights a search term | LabelsRow, label pickers and forms, ACL and aging-rule tables |
| **CatBadge** | CAT I/II/III with appropriate color | CatColumn, rule displays, findings |
| **CoraPctBadge** | CORA risk rating with color | CoraColumn, dashboard Overview panel |
| **ResultBadge**, **StatusBadge**, **EngineBadge**, **ManualBadge**, **OverrideBadge**, **ResultEngineBadges** | Review result / status / origin badges | Review grids, checklist grids, CSV export display text |
| **ClassificationBadge** | Security classification styling | Benchmark grids |
| **HighlightText** | Wraps the matched search term in a highlight span | Text columns, pick lists |

---

## Breadcrumb Filters

Filters that sit after the breadcrumb in the menu bar. A route opts in through its
meta (`labelFilter` for Collection Labels, `collectionFilter` for the Collections page);
MenuBar renders the matching pills component.

| Component | Description | Used By |
|-----------|-------------|---------|
| **BreadcrumbFilter** | The filter box: a slot for the picker plus a clear button | LabelFilterPills, CollectionFilterPills |
| **PillsTrigger** | MultiSelect `#value` chips: removable chips for applied options, "+N" overflow, chevron. Chip remove is hidden while the overlay is open | LabelFilterPicker, MetaMetricsFilter |
| **LabelFilterPicker** | Collection Label picker with a "No label" option; refetches Labels on open and prunes names the Collection no longer has. Selection lives in the route query (`useLabelFilterQuery`) | LabelFilterPills |
| **MetaMetricsFilter** | Include/exclude Collection picker; selection lives in `useMetaCollectionFilter` (in memory only) | CollectionFilterPills |

Shared styling for the picker overlay is in `pillsPicker.css` / `pillsPicker.js`.

---

## PrimeVue Native Features

Don't reinvent these—use PrimeVue's built-in capabilities.

| Feature | PrimeVue Approach |
|---------|-------------------|
| **Row expansion** | `v-model:expandedRows` + `#expansion` template |
| **Cell editing** | `editMode="cell"` + `#editor` template |
| **Tooltips** | `v-tooltip` directive (positioning, delays, custom styling) |
| **Severity colors** | `<Tag severity="danger/warn/success/info">` |
| **Row styling** | `:rowClass` or `:rowStyle` props |
| **Cell background** | Dynamic classes in `#body` template |
| **Sorting** | Native Column `sortable` prop |
| **Filtering** | Native + custom `#filter` template |
| **Checkbox selection** | Native `selectionMode="multiple"` |
| **Header info icon** | Custom `#header` template with icon + tooltip |

---

## Column Features

Columns must be:
- Sortable
- Filterable (where applicable)
- resizable (native PrimeVue)
- hidable (native PrimeVue)
- transportable across tables
- agnostic to data source (use props for field names)

### Header Options (Native PrimeVue)
- Sorting: `sortable` prop
- Filtering: `#filter` template
- Checkbox: Column with `selectionMode`
- Info tooltip: `#header` template + `v-tooltip`

### Cell Options (via `#body` template)
- Background color: dynamic `:class` binding
- Reactive styling: computed classes based on data

---

## Row Components

| Row Type | Implementation |
|----------|---------------|
| Checkbox row | Native: `selectionMode="multiple"` |
| Editable row | Native: `editMode="row"` + `#editor` templates |
| ExpandableReviewRow | Native: `#expansion` template with review detail content |

---

## Table Footer

- Refresh button: `#footer` template
- CSV export: `#footer` template + `StatusFooter :dt="dataTableRef"`
- Row count: `#footer` template with `{{ data.length }}`
- Totals badges: `#footer` template with Tag components

### CSV export

`StatusFooter` exports the bound DataTable through `shared/csv.js` `exportDataTableCsv`,
which reads only the Column props `field`, `header`, `export-header` and `exportable`.
The legacy client exported each column's rendered text; the Vue equivalent is
declarative, so every exporting table must:

- Give each data column a `field`, even when a `#body` slot renders something derived
  from the row. Add `:exportable="false"` to control columns (actions, apply buttons,
  custom select-all checkboxes). PrimeVue selection/expander columns need nothing.
- Add `export-header` to any column whose visible header is a `#header` slot; the
  `header` prop cannot be used there because PrimeVue renders both.
- Use a hidden column (`<Column field="labels" header="Labels" hidden />`) to export a
  value the grid shows inside another cell. Hidden columns render nothing per row.

Cell text comes from, in order: the column's `:export-value` function, the DataTable's
`:export-function`, or `shared/lib/exportCells.js` `exportDisplayValue`. All receive
`{ data, field, record }` for every cell, null included.

- `exportDisplayValue` maps the field names shared across several grids
  (`resultEngine`, `result`, `status`, `severity`, `labels`/`assetLabels`, `stigs`) to
  the text the grid displays and passes everything else to `serializeCsvValue`. Add a
  rule there only when an object-valued field recurs across grids.
- A one-off column (a schedule object, a run duration computed from the row, a
  role id) binds `:export-value` on the Column, usually a one-line arrow in the
  component's script, e.g. `:export-value="({ record }) => resourceSortKey(record)"`.
  A column with `export-value` needs no `field`; it is the declarative equivalent of
  the legacy client's `exportvalue` attribute.

`shared/tests/columnExportConventions.test.js` scans every exporting table for the
field and header rules above.

---

## Assignment Interfaces

Dual-pane relationship editing is the `PickList` family in `components/common`
(`PickList.vue`, `PickListLayout.vue`, `PickListPane.vue`, `PickListTable.vue`,
`PickListControls.vue`, `usePickListModel.js`). Used for user-group membership, STIG
assignment, and grant management.

---

## Data Fetching

Components do not hand-roll loading/error state. API modules throw; `useAsyncState`
turns that into reactive state. See
[fetching-asyncDataOperations-ErrorHandling](architecture/fetching-asyncDataOperations-ErrorHandling.md)
and [LogicExtraction](components/LogicExtraction.md).
