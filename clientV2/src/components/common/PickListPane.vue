<script setup>
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'

/**
 * One pane of a dual-list picker: a titled column with an optional search
 * input / filter row above the list. The list itself (Listbox, DataTable...)
 * goes in the default slot. Shared by PickList, PickListTable, GrantsPickList
 * and CollectionGrantPickList so their panes render identically.
 */
defineProps({
  /** Render the search input in the filter row. */
  showSearch: {
    type: Boolean,
    default: false,
  },
  /** Search text, used with `v-model:search`. */
  search: {
    type: String,
    default: '',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...',
  },
})

const emit = defineEmits(['update:search'])
</script>

<template>
  <div class="list-column">
    <h4 class="list-header">
      <slot name="header" />
    </h4>

    <div v-if="showSearch || $slots.filter" class="filter-container">
      <IconField v-if="showSearch" class="search-field">
        <InputIcon class="pi pi-search" />
        <InputText
          :model-value="search"
          :placeholder="searchPlaceholder"
          fluid
          @update:model-value="emit('update:search', $event)"
        />
      </IconField>
      <slot name="filter" />
    </div>

    <slot />
  </div>
</template>

<style scoped>
.list-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--color-background-subtle);
}

.list-header {
  margin: 0;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: var(--text-xl);
  font-weight: 600;
  flex: 0 0 auto;
  color: var(--color-text-bright);
  background: var(--p-datatable-row-background);
  border-bottom: 1px solid var(--color-border-default);
}

.filter-container {
  padding: 0.5rem 0.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex: 0 0 auto;
  border-bottom: 1px solid var(--color-border-default);
}

.search-field {
  flex: 1;
}
</style>
