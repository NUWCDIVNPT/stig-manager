<script setup>
import Button from 'primevue/button'
import { computed } from 'vue'

const props = defineProps({
  // Left side controls
  showRefresh: {
    type: Boolean,
    default: false,
  },
  showExport: {
    type: Boolean,
    default: true,
  },
  refreshLoading: {
    type: Boolean,
    default: false,
  },

  // Info boxes configuration
  // Array of objects: { icon?: string, value: string|number, label?: string, tooltip?: string }
  infoBoxes: {
    type: Array,
    default: () => [],
  },

  // Item count configuration (shown as rightmost info box)
  itemCount: {
    type: Number,
    required: true,
  },
  itemCountIcon: {
    type: String,
    default: 'pi pi-list',
  },
  itemCountLabel: {
    type: String,
    default: 'rows',
  },

  // Selection count (optional - shown when items are selected)
  selectedCount: {
    type: Number,
    default: 0,
  },
  showSelection: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['refresh', 'export'])

function handleRefresh() {
  emit('refresh')
}

function handleExport() {
  emit('export')
}

const allInfoBoxes = computed(() => {
  const boxes = [...props.infoBoxes]

  // Add selection count if enabled and items are selected
  if (props.showSelection && props.selectedCount > 0) {
    boxes.push({
      icon: 'pi pi-check-square',
      value: props.selectedCount,
      label: 'selected',
      isSelection: true,
    })
  }

  // Always add item count as the last box
  boxes.push({
    icon: props.itemCountIcon,
    value: props.itemCount,
    label: props.itemCountLabel,
    isItemCount: true,
  })

  return boxes
})
</script>

<template>
  <div class="sm-status-footer">
    <div class="sm-status-footer__left">
      <Button
        v-if="showRefresh"
        icon="pi pi-refresh"
        text
        rounded
        :loading="refreshLoading"
        :disabled="refreshLoading"
        class="sm-status-footer__button"
        aria-label="Refresh data"
        @click="handleRefresh"
      />
      <Button
        v-if="showExport"
        icon="pi pi-download"
        text
        rounded
        class="sm-status-footer__button sm-status-footer__button--export"
        aria-label="Export to CSV"
        @click="handleExport"
      >
        <span class="sm-status-footer__button-label">CSV</span>
      </Button>
    </div>

    <div class="sm-status-footer__right">
      <div
        v-for="box in allInfoBoxes"
        :key="`${box.label}-${box.value}`"
        class="sm-status-footer__info-box"
        :class="{
          'sm-status-footer__info-box--item-count': box.isItemCount,
          'sm-status-footer__info-box--selection': box.isSelection,
        }"
        :title="box.tooltip"
      >
        <i
          v-if="box.icon"
          class="sm-status-footer__info-icon"
          :class="[box.icon]"
          aria-hidden="true"
        />
        <span class="sm-status-footer__info-value">{{ box.value }}</span>
        <span v-if="box.label" class="sm-status-footer__info-label">{{ box.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sm-status-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.75rem;
  margin: 0;
  width: 100%;
  min-height: 2.25rem;
  background: var(--color-surface-subtle);
  border-top: 1px solid var(--color-border-subtle);
}

.sm-status-footer__left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.sm-status-footer__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Button styles */
.sm-status-footer__button {
  height: 1.75rem;
  width: 1.75rem;
  padding: 0;
  color: var(--color-text-secondary);
}

.sm-status-footer__button:hover {
  color: var(--color-primary-highlight);
  background: var(--color-button-hover-bg);
}

:deep(.sm-status-footer__button .p-button-label) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.sm-status-footer__button-label {
  font-weight: 600;
  margin-left: 0.25rem;
}

/* Export button with label */
.sm-status-footer__button--export {
  width: auto;
  padding: 0 0.5rem;
}

/* Info box styles */
.sm-status-footer__info-box {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  background: var(--color-surface-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 0.25rem;
  color: var(--color-text-primary);
}

.sm-status-footer__info-box--item-count {
  background: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary-highlight) 15%, transparent);
}

.sm-status-footer__info-box--selection {
  background: color-mix(in srgb, var(--color-selection-green) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-selection-green) 15%, transparent);
}

.sm-status-footer__info-icon {
  color: var(--color-primary-highlight);
}

.sm-status-footer__info-box--selection .sm-status-footer__info-icon {
  color: var(--color-selection-green);
}

.sm-status-footer__info-value {
  font-weight: 600;
  color: var(--color-text-bright);
}

.sm-status-footer__info-label {
  color: var(--color-text-muted);
  text-transform: lowercase;
}
</style>
