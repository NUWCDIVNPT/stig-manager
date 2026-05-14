<script setup>
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'

import DurationColumn from '../../../components/columns/DurationColumn.vue'
import LabelsRow from '../../../components/columns/LabelsRow.vue'
import PercentageColumn from '../../../components/columns/PercentageColumn.vue'
import ColumnFilter from '../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../components/common/ColumnSearchFilter.vue'
import DeleteModal from '../../../components/common/DeleteModal.vue'

import StatusFooter from '../../../components/common/StatusFooter.vue'
import { fetchCollectionAssetSummary } from '../../../shared/api/collectionsApi.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useTableSelection } from '../../../shared/composables/useTableSelection.js'
import { deleteAssets } from '../api/assetManageApi.js'
import AssetsToolbar from './AssetsToolbar.vue'
import CreateAssetModal from './CreateAssetModal.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const isLoading = ref(false)
const assets = ref([])
const dataTableRef = ref(null)

const { getCollectionGrant } = useCurrentUser()
const collectionName = computed(
  () => getCollectionGrant(props.collectionId)?.collection?.name ?? '',
)

async function loadAssets() {
  if (!props.collectionId) { return }
  isLoading.value = true
  try {
    assets.value = await fetchCollectionAssetSummary(props.collectionId)
  }
  catch (error) {
    console.error('Failed to load assets', error)
  }
  finally {
    isLoading.value = false
  }
}

watch(() => props.collectionId, loadAssets, { immediate: true })

const tableData = computed(() =>
  assets.value.map(r => ({
    assetId: r.assetId,
    assetName: r.name,
    labels: r.labels,
    stigCnt: r.benchmarkIds?.length ?? 0,
    checks: r.metrics?.assessments ?? 0,
    oldest: r.metrics?.minTs,
    newest: r.metrics?.maxTs,
    assessedPct: r.metrics?.assessments ? (r.metrics.assessed / r.metrics.assessments) * 100 : 0,
    submittedPct: r.metrics?.assessments
      ? ((r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100
      : 0,
    acceptedPct: r.metrics?.assessments ? (r.metrics.statuses.accepted / r.metrics.assessments) * 100 : 0,
    rejectedPct: r.metrics?.assessments ? (r.metrics.statuses.rejected / r.metrics.assessments) * 100 : 0,
  })),
)

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }

const assetFilter = ref('')
const labelFilter = ref([])

const labelOptions = computed(() => {
  const seen = new Map()
  for (const row of tableData.value) {
    for (const lbl of (row.labels ?? [])) {
      if (!seen.has(lbl.labelId)) {
        seen.set(lbl.labelId, { label: lbl.name, value: lbl.labelId })
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const filteredData = computed(() => {
  let data = tableData.value
  if (assetFilter.value) {
    const q = assetFilter.value.toLowerCase()
    data = data.filter(r => r.assetName.toLowerCase().includes(q))
  }
  if (labelFilter.value.length > 0) {
    const ids = new Set(labelFilter.value)
    data = data.filter(r => (r.labels ?? []).some(l => ids.has(l.labelId)))
  }
  return data
})

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

const {
  selectedIdSet,
  isAllSelected,
  selectAll,
  handleCheckboxClick,
} = useTableSelection(
  filteredData,
  computed(() => selectedAssets.value),
  next => (selectedAssets.value = next),
  'assetId',
)

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

function onAssetCreated(row) {
  assets.value = [...assets.value, {
    assetId: row.assetId,
    name: row.name ?? row.assetName,
    labels: row.labels ?? [],
    benchmarkIds: row.benchmarkIds ?? [],
    metrics: row.metrics,
    collection: row.collection,
  }]
}

function onAssetChanged(row) {
  const idx = assets.value.findIndex(a => a.assetId === row.assetId)
  if (idx !== -1) {
    assets.value = assets.value.with(idx, {
      ...assets.value[idx],
      name: row.name ?? row.assetName,
      labels: row.labels ?? [],
      benchmarkIds: row.benchmarkIds ?? [],
      metrics: row.metrics,
    })
  }
}

const deleteModalVisible = ref(false)

function onDeleteAssets() {
  deleteModalVisible.value = true
}

async function onDeleteConfirmed() {
  const assetIds = selectedAssets.value.map(a => a.assetId)
  await deleteAssets(props.collectionId, assetIds)
  selectedAssets.value = []
  await loadAssets()
}

function onAssetsTransferred(transferredIds) {
  const idSet = new Set(transferredIds)
  assets.value = assets.value.filter(a => !idSet.has(a.assetId))
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

    <CreateAssetModal
      v-model:visible="createModalVisible"
      :collection-id="props.collectionId"
      :asset-id="editAssetId"
      @asset-created="onAssetCreated"
      @asset-changed="onAssetChanged"
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
        :value="filteredData"
        data-key="assetId"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        :loading="isLoading"
        :virtual-scroller-options="{ itemSize: 27, delay: 0 }"
        class="flex-fill"
      >
        <Column style="width: 3rem; height: 27px; padding: 0 0.5rem;" :pt="{ headerContent: { style: 'justify-content: flex-start; width: 100%' } }">
          <template #header>
            <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
              <Checkbox v-if="filteredData.length > 0" :model-value="isAllSelected" :binary="true" @update:model-value="selectAll" />
            </div>
          </template>
          <template #body="{ data, index }">
            <div style="display:flex;align-items:center;justify-content:center;cursor:pointer" @click.stop="handleCheckboxClick($event, data, index)">
              <Checkbox :model-value="selectedIdSet.has(data.assetId)" :binary="true" style="pointer-events:none" />
            </div>
          </template>
        </Column>

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
}

.flex-fill {
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
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

:deep(.p-datatable-footer) {
  padding: 0;
  border: none;
}

:deep(th:nth-child(n+4) .p-datatable-column-header-content) {
  justify-content: center;
}

:deep(td:nth-child(n+4)) {
  text-align: center;
}
</style>
