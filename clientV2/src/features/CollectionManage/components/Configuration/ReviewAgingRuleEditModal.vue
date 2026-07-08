<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { computed, reactive, ref, watch } from 'vue'
import collectionIcon from '../../../../assets/collection.svg'
import labelIcon from '../../../../assets/label.svg'
import shieldGreenCheckIcon from '../../../../assets/shield-green-check.svg'
import targetIcon from '../../../../assets/target.svg'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import {
  fetchAssetStigs,
  fetchCollectionAssets,
  fetchCollectionLabels,
  fetchCollectionStigs,
} from '../../api/tasksManageApi.js'
import { useLazyResource } from '../../composables/useLazyResource.js'
import { collectionInputTextPt, collectionSelectPt } from './pt.js'
import {
  ACTION_OPTIONS,
  defaultForm,
  formToRule,
  INTERVAL_UNIT_OPTIONS,
  isCollectionTarget,
  ruleToForm,
  TRIGGER_FIELD_OPTIONS,
  UPDATE_FIELD_OPTIONS,
  updateValueOptions,
} from './reviewAgingLogic.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  // Existing grid rule for edit/view mode, or null to create a new rule.
  rule: { type: Object, default: null },
  isReadOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'save'])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const isEditMode = computed(() => !!props.rule)

const title = computed(() => {
  if (props.isReadOnly) {
    return 'View Rule'
  }
  return isEditMode.value ? 'Edit Rule' : 'New Rule'
})

const form = reactive(defaultForm())

const targetScope = ref('Collection')
const scopeOptions = ['Collection', 'Asset', 'Label', 'STIG']

const scopeIconMap = {
  Collection: collectionIcon,
  Asset: targetIcon,
  Label: labelIcon,
  STIG: shieldGreenCheckIcon,
}

const selectedAsset = ref(null)
const selectedLabel = ref(null)
const selectedStigId = ref(null)

// Collection-level pickers: fetched lazily and cached until the modal needs
// them. useLazyResource folds the "fetch once" guard into ensure().
const { items: allAssets, isLoading: isLoadingAssets, ensure: ensureAssets }
  = useLazyResource(() => fetchCollectionAssets(props.collectionId))
const { items: allLabels, ensure: ensureLabels }
  = useLazyResource(() => fetchCollectionLabels(props.collectionId))
const { items: collectionStigs, ensure: ensureCollectionStigs }
  = useLazyResource(() => fetchCollectionStigs(props.collectionId))

const { state: assetStigs, execute: loadAssetStigs } = useAsyncState(
  assetId => fetchAssetStigs(assetId),
  { initialState: [], immediate: false },
)

const { state: labelStigs, execute: loadLabelStigs } = useAsyncState(
  labelId => fetchCollectionStigs(props.collectionId, labelId),
  { initialState: [], immediate: false },
)

const availableStigs = computed(() => {
  let raw = []
  if (targetScope.value === 'Asset' && selectedAsset.value) {
    raw = assetStigs.value || []
  }
  else if (targetScope.value === 'Label' && selectedLabel.value) {
    raw = labelStigs.value || []
  }
  else {
    raw = collectionStigs.value || []
  }
  return raw.map(r => typeof r === 'string' ? r : (r.benchmarkId || r))
})

const isTargetValid = computed(() => {
  if (targetScope.value === 'Collection') {
    return true
  }
  if (targetScope.value === 'Asset') {
    return !!selectedAsset.value
  }
  if (targetScope.value === 'Label') {
    return !!selectedLabel.value
  }
  if (targetScope.value === 'STIG') {
    return !!selectedStigId.value
  }
  return false
})

const titleError = computed(() => {
  if (!form.title?.trim()) {
    return 'Rule title is required'
  }
  return ''
})

const updateValueChoices = computed(() => updateValueOptions(form.updateField))
const showUpdateFields = computed(() => form.triggerAction === 'update')

const isValid = computed(() => !titleError.value && isTargetValid.value)

// Keep the first update value valid whenever the update field changes.
watch(() => form.updateField, (field) => {
  const options = updateValueOptions(field)
  if (!options.some(o => o.value === form.updateValue)) {
    form.updateValue = options[0]?.value ?? null
  }
})

function initPickersFromTarget(newTarget) {
  if (isCollectionTarget(newTarget)) {
    targetScope.value = 'Collection'
    selectedAsset.value = null
    selectedLabel.value = null
    selectedStigId.value = null
  }
  else if (newTarget.asset) {
    targetScope.value = 'Asset'
    selectedAsset.value = newTarget.asset
    selectedStigId.value = newTarget.benchmarkId || null
  }
  else if (newTarget.label) {
    targetScope.value = 'Label'
    selectedLabel.value = newTarget.label
    selectedStigId.value = newTarget.benchmarkId || null
  }
  else if (newTarget.benchmarkId) {
    targetScope.value = 'STIG'
    selectedAsset.value = null
    selectedLabel.value = null
    selectedStigId.value = newTarget.benchmarkId
  }
}

