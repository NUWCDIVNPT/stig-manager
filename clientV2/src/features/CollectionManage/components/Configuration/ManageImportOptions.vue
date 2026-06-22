<script setup>
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import SaveStatusBadge from '../../../../components/common/SaveStatusBadge.vue'
import { useCollectionSettingsSave } from '../../composables/useCollectionSettingsSave.js'
import { normalizeImportOptions } from './importOptionsLogic.js'
import { collectionSelectPt } from './pt.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const statusOptions = [
  { label: 'Keep existing', value: 'null' },
  { label: 'Saved', value: 'saved' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Accepted', value: 'accepted' },
]

const unreviewedOptions = [
  { label: 'Never', value: 'never' },
  { label: 'Having comments', value: 'commented' },
  { label: 'Always', value: 'always' },
]

const unreviewedCommentedOptions = [
  { label: 'Informational', value: 'informational' },
  { label: 'Not Reviewed', value: 'notchecked' },
]

const emptyOptions = [
  { label: 'Ignored', value: 'ignore' },
  { label: 'Replaced', value: 'replace' },
  { label: 'Imported', value: 'import' },
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
    },
  }),
  normalizeSettings: (settings) => {
    settings.importOptions = normalizeImportOptions(settings.importOptions)
    return settings
  },
})
</script>

<template>
  <div class="manage-import-options">
    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner" /> Loading import options...
    </div>
    <div v-else-if="state" class="settings-content">
      <div class="panel-status-row">
        <SaveStatusBadge :status="saveStatus" />
      </div>
      <div class="settings-group">
        <h3 class="group-title">
          Review Status Per Result
        </h3>

        <div class="labeled-field">
          <label class="flabel">Fail:</label>
          <Select v-model="state.importOptions.autoStatus.fail" :options="statusOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="performSave" />
        </div>

        <div class="labeled-field">
          <label class="flabel">Not Applicable:</label>
          <Select v-model="state.importOptions.autoStatus.notapplicable" :options="statusOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="performSave" />
        </div>

        <div class="labeled-field">
          <label class="flabel">Pass:</label>
          <Select v-model="state.importOptions.autoStatus.pass" :options="statusOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="performSave" />
        </div>
      </div>

      <div class="settings-group">
        <div class="field-row">
          <div class="labeled-field">
            <label class="flabel">Include unreviewed rules:</label>
            <Select v-model="state.importOptions.unreviewed" :options="unreviewedOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="performSave" />
          </div>

          <div class="labeled-field" :class="{ 'disabled-field': state.importOptions.unreviewed === 'never' }">
            <label class="flabel">Unreviewed with a comment is:</label>
            <Select v-model="state.importOptions.unreviewedCommented" :options="unreviewedCommentedOptions" option-label="label" option-value="value" :disabled="state.importOptions.unreviewed === 'never'" :pt="collectionSelectPt" @update:model-value="performSave" />
          </div>
        </div>

        <div class="field-row">
          <div class="labeled-field">
            <label class="flabel">Empty detail text is:</label>
            <Select v-model="state.importOptions.emptyDetail" :options="emptyOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="performSave" />
          </div>

          <div class="labeled-field">
            <label class="flabel">Empty comment text is:</label>
            <Select v-model="state.importOptions.emptyComment" :options="emptyOptions" option-label="label" option-value="value" :pt="collectionSelectPt" @update:model-value="performSave" />
          </div>
        </div>

        <div class="labeled-field">
          <div class="checkbox-row">
            <ToggleSwitch v-model="state.importOptions.updateAssetProps" @update:model-value="performSave" />
            <span class="checkbox-label">Update existing Asset properties <i class="pi pi-question-circle" /></span>
          </div>
        </div>

        <div class="labeled-field">
          <div class="checkbox-row">
            <ToggleSwitch v-model="state.importOptions.allowCustom" @update:model-value="performSave" />
            <span class="checkbox-label">Options can be customized for each import</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../collection-manage.css";
</style>
