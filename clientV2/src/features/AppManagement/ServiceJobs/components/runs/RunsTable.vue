<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import StatusFooter from '../../../../../components/common/StatusFooter.vue'
import { formatDateTime, formatDuration } from '../../lib/serviceJobsFormat.js'
import { jobsTablePt } from '../../lib/serviceJobsPt.js'
import RunStatePill from '../RunStatePill.vue'

const props = defineProps({
  runs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'delete-run'])

const dataTableRef = ref(null)
const selectedRun = ref(null)

// Elapsed ms between start and end, unless the run is still running.
function runDuration(run) {
  if (run.state === 'running') {
    return null
  }
  return new Date(run.updated) - new Date(run.created)
}

const tablePt = jobsTablePt({ bodyFontSize: '0.95rem', footer: 'divider' })

const rowCount = computed(() => props.runs.length)
</script>

<template>
  <div class="panel">
    <div class="panel-title">
      <i class="pi pi-history" /> Recent Runs
    </div>
    <DataTable
      ref="dataTableRef"
      v-model:selection="selectedRun"
      :value="runs"
      :loading="loading"
      data-key="runId"
      selection-mode="single"
      sort-field="created"
      :sort-order="-1"
      scrollable
      scroll-height="flex"
      export-filename="job-runs"
      class="flex-fill"
      :pt="tablePt"
      @row-select="emit('select', selectedRun)"
    >
      <template #empty>
        No runs found
      </template>

      <Column field="created" header="Started" sortable>
        <template #body="{ data }">
          {{ formatDateTime(data.created) }}
        </template>
      </Column>

      <Column field="state" header="State" sortable>
        <template #body="{ data }">
          <RunStatePill :state="data.state" />
        </template>
      </Column>

      <Column field="duration" header="Duration">
        <template #body="{ data }">
          {{ formatDuration(runDuration(data)) }}
        </template>
      </Column>

      <Column header="" style="width: 3rem; text-align: center;">
        <template #body="{ data }">
          <button class="row-delete" title="Delete run" @click.stop="emit('delete-run', data)">
            <i class="pi pi-trash" />
          </button>
        </template>
      </Column>

      <template #footer>
        <StatusFooter
          :show-refresh="false"
          :total-count="rowCount"
          total-label="runs"
          total-icon="pi pi-history"
          @action="key => key === 'export' && dataTableRef?.exportCSV()"
        />
      </template>
    </DataTable>
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

.flex-fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.row-delete {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-dim);
  padding: 0.2rem;
  border-radius: 4px;
}

.row-delete:hover {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 10%, transparent);
}
</style>
