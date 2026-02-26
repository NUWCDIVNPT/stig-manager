<script setup>
import Select from 'primevue/select'
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
  options: {
    type: Array,
    default: () => [],
  },
  optionLabel: {
    type: String,
    default: 'label',
  },
  optionValue: {
    type: String,
    default: 'value',
  },
  placeholder: {
    type: String,
    default: '',
  },
  pickerOnly: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])

// Pass-through styles to override global PT inline styles
const selectPt = computed(() => ({
  root: {
    style: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      border: 'none',
      width: 'auto',
      boxShadow: 'none',
    },
  },
  label: {
    style: {
      padding: '0',
      fontWeight: '600',
      color: 'var(--color-text-primary)',
      background: 'transparent',
      ...(props.pickerOnly ? { display: 'none' } : {}),
    },
  },
}))
</script>

<template>
  <Select
    :model-value="modelValue"
    :options="options"
    :option-label="optionLabel"
    :option-value="optionValue"
    :placeholder="placeholder"
    :pt="selectPt"
    :pt-options="{ mergeProps: false }"
    class="breadcrumb-select" :class="[{ 'breadcrumb-select--picker-only': pickerOnly }]"
    panel-class="breadcrumb-select-panel"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<style scoped>
.breadcrumb-select {
  display: inline-flex;
  align-items: center;
}

:deep(.p-select-label) {
  font-size: 1.2rem;
}

:deep(.p-select-label:hover) {
  text-decoration: underline;
}

:deep(.p-select-dropdown) {
  color: var(--color-text-dim);
  width: auto;
  padding-left: 0.25rem;
}

:deep(.p-select-dropdown .p-icon) {
  width: 0.75rem;
  height: 0.75rem;
}

/* Picker-only mode: chevron rendered as a small interactive pill */
.breadcrumb-select--picker-only {
  margin-left: 0.15rem;
}

.breadcrumb-select--picker-only :deep(.p-select-dropdown) {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
  border: 1px solid var(--color-border-default);
  border-radius: 0.25rem;
  padding: 0.15rem 0.3rem;
  transition: background-color 0.15s, border-color 0.15s;
}

.breadcrumb-select--picker-only:hover :deep(.p-select-dropdown) {
  background-color: var(--color-bg-hover-strong);
  border-color: var(--color-text-dim);
}

.breadcrumb-select--picker-only :deep(.p-select-dropdown .p-icon) {
  width: 0.65rem;
  height: 0.65rem;
}
</style>
