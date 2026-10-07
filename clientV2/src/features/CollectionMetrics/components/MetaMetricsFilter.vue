<script setup>
import MultiSelect from 'primevue/multiselect'
import SelectButton from 'primevue/selectbutton'
import { computed, ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { isActive as isFilterActive, valuesFilter } from '../../../shared/lib/columnFilters.js'
import { fetchMetaCollections } from '../../MetaCollectionView/api/metaApi.js'

const props = defineProps({
  // A columnFilters valuesFilter over collectionId
  modelValue: {
    type: Object,
    default: () => valuesFilter(),
  },
})

const emit = defineEmits(['update:modelValue', 'update:effectiveCollectionIds'])

const MODE_OPTIONS = [
  { label: 'Include', value: false },
  { label: 'Exclude', value: true },
]
const MAX_VISIBLE_SELECTED = 3
// Every id goes in the request URL, so keep it well under proxy URL limits
const MAX_SENT_IDS = 250

const { state: options, isLoading } = useAsyncState(
  fetchMetaCollections,
  { initialState: [], immediate: true },
)

const multiSelectPt = {
  root: { style: 'width: 100%; background-color: var(--color-background-light); border-color: var(--color-border-default)' },
  label: { style: 'padding: 5px 10px; font-size: var(--text-md); color: var(--color-text-primary)' },
  labelContainer: { style: { display: 'flex', alignItems: 'center' } },
  overlay: { style: { width: '250px' } },
  listContainer: { style: { maxHeight: '270px' } },
  list: { style: { padding: '0.25rem' } },
  option: { style: { padding: '0.35rem 0.6rem', fontSize: 'var(--text-md)' } },
  header: { style: { padding: '0.4rem 0.5rem' } },
  pcFilter: { root: { style: { padding: '0.3rem 0.5rem', fontSize: 'var(--text-md)' } } },
}

const selectButtonPt = {
  root: { style: { display: 'flex', width: '100%' } },
  pcToggleButton: {
    root: { style: { flex: '1', padding: '0.2rem', fontSize: 'var(--text-md)' } },
    content: { style: { padding: '0.2rem 0.5rem' } },
  },
}

const multiSelectRef = ref()
const draftIds = ref([])
const draftExclude = ref(false)

const appliedExclude = computed(() => Boolean(props.modelValue?.exclude))
const appliedIds = computed(() => props.modelValue?.value || [])

const appliedOptions = computed(() => {
  const selected = new Set(appliedIds.value)
  return (options.value || []).filter(opt => selected.has(opt.collectionId))
})

const isActive = computed(() => isFilterActive(props.modelValue) && appliedOptions.value.length > 0)

// Excluding every collection would resolve to an empty list, which the API treats as "all"
const excludesEverything = computed(() =>
  draftExclude.value
  && options.value?.length > 0
  && draftIds.value.length >= options.value.length,
)

const tooManyIds = computed(() => {
  const sent = draftExclude.value ? (options.value?.length ?? 0) - draftIds.value.length : draftIds.value.length
  return sent > MAX_SENT_IDS
})

const selectedNames = computed(() => appliedOptions.value.map(opt => opt.name || 'unnamed collection'))

const displayText = computed(() => {
  if (isLoading.value) {
    return 'Loading...'
  }
  if (!isActive.value) {
    return 'Select Collections to Filter...'
  }
  const prefix = appliedExclude.value ? 'Excluding: ' : ''
  const visible = selectedNames.value.slice(0, MAX_VISIBLE_SELECTED).join(', ')
  const hidden = selectedNames.value.length - MAX_VISIBLE_SELECTED
  return hidden > 0 ? `${prefix}${visible} +${hidden} more` : `${prefix}${visible}`
})

const titleText = computed(() => {
  if (!isActive.value) {
    return ''
  }
  const verb = appliedExclude.value ? 'Excluding' : 'Including'
  return `${verb}: ${selectedNames.value.join(', ')}`
})

// Include passes ids straight through; exclude resolves against the full collection list
const effectiveCollectionIds = computed(() => {
  if (!isFilterActive(props.modelValue)) {
    return []
  }
  if (!appliedExclude.value) {
    return appliedIds.value
  }
  const excluded = new Set(appliedIds.value)
  return (options.value || []).map(opt => opt.collectionId).filter(id => !excluded.has(id))
})

watch(effectiveCollectionIds, (ids) => {
  if (appliedExclude.value && isLoading.value) {
    return
  }
  emit('update:effectiveCollectionIds', ids)
}, { immediate: true })

function syncDraftFromModel() {
  draftIds.value = [...appliedIds.value]
  draftExclude.value = appliedExclude.value
}

function applyFilters() {
  emit('update:modelValue', valuesFilter({ value: [...draftIds.value], exclude: draftExclude.value }))
  multiSelectRef.value?.hide?.()
}

function cancelFilters() {
  syncDraftFromModel()
  multiSelectRef.value?.hide?.()
}

function clearFilters() {
  draftIds.value = []
  draftExclude.value = false
  emit('update:modelValue', valuesFilter())
}
</script>

<template>
  <div class="meta-metrics-filter">
    <MultiSelect
      ref="multiSelectRef"
      v-model="draftIds"
      :class="{ 'is-active': isActive }"
      :options="options"
      option-value="collectionId"
      option-label="name"
      placeholder="Select Collections to Filter..."
      :filter="true"
      :show-toggle-all="true"
      :loading="isLoading"
      :pt="multiSelectPt"
      :show-clear="true"
      @show="syncDraftFromModel"
    >
      <template #clearicon>
        <i class="pi pi-times sm-clear-icon" title="Clear filters" @click.stop.prevent="clearFilters" />
      </template>

      <template #value>
        <div class="trigger-left" :title="titleText">
          <i class="pi" :class="isActive ? 'pi-filter-fill' : 'pi-filter'" />
          <span class="placeholder-text">{{ displayText }}</span>
        </div>
      </template>

      <template #header>
        <div class="mode-row">
          <SelectButton
            v-model="draftExclude"
            :options="MODE_OPTIONS"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            :pt="selectButtonPt"
          />
        </div>
      </template>

      <template #option="slotProps">
        <span>{{ slotProps.option.name || 'unnamed collection' }}</span>
      </template>

      <template #footer>
        <div class="panel-footer">
          <span v-if="excludesEverything" class="footer-warning">Leave at least one collection unexcluded</span>
          <span v-else-if="tooManyIds" class="footer-warning">Filter can cover at most {{ MAX_SENT_IDS }} collections</span>
          <div class="footer-buttons">
            <button type="button" class="footer-btn" @click="cancelFilters">
              <span>Cancel</span>
            </button>
            <button type="button" class="footer-btn footer-btn--primary" :disabled="excludesEverything || tooManyIds" @click="applyFilters">
              <i class="pi pi-check" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </template>
    </MultiSelect>
  </div>
</template>

<style scoped>
.meta-metrics-filter {
  display: flex;
  align-items: center;
  width: 100%;
}

.is-active {
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

.mode-row {
  padding: 0.4rem 0.5rem 0;
}

.panel-footer {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.4rem 0.5rem;
  border-top: 1px solid var(--color-border-default);
  background-color: var(--color-background-light);
}

.footer-warning {
  font-size: var(--text-sm);
  color: var(--color-text-dim);
}

.footer-buttons {
  display: flex;
  gap: 0.4rem;
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

.footer-btn:hover:not(:disabled) {
  background: var(--color-bg-hover-strong);
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
