<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import { computed, reactive, ref, watch } from 'vue'

import LabelChip from '../../../components/common/Label.vue'
import MetadataEditor from '../../../components/common/MetadataEditor.vue'
import CommonPickList from '../../../components/common/PickList.vue'

import { fetchCollectionAssetSummary, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { fetchStigs } from '../../../shared/api/stigsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { normalizeColor } from '../../../shared/lib/colorUtils.js'
import { primaryBtnPt, secondaryBtnPt } from '../../ImportWizard/lib/importDialogPt.js'
import { createAsset, fetchAssetWithStigs, replaceAsset } from '../api/assetManageApi.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  assetId: { type: String, default: null },
})

const emit = defineEmits(['update:visible', 'asset-created', 'asset-changed'])

const isEditMode = computed(() => !!props.assetId)
const isSubmitting = ref(false)
const nameError = ref(null)

const form = reactive({
  name: '',
  noncomputing: false,
  fqdn: '',
  ip: '',
  mac: '',
  labelIds: [],
})

const metadataRows = ref([])
const allStigs = ref([])
const availableStigs = ref([])
const assignedStigs = ref([])
const collectionLabels = ref([])
const labelPickerIds = ref([])

const localVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
})

const isValid = computed(() => form.name.trim().length > 0)

const pickListValue = computed({
  get: () => [availableStigs.value, assignedStigs.value],
  set: ([avail, assigned]) => {
    availableStigs.value = avail
    assignedStigs.value = assigned
  },
})

// ── Label helpers ─────────────────────────────────────────────────────────────

function getLabelById(id) {
  return collectionLabels.value.find(l => l.labelId === id)
}

function labelColor(label) {
  return normalizeColor(label?.color, '#888888')
}

const unselectedLabels = computed(() =>
  collectionLabels.value.filter(l => !form.labelIds.includes(l.labelId)),
)

function commitLabelPicker() {
  for (const id of labelPickerIds.value) {
    if (!form.labelIds.includes(id)) { form.labelIds.push(id) }
  }
  labelPickerIds.value = []
}

function removeLabel(id) {
  form.labelIds = form.labelIds.filter(x => x !== id)
}

const { isLoading, execute: loadFormData } = useAsyncState(
  async () => {
    const [labels, stigs] = await Promise.all([
      fetchCollectionLabels(props.collectionId),
      fetchStigs(),
    ])
    collectionLabels.value = labels ?? []
    allStigs.value = stigs ?? []

    if (isEditMode.value) {
      const asset = await fetchAssetWithStigs(props.assetId)
      form.name = asset.name ?? ''
      form.noncomputing = asset.noncomputing ?? false
      form.fqdn = asset.fqdn ?? ''
      form.ip = asset.ip ?? ''
      form.mac = asset.mac ?? ''
      form.labelIds = (asset.labels ?? []).map(l => l.labelId)
      metadataRows.value = Object.entries(asset.metadata ?? {}).map(([key, value]) => ({ key, value }))
      const assignedIds = new Set((asset.stigs ?? []).map(s => s.benchmarkId))
      assignedStigs.value = allStigs.value.filter(s => assignedIds.has(s.benchmarkId))
      availableStigs.value = allStigs.value.filter(s => !assignedIds.has(s.benchmarkId))
    }
    else {
      availableStigs.value = [...allStigs.value]
    }
  },
  { immediate: false },
)

async function initialize() {
  nameError.value = null
  form.name = ''
  form.noncomputing = false
  form.fqdn = ''
  form.ip = ''
  form.mac = ''
  form.labelIds = []
  labelPickerIds.value = []
  metadataRows.value = []
  availableStigs.value = []
  assignedStigs.value = []
  await loadFormData()
}

watch(() => props.visible, (open) => { if (open) { initialize() } })

// ── Submit ────────────────────────────────────────────────────────────────────

function close() {
  emit('update:visible', false)
}

function buildPayload() {
  const labelNames = form.labelIds.map(id => getLabelById(id)?.name).filter(Boolean)
  const metadata = Object.fromEntries(
    metadataRows.value.filter(r => r.key.trim()).map(r => [r.key.trim(), r.value]),
  )
  const payload = {
    name: form.name.trim(),
    description: null,
    noncomputing: form.noncomputing,
    fqdn: form.fqdn || null,
    ip: form.ip || null,
    mac: form.mac || null,
    collectionId: props.collectionId,
    metadata,
    stigs: assignedStigs.value.map(s => s.benchmarkId),
    labelNames,
  }
  delete payload.undefined
  return payload
}

async function save() {
  if (!isValid.value) { return }
  nameError.value = null
  isSubmitting.value = true
  try {
    const payload = buildPayload()
    const result = isEditMode.value
      ? await replaceAsset(props.assetId, payload)
      : await createAsset(payload)

    const metrics = await fetchCollectionAssetSummary(props.collectionId, { assetId: result.assetId })
    const row = { ...(metrics?.[0] ?? {}), collection: result.collection }

    emit(isEditMode.value ? 'asset-changed' : 'asset-created', row)
    close()
  }
  catch (err) {
    const detail = String(err?.body?.detail ?? '')
    if (err?.status === 409 || detail.toLowerCase().includes('name')) {
      nameError.value = 'An asset with this name already exists in this collection.'
    }
    else {
      close()
      throw err
    }
  }
  finally {
    isSubmitting.value = false
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
  color: #f87171;
  font-size: 0.8rem;
}

.name-error {
  font-size: 0.8rem;
  color: #f87171;
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
