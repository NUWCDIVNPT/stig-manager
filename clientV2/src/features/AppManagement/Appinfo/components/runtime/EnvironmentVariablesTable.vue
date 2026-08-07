<script setup>
import KeyValueTable from '../common/KeyValueTable.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  title: { type: String, default: 'Environment' },
})
</script>

<template>
  <KeyValueTable
    :title="title"
    :rows="rows"
    key-header="Variable"
    value-header="Value"
    value-align="left"
    noun="item"
    export-filename="appinfo-nodejs-environment"
  />
</template>
