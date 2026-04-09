<script setup>
import MultiSelect from 'primevue/multiselect'
import { computed, ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchCollectionLabels } from '../../CollectionView/api/collectionApi.js'
import { fetchMetaCollections } from '../../MetaCollectionView/api/metaApi.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  type: {
    type: String,
    required: true,
    validator: val => ['collection', 'label'].includes(val),
  },
  collectionId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const fetchOptions = () => {
  if (props.type === 'collection') {
    return fetchMetaCollections()
  }
  if (props.type === 'label' && props.collectionId) {
    return fetchCollectionLabels(props.collectionId)
  }
  return []
}

const { state: options, isLoading, execute } = useAsyncState(
  fetchOptions,
  { initialState: [], immediate: true },
)

watch(() => props.collectionId, () => {
  if (props.type === 'label') {
    execute()
  }
})

const multiSelectPt = {
  root: { style: 'background-color: var(--color-background-light); border-color: var(--color-border-default)' },
  label: { style: 'padding: 6px 10px; font-size: 0.92rem; color: var(--color-text-primary)' },
  labelContainer: { style: { display: 'flex', alignItems: 'center' } },
  overlay: { style: { width: '235px' } },
  listContainer: { style: { maxHeight: '300px' } },
  header: { style: { padding: '0.5rem' } },
}

const multiSelectRef = ref()
const draftValues = ref([])
const NO_LABEL_SENTINEL = '__no_label__' // ai suggestion because the value of null cannot be used in the multiselect options, we use a sentinel value to represent "no label"
const MAX_VISIBLE_SELECTED = 3

const optionValue = computed(() => props.type === 'collection' ? 'collectionId' : 'labelId')
const placeholder = computed(() => props.type === 'collection' ? 'Select Collections to Filter...' : 'Select Labels to Filter ...')

const noLabelOption = Object.freeze({
  labelId: NO_LABEL_SENTINEL,
  name: 'No label',
  color: '777777',
})

const renderedOptions = computed(() => {
  if (props.type !== 'label') {
    return options.value || []
  }
  const labelOptions = (options.value || []).filter(opt => opt.labelId !== null && opt.labelId !== 'null')
  return [noLabelOption, ...labelOptions]
})

watch(
  () => props.modelValue,
  (newVal) => {
    draftValues.value = toDraftValues(newVal || [])
  },
  { immediate: true },
)

const appliedOptions = computed(() => {
  if (!renderedOptions.value) {
    return []
  }
  const selectedValues = new Set(toDraftValues(props.modelValue || []))
  return renderedOptions.value.filter(opt => selectedValues.has(opt[optionValue.value]))
})

const selectedNames = computed(() => {
  return appliedOptions.value.map((opt) => {
    if (props.type === 'label') {
      return formatLabelName(opt.name)
    }
    return opt.name || 'unnamed collection'
  })
})

const visibleSelectedNames = computed(() => selectedNames.value.slice(0, MAX_VISIBLE_SELECTED))
const hiddenSelectedCount = computed(() => Math.max(0, selectedNames.value.length - visibleSelectedNames.value.length))
const fullSelectedListText = computed(() => selectedNames.value.join(', '))

const displayText = computed(() => {
  if (isLoading.value) {
    return 'Loading...'
  }
  if (selectedNames.value.length === 0) {
    return placeholder.value
  }
  const visibleText = visibleSelectedNames.value.join(', ')
  if (hiddenSelectedCount.value > 0) {
    return `${visibleText} +${hiddenSelectedCount.value} more`
  }
  return visibleText
})

const isVisible = computed(() => {
  if (props.type === 'label' && !isLoading.value && (!renderedOptions.value || renderedOptions.value.length === 0)) {
    return false
  }
  return true
})

function syncDraftFromModel() {
  draftValues.value = toDraftValues(props.modelValue || [])
}

function toDraftValues(values = []) {
  if (!values) {
    return []
  }
  return values.map(value => value === null ? NO_LABEL_SENTINEL : value)
}

function toModelValues(values = []) {
  if (!values) {
    return []
  }
  return values.map(value => value === NO_LABEL_SENTINEL ? null : value)
}

function applyFilters() {
  emit('update:modelValue', toModelValues(draftValues.value))
  multiSelectRef.value?.hide?.()
}

function clearFilters() {
  draftValues.value = []
  emit('update:modelValue', [])
}

function normalizeColor(color) {
  if (!color) {
    return '#000000'
  }
  return color.startsWith('#') ? color : `#${color}`
}

function getContrastColor(hexColor) {
  if (!hexColor) {
    return '#ffffff'
  }
  const hex = hexColor.replace('#', '')
  const r = Number.parseInt(hex.substr(0, 2), 16)
  const g = Number.parseInt(hex.substr(2, 2), 16)
  const b = Number.parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

function formatLabelName(name) {
  return name || 'no label'
}
</script>

<template>
  <div v-if="isVisible" class="metrics-filter-container">
    <MultiSelect
      ref="multiSelectRef"
      v-model="draftValues"
      class="metrics-multiselect"
      :class="{ 'is-active': appliedOptions.length > 0 }"
      :options="renderedOptions"
      :option-value="optionValue"
      option-label="name"
      :placeholder="placeholder"
      :filter="true"
      :show-toggle-all="true"
      :max-selected-labels="3"
      :loading="isLoading"
      :pt="multiSelectPt"
      :show-clear="true"
      @show="syncDraftFromModel"
    >
      <template #clearicon>
        <i class="pi pi-times sm-clear-icon" title="Clear filters" @click.stop.prevent="clearFilters" />
      </template>

      <template #value>
        <div class="trigger-left" :title="appliedOptions.length > 0 ? fullSelectedListText : ''">
          <i class="pi" :class="appliedOptions.length > 0 ? 'pi-filter-fill' : 'pi-filter'" />
          <span class="placeholder-text">{{ displayText }}</span>
        </div>
      </template>

      <template #option="slotProps">
        <span
          v-if="type === 'label'"
          class="label-chip"
          :class="{ 'is-empty-label': !slotProps.option.name }"
          :style="{ backgroundColor: normalizeColor(slotProps.option.color), color: getContrastColor(slotProps.option.color) }"
        >
          {{ formatLabelName(slotProps.option.name) }}
        </span>
        <span v-else>{{ slotProps.option.name || 'unnamed collection' }}</span>
      </template>

      <template #footer>
        <div class="panel-footer">
          <button type="button" class="apply-btn" @click="applyFilters">
            <i class="pi pi-check" />
            <span>Apply</span>
          </button>
        </div>
      </template>
    </MultiSelect>
  </div>
</template>

<style scoped>
.metrics-filter-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.metrics-multiselect {
  width: 235px;
}

.metrics-multiselect.is-active {
  background-color: var(--color-bg-hover-strong) !important;
}

.sm-clear-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 2rem;
  padding: 0.3rem;
  cursor: pointer;
  color: var(--color-text-dim);
}

.sm-clear-icon:hover {
  color: var(--color-text-bright);
}

.trigger-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  overflow: hidden;
}

.placeholder-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.label-chip {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.is-empty-label {
  font-style: italic;
}

.panel-footer {
  padding: 0.5rem;
  border-top: 1px solid var(--color-border-default);
  background-color: var(--color-background-light);
}

.apply-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.apply-btn:hover {
  background: var(--color-bg-hover-strong);
}
</style>
