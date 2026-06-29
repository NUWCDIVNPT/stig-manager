<script setup>
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import { computed, ref, watch } from 'vue'
import shieldSvg from '../../../../assets/shield-green-check.svg'
import targetSvg from '../../../../assets/target.svg'
import LabelChip from '../../../../components/common/Label.vue'
import { apiCall } from '../../../../shared/api/apiClient.js'
import { fetchCollectionLabels, fetchCollectionStigs } from '../../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { normalizeColor } from '../../../../shared/lib/colorUtils.js'
import { useLazyResource } from '../../composables/useLazyResource.js'
import { isDuplicateAclRule } from '../../lib/aclRules.js'
import AclResourceDisplay from './AclResourceDisplay.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  // acls used if we need to check for duplicates already set for this user
  rules: {
    type: Array,
    default: () => [],
  },
  active: {
    type: Boolean,
    default: false,
  },
})

// this emmites preview so the parent has the data disable buttons and actually adding
const emit = defineEmits(['preview'])

// select options for the scope tabs
const SCOPE_OPTIONS = [
  { label: 'Whole Collection', value: 'collection' },
  { label: 'Asset', value: 'asset' },
  { label: 'Label', value: 'label' },
]

const scope = ref('collection')
const selectedAsset = ref(null)
const selectedLabel = ref(null)
const selectedBenchmarkId = ref(null)

const { items: assets, isLoading: assetsLoading, ensure: ensureAssets, reset: resetAssets }
  = useLazyResource(() => apiCall('getAssets', { collectionId: props.collectionId }))
const { items: labels, isLoading: labelsLoading, ensure: ensureLabels, reset: resetLabels }
  = useLazyResource(() => fetchCollectionLabels(props.collectionId))

// STIG options for the current scope. The fetcher reads scope/selection
// reactively and is (re)run by the watcher below via execute(). useAsyncState
// owns the loading flag, routes failures to the global error modal, and discards
// stale responses when the scope changes mid-flight (generation + AbortController),
// so a slow earlier fetch can't clobber a newer one.
const { state: stigs, isLoading: stigsLoading, execute: loadStigs } = useAsyncState(
  () => {
    if (scope.value === 'collection') {
      return fetchCollectionStigs(props.collectionId)
    }
    if (scope.value === 'asset' && selectedAsset.value) {
      return apiCall('getAsset', { assetId: selectedAsset.value.assetId, projection: 'stigs' })
        .then(asset => asset.stigs ?? [])
    }
    if (scope.value === 'label' && selectedLabel.value) {
      return fetchCollectionStigs(props.collectionId, { labelId: selectedLabel.value.labelId })
    }
    return []
  },
  { immediate: false, initialState: [] },
)

watch([scope, selectedAsset, selectedLabel, () => props.active], ([, , , isActive]) => {
  if (!isActive) {
    return
  }
  loadStigs()
}, { immediate: true })

// on scope change clear selections for other scopes.
// We call ensure() to lazily fetch the necessary dropdown options (like Assets or Labels)
// only when the user actually navigates to that tab. ensure() guarantees we only hit the API once.
watch(scope, (value) => {
  selectedAsset.value = null
  selectedLabel.value = null
  selectedBenchmarkId.value = null
  if (value === 'asset') {
    ensureAssets()
  }
  else if (value === 'label') {
    ensureLabels()
  }
})

watch([selectedAsset, selectedLabel], () => {
  selectedBenchmarkId.value = null
})

// used to enable buttons
const scopeReady = computed(() => {
  if (scope.value === 'asset') {
    return !!selectedAsset.value
  }
  if (scope.value === 'label') {
    return !!selectedLabel.value
  }
  return true
})

// takes the current selections and builds a rule for the parent
function buildRule(access) {
  const rule = {
    benchmarkId: selectedBenchmarkId.value || undefined,
    assetId: undefined,
    assetName: undefined,
    labelId: undefined,
    labelName: undefined,
    label: undefined,
    access,
  }
  if (scope.value === 'asset' && selectedAsset.value) {
    rule.assetId = selectedAsset.value.assetId
    rule.assetName = selectedAsset.value.name
  }
  else if (scope.value === 'label' && selectedLabel.value) {
    const l = selectedLabel.value
    rule.labelId = l.labelId
    rule.labelName = l.name
    rule.label = { labelId: l.labelId, name: l.name, color: l.color }
  }
  return rule
}

// create a preview of the rule
const previewRule = computed(() => (scopeReady.value ? buildRule('r') : null))
// checks if the preview rule is a duplicate of an existing rule
const isPreviewDuplicate = computed(() =>
  !!previewRule.value && isDuplicateAclRule(props.rules, previewRule.value))

// emit when the preview changes
watch(previewRule, value => emit('preview', value), { immediate: true })

// reset the builder when the active prop changes
watch(() => props.active, (isActive) => {
  if (isActive) {
    scope.value = 'collection'
    clear()
    resetAssets()
    resetLabels()
  }
}, { immediate: true })

function clear() {
  selectedAsset.value = null
  selectedLabel.value = null
  selectedBenchmarkId.value = null
}

