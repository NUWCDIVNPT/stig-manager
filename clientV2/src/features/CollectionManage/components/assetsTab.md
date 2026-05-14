# ManageAssets.vue — Implementation Guide

Tab inside `CollectionManage` for viewing and managing assets with metrics. The current file (`ManageAssets.vue`) is a stub — replace it entirely.

---

## Goal

A full-featured asset list with:
- Multi-select checkboxes (shift-click range) via `useTableSelection`
- Metrics columns pulled from the `/metrics/summary/asset` endpoint
- `LabelsRow.vue` for the labels cell
- `StatusFooter` showing CSV export, refresh, and asset count

---

## API

**Function:** `fetchCollectionAssetSummary(collectionId)` — exists but most be lifted to shared. do not import from collection view

This calls `getMetricsSummaryByCollectionAggAsset` on the STIG Manager API.

**Response shape per item:**
```json
{
  "assetId": "3270",
  "name": "Asset-10-1",
  "labels": [{ "name": "testLabel_1", "color": "000000", "labelId": "..." }],
  "ip": "192.168.1.240",
  "fqdn": "asset-10-1.example.com",
  "mac": "",
  "benchmarkIds": ["Google_Chrome_Current_Windows", "..."],
  "metrics": {
    "maxTs": "...",
    "minTs": "...",
    "maxTouchTs": "...",
    "results": { "fail": 263, "pass": 550, "other": 83, "notapplicable": 0 },
    "assessed": 813,
    "findings": { "low": 20, "high": 30, "medium": 213 },
    "statuses": { "saved": 892, "accepted": 0, "rejected": 0, "submitted": 4 },
    "assessments": 1001,
    "assessedBySeverity": { "low": 54, "high": 67, "medium": 692 },
    "assessmentsBySeverity": { "low": 69, "high": 76, "medium": 856 }
  }
}
```

---

## Columns to Display

Columns match the reference design image (left → right). Use existing components from `src/components/columns/`:

| # | Header | Field (transformed) | Component | Source in API response |
|---|---|---|---|---|
| 1 | *(checkbox)* | — | `<Checkbox>` custom | `useTableSelection` with `idKey='assetId'` |
| 2 | Asset | `assetName` | `AssetColumn` | `r.name` |
| 3 | Labels | `labels` | `LabelsColumn` | `r.labels` |
| 4 | STIGs | `stigCnt` | `Column` | `r.benchmarkIds.length` |
| 5 | Rules | `checks` | `Column` | `r.metrics.assessments` |
| 6 | Oldest | `oldest` | `DurationColumn` | `r.metrics.minTs` |
| 7 | Newest | `newest` | `DurationColumn` | `r.metrics.maxTs` |
| 8 | Assessed | `assessedPct` | `PercentageColumn` | `assessed / assessments * 100` |
| 9 | Submitted | `submittedPct` | `PercentageColumn` | `(submitted + accepted + rejected) / assessments * 100` |
| 10 | Accepted | `acceptedPct` | `PercentageColumn` | `statuses.accepted / assessments * 100` |
| 11 | Rejected | `rejectedPct` | `PercentageColumn` | `statuses.rejected / assessments * 100` |

All column components live in `src/components/columns/`. They accept `field`, `header`, and `sortable` as props. **Do not add ip/fqdn columns** — they are not in the reference design.

---

## useTableSelection

**Import:** `src/shared/composables/useTableSelection.js`

```js
import { useTableSelection } from '../../../shared/composables/useTableSelection.js'

const selectedAssets = ref([])

const {
  selectedIdSet,
  isAllSelected,
  selectAll,
  handleCheckboxClick,
} = useTableSelection(
  computed(() => assets.value), // all items ref
  computed(() => selectedAssets.value),
  next => (selectedAssets.value = next),
  'assetId' // idKey — must match the unique ID field
)
```

