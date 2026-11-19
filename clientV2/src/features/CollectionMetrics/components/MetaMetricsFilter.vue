<script setup>
import MultiSelect from 'primevue/multiselect'
import { computed, ref, watch } from 'vue'
import { pillsMultiSelectPt } from '../../../components/common/pillsPicker.js'
import PillsTrigger from '../../../components/common/PillsTrigger.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchMetaCollections } from '../../MetaCollectionView/api/metaApi.js'

const props = defineProps({
  // Selected collection ids; [] means all
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

// Every id goes in the request URL, so keep it well under proxy URL limits
const MAX_SENT_IDS = 250

const { state: options, isLoading } = useAsyncState(
  fetchMetaCollections,
  { initialState: null, immediate: true },
)

// Drop ids of collections that were deleted or are no longer granted (stale link or bookmark)
watch([() => props.modelValue, options], () => {
  if (!options.value || !props.modelValue.length) {
    return
  }
  const known = new Set(options.value.map(opt => opt.collectionId))
  const kept = props.modelValue.filter(id => known.has(id))
  if (kept.length !== props.modelValue.length) {
    emit('update:modelValue', kept)
  }
}, { immediate: true })

const multiSelectRef = ref()
const draftIds = ref([])
// Chip remove is hidden (space kept) while open, matching the label filter
const isOverlayOpen = ref(false)

const appliedOptions = computed(() => {
  const selected = new Set(props.modelValue)
  return (options.value || []).filter(opt => selected.has(opt.collectionId))
})

const nameOf = opt => opt.name || 'unnamed collection'

const tooManyIds = computed(() => draftIds.value.length > MAX_SENT_IDS)

// Collections have no colour, so neutral chips
const pills = computed(() => appliedOptions.value.map(opt => ({
  key: opt.collectionId,
  name: nameOf(opt),
  class: 'trigger-pills__chip--neutral',
})))

const titleText = computed(() => pills.value.map(pill => pill.name).join(', '))

function syncDraftFromModel() {
  draftIds.value = [...props.modelValue]
}

// Follow outside changes (clear button, chip remove, URL) so the menu never opens on a stale draft
watch(() => props.modelValue, syncDraftFromModel, { immediate: true })

function applyFilters() {
  emit('update:modelValue', [...draftIds.value])
  multiSelectRef.value?.hide?.()
}

function cancelFilters() {
  syncDraftFromModel()
  multiSelectRef.value?.hide?.()
}

function removeCollection(collectionId) {
  emit('update:modelValue', props.modelValue.filter(id => id !== collectionId))
}
</script>

<template>
  <div class="meta-metrics-filter">
    <MultiSelect
      ref="multiSelectRef"
      v-model="draftIds"
      class="pills-picker"
      :options="options || []"
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
        <PillsTrigger
          :pills="pills"
          placeholder="Filter by collection"
          :open="isOverlayOpen"
          :title="titleText"
          @remove="removeCollection($event.key)"
        />
      </template>

      <template #option="slotProps">
        <span>{{ nameOf(slotProps.option) }}</span>
      </template>

      <template #footer>
        <div class="panel-footer">
          <span v-if="tooManyIds" class="footer-warning">Filter can cover at most {{ MAX_SENT_IDS }} collections</span>
          <div class="footer-buttons">
            <button type="button" class="footer-btn" @click="cancelFilters">
              <span>Cancel</span>
            </button>
            <button type="button" class="footer-btn footer-btn--primary" :disabled="tooManyIds" @click="applyFilters">
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

.footer-warning {
  font-size: var(--text-sm);
  color: var(--color-text-dim);
}
</style>
