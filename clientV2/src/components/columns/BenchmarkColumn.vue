<script setup>
import Column from 'primevue/column'
import shieldGreenCheck from '../../assets/shield-green-check.svg'
import HighlightText from '../common/HighlightText.vue'

const props = defineProps({
  field: String,
  header: String,
  searchTerm: {
    type: String,
    default: '',
  },
  showShield: {
    type: Boolean,
    default: false,
  },
  onShieldClick: {
    type: Function,
    default: null,
  },
})

function handleShieldClick(rowData) {
  if (props.showShield && props.onShieldClick) {
    props.onShieldClick(rowData)
  }
}
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-info">
          <HighlightText :text="slotProps.data.benchmarkId" :term="searchTerm" />
        </div>
        <button
          v-if="showShield"
          type="button"
          class="shield-action"
          title="Open Benchmark Review"
          @click.stop="handleShieldClick(slotProps.data)"
        >
          <img :src="shieldGreenCheck" width="14" height="14" alt="Review">
        </button>
      </div>
    </template>
  </Column>
</template>
