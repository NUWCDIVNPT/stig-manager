<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'

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

const emit = defineEmits(['select-rule', 'refresh'])

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
  }

  return { results, statuses, total: data.length }
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

function handleFooterAction(actionKey) {
  if (actionKey === 'refresh') {
    emit('refresh')
  }
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
      class="checklist-table"
      @row-select="onRowSelect"
    >
      <Column header="CAT" field="severity" :style="{ width: '44px', textAlign: 'center' }">
        <template #body="{ data }">
          <CatBadge v-if="data.severity" :category="severityMap[data.severity] || 2" />
        </template>
      </Column>

      <Column header="Group" field="groupId" :style="{ width: '80px' }">
        <template #body="{ data }">
          <span class="cell-text--mono">{{ data.groupId }}</span>
        </template>
      </Column>

      <Column header="Rule Title" field="ruleTitle" />

      <Column field="result" :style="{ width: '56px', textAlign: 'center' }">
        <template #header>
          <span>Result</span>
        </template>
        <template #body="{ data }">
          <div class="result-cell">
            <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
            <img
              v-if="getEngineDisplay(data) === 'engine'"
              src="../../../assets/bot2.svg"
              alt="Engine"
              class="engine-icon"
              title="Result engine"
            >
            <img
              v-else-if="getEngineDisplay(data) === 'override'"
              src="../../../assets/override2.svg"
              alt="Override"
              class="engine-icon"
              title="Overridden result"
            >
          </div>
        </template>
      </Column>

      <Column header="Status" field="status" :style="{ width: '44px', textAlign: 'center' }">
        <template #body="{ data }">
          <StatusBadge v-if="data.status" :status="data.status" />
        </template>
      </Column>

      <Column field="touchTs" :style="{ width: '40px', textAlign: 'center' }">
        <template #header>
          <i class="pi pi-clock" title="Last action" />
        </template>
        <template #body="{ data }">
          <span class="cell-text--dim" :title="data.touchTs">{{ durationToNow(data.touchTs) }}</span>
        </template>
      </Column>

      <template v-if="stats" #footer>
        <StatusFooter
          :refresh-loading="isLoading"
          :total-count="stats.total"
          :show-export="false"
          @action="handleFooterAction"
        >
          <template #left-extra>
            <ResultBadge status="NF" :count="stats.results.pass" />
            <ResultBadge status="O" :count="stats.results.fail" />
            <ResultBadge status="NA" :count="stats.results.notapplicable" />
            <ResultBadge status="NR" :count="stats.results.other" />
            <span class="footer-divider">|</span>
            <StatusBadge status="saved" :count="stats.statuses.saved" />
            <StatusBadge status="submitted" :count="stats.statuses.submitted" />
            <StatusBadge status="accepted" :count="stats.statuses.accepted" />
            <StatusBadge status="rejected" :count="stats.statuses.rejected" />
          </template>
        </StatusFooter>
      </template>
    </DataTable>
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
  padding: 0.35rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.checklist-info__title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.checklist-info__access-badge {
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

/* Let rows grow to fit content — no fixed row height */
:deep(.p-datatable-tbody > tr > td) {
  vertical-align: top;
  padding: 0.25rem 0.5rem;
}

:deep(.p-datatable-thead > tr > th) {
  padding: 0.3rem 0.5rem;
}

:deep(.p-datatable-footer) {
  padding: 0;
  border: none;
}

.cell-text--mono {
  font-family: monospace;
  color: var(--color-text-dim);
}

.cell-text--dim {
  color: var(--color-text-dim);
}

.result-cell {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.engine-icon {
  width: 12px;
  height: 12px;
  opacity: 0.7;
  flex-shrink: 0;
}

.footer-divider {
  color: var(--color-border-light);
}
</style>
