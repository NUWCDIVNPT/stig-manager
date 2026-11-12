<script setup>
import CollectionTableBase from './CollectionTableBase.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  selectedCollectionId: { type: String, default: null },
})

const emit = defineEmits(['update:selectedCollectionId'])

const COLUMNS = [
  { field: 'collectionId', header: 'ID', type: 'string', hidden: true },
  { field: 'state', header: 'State', type: 'string' },
  { field: 'assets', header: 'Assets', type: 'number' },
  { field: 'assetsDisabled', header: 'Assets Disabled', type: 'number' },
  { field: 'assetsTotal', header: 'Assets Total', type: 'number', hidden: true },
  { field: 'uniqueStigs', header: 'STIGs', type: 'number' },
  { field: 'stigAssignments', header: 'Assignments', type: 'number' },
  { field: 'rules', header: 'Rules', type: 'number' },
  { field: 'reviews', header: 'Reviews', type: 'number' },
  { field: 'reviewsDisabled', header: 'Reviews Disabled', type: 'number' },
  { field: 'reviewsTotal', header: 'Reviews Total', type: 'number', hidden: true },
  { field: 'countOfGrants', header: 'Grants', type: 'number' },
]
</script>

<template>
  <CollectionTableBase
    title="Overview"
    :rows="rows"
    :columns="COLUMNS"
    :selected-collection-id="selectedCollectionId"
    export-filename="appinfo-collections-overview"
    @update:selected-collection-id="emit('update:selectedCollectionId', $event)"
  />
</template>
