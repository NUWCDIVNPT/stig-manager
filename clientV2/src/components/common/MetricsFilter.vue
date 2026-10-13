<script setup>
import MultiSelect from 'primevue/multiselect'
import { computed, ref, watch } from 'vue'
import { fetchCollectionLabels } from '../../features/CollectionView/api/collectionApi.js'
import { useAsyncState } from '../../shared/composables/useAsyncState.js'
import { labelChipStyle, normalizeColor } from '../../shared/lib/colorUtils.js'
import LabelChip from './Label.vue'
import { MAX_VISIBLE_PILLS, pillsMultiSelectPt } from './pillsPicker.js'

// Collection label picker: the applied labels are removable chips that open the picker.
const props = defineProps({
  // Label names; `null` means "assets with no label"
  modelValue: {
    type: Array,
    default: () => [],
  },
  collectionId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const { state: options, isLoading, execute } = useAsyncState(
  () => props.collectionId ? fetchCollectionLabels(props.collectionId) : [],
  { initialState: [], immediate: false },
)

// Collection the loaded label options belong to; null until a load succeeds
const loadedCollectionId = ref(null)

async function loadOptions() {
  const requestedId = props.collectionId
  loadedCollectionId.value = null
  const result = await execute()
  if (result && requestedId && requestedId === props.collectionId) {
    loadedCollectionId.value = requestedId
  }
}

loadOptions()

watch(() => props.collectionId, loadOptions)

// Drop selected label names the collection doesn't have (stale bookmark, renamed or
// deleted label) so the filter never applies something the picker can't show.
watch([() => props.modelValue, loadedCollectionId], () => {
  if (loadedCollectionId.value !== props.collectionId || !props.modelValue?.length) {
    return
  }
  const known = new Set(options.value.map(opt => opt.name))
  const kept = props.modelValue.filter(name => name === null || known.has(name))
  if (kept.length !== props.modelValue.length) {
    emit('update:modelValue', kept)
  }
}, { immediate: true })

const multiSelectRef = ref()
const draftValues = ref([])
// Chip remove is hidden (space kept) while open: removing would reset the unapplied draft
const isOverlayOpen = ref(false)
// MultiSelect cannot hold null, so "no label" is a sentinel in draftValues and
// mapped back to null for the model. Label selections are label names; the
// sentinel is only ever produced for noLabelOption (see optionValueOf) and is
// longer than a label name can be (LabelName maxLength 16 in the API spec).
const NO_LABEL_SENTINEL = '__no_label_sentinel__'

const noLabelOption = Object.freeze({
  labelId: NO_LABEL_SENTINEL,
  name: 'No label',
  color: '777777',
})

function optionValueOf(opt) {
  return opt === noLabelOption ? NO_LABEL_SENTINEL : opt.name
}

const renderedOptions = computed(() => {
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
  const selectedValues = new Set(toDraftValues(props.modelValue || []))
  return renderedOptions.value.filter(opt => selectedValues.has(optionValueOf(opt)))
})

const visiblePills = computed(() => appliedOptions.value.slice(0, MAX_VISIBLE_PILLS))
const hiddenPillCount = computed(() => appliedOptions.value.length - visiblePills.value.length)

// Refetch labels on open so ones added or renamed elsewhere show up; silent, since
// MultiSelect ignores clicks while `loading`.
function onBeforeShow() {
  isOverlayOpen.value = true
  loadOptions()
}

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

function removeOption(opt) {
  const value = optionValueOf(opt)
  emit('update:modelValue', toModelValues(toDraftValues(props.modelValue).filter(v => v !== value)))
}
</script>

<template>
  <div class="label-picker-container">
    <MultiSelect
      ref="multiSelectRef"
      v-model="draftValues"
      class="pills-picker"
      :options="renderedOptions"
      :option-value="optionValueOf"
      option-label="name"
      placeholder="Filter by label"
      :filter="true"
      :show-toggle-all="true"
      :loading="isLoading && !options.length"
      :pt="pillsMultiSelectPt"
      @show="syncDraftFromModel"
      @before-show="onBeforeShow"
      @before-hide="isOverlayOpen = false"
    >
      <template #value>
        <div class="trigger-pills">
          <span v-if="!appliedOptions.length" class="trigger-pills__placeholder">Filter by label</span>
          <span v-else class="trigger-pills__chips">
            <span
              v-for="opt in visiblePills"
              :key="opt.labelId"
              class="trigger-pills__chip"
              :style="labelChipStyle(opt.color)"
            >
              <span class="trigger-pills__name">{{ opt.name }}</span>
              <i
                class="pi pi-times trigger-pills__remove"
                :style="isOverlayOpen ? { visibility: 'hidden' } : null"
                :title="`Remove ${opt.name}`"
                @click.stop.prevent="removeOption(opt)"
              />
            </span>
            <span v-if="hiddenPillCount" class="trigger-pills__more">+{{ hiddenPillCount }}</span>
          </span>
          <span class="trigger-pills__chevron"><i class="pi pi-chevron-down" /></span>
        </div>
      </template>

      <template #option="slotProps">
        <LabelChip :value="slotProps.option.name" :color="normalizeColor(slotProps.option.color)" />
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

<style scoped src="./pillsPicker.css"></style>

<style scoped>
.label-picker-container {
  display: flex;
  align-items: center;
  width: 100%;
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
