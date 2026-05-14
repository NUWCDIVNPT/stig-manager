<script setup>
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'

const props = defineProps({
  matched: { type: Array, required: true },
  filteredMatched: { type: Array, required: true },
  notReviewed: { type: Array, required: true },
  unmatched: { type: Array, required: true },
  updatedOnly: { type: Boolean, required: true },
})

const emit = defineEmits(['update:updatedOnly'])

const RESULT_TO_STATUS = {
  fail: 'O',
  pass: 'NF',
  notapplicable: 'NA',
  notchecked: 'NR',
  informational: 'I',
}

const previewRows = computed(() =>
  props.filteredMatched.map(row => ({
    ruleId: row.new.ruleId,
    title: row.current.ruleTitle ?? row.current.title ?? '',
    groupId: row.current.groupId ?? '',
    severity: row.current.severity ?? '',
    currentResult: row.current.result ?? null,
    newResult: row.new.result ?? null,
    newDetail: row.new.detail ?? '',
    newComment: row.new.comment ?? '',
    newStatus: row.new.status ?? '',
  })),
)

const dtRef = ref()

function onFooterAction(action) {
  if (action === 'export') {
    dtRef.value?.exportCSV()
  }
}

function badgeFor(result) {
  return result ? RESULT_TO_STATUS[result] ?? 'NR' : null
}
</script>

<template>
  <div class="preview-root">
    <div class="preview-header">
      <p class="preview-subtitle">
        Review the items that will be imported into the current checklist. Items that are not matched, or that are
        marked Not Reviewed in the file, are listed below the import preview and will not be imported.
      </p>
      <div class="preview-filter">
        <Checkbox
          input-id="updatedOnly"
          :model-value="updatedOnly"
          binary
          @update:model-value="emit('update:updatedOnly', $event)"
        />
        <label for="updatedOnly">Show only changed results</label>
      </div>
    </div>

    <div class="preview-table-wrapper">
      <DataTable
        ref="dtRef"
        :value="previewRows"
        export-filename="asset-stig-import-preview"
        scrollable
        scroll-height="flex"
        resizable-columns
        striped-rows
        :virtual-scroller-options="{ itemSize: 38 }"
        :pt="{ table: { style: 'table-layout: fixed; width: 100%' } }"
      >
        <Column field="ruleId" header="Rule" style="min-width: 130px" sortable />
        <Column field="title" header="Title" style="min-width: 220px" sortable>
          <template #body="{ data }">
            <span :title="data.title">{{ data.title }}</span>
          </template>
        </Column>
        <Column field="groupId" header="Group" style="width: 110px" sortable />
        <Column field="severity" header="Severity" style="width: 100px" sortable />
        <Column header="Current" style="width: 80px; text-align: center" :sort-field="r => r.currentResult ?? ''" sortable>
          <template #body="{ data }">
            <ResultBadge v-if="badgeFor(data.currentResult)" :status="badgeFor(data.currentResult)" />
            <span v-else>—</span>
          </template>
        </Column>
        <Column header="New" style="width: 80px; text-align: center" :sort-field="r => r.newResult ?? ''" sortable>
          <template #body="{ data }">
            <ResultBadge v-if="badgeFor(data.newResult)" :status="badgeFor(data.newResult)" />
            <span v-else>—</span>
          </template>
        </Column>
        <Column field="newDetail" header="New Detail" style="min-width: 200px">
          <template #body="{ data }">
            <span class="ellipsis" :title="data.newDetail">{{ data.newDetail }}</span>
          </template>
        </Column>
        <Column field="newComment" header="New Comment" style="min-width: 200px">
          <template #body="{ data }">
            <span class="ellipsis" :title="data.newComment">{{ data.newComment }}</span>
          </template>
        </Column>
        <Column field="newStatus" header="New Status" style="width: 110px" sortable>
          <template #body="{ data }">
            <span v-if="data.newStatus" class="status-pill">{{ data.newStatus }}</span>
            <span v-else class="status-empty">—</span>
          </template>
        </Column>
        <template #empty>
          <div class="preview-empty">
            <i class="pi pi-info-circle" />
            <span>No matched, reviewed rules to import.</span>
          </div>
        </template>
      </DataTable>
      <StatusFooter
        :total-count="previewRows.length"
        :show-refresh="false"
        :show-export="true"
        total-label="rules"
        total-icon="pi pi-list"
        @action="onFooterAction"
      />
    </div>

    <div v-if="notReviewed.length > 0 || unmatched.length > 0" class="excluded-grid">
      <div v-if="notReviewed.length > 0" class="excluded-card">
        <div class="excluded-header">
          <span class="pi pi-eye-slash" />
          <span>Parsed but Not Reviewed ({{ notReviewed.length }})</span>
        </div>
        <p class="excluded-desc">
          These rules are present in the file with result <code>notchecked</code> and will not be imported.
        </p>
        <div class="excluded-list">
          <span v-for="ruleId in notReviewed" :key="ruleId" class="excluded-chip">{{ ruleId }}</span>
        </div>
      </div>

      <div v-if="unmatched.length > 0" class="excluded-card">
        <div class="excluded-header">
          <span class="pi pi-times-circle" />
          <span>Unmatched in current STIG ({{ unmatched.length }})</span>
        </div>
        <p class="excluded-desc">
          These rule IDs are in the file but not in the current revision of this STIG, and will not be imported.
        </p>
        <div class="excluded-list">
          <span v-for="ruleId in unmatched" :key="ruleId" class="excluded-chip">{{ ruleId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-root {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  flex: 1;
  min-height: 0;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
}

.preview-subtitle {
  margin: 0;
  color: var(--color-text-dim);
  flex: 1;
  line-height: 1.4;
}

.preview-filter {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--color-text-dim);
  font-size: 0.9rem;
  flex-shrink: 0;
}

.preview-filter label { cursor: pointer; }

.preview-table-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text-dim);
  padding: 0.75rem 1rem;
}

.ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.excluded-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  flex-shrink: 0;
}

.excluded-grid > .excluded-card:only-child {
  grid-column: 1 / -1;
}

.excluded-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-background-light) 35%, transparent);
}

.excluded-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: var(--color-text-bright);
}

.excluded-header .pi {
  color: var(--color-text-dim);
}

.excluded-desc {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.85rem;
  line-height: 1.4;
}

.excluded-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  max-height: 7rem;
  overflow-y: auto;
}

.excluded-chip {
  font-size: 0.8rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--color-background-darkest);
  color: var(--color-text-dim);
  border: 1px solid var(--color-border-default);
  font-family: ui-monospace, monospace;
}

.status-pill {
  display: inline-block;
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  background: var(--color-background-darkest);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  font-size: 0.78rem;
  text-transform: capitalize;
}

.status-empty {
  color: var(--color-text-dim);
}
</style>
