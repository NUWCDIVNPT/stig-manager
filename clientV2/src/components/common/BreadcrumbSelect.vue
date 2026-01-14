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
// Note: fontSize is inherited from --breadcrumb-font-size CSS variable
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
      color: '#e4e4e7',
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

/* Inherit font-size from --breadcrumb-font-size CSS variable (defined in style.css :root) */
:deep(.p-select-label) {
  font-size: var(--breadcrumb-font-size);
}

:deep(.p-select-label:hover) {
  text-decoration: underline;
}

:deep(.p-select-dropdown) {
  color: #6b7280;
  width: auto;
  padding-left: 0.25rem;
}

:deep(.p-select-dropdown .p-icon) {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
