<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import { computed, toRef } from 'vue'

import LabelChip from '../../../components/common/Label.vue'
import MetadataEditor from '../../../components/common/MetadataEditor.vue'
import CommonPickList from '../../../components/common/PickList.vue'

import { primaryBtnPt, secondaryBtnPt } from '../../ImportWizard/lib/importDialogPt.js'
import { useAssetForm } from '../composables/useAssetForm.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  assetId: { type: String, default: null },
})

const emit = defineEmits(['update:visible', 'asset-created', 'asset-changed'])

const localVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
})

const {
  isEditMode,
  isLoading,
  isSubmitting,
  isValid,
  nameError,
  form,
  metadataRows,
  assignedStigs,
  pickListValue,
  labelPickerIds,
  unselectedLabels,
  getLabelById,
  labelColor,
  commitLabelPicker,
  removeLabel,
  save: saveAsset,
} = useAssetForm({
  collectionId: toRef(props, 'collectionId'),
  assetId: toRef(props, 'assetId'),
  visible: toRef(props, 'visible'),
})

function close() {
  emit('update:visible', false)
}

async function save() {
  let row
  try {
    row = await saveAsset()
  }
  catch (err) {
    close()
    throw err
  }
  if (row) {
    emit(isEditMode.value ? 'asset-changed' : 'asset-created', row)
    close()
  }
}

// ── Passthrough objects ───────────────────────────────────────────────────────

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); box-shadow: 0 24px 64px rgba(0,0,0,0.6); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim); border-radius: 4px;' },
}

const checkboxPt = {
  box: ({ context }) => ({
    style: `background: ${context.checked ? 'var(--color-action-blue-dark)' : 'var(--color-background-light)'}; border-color: ${context.checked ? 'var(--color-action-blue-dark)' : 'var(--color-border-default)'};`,
  }),
  icon: { style: 'color: white;' },
}

const inputTextPt = {
  root: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border-color: var(--color-border-default); font-size: 0.88rem; padding: 0.45rem 0.65rem;' },
}

const labelPickerPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; display: inline-flex; align-items: center; height: 1.9rem; cursor: pointer; transition: all 0.15s;' },
  labelContainer: { style: 'padding: 0; display: flex; align-items: center;' },
  label: { style: 'padding: 0;' },
  dropdown: { style: 'color: var(--color-text-dim); width: 1.8rem;' },
  panel: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); min-width: 140px;' },
  header: { style: 'padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--color-border-default); display: flex; align-items: center; gap: 0.5rem;' },
  listContainer: { style: 'padding: 0.25rem;' },
  item: ({ context }) => ({
    style: {
      padding: '0.4rem 0.6rem',
      borderRadius: '3px',
      background: context.focused ? 'var(--color-background-light)' : 'transparent',
      cursor: 'pointer',
    },
  }),
  // option checkboxes
  optionCheckbox: {
    box: ({ context }) => ({
      style: `width: 14px; height: 14px; background: ${context.checked ? 'var(--color-action-blue-dark)' : 'var(--color-background-light)'}; border-color: ${context.checked ? 'var(--color-action-blue-dark)' : 'var(--color-border-default)'};`,
    }),
    icon: { style: 'color: white;' },
  },
  // select-all header checkbox
  headerCheckbox: {
    box: ({ context }) => ({
      style: `background: ${context.checked ? 'var(--color-action-blue-dark)' : 'var(--color-background-light)'}; border-color: ${context.checked ? 'var(--color-action-blue-dark)' : 'var(--color-border-default)'};`,
    }),
    icon: { style: 'color: white;' },
  },
}

