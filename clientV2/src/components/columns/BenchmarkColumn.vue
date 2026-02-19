<script setup>
import Column from 'primevue/column'

import { defineProps } from 'vue'

import shieldGreenCheck from '../../assets/shield-green-check.svg'

const props = defineProps({
  field: String,
  header: String,
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
          {{ slotProps.data.benchmarkId }}
        </div>
        <button
          v-if="showShield"
          type="button"
          class="shield-action"
          title="Open Asset Review"
          @click.stop="handleShieldClick(slotProps.data)"
        >
          <img :src="shieldGreenCheck" width="14" height="14" alt="Review">
        </button>
      </div>
    </template>
  </Column>
</template>

<style scoped>
.sm-grid-cell-with-toolbar {
  display: flex;
  align-items: center;
}

.sm-info {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sm-static-width {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shield-action {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.15s, transform 0.15s, background-color 0.15s;
}

.shield-action:hover {
  opacity: 1;
  transform: scale(1.2);
  background-color: var(--color-button-hover-bg);
}

.shield-action img {
  pointer-events: none;
}
</style>
