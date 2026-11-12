<script setup>
import Select from 'primevue/select'
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: String,
    default: null,
  },
  allowNone: {
    type: Boolean,
    default: false,
  },
  noneLabel: {
    type: String,
    default: '— None —',
  },
  excludeValue: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const NONE_SENTINEL = '__none__'

// Compact, matching the 2rem search box in the toolbar; shrinks with ellipsis.
const selectPt = {
  root: { style: 'height: 2rem; min-width: 8rem; max-width: 13rem; align-items: center; background-color: var(--color-background-light); border-color: var(--color-border-default);' },
  label: { style: 'padding: 0 0.5rem; font-size: var(--text-md); color: var(--color-text-primary);' },
  dropdown: { style: 'width: 1.75rem;' },
  option: { style: 'font-size: var(--text-md);' },
}

const selectOptions = computed(() => {
  const filtered = (props.options ?? [])
    .filter(opt => opt.revisionStr !== props.excludeValue)
    .map(opt => ({
      value: opt.revisionStr,
      label: opt.benchmarkDate ? `${opt.revisionStr} (${opt.benchmarkDate})` : opt.revisionStr,
    }))
  if (props.allowNone) {
    return [{ value: NONE_SENTINEL, label: props.noneLabel }, ...filtered]
  }
  return filtered
})

const selected = computed({
  get() {
    return props.modelValue ?? (props.allowNone ? NONE_SENTINEL : null)
  },
  set(value) {
    emit('update:modelValue', value === NONE_SENTINEL ? null : value)
  },
})
</script>

<template>
  <label class="revision-select">
    <span class="revision-select__label">{{ label }}</span>
    <Select
      v-model="selected"
      :options="selectOptions"
      option-label="label"
      option-value="value"
      :disabled="disabled"
      :pt="selectPt"
    />
  </label>
</template>

<style scoped>
.revision-select {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.revision-select__label {
  font-size: var(--text-md);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-dim);
  white-space: nowrap;
}
</style>