**Checkbox column pattern** (copy from `ImportFileQueueStep1.vue`):
```html
<Column style="width: 3rem; flex-shrink: 0">
  <template #header>
    <Checkbox v-if="assets.length > 0" :model-value="isAllSelected" :binary="true" @update:model-value="selectAll" />
  </template>
  <template #body="{ data, index }">
    <div style="display:flex;align-items:center;justify-content:center;cursor:pointer" @click.stop="handleCheckboxClick($event, data, index)">
      <Checkbox :model-value="selectedIdSet.has(data.assetId)" :binary="true" style="pointer-events:none" />
    </div>
  </template>
</Column>
```

---

## LabelsRow Usage

```html
<Column field="labels" header="Labels">
  <template #body="{ data }">
    <LabelsRow :labels="data.labels" />
  </template>
</Column>
```

`LabelsRow` handles overflow automatically with a popover — no extra configuration needed.

---

## StatusFooter

```html
<StatusFooter
  :refresh-loading="isLoading"
  :total-count="assets.length"
  :show-selected="selectedAssets.length > 0"
  :selected-items="selectedAssets"
  total-label="assets"
  @action="handleFooterAction"
/>
```

`handleFooterAction(key)` — handle `'refresh'` and `'export'`. For CSV export, call `dataTableRef.value?.exportCSV()`.

---

## DataTable Setup

Follow `MetricsSummaryGrid.vue` for DataTable props:
```html
<DataTable
  ref="dataTableRef"
  :value="tableData"
  data-key="assetId"
  scrollable
  scroll-height="flex"
  resizable-columns
  column-resize-mode="fit"
  :loading="isLoading"
  :virtual-scroller-options="{ itemSize: 27, delay: 0 }"
>
```

- `scroll-height="flex"` requires the parent to be a flex column with `flex: 1; min-height: 0`
- Row height should be `27px` (inline style on each column: `style="height: 27px; padding: 0 0.5rem;"`)
- `virtual-scroller-options` is important for large asset lists

---

## Data Transformation

Flatten the API response before passing to the table (same pattern as `MetricsSummaryGrid`):

```js
const tableData = computed(() =>
  assets.value.map(r => ({
    assetId: r.assetId,
    assetName: r.name,
    labels: r.labels,
    stigCnt: r.benchmarkIds?.length ?? 0,
    checks: r.metrics.assessments,
    oldest: r.metrics.minTs,
    newest: r.metrics.maxTs,
    assessedPct: r.metrics.assessments ? r.metrics.assessed / r.metrics.assessments * 100 : 0,
    submittedPct: r.metrics.assessments
      ? (r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments * 100
      : 0,
    acceptedPct: r.metrics.assessments ? r.metrics.statuses.accepted / r.metrics.assessments * 100 : 0,
    rejectedPct: r.metrics.assessments ? r.metrics.statuses.rejected / r.metrics.assessments * 100 : 0,
  }))
)
```

---

## Codebase Rules

1. **No custom CSS variables** — use existing tokens: `--color-border-default`, `--color-background-dark`, `--color-text-default`, `--color-text-dim`, etc.
2. **No inline styles except row height/padding** — scoped CSS only.
3. **No new column components** — reuse from `src/components/columns/`. `PercentageColumn` and `CatColumn` expect `field` + `header` + optional props.
4. **`<script setup>` only** — no Options API.
5. **Imports use relative paths** — no `@/` alias.
6. **`useTableSelection` idKey must match** the field used as `data-key` on `<DataTable>`.
7. **Footer lives inside `<DataTable>`'s `#footer` slot** — not outside the table.
8. **No toolbar** — this tab already has context from the parent; skip Create/Import/Export/Delete toolbar buttons unless explicitly added later.

---

## Layout Skeleton

```
<div style="display:flex; flex-direction:column; height:100%">
  <DataTable flex-fill>
    columns...
    #footer: <StatusFooter>
  </DataTable>
</div>
```