function onScopeChange() {
  selectedAsset.value = null
  selectedLabel.value = null
  selectedStigId.value = null
}

watch(targetScope, (newScope) => {
  if (newScope === 'Asset') {
    ensureAssets()
  }
}, { immediate: true })

watch(selectedAsset, (asset) => {
  if (asset) {
    loadAssetStigs(asset.assetId)
  }
})

watch(selectedLabel, (label) => {
  if (label) {
    loadLabelStigs(label.labelId)
  }
})

watch([targetScope, selectedAsset, selectedLabel, selectedStigId], () => {
  if (targetScope.value === 'Collection') {
    form.target = { collection: true }
  }
  else if (targetScope.value === 'Asset') {
    form.target = {
      asset: selectedAsset.value || null,
      benchmarkId: selectedStigId.value || undefined,
    }
  }
  else if (targetScope.value === 'Label') {
    form.target = {
      label: selectedLabel.value || null,
      benchmarkId: selectedStigId.value || undefined,
    }
  }
  else if (targetScope.value === 'STIG') {
    form.target = {
      benchmarkId: selectedStigId.value || null,
    }
  }
})

watch(() => props.visible, (open) => {
  if (open) {
    Object.assign(form, ruleToForm(props.rule))
    initPickersFromTarget(form.target)

    ensureLabels()
    ensureCollectionStigs()
  }
})

function close() {
  emit('update:visible', false)
}

function onSave() {
  if (props.isReadOnly || !isValid.value) {
    return
  }
  emit('save', formToRule(form))
  close()
}

