<script setup>
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [[], []],
  },
  dataKey: {
    type: String,
    required: true,
  },
  showSourceFilter: {
    type: Boolean,
    default: false,
  },
  showTargetFilter: {
    type: Boolean,
    default: false,
  },
  filterBy: {
    type: String,
    default: null,
  },
  sourceFilterPlaceholder: {
    type: String,
    default: 'Search...',
  },
  targetFilterPlaceholder: {
    type: String,
    default: 'Search...',
  },
})

const emit = defineEmits(['update:modelValue'])

const sourceSearch = ref('')
const targetSearch = ref('')

const selectionSource = ref([])
const selectionTarget = ref([])

const sourceList = computed(() => props.modelValue[0] || [])
const targetList = computed(() => props.modelValue[1] || [])

const filteredSource = computed(() => {
  if (!props.showSourceFilter || !sourceSearch.value || !props.filterBy) return sourceList.value
  const lowerSearch = sourceSearch.value.toLowerCase()
  return sourceList.value.filter(item => {
    const val = item[props.filterBy]
    return val && String(val).toLowerCase().includes(lowerSearch)
  })
})

const filteredTarget = computed(() => {
  if (!props.showTargetFilter || !targetSearch.value || !props.filterBy) return targetList.value
  const lowerSearch = targetSearch.value.toLowerCase()
  return targetList.value.filter(item => {
    const val = item[props.filterBy]
    return val && String(val).toLowerCase().includes(lowerSearch)
  })
})

const onMoveRight = () => {
  if (selectionSource.value.length > 0) {
    const itemsToMove = [...selectionSource.value]
    const newTarget = [...targetList.value, ...itemsToMove]
    const newSource = sourceList.value.filter(item => !itemsToMove.includes(item))
    
    emit('update:modelValue', [newSource, newTarget])
    selectionSource.value = []
  }
}

const onMoveLeft = () => {
  if (selectionTarget.value.length > 0) {
    const itemsToMove = [...selectionTarget.value]
    const newSource = [...sourceList.value, ...itemsToMove]
    const newTarget = targetList.value.filter(item => !itemsToMove.includes(item))
    
    emit('update:modelValue', [newSource, newTarget])
    selectionTarget.value = []
  }
}

const onMoveAllRight = () => {
  const newTarget = [...targetList.value, ...filteredSource.value]
  const newSource = sourceList.value.filter(item => !filteredSource.value.includes(item))
  
  emit('update:modelValue', [newSource, newTarget])
  selectionSource.value = []
}

const onMoveAllLeft = () => {
  const newSource = [...sourceList.value, ...filteredTarget.value]
  const newTarget = targetList.value.filter(item => !filteredTarget.value.includes(item))
  
  emit('update:modelValue', [newSource, newTarget])
  selectionTarget.value = []
}
</script>

<template>
  <div class="common-picklist-root">
    <div class="picklist-container">
      <div class="list-column">
        <h4 class="list-header">
          <slot name="sourceheader">Available</slot>
        </h4>
        
        <div v-if="showSourceFilter" class="filter-container">
          <IconField class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="sourceSearch" :placeholder="sourceFilterPlaceholder" fluid />
          </IconField>
        </div>

        <Listbox
          v-model="selectionSource"
          :options="filteredSource"
          multiple
          :pt="{
            root: { style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column;' },
          }"
        >
          <template #option="slotProps">
            <slot name="item" :item="slotProps.option">
              {{ slotProps.option[dataKey] }}
            </slot>
          </template>
        </Listbox>
      </div>

      <div class="controls-column">
        <Button icon="pi pi-angle-double-right" text @click="onMoveAllRight" />
        <Button icon="pi pi-angle-right" text :disabled="selectionSource.length === 0" @click="onMoveRight" />
        <Button icon="pi pi-angle-left" text :disabled="selectionTarget.length === 0" @click="onMoveLeft" />
        <Button icon="pi pi-angle-double-left" text @click="onMoveAllLeft" />
      </div>

      <div class="list-column">
        <h4 class="list-header">
          <slot name="targetheader">Selected</slot>
        </h4>
        
        <div v-if="showTargetFilter" class="filter-container">
          <IconField class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="targetSearch" :placeholder="targetFilterPlaceholder" fluid />
          </IconField>
        </div>

        <Listbox
          v-model="selectionTarget"
          :options="filteredTarget"
          multiple
          :pt="{
            root: { style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column;' },
          }"
        >
          <template #option="slotProps">
            <slot name="item" :item="slotProps.option">
              {{ slotProps.option[dataKey] }}
            </slot>
          </template>
        </Listbox>
      </div>
    </div>
  </div>
</template>

<style scoped>
.common-picklist-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.picklist-container {
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  gap: 0.5rem;
  min-height: 0;
}

.list-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background: var(--color-background-light);
  padding: 0.5rem;
}

.list-header {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  flex: 0 0 auto;
  color: var(--color-text-primary);
}

.filter-container {
  margin-bottom: 0.5rem;
  display: flex;
}

.search-field {
  flex: 1;
}

.controls-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  padding: 0 0.25rem;
}

:deep(.p-listbox) {
  border: none;
  background: transparent;
}

:deep(.p-listbox-list-container) {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  max-height: none !important;
  overflow: auto;
}

:deep(.p-listbox-option) {
  padding: 0.45rem 0.75rem;
  font-size: 0.9rem;
  border-radius: 3px;
  margin-bottom: 1px;
}

:deep(.p-listbox-option[data-p-highlight="true"]) {
  background: color-mix(in srgb, var(--color-action-blue-dark) 18%, transparent);
  color: var(--color-text-bright);
}
</style>
