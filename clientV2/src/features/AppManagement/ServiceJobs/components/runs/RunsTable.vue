<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { ref, watch } from 'vue'
import ActionButton from '../../../../../components/common/ActionButton.vue'
import StatusFooter from '../../../../../components/common/StatusFooter.vue'
import { useTableFooterActions } from '../../../../../shared/composables/useTableFooterActions.js'
import { compactTablePt } from '../../../../../shared/lib/dataTablePt.js'
import { formatDateTime, formatDuration, runDuration } from '../../lib/serviceJobsFormat.js'
import { borderPt } from '../../lib/serviceJobsPt.js'
import RunStatePill from '../RunStatePill.vue'

const props = defineProps({
  runs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'delete-run'])

const dataTableRef = ref(null)
const selectedRun = ref(null)

// Mirror the legacy grid, which auto-selected the newest run on every load so
// the output panel shows the latest run without a manual click.
watch(() => props.runs, (list) => {
  const newest = (list ?? []).reduce(
    (a, b) => (!a || new Date(b.created) > new Date(a.created) ? b : a),
    null,
  )
  selectedRun.value = newest
  emit('select', newest)
}, { immediate: true })

const tablePt = {
  ...compactTablePt({ bodyFontSize: '1rem', footer: 'divider', headerPadding: '0.3rem 0.6rem' }),
  bodyRow: { style: 'cursor: pointer;' },
}

const { onFooterAction } = useTableFooterActions(dataTableRef)
</script>

<template>
  <div class="panel">
    <div class="panel-title">
      <i class="pi pi-history" /> Recent Runs
    </div>
    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedRun"
        :value="runs"
        :loading="loading"
        selection-mode="single"
        data-key="runId"
        sort-field="created"
        :sort-order="-1"
        scrollable
        scroll-height="flex"
        export-filename="stig-manager-job-runs"
        class="flex-fill"
        :pt="tablePt"
        @row-select="emit('select', selectedRun)"
      >
        <template #empty>
          No runs found.
        </template>

        <Column field="created" header="Started" sortable :pt="borderPt" style="width: 42%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            {{ formatDateTime(data.created) }}
          </template>
        </Column>

        <Column field="state" header="State" sortable :pt="borderPt" style="width: 28%;">
          <template #body="{ data }">
            <RunStatePill :state="data.state" />
          </template>
        </Column>

        <Column field="duration" :pt="borderPt" style="width: 18%; text-align: right;">
          <template #header>
            <span class="right-label">Duration</span>
          </template>
          <template #body="{ data }">
            {{ formatDuration(runDuration(data)) }}
          </template>
        </Column>

        <Column style="width: 12%; text-align: center;">
          <template #body="{ data }">
            <ActionButton
              icon="pi pi-trash icon-red"
              title="Delete run"
              @click.stop="emit('delete-run', data)"
            />
          </template>
        </Column>

        <template #footer>
          <StatusFooter
            :show-refresh="false"
            :total-count="runs.length"
            total-label="runs"
            total-icon="pi pi-history"
            @action="onFooterAction"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
}

.panel-title {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.table-container {
  flex: 1;
  min-height: 0;
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

.right-label {
  display: inline-block;
  width: 100%;
  text-align: right;
}
</style>
