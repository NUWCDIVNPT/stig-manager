<script setup>
import KeyValueTable from '../common/KeyValueTable.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})
</script>

<template>
  <KeyValueTable
    title="Client requests"
    :rows="rows"
    key-header="Client"
    value-header="Requests"
    noun="client"
    export-filename="appinfo-operation-clients"
  />
</template>
