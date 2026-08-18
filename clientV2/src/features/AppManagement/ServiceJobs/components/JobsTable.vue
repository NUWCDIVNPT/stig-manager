<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useTableFooterActions } from '../../../../shared/composables/useTableFooterActions.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { createdByLabel, formatDateTime, isSystemJob, scheduleSummary } from '../lib/serviceJobsFormat.js'
import { borderPt } from '../lib/serviceJobsPt.js'
import RunStatePill from './RunStatePill.vue'

const props = defineProps({
  jobs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  selection: { type: Object, default: null },
})

const emit = defineEmits(['update:selection', 'create', 'modify', 'remove', 'run-now', 'refresh'])

const dataTableRef = ref(null)
const nameFilter = ref('')

const selectedJob = computed({
  get: () => props.selection,
  // Ignore PrimeVue's single-select toggle-to-null so a row stays selected.
  set: value => value && emit('update:selection', value),
})

const hasSelection = computed(() => props.selection != null)
// System jobs may only be modified/run, not removed. Uses the same system-job
// definition as the modal so grid and modal never disagree (finding #1).
const canRemove = computed(() => hasSelection.value && !isSystemJob(props.selection))

// Attach a display label for the owner so the Created By column can sort on the
// same value it renders ('system' for null createdBy) rather than empty.
const filteredJobs = computed(() => {
  const term = nameFilter.value.trim().toLowerCase()
  const rows = term
    ? props.jobs.filter(j => j.name?.toLowerCase().includes(term))
    : props.jobs
  return rows.map(j => ({ ...j, createdByLabel: createdByLabel(j) }))
})

const filtersActive = computed(() => filteredJobs.value.length !== props.jobs.length)

const tablePt = {
  ...compactTablePt({ bodyFontSize: '1rem', footer: 'divider', headerPadding: '0.3rem 0.6rem' }),
  bodyRow: { style: 'cursor: pointer;' },
}

const { onFooterAction } = useTableFooterActions(dataTableRef, { onRefresh: () => emit('refresh') })
</script>

<template>
  <div class="jobs-table">
    <ActionToolbar>
      <ActionButton icon="pi pi-plus icon-green" @click="emit('create')">
        Create
      </ActionButton>
      <div class="toolbar-divider" />
      <ActionButton icon="pi pi-pencil icon-blue" :disabled="!hasSelection" @click="emit('modify', selection)">
        Modify
      </ActionButton>
      <ActionButton
        icon="pi pi-trash icon-red"
        :disabled="!canRemove"
        :title="hasSelection && !canRemove ? 'System jobs cannot be removed' : 'Remove the selected job'"
        @click="emit('remove', selection)"
      >
        Remove
      </ActionButton>
      <div class="toolbar-divider" />
      <ActionButton icon="pi pi-play icon-green" :disabled="!hasSelection" @click="emit('run-now', selection)">
        Run Now
      </ActionButton>
    </ActionToolbar>

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedJob"
        :value="filteredJobs"
        :loading="loading"
        selection-mode="single"
        data-key="jobId"
        sort-field="name"
        :sort-order="1"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        export-filename="stig-manager-service-jobs"
        class="flex-fill"
        :table-style="{ 'min-width': '60rem' }"
        :row-class="row => row.lastRun?.state === 'failed' ? 'row-error' : ''"
        :pt="tablePt"
      >
        <template #empty>
          No jobs found.
        </template>

        <Column field="name" sortable :pt="borderPt" style="width: 26%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #header>
            <div class="column-header-with-filter">
              Name
              <ColumnSearchFilter v-model="nameFilter" placeholder="Search name..." />
            </div>
          </template>
          <template #body="{ data }">
            <div class="name-cell">
              <RunStatePill :state="data.lastRun?.state ?? 'missing'" />
              <span class="job-name" :title="data.name">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="createdByLabel" header="Created By" sortable :pt="borderPt" style="width: 12%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <span :class="{ 'dim-value': !data.createdBy }">{{ data.createdByLabel }}</span>
          </template>
        </Column>

        <Column field="tasks" header="Tasks" :pt="borderPt" style="width: 22%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <span :title="(data.tasks ?? []).map(t => t.name).join(', ')">
              {{ (data.tasks ?? []).map(t => t.name).join(', ') || '-' }}
            </span>
          </template>
        </Column>

        <Column field="event" header="Schedule" :pt="borderPt" style="width: 18%;">
          <template #body="{ data }">
            <div v-if="data.event" class="schedule-cell" :class="{ 'dim-value': data.event.enabled === false }">
              <span class="schedule-line">{{ scheduleSummary(data.event) }}</span>
              <span v-if="data.event.type === 'recurring'" class="schedule-sub">Starting {{ formatDateTime(data.event.starts) }}</span>
              <span v-else-if="data.event.type === 'once'" class="schedule-sub">at {{ formatDateTime(data.event.starts) }}</span>
              <span v-if="data.event.enabled === false" class="disabled-tag">DISABLED</span>
            </div>
            <span v-else class="dim-value">Not scheduled</span>
          </template>
        </Column>

        <Column field="runCount" sortable :pt="borderPt" style="width: 8%; text-align: center;">
          <template #header>
            <span class="center-label">Runs</span>
          </template>
          <template #body="{ data }">
            {{ data.runCount ?? 0 }}
          </template>
        </Column>

        <Column field="lastRun.updated" header="Last Run" sortable style="width: 14%;">
          <template #body="{ data }">
            <span :class="{ 'dim-value': !data.lastRun }">
              {{ formatDateTime(data.lastRun?.updated ?? data.lastRun?.created) }}
            </span>
          </template>
        </Column>

        <template #footer>
          <StatusFooter
            :refresh-loading="loading"
            :total-count="jobs.length"
            :filtered-count="filtersActive ? filteredJobs.length : null"
            total-label="jobs"
            total-icon="pi pi-wrench"
            @action="onFooterAction"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.jobs-table {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0.5rem;
  min-width: 0;
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

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.center-label {
  display: inline-block;
  width: 100%;
  text-align: center;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.job-name {
  font-weight: 600;
  color: var(--color-text-bright);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.schedule-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.schedule-sub {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.disabled-tag {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
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
