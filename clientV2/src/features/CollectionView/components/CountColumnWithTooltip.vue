<script setup>
import Column from 'primevue/column'
import Popover from 'primevue/popover'
import { ref } from 'vue'

defineProps({
  field: String,
  header: String,
})

const popoverRef = ref()
const popoverItems = ref([])
let hideTimeout = null

function showPopover(event, items) {
  // Cancel any pending hide
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  popoverItems.value = items || []
  popoverRef.value.show(event)
}

function scheduleHide() {
  // Delay hiding to allow mouse to move to popover
  hideTimeout = setTimeout(() => {
    popoverRef.value.hide()
  }, 150)
}

function cancelHide() {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

function hidePopover() {
  cancelHide()
  popoverRef.value.hide()
}
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <span
        class="count-display"
        @mouseenter="showPopover($event, slotProps.data[slotProps.field])"
        @mouseleave="scheduleHide"
      >
        {{ Array.isArray(slotProps.data[slotProps.field]) ? slotProps.data[slotProps.field].length : slotProps.data[slotProps.field] }}
      </span>
      <Popover ref="popoverRef">
        <div
          class="popover-content"
          @mouseenter="cancelHide"
          @mouseleave="hidePopover"
        >
          <ul class="item-list">
            <li v-for="item in popoverItems" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>
      </Popover>
    </template>
  </Column>
</template>

<style scoped>
.count-display {
  cursor: default;
}

.popover-content {
  max-height: 300px;
  overflow-y: auto;
  font-size: 12px;
}

.item-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.item-list li {
  padding: 4px 8px;
  white-space: nowrap;
}

.item-list li:not(:last-child) {
  border-bottom: 1px solid var(--p-surface-border);
}
</style>
