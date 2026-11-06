<script setup>
import Column from 'primevue/column'
import { TOOLTIPS } from '../../shared/lib/tooltips.js'
import HighlightText from '../common/HighlightText.vue'

// Revision string column. Rows whose Collection default revision is pinned
// (`revisionPinned`) carry a pin glyph after the string, as the legacy client did.
defineProps({
  field: {
    type: String,
    default: 'revisionStr',
  },
  header: {
    type: String,
    default: 'Revision',
  },
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
        <span
          v-if="slotProps.data.revisionPinned"
          class="icon-pin revision-pin"
          role="img"
          aria-label="Pinned Revision"
          :title="TOOLTIPS.pinnedRevision"
        />
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


.revision-pin {
  color: var(--color-text-dim);
}
</style>
