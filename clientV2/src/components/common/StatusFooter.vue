<script setup>
import Button from 'primevue/button'
import { computed, useSlots } from 'vue'

const props = defineProps({
  // Standard Actions
  showRefresh: {
    type: Boolean,
    default: true,
  },
  refreshLoading: {
    type: Boolean,
    default: false,
  },
  showExport: {
    type: Boolean,
    default: true,
  },
  selectedItems: {
    type: [Array, Object],
    default: () => [],
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  showSelected: {
    type: Boolean,
    default: false,
  },
  /**
   * Custom left actions.
   * Structure: {
   *   key: string, (required) used for the action event name
   *   icon: string, (required)
   *   label?: string,
   *   title?: string,
   *   disabled?: boolean,
   *   loading?: boolean
   * }
   */
  actions: {
    type: Array,
    default: () => [],
  },

  /**
   * Custom right metrics.
   * Structure: {
   *   key: string, (required)
   *   value: string|number, (required)
   *   label?: string,
   *   icon?: string,
   *   title?: string,
   *   class?: string|object,
   *   style?: string|object
   * }
   */
  metrics: {
    type: Array,
    default: () => [],
  },

})

const emit = defineEmits(['action'])
const slots = useSlots()

const resolvedActions = computed(() => {
  const base = [] // might not need this, not sure yet.

  // Add standard refresh if enabled
  if (props.showRefresh) {
    base.push({
      key: 'refresh',
      icon: 'pi pi-refresh',
      ariaLabel: 'Refresh data',
      loading: props.refreshLoading,
      disabled: props.refreshLoading,
    })
  }

  // Add standard export if enabled
  if (props.showExport) {
    base.push({
      key: 'export',
      icon: 'pi pi-download',
      label: 'CSV',
      ariaLabel: 'Export to CSV',
    })
  }

  return [...base, ...props.actions]
})

const selectedCount = computed(() => {
  if (Array.isArray(props.selectedItems)) {
    return props.selectedItems.length
  }
  return props.selectedItems ? 1 : 0
})

function onActionClick(action) {
  emit('action', action.key)
}
</script>

<template>
  <div class="status-footer">
    <div class="status-footer__left">
      <Button
        v-for="action in resolvedActions"
        :key="action.key"
        :icon="action.icon"
        :loading="action.loading"
        :disabled="action.disabled"
        text
        class="status-footer__button"
        :class="{ 'status-footer__button--has-label': action.label }"
        :title="action.title"
        :label="action.label"
        @click="onActionClick(action)"
      />

      <template v-if="slots['left-extra']">
        <div class="status-footer__divider" />
        <slot name="left-extra" />
      </template>
    </div>

    <div class="status-footer__right">
      <div
        v-for="metric in metrics"
        :key="metric.key"
        class="status-footer__info-box"
        :class="[metric.class]"
        :style="metric.style"
        :title="metric.title"
      >
        <i
          v-if="metric.icon"
          class="status-footer__info-icon"
          :class="[metric.icon]"
          aria-hidden="true"
        />
        <span class="status-footer__info-value">{{ metric.value }}</span>
        <span v-if="metric.label" class="status-footer__info-label">{{ metric.label }}</span>
      </div>

      <div
        v-if="showSelected"
        class="status-footer__info-box status-footer__metric-selected"
        title="Selected rows"
      >
        <i class="status-footer__info-icon pi pi-check-square" aria-hidden="true" />
        <span class="status-footer__info-value">{{ selectedCount }}</span>
        <span class="status-footer__info-label">selected</span>
      </div>

      <div
        class="status-footer__info-box status-footer__metric-total"
        title="Total rows"
      >
        <i class="status-footer__info-icon pi pi-list" aria-hidden="true" />
        <span class="status-footer__info-value">{{ totalCount }}</span>
        <span class="status-footer__info-label">rows</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-footer {
  --color-selection-green: rgb(34, 197, 94);

  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0.4rem;
  background: var(--color-surface-subtle);
}

.status-footer__left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-footer__divider {
  width: 1px;
  height: 1.25rem;
  background-color: var(--color-border-subtle);
  margin: 0 0.25rem;
}

.status-footer__right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-footer__button {
  height: 1.5rem;
  width: 1.75rem;
  color: var(--color-text-secondary);
}

.status-footer__button--has-label {
  width: auto;
  padding: 0 0.5rem;
}

.status-footer__button:hover {
  color: var(--color-primary-highlight);
  background: var(--color-button-hover-bg);
}

.status-footer__info-box {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.25rem;
  background: var(--color-surface-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 0.125rem;
  color: var(--color-text-primary);
}

.status-footer__metric-total {
  background: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
}

.status-footer__metric-selected {
  background: color-mix(in srgb, var(--color-selection-green) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-selection-green) 8%, transparent);
}

.status-footer__metric-selected .status-footer__info-icon {
  color: var(--color-selection-green);
}

.status-footer__info-icon {
  color: var(--color-primary-highlight);
}

.status-footer__info-value {
  font-weight: 600;
  color: var(--color-text-bright);
}

.status-footer__info-label {
  color: var(--color-text-muted);
  text-transform: lowercase;
}
</style>
