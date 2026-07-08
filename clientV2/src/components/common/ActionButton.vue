<script setup>
/**
 * A toolbar action for ActionToolbar: icon + label button. The icon string
 * may include `icon-green` / `icon-red` / `icon-blue` / `icon-grey` to color
 * it. Native attrs (`disabled`, `title`, `@click`, …) fall through to the
 * button. Trailing icons or images go in the slot instead of the icon prop.
 */
defineProps({
  icon: {
    type: String,
    default: null,
  },
  /** 'clear' renders the subdued clear-selection style. */
  variant: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <button type="button" class="action-btn" :class="variant ? `action-btn--${variant}` : null">
    <i v-if="icon" :class="icon" />
    <slot />
  </button>
</template>

<style scoped>
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-background-subtle);
  color: var(--color-text-bright);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.action-btn i.icon-green {
  color: var(--color-action-green);
}

.action-btn i.icon-red {
  color: var(--color-action-red);
}

.action-btn i.icon-blue {
  color: var(--color-action-blue);
}

.action-btn i.icon-grey {
  color: var(--color-text-dim);
}

.action-btn--clear {
  color: var(--color-text-primary);
}

.action-btn--clear:hover:not(:disabled) {
  background: var(--color-bg-hover);
}
</style>
