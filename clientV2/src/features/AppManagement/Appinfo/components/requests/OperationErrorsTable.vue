<script setup>
import KeyValueTable from '../common/KeyValueTable.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})
</script>

<template>
  <KeyValueTable
    title="Errors"
    :rows="rows"
    key-header="Code"
    value-header="Requests"
    noun="error"
    export-filename="appinfo-operation-errors"
  />
</template>
