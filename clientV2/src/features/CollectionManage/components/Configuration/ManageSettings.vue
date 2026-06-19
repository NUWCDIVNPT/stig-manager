<script setup>
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import { computed } from 'vue'
import SaveStatusBadge from '../../../../components/common/SaveStatusBadge.vue'
import { useCollectionSettingsSave } from '../../composables/useCollectionSettingsSave.js'
import { collectionSelectPt } from './pt.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const enabledOptions = [
  { label: 'Always', value: 'always' },
  { label: 'Findings only', value: 'findings' },
]

const requiredOptionsAlways = [
  { label: 'Always', value: 'always' },
  { label: 'Findings only', value: 'findings' },
  { label: 'Optional', value: 'optional' },
]

const requiredOptionsFindings = [
  { label: 'Findings only', value: 'findings' },
  { label: 'Optional', value: 'optional' },
]

const resetCriteriaOptions = [
  { label: 'Review result', value: 'result' },
  { label: 'Any review field', value: 'any' },
]

const minAcceptGrantOptions = [
  { label: 'Manage or Owner', value: 3 },
  { label: 'Owner only', value: 4 },
]

const { state, isLoading, performSave, saveStatus } = useCollectionSettingsSave({
  collectionId: () => props.collectionId,
  buildPayload: state => ({
    fields: {
      detail: { ...state.fields.detail },
      comment: { ...state.fields.comment },
    },
    status: { ...state.status },
    history: { ...state.history },
    importOptions: {
      ...state.importOptions,
      updateAssetProps: state.importOptions.updateAssetProps ?? false,
    },
  }),
})

const onDetailEnabledChange = () => {
  if (state.value.fields.detail.enabled === 'findings') {
    if (state.value.fields.detail.required === 'always') {
      state.value.fields.detail.required = 'findings'
    }
  }
  performSave()
}

const onCommentEnabledChange = () => {
  if (state.value.fields.comment.enabled === 'findings') {
    if (state.value.fields.comment.required === 'always') {
      state.value.fields.comment.required = 'findings'
    }
  }
  performSave()
}

const detailRequiredOptions = computed(() => {
  return state.value?.fields.detail.enabled === 'always'
    ? requiredOptionsAlways
    : requiredOptionsFindings
})

const commentRequiredOptions = computed(() => {
  return state.value?.fields.comment.enabled === 'always'
    ? requiredOptionsAlways
    : requiredOptionsFindings
})
</script>

<template>
  <div class="manage-settings">
    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner" /> Loading settings...
    </div>
    <div v-else-if="state" class="settings-content">
      <div class="panel-status-row">
        <SaveStatusBadge :status="saveStatus" />
      </div>
      <div class="settings-group">
        <h3 class="group-title">
          Review Fields
        </h3>
        <p class="group-desc">
          Control when Detail and Comment fields are shown and required.
        </p>

        <div class="field-row">
          <div class="labeled-field">
            <label class="flabel">Detail Enabled</label>
            <Select v-model="state.fields.detail.enabled" :options="enabledOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="onDetailEnabledChange" />
          </div>
          <div class="labeled-field">
            <label class="flabel">Detail Field Required to Submit</label>
            <Select v-model="state.fields.detail.required" :options="detailRequiredOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="performSave" />
          </div>
        </div>

        <div class="field-row">
          <div class="labeled-field">
            <label class="flabel">Comment Field Enabled</label>
            <Select v-model="state.fields.comment.enabled" :options="enabledOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="onCommentEnabledChange" />
          </div>
          <div class="labeled-field">
            <label class="flabel">Comment Field Required to Submit</label>
            <Select v-model="state.fields.comment.required" :options="commentRequiredOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="performSave" />
          </div>
        </div>
      </div>

      <div class="settings-group">
        <h3 class="group-title">
          Review Status
        </h3>
        <p class="group-desc">
          Configure who can Accept reviews and when statuses should reset.
        </p>

        <div class="labeled-field">
          <label class="flabel">Reset to <i class="pi pi-bookmark" /> Saved upon change to:</label>
          <Select v-model="state.status.resetCriteria" :options="resetCriteriaOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="performSave" />
        </div>

        <div class="labeled-field">
          <div class="checkbox-row">
            <ToggleSwitch v-model="state.status.canAccept" @update:model-value="performSave" />
            <span class="checkbox-label">Reviews can be Accepted or Rejected</span>
          </div>
        </div>

        <div class="labeled-field" :class="{ 'disabled-field': !state.status.canAccept }">
          <label class="flabel">Grant required to set Accept or Reject:</label>
          <Select v-model="state.status.minAcceptGrant" :options="minAcceptGrantOptions" option-label="label" option-value="value" :disabled="!state.status.canAccept" :pt="collectionSelectPt" @update:model-value="performSave" />
        </div>
      </div>

      <div class="settings-group">
        <h3 class="group-title">
          <i class="pi pi-clock" /> Review history
        </h3>
        <p class="group-desc">
          Set the maximum number of history records to retain (0-15). Setting this to 0 disables review history.
        </p>

        <div class="labeled-field field-row-align">
          <label class="flabel">Asset/Rule history records are:</label>
          <div class="input-number-wrapper">
            <InputNumber v-model="state.history.maxReviews" :min="0" :max="15" show-buttons button-layout="horizontal" @update:model-value="performSave">
              <template #incrementicon>
                <span class="pi pi-plus" />
              </template>
              <template #decrementicon>
                <span class="pi pi-minus" />
              </template>
            </InputNumber>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../collection-manage.css";

.input-number-wrapper {
  max-width: 150px;
}

/* InputNumber customization */
:deep(.p-inputnumber) {
  display: flex;
  width: 100%;
}
:deep(.p-inputnumber-input) {
  width: 100%;
  text-align: center;
  background-color: var(--color-background-dark);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-left: none;
  border-right: none;
  padding: 0.5rem;
}
:deep(.p-inputnumber-button) {
  background-color: var(--color-background-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  padding: 0.5rem;
  cursor: pointer;
}
:deep(.p-inputnumber-button:hover) {
  background-color: var(--color-background-subtle);
}
</style>