defineExpose({ clear })
</script>

<template>
  <div class="builder">
    <p class="builder-intro">
      Pick what this rule applies to, then <strong>Add</strong> it with an access level.
    </p>

    <div class="field">
      <span class="field-label">Scope</span>
      <SelectButton
        v-model="scope"
        :options="SCOPE_OPTIONS"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        class="scope-buttons"
        :pt="{ button: { style: 'flex: 1;' } }"
      />
    </div>

    <div v-if="scope === 'asset'" class="field">
      <label class="field-label">Asset</label>
      <Select
        v-model="selectedAsset"
        :options="assets"
        :loading="assetsLoading"
        option-label="name"
        data-key="assetId"
        filter
        reset-filter-on-hide
        :virtual-scroller-options="{ itemSize: 38 }"
        scroll-height="min(40vh, 320px)"
        placeholder="Select an asset"
        class="builder-input"
        :pt="{ label: { style: 'font-size: 1.15rem;' }, item: { style: 'font-size: 1.15rem;' } }"
      >
        <template #value="{ value, placeholder }">
          <span v-if="value" class="builder-option">
            <img :src="targetSvg" class="svg-icon">
            <span>{{ value.name }}</span>
          </span>
          <span v-else class="builder-placeholder">{{ placeholder }}</span>
        </template>
        <template #option="{ option }">
          <span class="builder-option">
            <img :src="targetSvg" class="svg-icon">
            <span>{{ option.name }}</span>
          </span>
        </template>
      </Select>
    </div>

    <div v-else-if="scope === 'label'" class="field">
      <label class="field-label">Label</label>
      <Select
        v-model="selectedLabel"
        :options="labels"
        :loading="labelsLoading"
        option-label="name"
        data-key="labelId"
        filter
        reset-filter-on-hide
        :virtual-scroller-options="{ itemSize: 38 }"
        scroll-height="min(40vh, 320px)"
        placeholder="Select a label"
        class="builder-input"
        :pt="{ label: { style: 'font-size: 1.15rem;' }, item: { style: 'font-size: 1.15rem;' } }"
      >
        <template #value="{ value, placeholder }">
          <LabelChip v-if="value" :value="value.name" :color="normalizeColor(value.color)" />
          <span v-else class="builder-placeholder">{{ placeholder }}</span>
        </template>
        <template #option="{ option }">
          <LabelChip :value="option.name" :color="normalizeColor(option.color)" />
        </template>
      </Select>
    </div>

    <div class="field">
      <label class="field-label">
        STIG <span class="field-optional">optional</span>
      </label>
      <Select
        v-model="selectedBenchmarkId"
        :options="stigs"
        :loading="stigsLoading"
        option-label="benchmarkId"
        option-value="benchmarkId"
        filter
        show-clear
        reset-filter-on-hide
        :virtual-scroller-options="{ itemSize: 38 }"
        scroll-height="min(40vh, 320px)"
        placeholder="Any STIG"
        class="builder-input"
        :pt="{ label: { style: 'font-size: 1.15rem;' }, item: { style: 'font-size: 1.15rem;' } }"
      >
        <template #option="{ option }">
          <span class="builder-option">
            <img :src="shieldSvg" class="svg-icon">
            <span>{{ option.benchmarkId }}</span>
          </span>
        </template>
      </Select>
    </div>

    <div class="builder-spacer" />

    <div class="rule-preview">
      <span class="rule-preview-label">Rule preview</span>
      <AclResourceDisplay v-if="previewRule" :rule="previewRule" />
      <span v-else class="rule-preview-hint">
        {{ scope === 'asset' ? 'Select an asset to continue.' : 'Select a label to continue.' }}
      </span>
      <span v-if="isPreviewDuplicate" class="rule-preview-dupe">
        <i class="pi pi-exclamation-triangle" /> This rule already exists.
      </span>
    </div>
  </div>
</template>

<style scoped>
.builder {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.25rem;
  overflow-y: auto;
}

.builder-intro {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--color-text-dim);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 400;
  color: var(--color-text-bright);
}

.field-optional {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--color-background-subtle);
  color: var(--color-text-dim);
}

.scope-buttons {
  display: flex;
  width: 100%;
}

.builder-input {
  width: 100%;
}

.builder-option {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
}

.builder-placeholder {
  color: var(--color-text-dim);
  font-size: 1.15rem;
}

.builder-spacer {
  flex: 1 1 auto;
  min-height: 0.5rem;
}

.rule-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.8rem 0.9rem;
  border: 1px dashed var(--color-border-default);
  border-radius: 8px;
  background: var(--p-datatable-row-background);
}

.rule-preview-label {
  font-size: 1rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-dim);
}

.rule-preview-hint {
  font-size: 1.25rem;
  font-style: italic;
  color: var(--color-text-dim);
}

.rule-preview-dupe {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.1rem;
  color: var(--color-warning-orange);
}

.svg-icon {
  width: 1.1em;
  height: 1.1em;
  object-fit: contain;
}
</style>
