<script setup>
import Checkbox from 'primevue/checkbox'
import MultiSelect from 'primevue/multiselect'
import { computed } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    required: true,
  },
  modelValue: {
    required: false,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const isActive = computed(() => {
  return Array.isArray(props.modelValue) && props.modelValue.length > 0
})

// PrimeVue's own toggle-all checkbox has no partial state, so the header is
// rendered here with a Checkbox that reports indeterminate for a subset.
const allSelected = computed(() => {
  if (!isActive.value) {
    return false
  }
  const selected = new Set(props.modelValue)
  return props.options.every(o => selected.has(o.value))
})

function onToggleAll(checked) {
  emit('update:modelValue', checked ? props.options.map(o => o.value) : [])
}

function onToggle(val) {
  emit('update:modelValue', val)
}

const columnFilterPT = {
  root: { class: 'column-filter-select' },
  label: { style: 'display: none;' },
  dropdown: { style: 'width: auto; padding: 0.2rem 0.2rem;' },
  panel: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.6); min-width: 100px;' },
  item: ({ context }) => ({
    style: {
      color: context.selected ? 'var(--color-text-bright)' : 'var(--color-text-primary)',
      padding: '0.2rem 0.5rem',
      fontSize: '0.85rem',
      transition: 'background 0.12s',
      background: context.focused ? 'var(--color-background-light)' : 'transparent',
    },
  }),
  itemCheckboxContainer: { style: 'margin-right: 0.4rem;' },
  filterInput: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border: 1px solid var(--color-border-default); padding: 0.2rem; font-size: 0.85rem;' },
  filterIcon: { style: 'color: var(--color-text-dim); width: 0.8rem; height: 0.8rem;' },
}
</script>

<template>
  <MultiSelect
    :model-value="modelValue"
    :options="options"
    option-label="label"
    option-value="value"
    :pt="columnFilterPT"
    display="chip"
    :show-toggle-all="false"
    @update:model-value="onToggle"
  >
    <template #dropdownicon>
      <i class="pi pi-filter" :class="{ 'filter-active': isActive }" />
    </template>
    <template #header>
      <label class="column-filter__toggle-all">
        <Checkbox
          :model-value="allSelected"
          :indeterminate="isActive && !allSelected"
          :binary="true"
          @update:model-value="onToggleAll"
        />
        <span>Select All</span>
      </label>
    </template>
    <template #option="slotProps">
      <div class="column-filter__option">
        <slot name="option" :option="slotProps.option">
          <img v-if="slotProps.option.image" :src="slotProps.option.image" alt="" class="column-filter__option-img">
          <i v-else-if="slotProps.option.icon" :class="slotProps.option.icon" class="column-filter__option-icon" />
          <span v-else class="column-filter__option-text">{{ slotProps.option.label }}</span>
        </slot>
      </div>
    </template>
  </MultiSelect>
</template>

<style scoped>
.column-filter-select {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  width: auto;
}

.column-filter-select.p-focus {
  outline: none !important;
}

.column-filter-select:hover {
  background: color-mix(in srgb, var(--color-background-light) 40%, transparent);
  border-radius: 4px;
}

.pi-filter {
  font-size: 0.95rem;
  color: var(--color-text-dim);
  opacity: 0.8;
  transition: opacity 0.2s, color 0.2s;
  margin-top: 3px;
}

.pi-filter.filter-active {
  color: var(--color-primary) !important;
  opacity: 1;
}

.column-filter-select:hover .pi-filter {
  opacity: 1;
  color: var(--color-primary);
}

.column-filter__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.column-filter__option-img {
  width: 1rem;
  height: 1rem;
  object-fit: contain;
}

.column-filter__option-icon {
  font-size: 0.95rem;
  color: var(--color-text-dim);
}

.column-filter__option-text {
  font-size: 0.9rem;
}

/* Override primevue multiselect internal padding for value area which pushes it out */
:deep(.p-multiselect-label-container) {
  display: none !important; /* Hide the selected value chips so it acts just like a button */
}

/* Header row with the toggle-all checkbox; styled like PrimeVue's header
   since show-toggle-all is off and PrimeVue renders no header of its own. */
.column-filter__toggle-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  font-size: 0.85rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  cursor: pointer;
}
</style>
