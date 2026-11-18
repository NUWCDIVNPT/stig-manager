<script setup>
import Column from 'primevue/column'
import { durationToNow } from '../../shared/lib.js'
import { exportTimestamp } from '../../shared/lib/exportCells.js'
import { formatReviewDate } from '../../shared/lib/reviewFormUtils.js'

defineProps({
  field: String,
  header: String,
})
</script>

<template>
  <Column :field="field" :header="header" :export-value="exportTimestamp">
    <template #body="slotProps">
      <span :title="slotProps.data[slotProps.field] ? formatReviewDate(slotProps.data[slotProps.field]) : undefined">
        {{ durationToNow(slotProps.data[slotProps.field]) || '-' }}
      </span>
    </template>
  </Column>
</template>
