<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { formatDateTime, scheduleSummary } from '../lib/serviceJobsFormat.js'
import { jobsTablePt } from '../lib/serviceJobsPt.js'
import RunStatePill from './RunStatePill.vue'

const props = defineProps({
  jobs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['create', 'modify', 'remove', 'run-now', 'refresh', 'select'])

const dataTableRef = ref(null)
const selectedJob = ref(null)
const nameFilter = ref('')

// System jobs (jobId < 100) can be modified/run but never removed.
const isSystemJob = computed(() => selectedJob.value != null && Number(selectedJob.value.jobId) < 100)
const hasSelection = computed(() => selectedJob.value != null)

const filteredJobs = computed(() => {
  const term = nameFilter.value.trim().toLowerCase()
  if (!term) {
    return props.jobs
  }
  return props.jobs.filter(j => j.name?.toLowerCase().includes(term))
})

function onRowSelect(event) {
  emit('select', event.data)
}

function createdByLabel(job) {
  return job.createdBy?.username ?? 'system'
}

const tablePt = jobsTablePt({ bodyFontSize: '1rem', footer: 'divider' })
</script>

<template>
  <div class="panel">
    <div class="panel-toolbar">
      <Button label="Create" icon="pi pi-plus" text @click="emit('create')" />
      <span class="toolbar-sep" />
      <Button
        label="Modify"
        icon="pi pi-pencil"
        text
        :disabled="!hasSelection"
        @click="emit('modify', selectedJob)"
      />
      <Button
        label="Remove"
        icon="pi pi-trash"
        text
        severity="danger"
        :disabled="!hasSelection || isSystemJob"
        @click="emit('remove', selectedJob)"
      />
      <span class="toolbar-sep" />
      <Button
        label="Run now..."
        icon="pi pi-play"
        text
        :disabled="!hasSelection"
        @click="emit('run-now', selectedJob)"
      />
    </div>

    <DataTable
      ref="dataTableRef"
      v-model:selection="selectedJob"
      :value="filteredJobs"
      :loading="loading"
      data-key="jobId"
      selection-mode="single"
      sort-field="name"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      export-filename="service-jobs"
      class="flex-fill"
      :table-style="{ 'min-width': '60rem' }"
      :row-class="row => row.lastRun?.state === 'failed' ? 'row-error' : ''"
      :pt="tablePt"
      @row-select="onRowSelect"
    >
      <template #empty>
        No jobs found
      </template>

      <Column field="name" sortable style="width: 16rem;">
        <template #header>
          <div class="col-header-filter">
            Name
            <ColumnSearchFilter v-model="nameFilter" placeholder="Search name..." />
          </div>
        </template>
        <template #body="{ data }">
          <RunStatePill :state="data.lastRun?.state ?? 'missing'" />
          <span class="job-name">{{ data.name }}</span>
        </template>
      </Column>

      <Column field="createdBy" header="Created By" sortable style="width: 9rem;">
        <template #body="{ data }">
          <span :class="{ 'italic-system': !data.createdBy }">{{ createdByLabel(data) }}</span>
        </template>
      </Column>

      <Column field="tasks" header="Tasks" style="width: 14rem;">
        <template #body="{ data }">
          <span>{{ (data.tasks ?? []).map(t => t.name).join(', ') || '-' }}</span>
        </template>
      </Column>

      <Column field="event" header="Schedule" style="width: 12rem;">
        <template #body="{ data }">
          <span :class="{ 'italic-system': data.event && data.event.enabled === false }">
            {{ scheduleSummary(data.event) }}
            <span v-if="data.event && data.event.enabled === false" class="disabled-tag">(disabled)</span>
          </span>
        </template>
      </Column>

      <Column field="runCount" header="Runs" sortable style="width: 6rem; text-align: right;">
        <template #body="{ data }">
          {{ data.runCount ?? 0 }}
        </template>
      </Column>

      <Column field="lastRun" header="Last Run" sortable style="width: 12rem;">
        <template #body="{ data }">
          <span :class="{ 'dim-value': !data.lastRun }">
            {{ formatDateTime(data.lastRun?.updated ?? data.lastRun?.created) }}
          </span>
        </template>
      </Column>

      <template #footer>
        <StatusFooter
          :refresh-loading="loading"
          :filtered-count="filteredJobs.length"
          :total-count="jobs.length"
          total-label="jobs"
          total-icon="pi pi-wrench"
          @action="key => key === 'refresh' ? emit('refresh') : dataTableRef?.exportCSV()"
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

.panel-toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem;
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.toolbar-sep {
  width: 1px;
  align-self: stretch;
  margin: 0.25rem 0.4rem;
  background: var(--color-border-default);
}

.flex-fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.col-header-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.job-name {
  margin-left: 0.5rem;
  font-weight: 600;
  color: var(--color-text-bright);
}

.italic-system {
  font-style: italic;
  color: var(--color-text-dim);
}

.disabled-tag {
  color: var(--color-action-red);
}

.dim-value {
  color: var(--color-text-dim);
}
</style>

<!-- Unscoped: reaches the PrimeVue-rendered <tr> that :row-class stamps. -->
<style>
.p-datatable-tbody > tr.row-error {
  background: color-mix(in srgb, var(--color-action-red) 8%, transparent);
}
</style>
