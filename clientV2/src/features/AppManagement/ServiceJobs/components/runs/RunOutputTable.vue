<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { ref } from 'vue'
import StatusFooter from '../../../../../components/common/StatusFooter.vue'
import { compactTablePt } from '../../../../../shared/lib/dataTablePt.js'
import { formatDateTime } from '../../lib/serviceJobsFormat.js'
import { borderPt } from '../../lib/serviceJobsPt.js'

defineProps({
  output: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const dataTableRef = ref(null)
const tablePt = compactTablePt({ bodyFontSize: '1rem', footer: 'divider', headerPadding: '0.3rem 0.6rem' })
</script>

<template>
  <div class="panel">
    <div class="panel-title">
      <i class="pi pi-align-left" /> Runtime Output
    </div>
    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        :value="output"
        :loading="loading"
        data-key="seq"
        sort-field="seq"
        :sort-order="-1"
        scrollable
        scroll-height="flex"
        export-filename="Job-Run-Output"
        class="flex-fill"
        :table-style="{ 'min-width': '40rem' }"
        :pt="tablePt"
      >
        <template #empty>
          No output to display.
        </template>

        <Column field="seq" sortable :pt="borderPt" style="width: 8%; text-align: center;">
          <template #header>
            <span class="center-label">Seq</span>
          </template>
        </Column>
        <Column field="ts" header="Timestamp" sortable :pt="borderPt" style="width: 22%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            {{ formatDateTime(data.ts) }}
          </template>
        </Column>
        <Column field="task" header="Task" sortable :pt="borderPt" style="width: 18%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" />
        <Column field="type" header="Type" sortable :pt="borderPt" style="width: 12%;">
          <template #body="{ data }">
            <span :class="{ 'type-error': data.type === 'error' }">{{ data.type }}</span>
          </template>
        </Column>
        <Column field="message" header="Message" style="width: 40%;">
          <template #body="{ data }">
            <span class="msg">{{ data.message }}</span>
          </template>
        </Column>

        <template #footer>
          <StatusFooter
            :dt="dataTableRef"
            :show-refresh="false"
            :total-count="output.length"
            total-label="lines"
            total-icon="pi pi-align-left"
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
}

.flex-fill {
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.center-label {
  display: inline-block;
  width: 100%;
  text-align: center;
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
