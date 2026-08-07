<script setup>
import KeyValueTable from '../common/KeyValueTable.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})
</script>

<template>
  <KeyValueTable
    title="Status"
    :rows="rows"
    key-header="Variable"
    value-header="Value"
    noun="variable"
    export-filename="appinfo-mysql-status"
  />
</template>
