<script setup>
import MultiSelect from 'primevue/multiselect'
import SelectButton from 'primevue/selectbutton'
import { computed, ref, watch } from 'vue'
import { MAX_VISIBLE_PILLS, pillsMultiSelectPt } from '../../../components/common/pillsPicker.js'
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
// Every id goes in the request URL, so keep it well under proxy URL limits
const MAX_SENT_IDS = 250

const { state: options, isLoading } = useAsyncState(
  fetchMetaCollections,
  { initialState: [], immediate: true },
)

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
// Chip remove is hidden (space kept) while open, matching the label filter
const isOverlayOpen = ref(false)

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

const visiblePills = computed(() => appliedOptions.value.slice(0, MAX_VISIBLE_PILLS))
const hiddenPillCount = computed(() => appliedOptions.value.length - visiblePills.value.length)

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

function removeCollection(collectionId) {
  const ids = appliedIds.value.filter(id => id !== collectionId)
  emit('update:modelValue', ids.length ? valuesFilter({ value: ids, exclude: appliedExclude.value }) : valuesFilter())
}
</script>

<template>
  <div class="meta-metrics-filter">
    <MultiSelect
      ref="multiSelectRef"
      v-model="draftIds"
      class="pills-picker"
      :options="options"
      option-value="collectionId"
      option-label="name"
      placeholder="Filter by collection"
      :filter="true"
      :show-toggle-all="true"
      :loading="isLoading"
      :pt="pillsMultiSelectPt"
      @show="syncDraftFromModel"
      @before-show="isOverlayOpen = true"
      @before-hide="isOverlayOpen = false"
    >
      <template #value>
        <div class="trigger-pills" :title="titleText">
          <span v-if="!isActive" class="trigger-pills__placeholder">Filter by collection</span>
          <template v-else>
            <span v-if="appliedExclude" class="trigger-pills__mode">Excluding</span>
            <span class="trigger-pills__chips">
              <span v-for="opt in visiblePills" :key="opt.collectionId" class="trigger-pills__chip collection-chip">
                <span class="trigger-pills__name">{{ opt.name || 'unnamed collection' }}</span>
                <i
                  class="pi pi-times trigger-pills__remove"
                  :style="isOverlayOpen ? { visibility: 'hidden' } : null"
                  :title="`Remove ${opt.name || 'unnamed collection'}`"
                  @click.stop.prevent="removeCollection(opt.collectionId)"
                />
              </span>
              <span v-if="hiddenPillCount" class="trigger-pills__more">+{{ hiddenPillCount }}</span>
            </span>
          </template>
          <span class="trigger-pills__chevron"><i class="pi pi-chevron-down" /></span>
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

<style scoped src="../../../components/common/pillsPicker.css"></style>

<style scoped>
.meta-metrics-filter {
  display: flex;
  align-items: center;
  width: 100%;
}

/* Collections have no colour, so a neutral chip */
.collection-chip {
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.trigger-pills__mode {
  flex-shrink: 0;
  font-size: var(--text-md);
  color: var(--color-text-dim);
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
