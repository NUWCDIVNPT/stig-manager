<script setup>
import Button from 'primevue/button'

defineProps({
  // Left side configuration (buttons, dividers)
  // Array of objects: { type: 'button'|'divider', icon?: string, label?: string, action?: string, loading?: boolean, disabled?: boolean, title?: string }
  leftItems: {
    type: Array,
    default: () => [],
  },

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

  // Right side configuration (info boxes)
  // Array of objects: { type: 'metric', value: string|number, label?: string, icon?: string, title?: string, variant?: 'default'|'highlight'|'selection' }
  rightItems: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['action', 'refresh', 'export'])

function handleAction(action) {
  if (action) {
    emit('action', action)
  }
}

function handleRefresh() {
  emit('refresh')
}

function handleExport() {
  emit('export')
}
</script>

<template>
  <div class="sm-status-footer">
    <div class="sm-status-footer__left">
      <!-- Standard Actions -->
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
        class="sm-status-footer__button sm-status-footer__button--has-label"
        aria-label="Export to CSV"
        @click="handleExport"
      >
        <span class="sm-status-footer__button-label">CSV</span>
      </Button>

      <!-- Configured Items -->
      <template v-for="(item, index) in leftItems" :key="index">
        <Button
          v-if="item.type === 'button'"
          :icon="item.icon"
          :loading="item.loading"
          :disabled="item.disabled"
          text
          rounded
          class="sm-status-footer__button"
          :class="{ 'sm-status-footer__button--has-label': item.label }"
          :aria-label="item.title || item.label"
          :title="item.title"
          @click="handleAction(item.action)"
        >
          <span v-if="item.label" class="sm-status-footer__button-label">{{ item.label }}</span>
        </Button>
        <div v-else-if="item.type === 'divider'" class="sm-status-footer__divider" />
      </template>

      <!-- Custom content slot for left side -->
      <slot name="left-custom" />
    </div>

    <div class="sm-status-footer__right">
      <!-- Custom content slot for right side -->
      <slot name="right-custom" />

      <div
        v-for="(item, index) in rightItems"
        :key="index"
        class="sm-status-footer__info-box"
        :class="[`sm-status-footer__info-box--${item.variant || 'default'}`]"
        :title="item.title"
      >
        <i
          v-if="item.icon"
          class="sm-status-footer__info-icon"
          :class="[item.icon]"
          aria-hidden="true"
        />
        <span class="sm-status-footer__info-value">{{ item.value }}</span>
        <span v-if="item.label" class="sm-status-footer__info-label">{{ item.label }}</span>
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

.sm-status-footer__divider {
  width: 1px;
  height: 1.25rem;
  background-color: var(--color-border-subtle);
  margin: 0 0.25rem;
}

/* Button styles */
.sm-status-footer__button {
  height: 1.75rem;
  width: 1.75rem;
  padding: 0;
  color: var(--color-text-secondary);
}

.sm-status-footer__button--has-label {
  width: auto;
  padding: 0 0.5rem;
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

.sm-status-footer__info-box--highlight {
  background: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary-highlight) 15%, transparent);
}

.sm-status-footer__info-box--selection {
  background: color-mix(in srgb, var(--color-selection-green) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-selection-green) 15%, transparent);
}

.sm-status-footer__info-box--selection .sm-status-footer__info-icon {
  color: var(--color-selection-green);
}

.sm-status-footer__info-icon {
  color: var(--color-primary-highlight);
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
