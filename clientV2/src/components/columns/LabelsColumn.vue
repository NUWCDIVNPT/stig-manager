<script setup>
import Column from 'primevue/column'
import LabelsRow from './LabelsRow.vue'

defineProps({
  field: String,
  header: String,
})
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <LabelsRow
        :labels="slotProps.data[slotProps.field]"
        compact
      />
    </template>
  </Column>
</template>
