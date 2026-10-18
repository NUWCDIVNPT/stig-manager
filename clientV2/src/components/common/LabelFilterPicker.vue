<script setup>
import MultiSelect from 'primevue/multiselect'
import { computed, ref, watch } from 'vue'
import { fetchCollectionLabels } from '../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../shared/composables/useAsyncState.js'
import { labelChipStyle } from '../../shared/lib/colorUtils.js'
import LabelChip from './Label.vue'
import { pillsMultiSelectPt } from './pillsPicker.js'
import PillsTrigger from './PillsTrigger.vue'

// Collection label picker for the breadcrumb filter: the applied labels are removable
// chips that open the picker.
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

// The label list is kept with the collection it was fetched for, so the prune below
// never compares a selection against another collection's labels.
const { state: loaded, isLoading, execute: loadOptions } = useAsyncState(
  async () => props.collectionId
    ? { collectionId: props.collectionId, labels: await fetchCollectionLabels(props.collectionId) }
    : null,
  { initialState: null, immediate: false },
)

// Empty while the current collection's labels are not loaded (including a failed
// refetch after a collection switch, which leaves the previous list in `loaded`).
const options = computed(() => loaded.value?.collectionId === props.collectionId ? loaded.value.labels : [])

watch(() => props.collectionId, () => loadOptions(), { immediate: true })

// Drop selected label names the collection doesn't have (stale bookmark, renamed or
// deleted label) so the filter never applies something the picker can't show.
watch([() => props.modelValue, loaded], () => {
  if (loaded.value?.collectionId !== props.collectionId || !props.modelValue.length) {
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
const isOverlayOpen = ref(false)
// MultiSelect cannot hold null, so "no label" is a sentinel in draftValues and
// mapped back to null for the model. Label selections are label names; the
// sentinel is only ever produced for noLabelOption (see optionValueOf) and is
// longer than a label name can be (LABEL_NAME_MAX_LENGTH in labelFilters.js).
const NO_LABEL_SENTINEL = '__no_label_sentinel__'

// No colour, so the chip takes the theme's neutral label colour
const noLabelOption = Object.freeze({
  labelId: NO_LABEL_SENTINEL,
  name: 'No label',
  color: null,
})

function optionValueOf(opt) {
  return opt === noLabelOption ? NO_LABEL_SENTINEL : opt.name
}

function modelValueOf(opt) {
  return opt === noLabelOption ? null : opt.name
}

const renderedOptions = computed(() => [noLabelOption, ...options.value])

const appliedOptions = computed(() => {
  const selected = new Set(props.modelValue)
  return renderedOptions.value.filter(opt => selected.has(modelValueOf(opt)))
})

// Trigger chips; `value` is what removing the chip takes out of the model
const pills = computed(() => appliedOptions.value.map(opt => ({
  key: opt.labelId,
  name: opt.name,
  style: labelChipStyle(opt.color),
  value: modelValueOf(opt),
})))

// Refetch labels on open so ones added or renamed elsewhere show up; silent, since
// MultiSelect ignores clicks while `loading`.
function onBeforeShow() {
  isOverlayOpen.value = true
  loadOptions()
}

function syncDraftFromModel() {
  draftValues.value = props.modelValue.map(name => name === null ? NO_LABEL_SENTINEL : name)
}

watch(() => props.modelValue, syncDraftFromModel, { immediate: true })

function applyFilters() {
  emit('update:modelValue', draftValues.value.map(value => value === NO_LABEL_SENTINEL ? null : value))
  multiSelectRef.value?.hide?.()
}

function cancelFilters() {
  syncDraftFromModel()
  multiSelectRef.value?.hide?.()
}

function removePill(pill) {
  emit('update:modelValue', props.modelValue.filter(name => name !== pill.value))
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
        <PillsTrigger :pills="pills" placeholder="Filter by label" :open="isOverlayOpen" @remove="removePill" />
      </template>

      <template #option="slotProps">
        <LabelChip :value="slotProps.option.name" :color="slotProps.option.color" />
      </template>

      <template #footer>
        <div class="panel-footer">
          <div class="footer-buttons">
            <button type="button" class="footer-btn" @click="cancelFilters">
              <span>Cancel</span>
            </button>
            <button type="button" class="footer-btn footer-btn--primary" @click="applyFilters">
              <i class="pi pi-check" />
              <span>Apply</span>
            </button>
          </div>
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
</style>
