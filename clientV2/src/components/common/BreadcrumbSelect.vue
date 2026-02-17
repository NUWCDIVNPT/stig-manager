<script setup>
import Select from 'primevue/select'

defineProps({
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
})

defineEmits(['update:modelValue'])

// Pass-through styles to override global PT inline styles
const selectPt = {
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
    },
  },
}
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
    class="breadcrumb-select"
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
</style>
