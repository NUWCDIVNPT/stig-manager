<script setup>
import MultiSelect from 'primevue/multiselect'
import { computed, ref, watch } from 'vue'
import { fetchCollectionLabels } from '../../features/CollectionView/api/collectionApi.js'
import { fetchMetaCollections } from '../../features/MetaCollectionView/api/metaApi.js'
import { useAsyncState } from '../../shared/composables/useAsyncState.js'
import { getContrastColor, normalizeColor } from '../../shared/lib/colorUtils.js'
import LabelsRow from '../columns/LabelsRow.vue'

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
  // flex on label: LabelsRow has no intrinsic width (contain: inline-size), so the label must grow to give it room
  label: { style: 'padding: 5px 10px; font-size: var(--text-md); color: var(--color-text-primary); flex: 1 1 auto' },
  labelContainer: { style: { display: 'flex', alignItems: 'center' } },
  overlay: { style: { width: '250px' } },
  listContainer: { style: { maxHeight: '270px' } },
  list: { style: { padding: '0.25rem' } },
  option: { style: { padding: '0.35rem 0.6rem', fontSize: 'var(--text-md)' } },
  header: { style: { padding: '0.4rem 0.5rem' } },
  pcFilter: { root: { style: { padding: '0.3rem 0.5rem', fontSize: 'var(--text-md)' } } },
}

const multiSelectRef = ref()
const draftValues = ref([])
// MultiSelect cannot hold null, so "no label" is a sentinel in draftValues and
// mapped back to null for the model. Label selections are label names; the
// sentinel is only ever produced for noLabelOption (see optionValueOf) and is
// longer than a label name can be (LabelName maxLength 16 in the API spec).
const NO_LABEL_SENTINEL = '__no_label_sentinel__'
const MAX_VISIBLE_SELECTED = 3

const placeholder = computed(() => props.type === 'collection' ? 'Select Collections to Filter...' : 'Select Labels to Filter ...')

// labelId keys the chip in LabelsRow
const noLabelOption = Object.freeze({
  labelId: NO_LABEL_SENTINEL,
  name: 'No label',
  color: '777777',
})

// Selection values: collectionId for collections, the label name for labels.
function optionValueOf(opt) {
  if (props.type === 'collection') {
    return opt.collectionId
  }
  return opt === noLabelOption ? NO_LABEL_SENTINEL : opt.name
}

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
  return renderedOptions.value.filter(opt => selectedValues.has(optionValueOf(opt)))
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

// Selected labels render through LabelsRow so the trigger shows the same chips
// and "+N" overflow as label cells elsewhere; collections stay text.
const showSelectedChips = computed(() => props.type === 'label' && !isLoading.value && appliedOptions.value.length > 0)

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

function cancelFilters() {
  syncDraftFromModel()
  multiSelectRef.value?.hide?.()
}

function clearFilters() {
  draftValues.value = []
  emit('update:modelValue', [])
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
      :option-value="optionValueOf"
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
          <div v-if="showSelectedChips" class="trigger-chips">
            <LabelsRow :labels="appliedOptions" compact />
          </div>
          <span v-else class="placeholder-text">{{ displayText }}</span>
        </div>
      </template>

      <template #option="slotProps">
        <span
          v-if="type === 'label'"
          class="label-chip"
          :class="{ 'is-empty-label': !slotProps.option.name }"
          :style="{ backgroundColor: normalizeColor(slotProps.option.color, '#000000'), color: getContrastColor(slotProps.option.color, '#000000', '#ffffff') }"
        >
          {{ formatLabelName(slotProps.option.name) }}
        </span>
        <span v-else>{{ slotProps.option.name || 'unnamed collection' }}</span>
      </template>

      <template #footer>
        <div class="panel-footer">
          <button type="button" class="footer-btn" @click="cancelFilters">
            <span>Cancel</span>
          </button>
          <button type="button" class="footer-btn footer-btn--primary" @click="applyFilters">
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
  gap: 0.35rem;
  flex: 1;
  overflow: hidden;
}

.trigger-chips {
  flex: 1;
  min-width: 0;
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
  font-size: var(--text-sm);
  font-weight: 500;
}

.is-empty-label {
  font-style: italic;
}

.panel-footer {
  display: flex;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem;
  border-top: 1px solid var(--color-border-default);
  background-color: var(--color-background-light);
}

.footer-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-border-default);
  border-radius: 5px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--text-md);
}

.footer-btn--primary {
  font-weight: 600;
}

.footer-btn:hover {
  background: var(--color-bg-hover-strong);
}
</style>
