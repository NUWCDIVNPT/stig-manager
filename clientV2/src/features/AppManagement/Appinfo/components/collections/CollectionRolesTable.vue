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
  { field: 'restricted', header: 'Restricted', type: 'number' },
  { field: 'full', header: 'Full', type: 'number' },
  { field: 'manage', header: 'Manage', type: 'number' },
  { field: 'owner', header: 'Owner', type: 'number' },
]
</script>

<template>
  <CollectionTableBase
    title="Roles"
    :rows="rows"
    :columns="COLUMNS"
    :selected-collection-id="selectedCollectionId"
    export-filename="appinfo-collections-roles"
    @update:selected-collection-id="emit('update:selectedCollectionId', $event)"
  />
</template>
