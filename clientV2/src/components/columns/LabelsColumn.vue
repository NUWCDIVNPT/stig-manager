<script setup>
import Column from 'primevue/column'
import LabelsRow from './LabelsRow.vue'

defineProps({
  field: String,
  header: String,
  searchTerm: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <LabelsRow
        :labels="slotProps.data[slotProps.field]"
        :search-term="searchTerm"
        compact
      />
    </template>
  </Column>
</template>
