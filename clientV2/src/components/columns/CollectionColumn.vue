<script setup>
import Column from 'primevue/column'
import collectionColorIcon from '../../assets/collection-color.svg'
import shieldGreenCheck from '../../assets/shield-green-check.svg'
import HighlightText from '../common/HighlightText.vue'
import RowLinkIcon from '../common/RowLinkIcon.vue'

defineProps({
  field: String,
  header: String,
  searchTerm: {
    type: String,
    default: '',
  },
  // (row) => route location for each icon link, or null for no link
  shieldTo: {
    type: Function,
    default: null,
  },
  collectionIconTo: {
    type: Function,
    default: null,
  },
})
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-info">
          <HighlightText :text="slotProps.data.collectionName" :term="searchTerm" />
        </div>
        <RowLinkIcon
          v-if="collectionIconTo"
          :to="collectionIconTo(slotProps.data)"
          :icon="collectionColorIcon"
          title="Go to Collection"
          alt="Collection"
        />
        <RowLinkIcon
          v-if="shieldTo"
          :to="shieldTo(slotProps.data)"
          :icon="shieldGreenCheck"
          title="Open Collection"
          alt="Review"
        />
      </div>
    </template>
  </Column>
</template>
