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
  isLink: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])

const isValidSelection = computed(() => {
  if (props.modelValue == null) { return true }
  if (props.options?.length === 0) { return true } // Assume valid while options are still loading
  return props.options.some(opt => String(opt[props.optionValue]) === String(props.modelValue))
})

const displayLabel = computed(() => {
  if (props.modelValue == null) { return props.placeholder }

  if (props.options?.length === 0) {
    return props.modelValue // Display raw value plain while loading
  }

  const match = props.options.find(opt => String(opt[props.optionValue]) === String(props.modelValue))
  if (match) {
    return match[props.optionLabel]
  }

  return `Unknown (${props.modelValue})`
})

// Pass-through styles to override global PT inline styles
const selectPt = computed(() => {
  const textColor = !isValidSelection.value
    ? 'var(--color-danger)'
    : props.isLink
      ? 'var(--color-primary-highlight)'
      : 'var(--color-text-primary)'

  return {
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
        fontSize: '1.2rem',
        color: textColor,
        background: 'transparent',
        ...(props.pickerOnly ? { display: 'none' } : {}),
      },
    },
  }
})
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
    filter
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #value>
      <div v-if="modelValue != null" class="breadcrumb-select-value" :class="{ 'is-invalid': !isValidSelection }">
        <i v-if="!isValidSelection" class="pi pi-exclamation-triangle" style="margin-right: 0.35rem;" />
        <span>{{ displayLabel }}</span>
      </div>
      <span v-else>
        {{ placeholder }}
      </span>
    </template>
  </Select>
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

.breadcrumb-select-value {
  display: flex;
  align-items: center;
}

.is-invalid {
  color: var(--color-danger);
  font-weight: 600;
}
</style>
