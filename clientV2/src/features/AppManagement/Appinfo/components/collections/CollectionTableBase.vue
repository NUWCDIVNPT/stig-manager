<script setup>
import { computed } from 'vue'
import ReportTableBase from '../common/ReportTableBase.vue'

const props = defineProps({
  title: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  /** [{ field, header, type: 'number'|'string'|'boolean', hidden?: true }] */
  columns: { type: Array, required: true },
  selectedCollectionId: { type: String, default: null },
  exportFilename: { type: String, default: 'appinfo-collections' },
  frozenName: { type: Boolean, default: false },
  tableMinWidth: { type: String, default: null },
})

const emit = defineEmits(['update:selectedCollectionId'])

// Stable identity: a fresh literal per render would rebuild the search columns on every row click
const keyColumn = computed(() => ({ field: 'name', header: 'Collection', width: '14rem', frozen: props.frozenName }))

const selectedRow = computed({
  get: () => props.rows.find(r => r.collectionId === props.selectedCollectionId) ?? null,
  set: value => emit('update:selectedCollectionId', value?.collectionId ?? null),
})

function rowClass(data) {
  return data.state === 'disabled' ? 'collection-row-disabled' : null
}
</script>

<template>
  <ReportTableBase
    searchable
    :title="title"
    :rows="rows"
    :columns="columns"
    :key-column="keyColumn"
    data-key="collectionId"
    sort-field="name"
    :export-filename="exportFilename"
    noun="collection"
    :table-min-width="tableMinWidth"
    column-toggle
    selectable
    :selection="selectedRow"
    :row-class="rowClass"
    @update:selection="selectedRow = $event"
  />
</template>

<style>
/* row-class lands inside the DataTable child component, so this cannot be scoped */
.collection-row-disabled > td {
  color: var(--color-text-error) !important;
  font-style: italic;
}

.collection-row-disabled .dim-value {
  color: var(--color-text-error) !important;
}
</style>
