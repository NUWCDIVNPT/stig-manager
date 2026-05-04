<script setup>
import lineHeightDown from '../../assets/line-height-down.svg'
import lineHeightUp from '../../assets/line-height-up.svg'
import { useGridDensity } from '../../shared/composables/useGridDensity.js'

const props = defineProps({
  gridKey: {
    type: String,
    required: true,
  },
  min: {
    type: Number,
    default: 1,
  },
  max: {
    type: Number,
    default: 10,
  },
  label: {
    type: String,
    default: 'Density',
  },
  defaultLineClamp: {
    type: Number,
    default: 1,
  },
})

const { lineClamp, increaseRowHeight, decreaseRowHeight } = useGridDensity(props.gridKey, props.defaultLineClamp, 12, 24)
</script>

<template>
  <div class="density-controls">
    <span class="density-controls__label">{{ label }}</span>
    <button
      type="button"
      class="density-controls__btn"
      :disabled="lineClamp <= min"
      title="Decrease row height"
      @click="decreaseRowHeight"
    >
      <img :src="lineHeightDown" alt="Decrease row height">
    </button>
    <button
      type="button"
      class="density-controls__btn"
      :disabled="lineClamp >= max"
      title="Increase row height"
      @click="increaseRowHeight"
    >
      <img :src="lineHeightUp" alt="Increase row height">
    </button>
  </div>
</template>

<style scoped>
.density-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.3rem 0.2rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  height: 2.42rem;
}

.density-controls__label {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--color-text-bright);
  margin-right: 0.2rem;
}

.density-controls__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background-light) 25%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 40%, transparent);
  border-radius: 5px;
  margin: 0 0.1rem;
  width: 2.1rem;
  height: 2.1rem;
  padding: 0;
  cursor: pointer;
  opacity: 0.9;
}

.density-controls__btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-default);
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
}

.density-controls__btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.density-controls__btn img {
  width: 15px;
  height: 15px;
}
</style>
