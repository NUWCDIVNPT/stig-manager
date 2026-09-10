<script setup>
import { FilterMatchMode, FilterService } from '@primevue/core/api'
import Column from 'primevue/column'
import { computed, inject, watch } from 'vue'

import LabelsRow from '../../../components/columns/LabelsRow.vue'
import ColumnFilter from '../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../components/common/ColumnSearchFilter.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { durationToNow } from '../../../shared/lib.js'
import { normalizeColor } from '../../../shared/lib/colorUtils.js'
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'
import { fetchOtherReviews } from '../api/assetReviewApi.js'
import { useReviewTabTable } from '../composables/useReviewTabTable.js'
import ReviewTabTable from './ReviewTabTable.vue'

defineProps({
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

FilterService.register('labelContainsAny', (value, filter) => {
  if (!filter || filter.length === 0) {
    return true
  }
  if (!value || value.length === 0) {
    return false
  }
  return value.some(label => filter.includes(label.name))
})

const ROW_HEIGHT = 36

const { state: otherReviews, isLoading, execute: loadOtherReviews } = useAsyncState(
  () => fetchOtherReviews(collectionId.value, ruleId.value),
  { immediate: false, initialState: [] },
)

const filteredOtherReviews = computed(() => {
  if (!assetId.value) {
    return otherReviews.value
  }
  return otherReviews.value.filter(review => review.assetId !== assetId.value)
})

const {
  editable,
  isAlreadyApplied,
  getApplyTooltip,
  filters,
  processedData: processedOtherReviews,
  stats: otherAssetsStats,
  resultOptions,
  engineOptions,
} = useReviewTabTable(filteredOtherReviews, {
  global: FilterMatchMode.CONTAINS,
  assetName: FilterMatchMode.CONTAINS,
  detail: FilterMatchMode.CONTAINS,
  comment: FilterMatchMode.CONTAINS,
  username: FilterMatchMode.CONTAINS,
  result: FilterMatchMode.IN,
  _engineDisplay: FilterMatchMode.IN,
  assetLabels: 'labelContainsAny',
})

const labelOptions = computed(() => {
  const seen = new Map()
  for (const item of filteredOtherReviews.value) {
    for (const label of (item.assetLabels || [])) {
      if (!seen.has(label.name)) {
        seen.set(label.name, label)
      }
    }
  }
  return Array.from(seen.values())
    .map(label => ({ value: label.name, label: label.name, color: label.color }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

watch([() => ruleId.value, () => collectionId.value], () => {
  if (ruleId.value && collectionId.value) {
    loadOtherReviews()
  }
}, { immediate: true })

const COLUMN_WIDTHS = { detail: '150px', comment: '150px', username: '80px' }
</script>

<template>
  <ReviewTabTable
    v-model:filters="filters"
    :value="processedOtherReviews"
    :loading="isLoading"
    data-key="assetId"
    export-filename="Other-Reviews"
    :row-height="ROW_HEIGHT"
    :stats="otherAssetsStats"
    :result-options="resultOptions"
    :engine-options="engineOptions"
    :editable="editable"
    :is-already-applied="isAlreadyApplied"
    :get-apply-tooltip="getApplyTooltip"
    :column-widths="COLUMN_WIDTHS"
    @apply-review="emit('apply-review', $event)"
  >
    <template #lead-columns="{ showLongText }">
      <Column field="assetName" sortable :style="{ width: '100px' }">
        <template #header>
          <div class="column-header-with-filter">
            Asset
            <ColumnSearchFilter v-model="filters.assetName.value" placeholder="Search asset..." />
          </div>
        </template>
        <template #body="{ data }">
          <span
            class="cell-text--ellipsis"
            :title="data.assetId"
            @click="showLongText($event, 'Asset', data.assetName)"
          >{{ data.assetName }}</span>
        </template>
      </Column>

      <Column field="assetLabels" filter-field="assetLabels" :style="{ width: '100px' }">
        <template #header>
          <div class="column-header-with-filter">
            Labels
            <ColumnFilter v-model="filters.assetLabels.value" :options="labelOptions">
              <template #option="{ option }">
                <span
                  class="label-filter-chip"
                  :style="{ backgroundColor: normalizeColor(option.color, '#cccccc') }"
                >{{ option.label }}</span>
              </template>
            </ColumnFilter>
          </div>
        </template>
        <template #body="{ data }">
          <LabelsRow :labels="data.assetLabels" compact />
        </template>
      </Column>
    </template>

    <template #mid-columns>
      <Column header="Evaluated" field="ts" sortable :style="{ width: '80px' }">
        <template #body="{ data }">
          <span class="cell-text--mono" :title="formatReviewDate(data.ts)">{{ durationToNow(data.ts) }}</span>
        </template>
      </Column>

      <Column header="Statused" field="touchTs" sortable :style="{ width: '80px' }">
        <template #body="{ data }">
          <span v-if="data.touchTs" class="cell-text--mono" :title="formatReviewDate(data.touchTs)">{{ durationToNow(data.touchTs) }}</span>
          <span v-else class="cell-text--empty">---</span>
        </template>
      </Column>
    </template>

    <template #empty>
      <div class="other-table__empty">
        No reviews found for this rule on other assets.
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
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--color-text-dim);
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

.other-table__empty {
  padding: 3rem 1rem;
  text-align: center;
  font-style: italic;
  color: var(--color-text-dim);
  font-size: 1.1rem;
}

.label-filter-chip {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 6px;
  white-space: nowrap;
}
</style>
