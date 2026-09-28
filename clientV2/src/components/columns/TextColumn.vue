<script setup>
import Column from 'primevue/column'
import HighlightText from '../common/HighlightText.vue'

// Plain text column whose cell highlights the grid's search term.
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
      <HighlightText :text="slotProps.data[slotProps.field]" :term="searchTerm" />
    </template>
  </Column>
</template>
