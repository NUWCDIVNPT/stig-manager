<script setup>
import MultiSelect from 'primevue/multiselect'

defineProps({
  columns: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function onToggle(val) {
  emit('update:modelValue', val)
}

// The theme's small variant sizes root/box/icon from matched tokens,
// keeping the check centered in the box
const compactCheckboxPt = {
  root: { class: 'p-checkbox-sm' },
}

const columnTogglePT = {
  root: { class: 'column-toggle-select' },
  label: { style: 'padding: 0.35rem 0.75rem; display: flex; align-items: center;' },
  dropdown: { style: 'width: auto; padding-right: 0.75rem; color: var(--color-text-bright);' },
  overlay: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,0.6);' },
  header: { style: 'background: var(--color-background-dark); border-bottom: 1px solid var(--color-border-light); padding: 0.35rem 0.6rem; gap: 0.5rem;' },
  option: ({ context }) => ({
    style: {
      color: context.selected ? 'var(--color-text-bright)' : 'var(--color-text-primary)',
      padding: '0.2rem 0.6rem',
      gap: '0.5rem',
      fontSize: '1rem',
      transition: 'background 0.12s',
      background: context.focused ? 'var(--color-background-light)' : 'transparent',
    },
  }),
  pcHeaderCheckbox: compactCheckboxPt,
  pcOptionCheckbox: compactCheckboxPt,
  pcFilter: { root: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border: 1px solid var(--color-border-default); padding: 0.25rem 0.45rem;' } },
  filterIcon: { style: 'color: var(--color-text-dim);' },
}
</script>

<template>
  <MultiSelect
    :model-value="modelValue"
    :options="columns"
    option-label="header"
    placeholder="Columns"
    :pt="columnTogglePT"
    scroll-height="22rem"
    filter
    @update:model-value="onToggle"
  >
    <template #value>
      <div class="column-toggle__value">
        <i class="pi pi-cog column-toggle__icon" />
        <span>Columns</span>
      </div>
    </template>
    <template #option="slotProps">
      <div class="column-toggle__option">
        <img v-if="slotProps.option.image" :src="slotProps.option.image" alt="" class="column-toggle__option-img">
        <i v-else-if="slotProps.option.icon" :class="slotProps.option.icon" class="column-toggle__option-icon" />
        <span class="column-toggle__option-text">{{ slotProps.option.header }}</span>
      </div>
    </template>
    <template #dropdownicon>
      <i class="pi pi-chevron-down" />
    </template>
  </MultiSelect>
</template>

<style scoped>
.column-toggle-select {
  display: inline-flex;
  align-items: center;
  height: var(--checklist-control-height, 2.42rem);
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  cursor: pointer;
  min-width: 7.5rem;
}

.column-toggle-select:hover {
  background: color-mix(in srgb, var(--color-background-light) 85%, transparent);
}

.column-toggle__value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--color-text-bright);
}

.column-toggle__icon {
  font-size: 1rem;
}

.column-toggle__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.column-toggle__option-img {
  width: 1.1rem;
  height: 1.1rem;
  object-fit: contain;
}

.column-toggle__option-icon {
  font-size: 0.95rem;
  color: var(--color-text-dim);
}

.column-toggle__option-text {
  font-size: 1rem;
}
</style>