const inputNumberPt = {
  pcInputText: {
    root: { style: 'width: 100%; text-align: center; background-color: var(--color-background-dark); color: var(--color-text-primary); border: 1px solid var(--color-border-default); border-left: none; border-right: none; padding: 0.5rem; min-width: 0;' },
  },
}

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: 'min(650px, 96vw)', height: 'min(890px, 92vh)' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-clock" />
        </div>
        <div class="modal-header-title">
          {{ title }}
        </div>
      </div>
    </template>

    <div class="form-body">
      <div class="top-row">
        <div class="labeled-field grow">
          <div class="field-header-row">
            <label class="flabel" for="ra-title">Title <span class="req-star">*</span></label>
            <span class="char-count">{{ form.title?.length ?? 0 }} / 45</span>
          </div>
          <InputText
            id="ra-title"
            v-model="form.title"
            :pt="collectionInputTextPt(!!titleError)"
            :disabled="isReadOnly"
            maxlength="45"
            placeholder="Rule title"
          />
          <div class="field-error" :class="{ 'field-error--hidden': !titleError }">
            {{ titleError || 'Placeholder' }}
          </div>
        </div>
        <div class="enabled-field">
          <label class="flabel" for="ra-enabled">Enabled</label>
          <Checkbox
            v-model="form.enabled"
            input-id="ra-enabled"
            :disabled="isReadOnly"
            binary
          />
        </div>
      </div>

      <div class="ra-group">
        <h3 class="ra-group-title">
          Target
        </h3>
        <div class="target-pickers">
          <div class="labeled-field">
            <label class="flabel">Target Scope</label>
            <Select
              v-model="targetScope"
              :options="scopeOptions"
              :disabled="isReadOnly"
              :pt="collectionSelectPt"
              @change="onScopeChange"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="select-option-with-icon">
                  <img v-if="scopeIconMap[slotProps.value]" :src="scopeIconMap[slotProps.value]" class="label-icon" alt="">
                  <span>{{ slotProps.value }}</span>
                </div>
              </template>
              <template #option="slotProps">
                <div class="select-option-with-icon">
                  <img v-if="scopeIconMap[slotProps.option]" :src="scopeIconMap[slotProps.option]" class="label-icon" alt="">
                  <span>{{ slotProps.option }}</span>
                </div>
              </template>
            </Select>
          </div>

          <div class="labeled-field">
            <label class="flabel">
              <img :src="targetIcon" class="label-icon" alt="">
              Select Asset <span v-if="targetScope === 'Asset'" class="req-star">*</span>
            </label>
            <Select
              v-model="selectedAsset"
              :options="allAssets"
              option-label="name"
              filter
              :loading="isLoadingAssets"
              :virtual-scroller-options="{ itemSize: 34 }"
              :disabled="isReadOnly || targetScope !== 'Asset'"
              placeholder="Search for an asset..."
              :pt="collectionSelectPt"
            />
          </div>

          <div class="labeled-field">
            <label class="flabel">
              <img :src="labelIcon" class="label-icon" alt="">
              Select Label <span v-if="targetScope === 'Label'" class="req-star">*</span>
            </label>
            <Select
              v-model="selectedLabel"
              :options="allLabels"
              option-label="name"
              filter
              :disabled="isReadOnly || targetScope !== 'Label'"
              placeholder="Search for a label..."
              :pt="collectionSelectPt"
            />
          </div>

          <div class="labeled-field">
            <label class="flabel">
              <img :src="shieldGreenCheckIcon" class="label-icon" alt="">
              {{ targetScope === 'STIG' ? 'Select STIG' : 'Specific STIG (Optional)' }}
              <span v-if="targetScope === 'STIG'" class="req-star">*</span>
            </label>
            <Select
              v-model="selectedStigId"
              :options="availableStigs"
              filter
              :disabled="isReadOnly || targetScope === 'Collection'"
              :placeholder="targetScope === 'STIG' ? 'Search for a STIG...' : 'All STIGs'"
              :show-clear="targetScope !== 'STIG'"
              :pt="collectionSelectPt"
            />
          </div>
        </div>
      </div>

      <div class="ra-group">
        <h3 class="ra-group-title">
          Trigger
        </h3>
        <div class="labeled-field">
          <label class="flabel" for="ra-trigger-field">Trigger field</label>
          <Select
            id="ra-trigger-field"
            v-model="form.triggerField"
            :options="TRIGGER_FIELD_OPTIONS"
            option-label="label"
            option-value="value"
            :disabled="isReadOnly"
            :pt="collectionSelectPt"
          />
        </div>
        <div class="labeled-field">
          <label class="flabel">Interval</label>
          <div class="interval-row">
            <InputNumber
              v-model="form.intervalValue"
              :min="1"
              :disabled="isReadOnly"
              :use-grouping="false"
              show-buttons
              button-layout="horizontal"
              class="interval-number"
              :pt="inputNumberPt"
            >
              <template #incrementicon>
                <i class="pi pi-plus" />
              </template>
              <template #decrementicon>
                <i class="pi pi-minus" />
              </template>
            </InputNumber>
            <Select
              v-model="form.intervalUnit"
              :options="INTERVAL_UNIT_OPTIONS"
              option-label="label"
              option-value="value"
              :disabled="isReadOnly"
              :pt="collectionSelectPt"
              class="interval-unit"
            />
          </div>
        </div>
      </div>

      <div class="ra-group">
        <h3 class="ra-group-title">
          Action
        </h3>
        <div class="labeled-field">
          <label class="flabel" for="ra-action">Action</label>
          <Select
            id="ra-action"
            v-model="form.triggerAction"
            :options="ACTION_OPTIONS"
            option-label="label"
            option-value="value"
            :disabled="isReadOnly"
            :pt="collectionSelectPt"
          />
        </div>
        <div class="labeled-field">
          <label class="flabel" for="ra-update-field">Update field</label>
          <Select
            id="ra-update-field"
            v-model="form.updateField"
            :options="UPDATE_FIELD_OPTIONS"
            option-label="label"
            option-value="value"
            :disabled="isReadOnly || !showUpdateFields"
            :pt="collectionSelectPt"
          />
        </div>
        <div class="labeled-field">
          <label class="flabel" for="ra-update-value">Update value</label>
          <Select
            id="ra-update-value"
            v-model="form.updateValue"
            :options="updateValueChoices"
            option-label="label"
            option-value="value"
            :disabled="isReadOnly || !showUpdateFields"
            :pt="collectionSelectPt"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" @click="close" />
        <Button
          v-if="!isReadOnly"
          label="Save"
          :pt="primaryBtnPt"
          :disabled="!isValid"
          @click="onSave"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
}

.modal-header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-action-blue-dark);
  flex-shrink: 0;
}

.modal-header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem 1.25rem;
  overflow-x: hidden;
}

.top-row {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
}

.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.grow {
  flex: 1;
}

.enabled-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding-top: 0.1rem;
}

.field-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flabel {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.req-star {
  color: var(--color-text-error);
}

.label-icon {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
  display: block;
}

.select-option-with-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.char-count {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.field-error {
  font-size: 0.85rem;
  line-height: 1.2;
  min-height: 1.2em;
  color: var(--color-text-error);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.field-error--hidden {
  visibility: hidden;
}

.ra-group {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 1.25rem;
}

.ra-group-title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-dim);
}
.target-pickers {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.interval-row {
  display: flex;
  gap: 0.6rem;
}

.interval-number {
  flex: 1;
  min-width: 0;
  display: flex;
}

.interval-unit {
  flex: 1;
  min-width: 0;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  justify-content: flex-end;
}
</style>
