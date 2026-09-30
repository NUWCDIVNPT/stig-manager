<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'

import DurationColumn from '../../../../components/columns/DurationColumn.vue'
import LabelsRow from '../../../../components/columns/LabelsRow.vue'
import PercentageColumn from '../../../../components/columns/PercentageColumn.vue'
import ColumnToggle from '../../../../components/common/ColumnToggle.vue'
import DeleteModal from '../../../../components/common/DeleteModal.vue'
import GridFilterButton from '../../../../components/common/GridFilterButton.vue'
import GridSearch from '../../../../components/common/GridSearch.vue'
import GridToolbar from '../../../../components/common/GridToolbar.vue'
import HighlightText from '../../../../components/common/HighlightText.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { fetchCollectionAssetSummary } from '../../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useColumnVisibility } from '../../../../shared/composables/useColumnVisibility.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { useGridSearch } from '../../../../shared/composables/useGridSearch.js'
import { labelNames } from '../../../../shared/lib/gridSearch.js'
import { rowHeightPx } from '../../../../shared/lib/rowHeights.js'
import { deleteAssets } from '../../api/assetManageApi.js'
import { useAssetTable } from '../../composables/useAssetTable.js'
import AssetFormModal from './AssetFormModal.vue'
import AssetsToolbar from './AssetsToolbar.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const ROW_HEIGHT = rowHeightPx('dense')

const dataTableRef = ref(null)

const { triggerError } = useGlobalError()
const { getCollectionGrant } = useCurrentUser()
const collectionName = computed(
  () => getCollectionGrant(props.collectionId)?.collection?.name ?? '',
)

const { state: assets, isLoading, execute: loadAssets } = useAsyncState(
  () => fetchCollectionAssetSummary(props.collectionId),
  { initialState: [], immediate: false },
)

watch(() => props.collectionId, loadAssets, { immediate: true })

const {
  tableData,
  applyAssetCreated,
  applyAssetChanged,
  applyAssetsTransferred,
} = useAssetTable(assets)

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
const tablePt = { footer: { style: 'padding: 0; border: none;' } }

const metricColumns = [
  { field: 'stigCnt', header: 'STIGs', component: Column, width: '2.75rem', pt: borderPt },
  { field: 'checks', header: 'Rules', component: Column, width: '2.75rem', pt: borderPt },
  { field: 'oldest', header: 'Oldest', component: DurationColumn, width: '2.75rem', pt: borderPt },
  { field: 'newest', header: 'Newest', component: DurationColumn, width: '2.75rem', pt: borderPt },
  { field: 'assessedPct', header: 'Assessed', component: PercentageColumn, width: '5.5rem', pt: borderPt },
  { field: 'submittedPct', header: 'Submitted', component: PercentageColumn, width: '5.5rem', pt: borderPt },
  { field: 'acceptedPct', header: 'Accepted', component: PercentageColumn, width: '5.5rem', pt: borderPt },
  { field: 'rejectedPct', header: 'Rejected', component: PercentageColumn, width: '5.5rem', pt: borderPt },
]

const { toggleableColumns, selectedColumns, visibleFields } = useColumnVisibility([
  { field: 'assetName', header: 'Asset', locked: true },
  { field: 'labels', header: 'Labels' },
  ...metricColumns.map(({ field, header }) => ({ field, header })),
], 'manageAssets.columns')

const visibleMetricColumns = computed(() => metricColumns.filter(c => visibleFields.value.has(c.field)))

const {
  term: searchTerm,
  filters: gridFilters,
  filteredRows,
  isFiltered,
  filterColumns,
  valueOptions,
  highlightTerm,
} = useGridSearch(tableData, [
  { field: 'assetName', header: 'Asset' },
  { field: 'labels', header: 'Labels', searchText: r => labelNames(r.labels), filterValues: r => r.labels, multiple: true },
  { field: 'benchmarkIds', header: 'STIG', filterValues: r => r.benchmarkIds, multiple: true, quickSearch: false },
], { visibleFields })

const selectedAssets = ref([])

function clearSelection() {
  selectedAssets.value = []
}

const createModalVisible = ref(false)
const editAssetId = ref(null)

function openCreateModal() {
  editAssetId.value = null
  createModalVisible.value = true
}

function openEditModal(assetId) {
  editAssetId.value = assetId
  createModalVisible.value = true
}

const deleteModalVisible = ref(false)

function onDeleteAssets() {
  deleteModalVisible.value = true
}

async function onDeleteConfirmed() {
  const assetIds = selectedAssets.value.map(a => a.assetId)
  try {
    await deleteAssets(props.collectionId, assetIds)
    selectedAssets.value = []
    await loadAssets()
  }
  catch (err) {
    triggerError(err)
  }
}

