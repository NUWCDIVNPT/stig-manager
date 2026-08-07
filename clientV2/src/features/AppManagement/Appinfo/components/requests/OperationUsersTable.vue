<script setup>
import KeyValueTable from '../common/KeyValueTable.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})
</script>

<template>
  <KeyValueTable
    title="User requests"
    :rows="rows"
    key-header="Username"
    value-header="Requests"
    noun="user"
    export-filename="appinfo-operation-users"
  />
</template>
