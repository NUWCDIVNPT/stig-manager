<script setup>
import Column from 'primevue/column'
import CoraPctBadge from '../common/CoraPctBadge.vue'

defineProps({
  field: String,
  header: String,
})
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <div style="display: flex; justify-content: center;">
        <CoraPctBadge
          v-if="slotProps.data.coraFull"
          :risk-rating="slotProps.data.coraFull.riskRating"
          :weighted-avg="slotProps.data.coraFull.weightedAvg"
        />
      </div>
    </template>
  </Column>
</template>
