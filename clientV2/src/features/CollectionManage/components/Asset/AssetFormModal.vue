<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { computed, ref, toRef } from 'vue'

import LabelChip from '../../../../components/common/Label.vue'
import MetadataEditor from '../../../../components/common/MetadataEditor.vue'
import CommonPickList from '../../../../components/common/PickList.vue'

import { primaryBtnPt, secondaryBtnPt } from '../../../ImportWizard/lib/importDialogPt.js'
import { useAssetForm } from '../../composables/useAssetForm.js'

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
  collectionLabels,
  labelFilter,
  filteredLabels,
  allFilteredSelected,
  labelColor,
  isLabelSelected,
  toggleLabel,
  toggleAllFiltered,
  setLabelRange,
  save: saveAsset,
} = useAssetForm({
  collectionId: toRef(props, 'collectionId'),
  assetId: toRef(props, 'assetId'),
  visible: toRef(props, 'visible'),
})

// Anchor for shift-click range selection over the filtered label list.
const lastLabelIndex = ref(null)

function onLabelRowClick(label, index, event) {
  if (event.shiftKey && lastLabelIndex.value !== null) {
    // Apply the clicked row's *new* state across the whole range.
    const selected = !isLabelSelected(label.labelId)
    setLabelRange(lastLabelIndex.value, index, selected)
  }
  else {
    toggleLabel(label.labelId)
  }
  lastLabelIndex.value = index
}

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

const inputTextPt = {
  root: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border-color: var(--color-border-default); font-size: 1rem; padding: 0.6rem 0.8rem;' },
}

const pickListPt = {
  sourceFilterInput: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border: 1px solid var(--color-border-default); border-radius: 4px; font-size: 0.95rem; padding: 0.35rem 0.6rem; width: 100%;' },
  targetFilterInput: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border: 1px solid var(--color-border-default); border-radius: 4px; font-size: 0.95rem; padding: 0.35rem 0.6rem; width: 100%;' },
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
    :style="{ width: 'min(980px, 96vw)', height: '85vh' }"
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
          <div class="field-header-row">
            <span class="flabel">Labels</span>
            <span class="field-hint">{{ form.labelIds.length }} of {{ collectionLabels.length }} selected</span>
          </div>

          <div v-if="collectionLabels.length === 0" class="no-labels-hint">
            No labels defined for this collection.
          </div>

          <div v-else class="label-picker">
            <div class="label-picker-toolbar">
              <span class="label-search">
                <i class="pi pi-search" />
                <input
                  v-model="labelFilter"
                  type="text"
                  placeholder="Filter labels..."
                  class="label-search-input"
                >
                <button v-if="labelFilter" class="label-search-clear" @click="labelFilter = ''">×</button>
              </span>
              <label class="label-selectall">
                <Checkbox
                  :model-value="allFilteredSelected"
                  :binary="true"
                  @update:model-value="toggleAllFiltered"
                />
                <span>Select all</span>
              </label>
            </div>

            <div class="label-list">
              <div
                v-for="(label, index) in filteredLabels"
                :key="label.labelId"
                class="label-row"
                :class="{ 'label-row--selected': isLabelSelected(label.labelId) }"
                @click="onLabelRowClick(label, index, $event)"
              >
                <Checkbox
                  :model-value="isLabelSelected(label.labelId)"
                  :binary="true"
                  :pt="checkboxPt"
                  @click.stop
                  @update:model-value="toggleLabel(label.labelId)"
                />
                <LabelChip :value="label.name" :color="labelColor(label)" />
              </div>
              <div v-if="filteredLabels.length === 0" class="label-empty">
                No labels match “{{ labelFilter }}”
              </div>
            </div>
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
  gap: 0.65rem;
  padding: 1rem 0.75rem;
}

.modal-header-icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-action-blue-dark);
  font-size: 1.1rem;
}

.modal-header-text {
  flex: 1;
  min-width: 0;
}

.modal-header-title {
  font-size: 1.35rem;
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
  font-size: 1rem;
  color: var(--color-text-primary);
  cursor: pointer;
  flex-shrink: 0;
  padding-bottom: 0.45rem;
  user-select: none;
}

.req-star {
  color: var(--color-action-red);
  font-size: 0.9rem;
}

.name-error {
  font-size: 0.9rem;
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
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: none;
  letter-spacing: normal;
}

.opt-tag {
  font-size: 0.95rem;
  font-weight: 400;
  color: var(--color-text-dim);
  opacity: 0.85;
  margin-left: 0.2rem;
  text-transform: none;
  letter-spacing: 0;
}

.field-hint {
  font-size: 0.95rem;
  color: var(--color-text-dim);
  opacity: 0.85;
}

.fi {
  width: 100%;
  font-size: 1rem;
}

/* Labels */
.no-labels-hint {
  font-size: 0.95rem;
  color: var(--color-text-dim);
  opacity: 0.7;
  padding: 0.4rem 0;
}

.label-picker {
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: var(--color-background-light);
  overflow: hidden;
}

.label-picker-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--color-border-default);
}

.label-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 0.4rem;
}

.label-search .pi-search {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.label-search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: 0.98rem;
  padding: 0.15rem 0;
}

.label-search-input::placeholder {
  color: var(--color-text-dim);
  opacity: 0.7;
}

.label-search-clear {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-dim);
  font-size: 1.05rem;
  line-height: 1;
  padding: 0 0.2rem;
  flex-shrink: 0;
}

.label-search-clear:hover {
  color: var(--color-text-primary);
}

.label-selectall {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.95rem;
  color: var(--color-text-primary);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  flex-shrink: 0;
}

.label-list {
  max-height: 11rem;
  overflow-y: auto;
  padding: 0.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.label-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  user-select: none;
  transition: background 0.12s;
}

.label-row:hover {
  background: var(--color-background-dark);
}

.label-row--selected {
  background: color-mix(in srgb, var(--color-action-blue-dark) 14%, transparent);
}

.label-row--selected:hover {
  background: color-mix(in srgb, var(--color-action-blue-dark) 22%, transparent);
}

.label-empty {
  padding: 0.6rem 0.5rem;
  font-size: 0.95rem;
  color: var(--color-text-dim);
  text-align: center;
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
  font-size: 1.25rem;
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
