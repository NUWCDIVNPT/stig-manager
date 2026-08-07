<script setup>
import KeyValueTable from '../common/KeyValueTable.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})
</script>

<template>
  <KeyValueTable
    title="Memory"
    :rows="rows"
    key-header="Key"
    value-header="Value"
    noun="key"
    export-filename="appinfo-nodejs-memory"
  />
</template>
