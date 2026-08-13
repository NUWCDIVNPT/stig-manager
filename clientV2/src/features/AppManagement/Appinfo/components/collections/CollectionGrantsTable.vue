<script setup>
import ReportTableBase from '../common/ReportTableBase.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  collectionName: { type: String, default: '' },
})

const COLUMNS = [
  { field: 'role', header: 'Role', type: 'string', width: '8rem' },
  { field: 'ruleCountRw', header: 'Rules RW', type: 'number' },
  { field: 'ruleCountR', header: 'Rules R', type: 'number' },
  { field: 'ruleCountNone', header: 'Rules None', type: 'number' },
  { field: 'uniqueAssets', header: 'Assets', type: 'number' },
  { field: 'uniqueAssetsDisabled', header: 'Assets Disabled', type: 'number' },
  { field: 'uniqueStigs', header: 'STIGs', type: 'number' },
  { field: 'uniqueStigsDisabled', header: 'STIGs Disabled', type: 'number' },
]
</script>

<template>
  <ReportTableBase
    title="Grants"
    :rows="rows"
    :columns="COLUMNS"
    :key-column="{ field: 'granteeName', header: 'Grantee', searchPlaceholder: 'Search grantee...', width: '14rem' }"
    :category-filter="{ field: 'role' }"
    data-key="grantId"
    sort-field="granteeName"
    export-filename="appinfo-collection-grants"
    noun="grant"
  >
    <template #title-extra>
      <template v-if="collectionName">
        <span class="title-sep">｜</span>
        <span class="title-summary">{{ collectionName }}</span>
      </template>
      <span v-else class="title-hint">Select a collection to display its grants</span>
    </template>
    <template #key-cell="{ data }">
      <span class="grantee-cell" :title="data.granteeName">
        <i :class="data.isGroup ? 'pi pi-users' : 'pi pi-user'" class="grantee-icon" />
        {{ data.granteeName }}
      </span>
    </template>
  </ReportTableBase>
</template>

<style scoped>
.grantee-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grantee-icon {
  color: var(--color-text-dim);
  font-size: 0.95rem;
  flex-shrink: 0;
}
</style>
