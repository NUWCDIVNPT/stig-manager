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
  { field: 'range00', header: 'Range 0', type: 'number' },
  { field: 'range01to05', header: 'Range 1–5', type: 'number' },
  { field: 'range06to10', header: 'Range 6–10', type: 'number' },
  { field: 'range11to15', header: 'Range 11–15', type: 'number' },
  { field: 'range16plus', header: 'Range 16+', type: 'number' },
  { field: 'restricted', header: 'Restricted', type: 'number' },
  { field: 'full', header: 'Full', type: 'number' },
  { field: 'manage', header: 'Manage', type: 'number' },
  { field: 'owner', header: 'Owner', type: 'number' },
  { field: 'collectionLabels', header: 'Labels', type: 'number' },
  { field: 'labeledAssets', header: 'Labeled', type: 'number' },
  { field: 'assetLabels', header: 'Tags', type: 'number' },
  { field: 'detailEnabled', header: 'Detail Enabled', type: 'boolean' },
  { field: 'detailRequired', header: 'Detail Required', type: 'boolean' },
  { field: 'commentEnabled', header: 'Comment Enabled', type: 'boolean' },
  { field: 'commentRequired', header: 'Comment Required', type: 'boolean' },
  { field: 'canAccept', header: 'Can Accept', type: 'boolean' },
  { field: 'resetCriteria', header: 'Reset Criteria', type: 'string' },
  { field: 'minAcceptGrant', header: 'Accept Grant', type: 'string' },
]
</script>

<template>
  <CollectionTableBase
    title="All Fields"
    :rows="rows"
    :columns="COLUMNS"
    :selected-collection-id="selectedCollectionId"
    export-filename="appinfo-collections-all-fields"
    frozen-name
    table-min-width="220rem"
    @update:selected-collection-id="emit('update:selectedCollectionId', $event)"
  />
</template>
