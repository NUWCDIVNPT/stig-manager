<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'

const props = defineProps({
  checklistData: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
  accessMode: {
    type: String,
    default: 'r',
  },
})

const emit = defineEmits(['select-rule'])

const selectedRow = ref(null)

// Map severity to CatBadge category number
const severityMap = { high: 1, medium: 2, low: 3 }

// Map API result values to ResultBadge display codes
const resultDisplayMap = {
  pass: 'NF',
  fail: 'O',
  notapplicable: 'NA',
  notchecked: 'NR',
  informational: 'I',
  unknown: 'NR',
  error: 'NR',
  notselected: 'NR',
  fixed: 'NF',
}

function getResultDisplay(result) {
  if (!result) {
    return null
  }
  return resultDisplayMap[result] || 'NR'
}

function getEngineDisplay(item) {
  if (!item.resultEngine) {
    return null
  }
  if (item.resultEngine.overrides?.length) {
    return 'override'
  }
  return 'engine'
}

function durationToNow(date) {
  if (!date) {
    return '-'
  }
  const d = Math.abs(new Date(date) - new Date()) / 1000
  const days = Math.floor(d / 86400)
  if (days > 0) {
    return `${days} d`
  }
  const hours = Math.floor(d / 3600)
  if (hours > 0) {
    return `${hours} h`
  }
  const minutes = Math.floor(d / 60)
  if (minutes > 0) {
    return `${minutes} m`
  }
  return 'now'
}

// Tally stats
const stats = computed(() => {
  const data = props.checklistData
  if (!data?.length) {
    return null
  }

  const results = { pass: 0, fail: 0, notapplicable: 0, other: 0 }
  const statuses = { saved: 0, submitted: 0, accepted: 0, rejected: 0 }
  let engine = 0
  let manual = 0
  let override = 0

  for (const item of data) {
    if (item.result === 'pass') {
      results.pass++
    }
    else if (item.result === 'fail') {
      results.fail++
    }
    else if (item.result === 'notapplicable') {
      results.notapplicable++
    }
    else {
      results.other++
    }

    if (item.status) {
      statuses[item.status] = (statuses[item.status] || 0) + 1
    }

    if (item.resultEngine) {
      if (item.resultEngine.overrides?.length) {
        override++
      }
      else {
        engine++
      }
    }
    else if (item.result) {
      manual++
    }
  }

  return { results, statuses, engine, manual, override, total: data.length }
})

// Sync selectedRow when selectedRuleId prop changes externally
watch(() => props.selectedRuleId, (ruleId) => {
  if (!ruleId) {
    selectedRow.value = null
    return
  }
  const item = props.checklistData?.find(r => r.ruleId === ruleId)
  if (item && selectedRow.value?.ruleId !== ruleId) {
    selectedRow.value = item
  }
})

// Auto-select first row when checklist data loads
watch(() => props.checklistData, (data) => {
  if (data?.length && !props.selectedRuleId) {
    selectedRow.value = data[0]
    emit('select-rule', data[0].ruleId)
  }
})

function onRowSelect(event) {
  emit('select-rule', event.data.ruleId)
}
</script>

<template>
  <div class="checklist-info">
    <div class="checklist-info__header">
      <span class="checklist-info__title">Checklist</span>
      <span
        class="checklist-info__access-badge"
        :class="accessMode === 'rw' ? 'access-rw' : 'access-r'"
      >
        {{ accessMode === 'rw' ? 'Writeable' : 'Read only' }}
      </span>
    </div>

    <DataTable
      v-model:selection="selectedRow"
      :value="checklistData"
      :loading="isLoading"
      data-key="ruleId"
      selection-mode="single"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize: 30, delay: 0 }"
      size="small"
      class="checklist-table"
      @row-select="onRowSelect"
    >
      <Column header="CAT" field="severity" :style="{ width: '50px', textAlign: 'center' }">
        <template #body="{ data }">
          <CatBadge v-if="data.severity" :category="severityMap[data.severity] || 2" />
        </template>
      </Column>

      <Column header="Group" field="groupId" :style="{ width: '90px' }">
        <template #body="{ data }">
          <span class="cell-text">{{ data.groupId }}</span>
        </template>
      </Column>

      <Column header="Rule Title" field="ruleTitle" :style="{ minWidth: '120px' }">
        <template #body="{ data }">
          <span class="cell-text cell-text--truncated" :title="data.ruleTitle">{{ data.ruleTitle }}</span>
        </template>
      </Column>

      <Column header="Result" field="result" :style="{ width: '48px', textAlign: 'center' }">
        <template #body="{ data }">
          <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
        </template>
      </Column>

      <Column header="" field="resultEngine" :style="{ width: '28px', textAlign: 'center' }">
        <template #body="{ data }">
          <span v-if="getEngineDisplay(data) === 'engine'" class="engine-icon" title="Result engine">
            <img src="../../../assets/bot2.svg" alt="Engine" class="engine-icon__img">
          </span>
          <span v-else-if="getEngineDisplay(data) === 'override'" class="engine-icon" title="Overridden result">
            <img src="../../../assets/override2.svg" alt="Override" class="engine-icon__img">
          </span>
        </template>
      </Column>

      <Column header="Status" field="status" :style="{ width: '44px', textAlign: 'center' }">
        <template #body="{ data }">
          <StatusBadge v-if="data.status" :status="data.status" />
        </template>
      </Column>

      <Column header="Age" field="touchTs" :style="{ width: '52px', textAlign: 'center' }">
        <template #body="{ data }">
          <span class="cell-text cell-text--dim" :title="data.touchTs">{{ durationToNow(data.touchTs) }}</span>
        </template>
      </Column>
    </DataTable>

    <div v-if="stats" class="checklist-info__footer">
      <span class="footer-stat">{{ stats.total }} rules</span>
      <span class="footer-divider">|</span>
      <ResultBadge status="NF" :count="stats.results.pass" />
      <ResultBadge status="O" :count="stats.results.fail" />
      <ResultBadge status="NA" :count="stats.results.notapplicable" />
      <ResultBadge status="NR" :count="stats.results.other" />
      <span class="footer-divider">|</span>
      <StatusBadge status="saved" :count="stats.statuses.saved" />
      <StatusBadge status="submitted" :count="stats.statuses.submitted" />
      <StatusBadge status="accepted" :count="stats.statuses.accepted" />
      <StatusBadge status="rejected" :count="stats.statuses.rejected" />
    </div>
  </div>
</template>

<style scoped>
.checklist-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.checklist-info__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.6rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.checklist-info__title {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

.checklist-info__access-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.access-rw {
  background-color: hsl(120deg 40% 25%);
  color: hsl(120deg 60% 75%);
}

.access-r {
  background-color: hsl(0deg 40% 25%);
  color: hsl(0deg 60% 75%);
}

.checklist-table {
  flex: 1;
  min-height: 0;
}

:deep(.p-datatable-table-container) {
  height: 100%;
}

:deep(.p-datatable-row-selected) {
  background-color: var(--color-primary-highlight) !important;
}

:deep(.p-datatable-row-selected td) {
  color: var(--color-text-bright);
}

.cell-text {
  font-size: 0.8rem;
}

.cell-text--truncated {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-text--dim {
  color: var(--color-text-dim);
  font-size: 0.75rem;
}

.engine-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.engine-icon__img {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.checklist-info__footer {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  background-color: var(--color-background-dark);
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.footer-stat {
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.footer-divider {
  color: var(--color-border-light);
  font-size: 0.75rem;
}
</style>