const pickListPt = {
  sourceFilterInput: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border: 1px solid var(--color-border-default); border-radius: 4px; font-size: 0.82rem; padding: 0.2rem 0.5rem; width: 100%;' },
  targetFilterInput: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border: 1px solid var(--color-border-default); border-radius: 4px; font-size: 0.82rem; padding: 0.2rem 0.5rem; width: 100%;' },
  sourceControls: {
    moveUpButton: { root: { style: 'border-radius: 4px;' } },
    moveDownButton: { root: { style: 'border-radius: 4px;' } },
    moveTopButton: { root: { style: 'border-radius: 4px;' } },
    moveBottomButton: { root: { style: 'border-radius: 4px;' } },
  },
  transferControls: {
    moveToTargetButton: { root: { style: 'border-radius: 4px;' } },
    moveAllToTargetButton: { root: { style: 'border-radius: 4px;' } },
    moveToSourceButton: { root: { style: 'border-radius: 4px;' } },
    moveAllToSourceButton: { root: { style: 'border-radius: 4px;' } },
  },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: 'min(760px, 96vw)', height: '82vh' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-server" />
        </div>
        <div class="modal-header-text">
          <div class="modal-header-title">
            {{ isEditMode ? 'Edit Asset' : 'Create new Asset' }}
          </div>
        </div>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--color-text-dim)" />
    </div>

    <div v-else class="form-body">
      <!-- ── Asset details ────────────────────────────────────────────────────── -->
      <div class="form-section">
        <!-- Name + noncomputing -->
        <div class="row row--name">
          <div class="labeled-field field--grow">
            <label class="flabel" for="am-name">Name <span class="req-star">*</span></label>
            <InputText
              id="am-name"
              v-model="form.name"
              :invalid="!!nameError"
              :pt="inputTextPt"
              style="width: 100%"
            />
          </div>
          <label class="noncomputing-label">
            <Checkbox v-model="form.noncomputing" :binary="true" :pt="checkboxPt" />
            <span>Non-computing</span>
          </label>
        </div>
        <div v-if="nameError" class="name-error">
          {{ nameError }}
        </div>

        <!-- FQDN / IP / MAC -->
        <div class="row row--3col">
          <div class="labeled-field">
            <span class="flabel">FQDN <span class="opt-tag">optional</span></span>
            <InputText v-model="form.fqdn" placeholder="Enter FQDN" :pt="inputTextPt" class="fi" />
          </div>
          <div class="labeled-field">
            <span class="flabel">IP address <span class="opt-tag">optional</span></span>
            <InputText v-model="form.ip" placeholder="Enter IP address" :pt="inputTextPt" class="fi" />
          </div>
          <div class="labeled-field">
            <span class="flabel">MAC address <span class="opt-tag">optional</span></span>
            <InputText v-model="form.mac" placeholder="Enter MAC address" :pt="inputTextPt" class="fi" />
          </div>
        </div>

        <!-- Labels -->
        <div class="labeled-field">
          <span class="flabel">Labels</span>
          <div class="label-chips-row">
            <span
              v-for="id in form.labelIds"
              :key="id"
              class="label-chip-wrapper"
            >
              <LabelChip :value="getLabelById(id)?.name ?? ''" :color="labelColor(getLabelById(id))" />
              <button class="chip-x" @click.stop="removeLabel(id)">×</button>
            </span>
            <MultiSelect
              v-if="unselectedLabels.length > 0"
              v-model="labelPickerIds"
              :options="unselectedLabels"
              option-label="name"
              option-value="labelId"
              :pt="labelPickerPt"
              :show-toggle-all="true"
              placeholder="Add label"
              @hide="commitLabelPicker"
            >
              <template #value="slotProps">
                <div style="font-size: 0.85rem; font-weight: 500; color: var(--color-text-primary); padding: 0 0.2rem 0 0.6rem; white-space: nowrap; display: flex; align-items: center; gap: 0.35rem;">
                  <i class="pi pi-plus" style="font-size: 0.75rem; color: var(--color-text-dim);" />
                  <span>{{ slotProps.value && slotProps.value.length ? `${slotProps.value.length} selected` : slotProps.placeholder }}</span>
                </div>
              </template>
              <template #option="{ option }">
                <LabelChip :value="option.name" :color="labelColor(option)" />
              </template>
            </MultiSelect>
            <span v-else-if="form.labelIds.length === 0" class="no-labels-hint">None</span>
          </div>
        </div>

        <!-- Metadata -->
        <MetadataEditor v-model="metadataRows" />
      </div>

      <!-- ── STIG Assignments ─────────────────────────────────────────────────── -->
      <div class="stig-section">
        <div class="stig-section-header">
          <span class="stig-section-title">STIG Assignments</span>
          <span class="field-hint">{{ assignedStigs.length }} assigned</span>
        </div>
        <CommonPickList
          v-model="pickListValue"
          data-key="benchmarkId"
          :show-source-filter="true"
          :show-target-filter="true"
          filter-by="benchmarkId"
          source-filter-placeholder="Search STIGs..."
          target-filter-placeholder="Search assigned..."
          :pt="pickListPt"
        >
          <template #sourceheader>
            Available
          </template>
          <template #targetheader>
            Assigned
          </template>
          <template #item="{ item }">
            <span>{{ item.benchmarkId }}</span>
          </template>
        </CommonPickList>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" @click="close" />
        <Button
          :label="isEditMode ? 'Save asset' : 'Create asset'"
          :pt="primaryBtnPt"
          :loading="isSubmitting"
          :disabled="!isValid"
          @click="save"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* ── Modal header ──────────────────────────────────────────────────────────── */

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
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
  flex-shrink: 0;
  color: var(--color-action-blue-dark);
  font-size: 0.9rem;
}

.modal-header-text {
  flex: 1;
  min-width: 0;
}

.modal-header-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-bright);
  line-height: 1.3;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.form-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem 2rem;
  border-bottom: 1px solid var(--color-border-default);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.row--name {
  align-items: flex-end;
}

.row--3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  align-items: start;
}

.field--grow {
  flex: 1;
}

.noncomputing-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-size: 0.88rem;
  color: var(--color-text-primary);
  cursor: pointer;
  flex-shrink: 0;
  padding-bottom: 0.35rem;
  user-select: none;
}

.req-star {
  color: var(--color-action-red);
  font-size: 0.8rem;
}

.name-error {
  font-size: 0.8rem;
  color: var(--color-text-error);
  margin-top: -0.5rem;
}

.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.flabel {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: none;
  letter-spacing: normal;
}

.opt-tag {
  font-size: 0.87rem;
  font-weight: 400;
  color: var(--color-text-dim);
  opacity: 0.85;
  margin-left: 0.2rem;
  text-transform: none;
  letter-spacing: 0;
}

.field-hint {
  font-size: 0.87rem;
  color: var(--color-text-dim);
  opacity: 0.85;
}

.fi {
  width: 100%;
  font-size: 0.88rem;
}

/* Labels */
.label-chips-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
}

.no-labels-hint {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  opacity: 0.5;
}

.label-chip-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.chip-x {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-dim);
  opacity: 0.8;
  padding: 0 0.1rem;
  font-size: 1.1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  transition: opacity 0.15s, color 0.15s;
}

.chip-x:hover {
  opacity: 1;
  color: #f87171;
}

/* ── STIG section ──────────────────────────────────────────────────────────── */

.stig-section {
  flex: 0 0 45%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
}

.stig-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.stig-section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: none;
  letter-spacing: normal;
}

/* ── Footer ────────────────────────────────────────────────────────────────── */

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.8rem;
  padding: 0.75rem 1.25rem;
}
</style>