function onAssetsTransferred(transferredIds) {
  const idSet = new Set(transferredIds)
  applyAssetsTransferred(transferredIds)
  selectedAssets.value = selectedAssets.value.filter(a => !idSet.has(a.assetId))
}
</script>

<template>
  <div class="manage-assets">
    <AssetsToolbar
      :collection-id="props.collectionId"
      :collection-name="collectionName"
      :has-selection="selectedAssets.length > 0"
      :single-selection="selectedAssets.length === 1"
      :selected-assets="selectedAssets"
      @imported="loadAssets"
      @clear-selection="clearSelection"
      @create-asset="openCreateModal"
      @modify-asset="openEditModal(selectedAssets[0].assetId)"
      @delete-assets="onDeleteAssets"
      @assets-transferred="onAssetsTransferred"
    />

    <AssetFormModal
      v-model:visible="createModalVisible"
      :collection-id="props.collectionId"
      :asset-id="editAssetId"
      @asset-created="applyAssetCreated"
      @asset-changed="applyAssetChanged"
    />

    <DeleteModal
      v-model:visible="deleteModalVisible"
      title="Delete Assets"
      :message="`Deleting ${selectedAssets.length === 1 ? 'this asset' : 'these assets'} will remove all data associated with the asset. This includes all the corresponding STIG assessments. Are you sure you want to continue?`"
      @confirm="onDeleteConfirmed"
    />

    <div class="table-container">
      <GridToolbar>
        <GridSearch v-model="searchTerm" label="Search assets" placeholder="Search assets..." />
        <template #end>
          <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
          <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />
        </template>
      </GridToolbar>
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedAssets"
        :value="filteredRows"
        data-key="assetId"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        selection-mode="multiple"
        :loading="isLoading"
        :virtual-scroller-options="{ itemSize: ROW_HEIGHT, delay: 0 }"
        :style="{ '--item-size': `${ROW_HEIGHT}px` }"
        export-filename="Assets"
        class="flex-fill clickable-rows"
        :table-style="{ 'table-layout': 'fixed' }"
        :pt="tablePt"
      >
        <Column selection-mode="multiple" style="width: 1rem; height: var(--item-size); padding: 0 0.5rem;" />

        <template #empty>
          {{ isFiltered && tableData.length ? 'No assets match the search.' : 'No assets found.' }}
        </template>

        <Column field="assetName" header="Asset" sortable :pt="borderPt" style="width: 5.5rem; height: var(--item-size); padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <div class="sm-grid-cell-with-toolbar">
              <div class="sm-info">
                <HighlightText :text="data.assetName" :term="highlightTerm('assetName')" />
              </div>
              <button
                type="button"
                class="row-edit-btn"
                title="Edit asset"
                @click.stop="openEditModal(data.assetId)"
              >
                <i class="pi pi-pencil" />
              </button>
            </div>
          </template>
        </Column>

        <Column v-if="visibleFields.has('labels')" field="labels" header="Labels" sortable :pt="borderPt" style="width: 9rem; height: var(--item-size); padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <LabelsRow :labels="data.labels" :search-term="highlightTerm('labels')" compact />
          </template>
        </Column>

        <template v-for="col in visibleMetricColumns" :key="col.field">
          <component :is="col.component" v-bind="col" sortable header-class="metric-col" body-class="metric-col" :style="`width: ${col.width}; height: var(--item-size); padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`" />
        </template>

        <template #footer>
          <StatusFooter
            :dt="dataTableRef"
            :refresh-loading="isLoading"
            :total-count="tableData.length"
            :filtered-count="isFiltered ? filteredRows.length : null"
            :show-selected="selectedAssets.length > 0"
            :selected-items="selectedAssets"
            total-label="assets"
            @refresh="loadAssets"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.manage-assets {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 1000px;
  padding: 1.5rem 3rem 3rem 3rem;
}

.table-container {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.flex-fill {
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* Whole row toggles selection via @row-click. */
.clickable-rows :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.sm-grid-cell-with-toolbar {
  display: flex;
  align-items: center;
}

.sm-info {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-edit-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  color: var(--color-text-dim);
  font-size: var(--icon-xs);
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;
}

:deep(tr:hover) .row-edit-btn {
  opacity: 1;
}

.row-edit-btn:hover {
  color: var(--color-text-bright);
}

:deep(th.metric-col .p-datatable-column-header-content) {
  justify-content: center;
}

:deep(td.metric-col) {
  text-align: center;
}
</style>
