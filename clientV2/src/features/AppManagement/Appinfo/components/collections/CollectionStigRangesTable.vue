<script setup>
import CollectionTableBase from './CollectionTableBase.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  selectedCollectionId: { type: String, default: null },
})

const emit = defineEmits(['update:selectedCollectionId'])

const COLUMNS = [
  { field: 'collectionId', header: 'ID', type: 'string', hidden: true },
  { field: 'state', header: 'State', type: 'string', hidden: true },
  { field: 'range00', header: '0', type: 'number' },
  { field: 'range01to05', header: '1–5', type: 'number' },
  { field: 'range06to10', header: '6–10', type: 'number' },
  { field: 'range11to15', header: '11–15', type: 'number' },
  { field: 'range16plus', header: '16+', type: 'number' },
]
</script>

<template>
  <CollectionTableBase
    title="STIG Assignment Ranges"
    :rows="rows"
    :columns="COLUMNS"
    :selected-collection-id="selectedCollectionId"
    export-filename="appinfo-collections-stig-ranges"
    @update:selected-collection-id="emit('update:selectedCollectionId', $event)"
  />
</template>
