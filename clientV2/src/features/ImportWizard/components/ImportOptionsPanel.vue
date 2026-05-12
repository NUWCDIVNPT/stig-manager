<script setup>
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import {
  EMPTY_FIELD_OPTIONS,
  UNREVIEWED_COMMENTED_OPTIONS,
  UNREVIEWED_OPTIONS,
} from '../composables/useImportOptions.js'

const props = defineProps({
  /** The full importOptions object (deep v-model) */
  modelValue: {
    type: Object,
    required: true,
  },
  /** Whether the user has enabled custom import options */
  customizing: {
    type: Boolean,
    required: true,
  },
  /** Show the "Configure custom import options" checkbox */
  showCustomizeCb: {
    type: Boolean,
    default: false,
  },
  /** Whether any customization is allowed at all */
  allowCustom: {
    type: Boolean,
    default: false,
  },
  /** Whether the current user can update existing asset properties */
  canUpdateAssetProps: {
    type: Boolean,
    default: true,
  },
  /** Status options array (Saved / Submitted / Accepted depending on role) */
  statusOptions: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'update:customizing'])

/** Proxy so template can use v-model on the options object fields */
function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function updateAutoStatus(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    autoStatus: { ...props.modelValue.autoStatus, [key]: value },
  })
}

const selectPt = {
  root: {
    style: 'background-color: var(--color-background-darkest) !important; border-color: var(--color-border-default) !important; height: 28px; min-width: 150px; display: inline-flex; align-items: center;',
  },
  label: {
    style: 'padding: 0 8px; color: var(--color-text-primary); font-size: 0.9rem;',
  },
}

const checkboxPt = {
  box: ({ context }) => ({
    style: `background-color: transparent; border-color: var(--color-border-hover); ${context.checked ? 'background-color: var(--color-primary-highlight); border-color: var(--color-primary-highlight);' : ''}`,
  }),
}
</script>

<template>
  <div class="import-options-panel">
    <div class="panel-header">
      <span class="panel-title">Import Options</span>
      <div v-if="showCustomizeCb" class="customize-toggle">
        <Checkbox
          :model-value="customizing"
          binary
          input-id="customizeOptions"
          :pt="checkboxPt"
          @update:model-value="emit('update:customizing', $event)"
        />
        <label for="customizeOptions">Custom Options</label>
      </div>
      <div v-else-if="!allowCustom" class="readonly-badge">
        Read Only
      </div>
    </div>

    <div class="options-body" :class="{ 'options-disabled': !customizing && allowCustom }">
      <div class="options-section">
        <div class="section-title">
          Review Status Per Result
        </div>
        <div class="mapping-grid">
          <div class="mapping-item">
            <label>Fail:</label>
            <Select
              :model-value="modelValue.autoStatus.fail"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              :disabled="!customizing"
              :pt="selectPt"
              @update:model-value="updateAutoStatus('fail', $event)"
            />
          </div>
          <div class="mapping-item">
            <label>NA:</label>
            <Select
              :model-value="modelValue.autoStatus.notapplicable"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              :disabled="!customizing"
              :pt="selectPt"
              @update:model-value="updateAutoStatus('notapplicable', $event)"
            />
          </div>
          <div class="mapping-item">
            <label>Pass:</label>
            <Select
              :model-value="modelValue.autoStatus.pass"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              :disabled="!customizing"
              :pt="selectPt"
              @update:model-value="updateAutoStatus('pass', $event)"
            />
          </div>
        </div>
      </div>

      <div class="options-section">
        <div class="options-row">
          <label>Include unreviewed rules</label>
          <Select
            :model-value="modelValue.unreviewed"
            :options="UNREVIEWED_OPTIONS"
            option-label="label"
            option-value="value"
            :disabled="!customizing"
            :pt="selectPt"
            @update:model-value="update('unreviewed', $event)"
          />
        </div>
        <div class="options-row">
          <label>Unreviewed with a comment</label>
          <Select
            :model-value="modelValue.unreviewedCommented"
            :options="UNREVIEWED_COMMENTED_OPTIONS"
            option-label="label"
            option-value="value"
            :disabled="!customizing || modelValue.unreviewed === 'never'"
            :pt="selectPt"
            @update:model-value="update('unreviewedCommented', $event)"
          />
        </div>
        <div class="options-row">
          <label>Empty detail text</label>
          <Select
            :model-value="modelValue.emptyDetail"
            :options="EMPTY_FIELD_OPTIONS"
            option-label="label"
            option-value="value"
            :disabled="!customizing"
            :pt="selectPt"
            @update:model-value="update('emptyDetail', $event)"
          />
        </div>
        <div class="options-row">
          <label>Empty comment text</label>
          <Select
            :model-value="modelValue.emptyComment"
            :options="EMPTY_FIELD_OPTIONS"
            option-label="label"
            option-value="value"
            :disabled="!customizing"
            :pt="selectPt"
            @update:model-value="update('emptyComment', $event)"
          />
        </div>
      </div>

      <div v-if="canUpdateAssetProps" class="options-section no-border checkbox-row">
        <Checkbox
          :model-value="modelValue.updateAssetProps"
          binary
          input-id="updateAssetProps"
          :disabled="!customizing"
          :pt="checkboxPt"
          @update:model-value="update('updateAssetProps', $event)"
        />
        <label for="updateAssetProps">Update existing Asset properties</label>
      </div>
      <div v-else class="options-section no-border asset-update-note">
        <i class="pi pi-info-circle" />
        <span>Asset property updates are configured in the Manage Collection interface.</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-options-panel {
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background-color: var(--color-background-subtle);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background-color: var(--color-background-light);
  border-bottom: 1px solid var(--color-border-default);
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.panel-title {
  font-weight: 600;
  color: var(--color-text-bright);
  font-size: 0.95rem;
}

.customize-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.customize-toggle label {
  cursor: pointer;
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.readonly-badge {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  font-style: italic;
}

.options-body {
  padding: 0 1rem;
  transition: opacity 0.2s ease;
}

.options-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.options-section {
  padding: 0.8rem 0;
  border-bottom: 1px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 90%;
  margin: 0 auto;
}

.options-section.no-border {
  border-bottom: none;
}

.section-title {
  font-size: 0.88rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-dim);
  font-weight: 600;
}

.mapping-grid {
  display: flex;
  gap: 3rem;
  justify-content: center;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mapping-item label {
  color: var(--color-text-dim);
  font-size: 0.9rem;
  white-space: nowrap;

}

.options-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rem;
}

.options-row label {
  width: 220px;
  color: var(--color-text-dim);
  font-size: 0.9rem;
  text-align: center;
}

.checkbox-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 0.75rem;
  cursor: pointer;
  align-items: center;
}

.checkbox-row label {
  cursor: pointer;
}

.asset-update-note {
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-dim);
  font-size: 0.88rem;
  font-style: italic;
}
</style>
