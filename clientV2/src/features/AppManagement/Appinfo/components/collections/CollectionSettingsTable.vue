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
  { field: 'detailEnabled', header: 'Detail Enabled', type: 'string' },
  { field: 'detailRequired', header: 'Detail Required', type: 'string' },
  { field: 'commentEnabled', header: 'Comment Enabled', type: 'string' },
  { field: 'commentRequired', header: 'Comment Required', type: 'string' },
  { field: 'canAccept', header: 'Can Accept', type: 'boolean' },
  { field: 'resetCriteria', header: 'Reset Criteria', type: 'string' },
  { field: 'minAcceptGrant', header: 'Accept Grant', type: 'string' },
]
</script>

<template>
  <CollectionTableBase
    title="Settings"
    :rows="rows"
    :columns="COLUMNS"
    :selected-collection-id="selectedCollectionId"
    export-filename="appinfo-collections-settings"
    @update:selected-collection-id="emit('update:selectedCollectionId', $event)"
  />
</template>
