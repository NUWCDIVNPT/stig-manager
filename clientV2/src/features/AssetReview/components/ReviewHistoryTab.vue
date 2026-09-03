<script setup>
import { FilterMatchMode } from '@primevue/core/api'
import Column from 'primevue/column'
import { computed, inject, watch } from 'vue'

import ColumnFilter from '../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../components/common/ColumnSearchFilter.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { durationToNow } from '../../../shared/lib.js'
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'
import { fetchReview } from '../api/assetReviewApi.js'
import { useReviewTabTable } from '../composables/useReviewTabTable.js'
import ReviewTabTable from './ReviewTabTable.vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['apply-review'])

const {
  selectedRuleId: ruleId,
  collectionId,
  assetId,
} = inject('assetReviewContext')

const { state: fullReviewHistory, isLoading: isInternalHistoryLoading, execute: loadHistory } = useAsyncState(
  async () => {
    const result = await fetchReview(collectionId.value, assetId.value, ruleId.value, { projection: 'history' })
    return result?.history || []
  },
  { immediate: false, initialState: [] },
)

watch([() => props.active, () => ruleId.value], ([active, rid], [_oldActive, oldRid]) => {
  if (!active || !ruleId.value || !assetId.value || !collectionId.value) {
    return
  }
  if (rid !== oldRid) {
    fullReviewHistory.value = []
  }
  loadHistory()
}, { immediate: true })

const {
  editable,
  isAlreadyApplied,
  getApplyTooltip,
  filters,
  processedData: processedHistory,
  stats: historyStats,
  resultOptions,
  engineOptions,
} = useReviewTabTable(fullReviewHistory, {
  global: FilterMatchMode.CONTAINS,
  ruleId: FilterMatchMode.CONTAINS,
  detail: FilterMatchMode.CONTAINS,
  comment: FilterMatchMode.CONTAINS,
  statusText: FilterMatchMode.CONTAINS,
  username: FilterMatchMode.CONTAINS,
  result: FilterMatchMode.IN,
  _engineDisplay: FilterMatchMode.IN,
  _statusLabel: FilterMatchMode.IN,
})

const statusOptions = computed(() => {
  const statuses = new Set((fullReviewHistory.value || []).map(item => item.status?.label).filter(Boolean))
  return Array.from(statuses).map(val => ({
    value: val,
    label: val,
  })).sort((a, b) => a.label.localeCompare(b.label))
})

const ROW_HEIGHT = 40
</script>

<template>
  <ReviewTabTable
    v-model:filters="filters"
    :value="processedHistory"
    :loading="isInternalHistoryLoading"
    data-key="touchTs"
    export-filename="History"
    :row-height="ROW_HEIGHT"
    :stats="historyStats"
    :result-options="resultOptions"
    :engine-options="engineOptions"
    :editable="editable"
    :is-already-applied="isAlreadyApplied"
    :get-apply-tooltip="getApplyTooltip"
    resizable-columns
    @apply-review="emit('apply-review', $event)"
  >
    <template #lead-columns="{ showLongText }">
      <Column header="Time" field="touchTs" sortable :style="{ width: '65px' }">
        <template #body="{ data }">
          <span class="cell-text--mono" :title="formatReviewDate(data.touchTs)">{{ durationToNow(data.touchTs) }}</span>
        </template>
      </Column>

      <Column field="ruleId" :style="{ width: '150px' }">
        <template #header>
          <div class="column-header-with-filter">
            Rule
            <ColumnSearchFilter v-model="filters.ruleId.value" placeholder="Search rule..." />
          </div>
        </template>
        <template #body="{ data }">
          <span
            class="cell-text--mono cell-text--ellipsis"
            title="Click to view full rule ID"
            @click="showLongText($event, 'Rule', data.ruleId)"
          >{{ data.ruleId }}</span>
        </template>
      </Column>
    </template>

    <template #mid-columns="{ showLongText }">
      <Column field="statusText" :style="{ width: '100px' }">
        <template #header>
          <div class="column-header-with-filter">
            Status Text
            <ColumnSearchFilter v-model="filters.statusText.value" placeholder="Search status text..." />
          </div>
        </template>
        <template #body="{ data }">
          <span
            v-if="data.status?.text"
            class="cell-text--ellipsis"
            title="Click to view full text"
            @click="showLongText($event, 'Status Text', data.status.text)"
          >
            {{ data.status.text }}
          </span>
          <span v-else class="cell-text--empty">---</span>
        </template>
      </Column>

      <Column filter-field="_statusLabel" :style="{ width: '70px', textAlign: 'center' }">
        <template #header>
          <div class="column-header-with-filter">
            Status
            <ColumnFilter v-model="filters._statusLabel.value" :options="statusOptions">
              <template #option="{ option }">
                <StatusBadge :status="option.value" />
              </template>
            </ColumnFilter>
          </div>
        </template>
        <template #body="{ data }">
          <StatusBadge v-if="data.status?.label" :status="data.status.label" />
        </template>
      </Column>
    </template>

    <template #empty>
      <div class="history-table__empty">
        No review history found for this rule.
      </div>
    </template>
  </ReviewTabTable>
</template>

<style scoped>
.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cell-text--mono {
  color: var(--color-text-primary);
  font-size: 1rem;
}

.cell-text--ellipsis {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95rem;
  line-height: 1.3;
  color: var(--color-text-primary);
  cursor: pointer;
  border-radius: 3px;
  padding: 0 2px;
  transition: background-color 0.1s ease;
}

.cell-text--ellipsis:hover {
  background-color: color-mix(in srgb, var(--color-primary-highlight) 15%, transparent);
}

.cell-text--empty {
  color: var(--color-text-dim);
  opacity: 0.5;
  font-style: italic;
  font-size: 0.9rem;
}

.history-table__empty {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text-dim);
  font-size: 1.1rem;
  font-style: italic;
}
</style>
