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

const selectPt = {
  label: { style: { fontSize: '1.1rem' } },
  option: { style: { fontSize: '1.1rem' } },
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
      class="revision-select__dropdown"
      :pt="selectPt"
    />
  </label>
</template>

<style scoped>
.revision-select {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.revision-select__label {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-dim);
}

.revision-select__dropdown {
  min-width: 12rem;
}
</style>
