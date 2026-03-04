<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'
import { computed, ref, watch } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
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
  revisionInfo: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['select-rule', 'refresh'])

const selectedRow = ref(null)
const checklistMenu = ref()

// --- Display mode (Group/Rule toggle) ---
const displayMode = ref('groupRule')

const displayModeItems = ref([
  {
    label: 'Group/Rule display',
    items: [
      {
        label: 'Group ID and Rule title',
        icon: () => displayMode.value === 'groupRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
        command: () => { displayMode.value = 'groupRule' },
      },
      {
        label: 'Group ID and Group title',
        icon: () => displayMode.value === 'groupGroup' ? 'pi pi-circle-fill' : 'pi pi-circle',
        command: () => { displayMode.value = 'groupGroup' },
      },
      {
        label: 'Rule ID and Rule title',
        icon: () => displayMode.value === 'ruleRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
        command: () => { displayMode.value = 'ruleRule' },
      },
    ],
  },
])

function toggleChecklistMenu(event) {
  checklistMenu.value.toggle(event)
}

// Column visibility based on display mode
const showGroupId = computed(() => displayMode.value !== 'ruleRule')
const showRuleId = computed(() => displayMode.value === 'ruleRule')
const showRuleTitle = computed(() => displayMode.value !== 'groupGroup')
const showGroupTitle = computed(() => displayMode.value === 'groupGroup')

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

// Tally stats (results + engine + statuses)
const stats = computed(() => {
  const data = props.checklistData
  if (!data?.length) {
    return null
  }

  const results = { pass: 0, fail: 0, notapplicable: 0, other: 0 }
  const engine = { manual: 0, engine: 0, override: 0 }
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

    // Engine counts (only for items that have a result)
    if (item.result) {
      if (!item.resultEngine) {
        engine.manual++
      }
      else if (item.resultEngine.overrides?.length) {
        engine.override++
      }
      else {
        engine.engine++
      }
    }

    if (item.status) {
      statuses[item.status] = (statuses[item.status] || 0) + 1
    }
  }

  return { results, engine, statuses, total: data.length }
})

// Header display text
const headerTitle = computed(() => {
  if (props.revisionInfo?.display) {
    return props.revisionInfo.display
  }
  return 'Checklist'
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
      <div class="checklist-info__header-left">
        <Button
          type="button"
          size="small"
          text
          class="checklist-info__menu-btn"
          title="Checklist options"
          @click="toggleChecklistMenu"
        >
          <i class="pi pi-list" />
          <span>Checklist</span>
          <i class="pi pi-chevron-down" style="font-size: 0.6rem; margin-left: 0.15rem" />
        </Button>
        <Menu
          ref="checklistMenu"
          :model="displayModeItems"
          :popup="true"
        />
        <span class="checklist-info__title">{{ headerTitle }}</span>
      </div>
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

      <Column
        v-if="showGroupId"
        header="Group"
        field="groupId"
        :style="{ width: '80px' }"
      >
        <template #body="{ data }">
          <span class="cell-text--mono">{{ data.groupId }}</span>
        </template>
      </Column>

      <Column
        v-if="showRuleId"
        header="Rule Id"
        field="ruleId"
        :style="{ width: '100px' }"
      >
        <template #body="{ data }">
          <span class="cell-text--mono">{{ data.ruleId }}</span>
        </template>
      </Column>

      <Column
        v-if="showRuleTitle"
        header="Rule Title"
        field="ruleTitle"
      />

      <Column
        v-if="showGroupTitle"
        header="Group Title"
        field="groupTitle"
      />

      <Column header="Result" field="result" :style="{ width: '44px', textAlign: 'center' }">
        <template #body="{ data }">
          <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
        </template>
      </Column>

      <Column field="resultEngine" :style="{ width: '24px', textAlign: 'center' }">
        <template #header>
          <img
            src="../../../assets/bot2.svg"
            alt="Engine"
            class="engine-header-icon"
            title="Result engine"
          >
        </template>
        <template #body="{ data }">
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
          @action="handleFooterAction"
        >
          <template #left-extra>
            <ResultBadge status="O" :count="stats.results.fail" />
            <ResultBadge status="NF" :count="stats.results.pass" />
            <ResultBadge status="NA" :count="stats.results.notapplicable" />
            <ResultBadge status="NR+" :count="stats.results.other" />
            <span class="footer-divider">|</span>
            <ManualBadge :count="stats.engine.manual" />
            <EngineBadge :count="stats.engine.engine" />
            <OverrideBadge :count="stats.engine.override" />
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
  padding: 0.25rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  gap: 0.5rem;
}

.checklist-info__header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  overflow: hidden;
}

.checklist-info__menu-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.checklist-info__menu-btn i:first-child {
  font-size: 0.75rem;
}

.checklist-info__title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checklist-info__access-badge {
  font-weight: 600;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  flex-shrink: 0;
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

:deep(.p-datatable-tbody > tr > td) {
  vertical-align: top;
  padding: 0.15rem 0.35rem;
}

:deep(.p-datatable-thead > tr > th) {
  padding: 0.2rem 0.35rem;
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

.engine-header-icon {
  width: 12px;
  height: 12px;
  opacity: 0.7;
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
