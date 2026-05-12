<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'

const props = defineProps({
  statusText: { type: String, default: 'Importing…' },
  statusRows: { type: Array, required: true },
  selectedRow: { type: Object, default: null },
  totalCount: { type: Number, default: 0 },
  isDone: { type: Boolean, default: false },
})

const emit = defineEmits(['update:selectedRow'])

const progressValue = computed(() =>
  props.totalCount > 0 ? Math.round((props.statusRows.length / props.totalCount) * 100) : 0,
)

const rejectedRows = computed(() => props.selectedRow?.rejected ?? [])

const statusRef = ref()
const rejectedRef = ref()

function onStatusFooterAction(action) {
  if (action === 'export') { statusRef.value.exportCSV() }
}

function onRejectedFooterAction(action) {
  if (action === 'export') { rejectedRef.value.exportCSV() }
}
</script>

<template>
  <div class="step-header">
    <h2 class="step-title">
      Importing results
    </h2>
  </div>
  <div class="import-status-strip">
    <div class="isp-header">
      <span :class="progressValue === 100 ? 'pi pi-check isp-icon isp-icon--done' : 'pi pi-spin pi-spinner isp-icon'" />
      <span class="isp-text">{{ statusText }}</span>
      <span class="isp-pct">{{ progressValue }}%</span>
    </div>
    <div class="isp-track">
      <div class="isp-fill" :style="{ width: `${progressValue}%` }" />
    </div>
  </div>

  <template v-if="isDone">
    <div class="import-table-wrapper">
      <div class="table-flex">
        <DataTable
          ref="statusRef"
          :model-value="selectedRow"
          :value="statusRows"
          export-filename="import-results"
          selection-mode="single"
          data-key="assetId"
          scrollable
          scroll-height="flex"
          resizable-columns
          striped-rows
          @row-select="e => emit('update:selectedRow', e.data)"
          @row-unselect="emit('update:selectedRow', null)"
        >
          <Column field="assetName" header="Asset" style="min-width: 180px" sortable />
          <Column field="created" header="Created" style="width: 90px" sortable>
            <template #body="{ data }">
              {{ data.created ? 'true' : 'false' }}
            </template>
          </Column>
          <Column field="addedStigs" header="Added STIGs" style="width: 110px" sortable>
            <template #body="{ data }">
              {{ data.addedStigs ? 'true' : 'false' }}
            </template>
          </Column>
          <Column field="inserted" header="Inserted" style="width: 90px" sortable>
            <template #body="{ data }">
              {{ data.error ? '-' : (data.inserted ?? 0) }}
            </template>
          </Column>
          <Column field="updated" header="Updated" style="width: 90px" sortable>
            <template #body="{ data }">
              {{ data.error ? '-' : (data.updated ?? 0) }}
            </template>
          </Column>
          <Column header="Rejected" :exportable="false" style="width: 90px" sortable :sort-field="r => r.error ? -1 : (r.rejected?.length ?? 0)">
            <template #body="{ data }">
              {{ data.error ? '!' : (data.rejected?.length ?? 0) }}
            </template>
          </Column>
        </DataTable>
      </div>
      <StatusFooter
        :total-count="statusRows.length"
        :show-refresh="false"
        :show-export="true"
        total-label="reviews"
        total-icon="pi pi-file"
        @action="onStatusFooterAction"
      />
    </div>

    <div class="rejected-wrapper">
      <div class="rejected-header">
        Rejected reviews
      </div>
      <div class="import-table-wrapper rejected-table-wrapper">
        <div class="table-flex">
          <DataTable
            ref="rejectedRef"
            :value="rejectedRows"
            export-filename="rejected-reviews"
            scrollable
            scroll-height="flex"
            resizable-columns
            striped-rows
            class="rejected-table"
          >
            <Column field="ruleId" header="Rule" style="min-width: 160px" sortable />
            <Column field="reason" header="Reason" sortable />
            <template #empty>
              <div class="rejected-empty">
                <span class="pi pi-info-circle" style="color: var(--color-primary-highlight); font-size: 1.2rem;" />
                <span>{{ selectedRow ? 'No rejected reviews for this asset.' : 'Select a row above with rejected reviews to inspect them here.' }}</span>
              </div>
            </template>
          </DataTable>
        </div>
        <StatusFooter
          :total-count="rejectedRows.length"
          :show-refresh="false"
          :show-export="true"
          total-label="reviews"
          total-icon="pi pi-file"
          @action="onRejectedFooterAction"
        />
      </div>
    </div>

    <div v-if="selectedRow?.error" class="error-row">
      <i class="pi pi-times-circle" /> {{ selectedRow.error }}
    </div>
  </template>

  <div v-else class="running-placeholder">
    <span class="pi pi-spin pi-spinner running-icon" />
    <div class="running-text">
      Processing {{ statusRows.length }} of {{ totalCount }}
    </div>
    <div class="running-hint">
      Full results appear here when the import finishes.
    </div>
  </div>
</template>

<style scoped>
.step-header {
  flex-shrink: 0;
}

.step-title {
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--color-primary-highlight);
}

.import-status-strip {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  flex-shrink: 0;
  margin-bottom: 0.75rem;
}

.isp-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.isp-icon { font-size: 0.8rem; color: var(--color-action-blue); flex-shrink: 0; }
.isp-icon--done { color: var(--color-success); }
.isp-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.isp-pct {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.isp-track {
  height: 6px;
  background: var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
}
.isp-fill {
  height: 100%;
  background: var(--color-action-blue-dark);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.table-flex {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.import-table-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  margin-bottom: 1rem;
}

.rejected-wrapper {
  display: flex;
  flex-direction: column;
  flex: 0 0 240px;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
}

.rejected-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text-dim);
  font-size: 1rem;
  padding: 0.75rem 1rem;
  text-align: center;
}

.rejected-header {
  padding: 0.6rem 1rem;
  background-color: var(--color-background-light);
  border-bottom: 1px solid var(--color-border-default);
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-bright);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.rejected-table-wrapper {
  border: none !important;
  margin-bottom: 0 !important;
}

.error-row {
  color: var(--color-text-error);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.running-placeholder {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border: 1px dashed var(--color-border-default);
  border-radius: 6px;
  padding: 1.5rem;
  color: var(--color-text-dim);
}
.running-icon {
  font-size: 1.4rem;
  color: var(--color-action-blue);
}
.running-text {
  font-size: 1rem;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}
.running-hint {
  font-size: 0.85rem;
}
</style>
