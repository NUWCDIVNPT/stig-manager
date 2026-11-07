<script setup>
import Column from 'primevue/column'
import HighlightText from '../common/HighlightText.vue'
import PinnedRevisionIcon from '../common/PinnedRevisionIcon.vue'

// Revision string column; rows whose `revisionPinned` is set carry a pin glyph after the string.
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
      <span class="revision-cell">
        <HighlightText :text="slotProps.data[slotProps.field]" :term="searchTerm" />
        <PinnedRevisionIcon v-if="slotProps.data.revisionPinned" />
      </span>
    </template>
  </Column>
</template>

<style scoped>
.revision-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
