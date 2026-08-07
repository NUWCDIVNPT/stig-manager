<script setup>
import KeyValueTable from '../common/KeyValueTable.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})
</script>

<template>
  <KeyValueTable
    title="OS"
    :rows="rows"
    key-header="Key"
    value-header="Value"
    value-align="left"
    noun="key"
    export-filename="appinfo-nodejs-os"
  />
</template>
