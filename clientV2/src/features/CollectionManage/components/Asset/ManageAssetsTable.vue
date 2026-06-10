<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'

import DurationColumn from '../../../../components/columns/DurationColumn.vue'
import LabelsRow from '../../../../components/columns/LabelsRow.vue'
import PercentageColumn from '../../../../components/columns/PercentageColumn.vue'
import ColumnFilter from '../../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import DeleteModal from '../../../../components/common/DeleteModal.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { fetchCollectionAssetSummary } from '../../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
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
  assetFilter,
  labelFilter,
  labelOptions,
  filteredData,
  applyAssetCreated,
  applyAssetChanged,
  applyAssetsTransferred,
} = useAssetTable(assets)

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
const tablePt = { footer: { style: 'padding: 0; border: none;' } }

const columns = [
  { field: 'stigCnt', header: 'STIGs', component: Column, width: '30px', pt: borderPt },
  { field: 'checks', header: 'Rules', component: Column, width: '30px', pt: borderPt },
  { field: 'oldest', header: 'Oldest', component: DurationColumn, width: '30px', pt: borderPt },
  { field: 'newest', header: 'Newest', component: DurationColumn, width: '30px', pt: borderPt },
  { field: 'assessedPct', header: 'Assessed', component: PercentageColumn, width: '60px', pt: borderPt },
  { field: 'submittedPct', header: 'Submitted', component: PercentageColumn, width: '60px', pt: borderPt },
  { field: 'acceptedPct', header: 'Accepted', component: PercentageColumn, width: '60px', pt: borderPt },
  { field: 'rejectedPct', header: 'Rejected', component: PercentageColumn, width: '60px', pt: borderPt },
]

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

function handleFooterAction(action) {
  if (action === 'refresh') {
    loadAssets()
  }
  else if (action === 'export') {
    dataTableRef.value?.exportCSV()
  }
}
</script>

<template>
  <div class="manage-assets">
    <header class="page-header">
      <h2 class="page-title">
        Assets
      </h2>
      <p class="page-desc">
        Manage collection assets and view their assessment metrics.
      </p>
    </header>

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
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedAssets"
        :value="filteredData"
        data-key="assetId"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        selection-mode="multiple"
        :loading="isLoading"
        :virtual-scroller-options="{ itemSize: 27, delay: 0 }"
        class="flex-fill clickable-rows"
        :table-style="{ 'table-layout': 'fixed' }"
        :pt="tablePt"
      >
        <Column selection-mode="multiple" style="width: 1rem; height: 27px; padding: 0 0.5rem;" />

        <Column field="assetName" sortable :pt="borderPt" style="width: 60px; height: 27px; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #header>
            <div class="column-header-with-filter">
              Asset
              <ColumnSearchFilter v-model="assetFilter" placeholder="Search asset..." />
            </div>
          </template>
          <template #body="{ data }">
            <div class="sm-grid-cell-with-toolbar">
              <div class="sm-info">
                {{ data.assetName }}
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

        <Column field="labels" sortable :pt="borderPt" style="width: 100px; height: 27px; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #header>
            <div class="column-header-with-filter">
              Labels
              <ColumnFilter v-model="labelFilter" :options="labelOptions" />
            </div>
          </template>
          <template #body="{ data }">
            <LabelsRow :labels="data.labels" compact />
          </template>
        </Column>

        <template v-for="col in columns" :key="col.field">
          <component :is="col.component" v-bind="col" sortable :style="`width: ${col.width}; height: 27px; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`" />
        </template>

        <template #footer>
          <StatusFooter
            :refresh-loading="isLoading"
            :total-count="filteredData.length"
            :show-selected="selectedAssets.length > 0"
            :selected-items="selectedAssets"
            total-label="assets"
            @action="handleFooterAction"
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

.page-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-default);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-default);
  margin-bottom: 0.25rem;
}

.page-desc {
  color: var(--color-text-dim);
  font-size: 0.9rem;
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

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
  font-size: 0.7rem;
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

:deep(th:nth-child(n+4) .p-datatable-column-header-content) {
  justify-content: center;
}

:deep(td:nth-child(n+4)) {
  text-align: center;
}
</style>
