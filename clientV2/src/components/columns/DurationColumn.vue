<script setup>
import Column from 'primevue/column'
import { durationToNow } from '../../shared/lib.js'
import { exportTimestamp } from '../../shared/lib/exportCells.js'

defineProps({
  field: String,
  header: String,
  tooltipX: String,
})
</script>

<template>
  <Column :field="field" :header="header" :export-value="exportTimestamp">
    <template #body="slotProps">
      {{ durationToNow(slotProps.data[slotProps.field]) || '-' }}
      {{ tooltipX }}
    </template>
  </Column>
</template>

<style scoped>
</style>
