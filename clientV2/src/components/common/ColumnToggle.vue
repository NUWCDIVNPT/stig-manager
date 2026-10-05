<script setup>
import MultiSelect from 'primevue/multiselect'
import { computed, ref } from 'vue'

const props = defineProps({
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

function onToggle(val) {
  emit('update:modelValue', val)
}

const multiSelectRef = ref(null)
const filterText = ref('')

function onFilter(event) {
  filterText.value = event.value ?? ''
}

// MultiSelect keeps its filter text private and only resets it on hide, so
// clearing goes through the same handler its input uses. That keeps the
// list, the focused option and the filter event in step, as if the user had
// emptied the box themselves.
function clearFilter() {
  const ms = multiSelectRef.value
  ms?.onFilterChange({ target: { value: '' } })
  ms?.$refs.filterInput?.$el?.focus()
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
    :model-value="modelValue"
    :options="options"
    option-label="header"
    :option-group-label="isGrouped ? 'group' : undefined"
    :option-group-children="isGrouped ? 'items' : undefined"
    data-key="field"
    placeholder="Columns"
    :pt="columnTogglePT"
    scroll-height="22rem"
    filter
    @update:model-value="onToggle"
    @filter="onFilter"
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
      <button
        v-if="filterText"
        type="button"
        class="column-toggle__filter-clear"
        aria-label="Clear column filter"
        @click.stop="clearFilter"
      >
        <i class="pi pi-times" />
      </button>
      <i v-else class="pi pi-search" />
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

/* The icon slot sits in an InputIcon, which ignores pointer events so the
   input underneath stays clickable; the clear button has to opt back in. */
.column-toggle__filter-clear {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
  font-size: inherit;
}

.column-toggle__filter-clear:hover {
  color: var(--color-text-bright);
}
</style>
