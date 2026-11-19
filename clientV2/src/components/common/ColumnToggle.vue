<script setup>
import MultiSelect from 'primevue/multiselect'
import { computed, ref } from 'vue'
import MultiSelectFilterIcon from './MultiSelectFilterIcon.vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
})

const model = defineModel({ type: Array, required: true })

// Columns that carry a `group` are listed under that heading, in order of
// first appearance; the selection stays a flat list of column objects.
const isGrouped = computed(() => props.columns.some(c => c.group))

const options = computed(() => {
  if (!isGrouped.value) {
    return props.columns
  }
  const groups = new Map()
  for (const column of props.columns) {
    const name = column.group ?? 'Other'
    if (!groups.has(name)) {
      groups.set(name, { group: name, items: [] })
    }
    groups.get(name).items.push(column)
  }
  return [...groups.values()]
})

const multiSelectRef = ref(null)

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
  optionGroup: { style: 'background: var(--color-background-dark); color: var(--color-text-dim); padding: 0.45rem 0.6rem 0.15rem; font-size: var(--text-md); font-weight: 600;' },
  option: ({ context }) => ({
    style: {
      color: context.selected ? 'var(--color-text-bright)' : 'var(--color-text-primary)',
      padding: '0.2rem 0.6rem',
      gap: '0.5rem',
      fontSize: 'var(--text-md)',
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
    ref="multiSelectRef"
    v-model="model"
    :options="options"
    option-label="header"
    :option-group-label="isGrouped ? 'group' : undefined"
    :option-group-children="isGrouped ? 'items' : undefined"
    data-key="field"
    placeholder="Columns"
    :pt="columnTogglePT"
    scroll-height="22rem"
    filter
  >
    <template #value>
      <div class="column-toggle__value">
        <i class="pi pi-cog" />
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
    <template #filtericon>
      <MultiSelectFilterIcon :multi-select="multiSelectRef" label="Clear column filter" />
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
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-bright);
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
  font-size: var(--text-md);
  color: var(--color-text-dim);
}

.column-toggle__option-text {
  font-size: var(--text-md);
}
</style>
