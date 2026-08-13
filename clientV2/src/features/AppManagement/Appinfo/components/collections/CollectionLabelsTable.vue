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
  { field: 'collectionLabels', header: 'Labels', type: 'number' },
  { field: 'labeledAssets', header: 'Labeled', type: 'number' },
  { field: 'assetLabels', header: 'Tags', type: 'number' },
]
</script>

<template>
  <CollectionTableBase
    title="Labels"
    :rows="rows"
    :columns="COLUMNS"
    :selected-collection-id="selectedCollectionId"
    export-filename="appinfo-collections-labels"
    @update:selected-collection-id="emit('update:selectedCollectionId', $event)"
  />
</template>
