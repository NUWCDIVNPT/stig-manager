<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { ref } from 'vue'
import StatusFooter from '../../../../../components/common/StatusFooter.vue'
import { formatDateTime } from '../../lib/serviceJobsFormat.js'
import { jobsTablePt } from '../../lib/serviceJobsPt.js'

defineProps({
  output: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const dataTableRef = ref(null)
const tablePt = jobsTablePt({ bodyFontSize: '0.95rem', footer: 'divider' })
</script>

<template>
  <div class="panel">
    <div class="panel-title">
      <i class="pi pi-align-left" /> Runtime Output
    </div>
    <DataTable
      ref="dataTableRef"
      :value="output"
      :loading="loading"
      data-key="seq"
      sort-field="seq"
      :sort-order="-1"
      scrollable
      scroll-height="flex"
      export-filename="job-run-output"
      class="flex-fill"
      :table-style="{ 'min-width': '40rem' }"
      :pt="tablePt"
    >
      <template #empty>
        No output to display
      </template>

      <Column field="seq" header="Seq" sortable style="width: 4rem; text-align: right;" />
      <Column field="ts" header="Timestamp" sortable style="width: 13rem;">
        <template #body="{ data }">
          {{ formatDateTime(data.ts) }}
        </template>
      </Column>
      <Column field="task" header="Task" sortable style="width: 10rem;" />
      <Column field="type" header="Type" sortable style="width: 6rem;">
        <template #body="{ data }">
          <span :class="{ 'type-error': data.type === 'error' }">{{ data.type }}</span>
        </template>
      </Column>
      <Column field="message" header="Message">
        <template #body="{ data }">
          <span class="msg">{{ data.message }}</span>
        </template>
      </Column>

      <template #footer>
        <StatusFooter
          :show-refresh="false"
          :total-count="output.length"
          total-label="lines"
          total-icon="pi pi-align-left"
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

.type-error {
  color: var(--color-action-red);
  font-weight: 600;
}

.msg {
  white-space: normal;
  word-break: break-word;
}
</style>
