<script setup>
import Column from 'primevue/column'
import { durationToNow } from '../../shared/lib.js'

defineProps({
  field: String,
  header: String,
  tooltipX: String,
})
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      {{ durationToNow(slotProps.data[slotProps.field]) || '-' }}
      {{ tooltipX }}
    </template>
  </Column>
</template>

<style scoped>
</style>
