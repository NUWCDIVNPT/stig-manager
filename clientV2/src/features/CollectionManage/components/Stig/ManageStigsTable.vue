<script setup>
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'

import DurationColumn from '../../../../components/columns/DurationColumn.vue'
import PercentageColumn from '../../../../components/columns/PercentageColumn.vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { fetchCollectionStigSummary } from '../../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useTableSelection } from '../../../../shared/composables/useTableSelection.js'
import { useStigTable } from '../../composables/useStigTable.js'
import StigToolbar from './StigToolbar.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const dataTableRef = ref(null)

const { state: stigs, isLoading, execute: loadStigs } = useAsyncState(
  () => fetchCollectionStigSummary(props.collectionId),
  { initialState: [], immediate: false },
)

watch(() => props.collectionId, loadStigs, { immediate: true })

const { stigFilter, filteredData } = useStigTable(stigs)

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }

const columns = [
  { field: 'revisionStr', header: 'Revision', component: Column, width: '50px', pt: borderPt },
  { field: 'ruleCount', header: 'Rules', component: Column, width: '30px', pt: borderPt },
  { field: 'assets', header: 'Assets', component: Column, width: '30px', pt: borderPt },
  { field: 'oldest', header: 'Oldest', component: DurationColumn, width: '30px', pt: borderPt },
  { field: 'newest', header: 'Newest', component: DurationColumn, width: '30px', pt: borderPt },
  { field: 'assessedPct', header: 'Assessed', component: PercentageColumn, width: '60px', pt: borderPt },
  { field: 'submittedPct', header: 'Submitted', component: PercentageColumn, width: '60px', pt: borderPt },
  { field: 'acceptedPct', header: 'Accepted', component: PercentageColumn, width: '60px', pt: borderPt },
  { field: 'rejectedPct', header: 'Rejected', component: PercentageColumn, width: '60px', pt: borderPt },
]

const selectedStigs = ref([])

const hasSelection = computed(() => selectedStigs.value.length > 0)
const singleSelection = computed(() => selectedStigs.value.length === 1)

const {
  selectedIdSet,
  isAllSelected,
  selectAll,
  handleCheckboxClick,
} = useTableSelection(
  filteredData,
  computed(() => selectedStigs.value),
  next => (selectedStigs.value = next),
  'benchmarkId',
)

function clearSelection() {
  selectedStigs.value = []
}

function onStigsChanged() {
  clearSelection()
  loadStigs()
}

function handleFooterAction(action) {
  if (action === 'refresh') {
    loadStigs()
  }
  else if (action === 'export') {
    dataTableRef.value?.exportCSV()
  }
}
</script>

<template>
  <div class="manage-stigs">
    <header class="page-header">
      <h2 class="page-title">
        STIGs
      </h2>
      <p class="page-desc">
        Manage collection STIGs and view their assessment metrics.
      </p>
    </header>

    <StigToolbar
      :collection-id="props.collectionId"
      :selected-stigs="selectedStigs"
      :has-selection="hasSelection"
      :single-selection="singleSelection"
      @clear-selection="clearSelection"
      @stigs-changed="onStigsChanged"
    />

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        :value="filteredData"
        data-key="benchmarkId"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        :loading="isLoading"
        :virtual-scroller-options="{ itemSize: 27, delay: 0 }"
        class="flex-fill clickable-rows"
        :table-style="{ 'table-layout': 'fixed' }"
        @row-click="handleCheckboxClick($event.originalEvent, $event.data, $event.index)"
      >
        <Column
          style="width: 3rem; height: 27px; padding: 0 0.5rem;"
          :pt="{ headerContent: { style: 'justify-content: flex-start; width: 100%' } }"
        >
          <template #header>
            <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
              <Checkbox
                v-if="filteredData.length > 0"
                :model-value="isAllSelected"
                :binary="true"
                @update:model-value="selectAll"
              />
            </div>
          </template>
          <template #body="{ data, index }">
            <div
              style="display:flex;align-items:center;justify-content:center;cursor:pointer"
              @click.stop="handleCheckboxClick($event, data, index)"
            >
              <Checkbox
                :model-value="selectedIdSet.has(data.benchmarkId)"
                :binary="true"
                style="pointer-events:none"
              />
            </div>
          </template>
        </Column>

        <Column
          field="benchmarkId"
          sortable
          :pt="borderPt"
          style="min-width: 100px; width: 140px;"
          :body-style="{ height: '27px', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
          :header-style="{ padding: '0 0.5rem' }"
        >
          <template #header>
            <div class="column-header-with-filter">
              Benchmark ID
              <ColumnSearchFilter v-model="stigFilter" placeholder="Search STIG..." />
            </div>
          </template>
          <template #body="{ data }">
            <div class="sm-grid-cell-with-toolbar">
              <div class="sm-info" :title="data.benchmarkId">
                {{ data.benchmarkId }}
              </div>
            </div>
          </template>
        </Column>

        <template v-for="col in columns" :key="col.field">
          <component
            :is="col.component"
            v-bind="col"
            sortable
            :style="`width: ${col.width}; min-width: ${col.width};`"
            :body-style="{ height: '27px', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
            :header-style="{ padding: '0 0.5rem' }"
          />
        </template>

        <template #footer>
          <StatusFooter
            :refresh-loading="isLoading"
            :total-count="filteredData.length"
            :show-selected="selectedStigs.length > 0"
            :selected-items="selectedStigs"
            total-label="STIGs"
            @action="handleFooterAction"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.manage-stigs {
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

:deep(.p-datatable-footer) {
  padding: 0;
  border: none;
}

:deep(th:nth-child(n+3) .p-datatable-column-header-content) {
  justify-content: center;
}

:deep(td:nth-child(n+3)) {
  text-align: center;
}
</style>
