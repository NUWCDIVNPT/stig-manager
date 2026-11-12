<script setup>
import Column from 'primevue/column'
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
  // (row) => route location for the shield link, or null for no link
  shieldTo: {
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
          <HighlightText :text="slotProps.data.benchmarkId" :term="searchTerm" />
        </div>
        <RowLinkIcon
          v-if="shieldTo"
          :to="shieldTo(slotProps.data)"
          :icon="shieldGreenCheck"
          title="Open Benchmark Review"
          alt="Review"
        />
      </div>
    </template>
  </Column>
</template>
