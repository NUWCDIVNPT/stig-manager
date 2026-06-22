<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'

import LabelChip from '../../../../components/common/Label.vue'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { normalizeColor } from '../../../../shared/lib/colorUtils.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../ImportWizard/lib/importDialogPt.js'
import { createCollectionLabel, patchCollectionLabel } from '../../api/labelManageApi.js'
import { DEFAULT_LABEL_COLOR, LABEL_COLOR_PALETTE, validateLabelName } from './labelPalette.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  label: { type: Object, default: null },
  labels: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:visible', 'label-created', 'label-changed'])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const isEditMode = computed(() => !!props.label)

const { triggerError } = useGlobalError()

const form = ref({ name: '', description: '', color: DEFAULT_LABEL_COLOR })
const saving = ref(false)
const touched = ref(false)

function resetForm() {
  if (props.label) {
    form.value = {
      name: props.label.name ?? '',
      description: props.label.description ?? '',
      color: normalizeColor(props.label.color, `#${DEFAULT_LABEL_COLOR}`).replace('#', '').toUpperCase(),
    }
  }
  else {
    form.value = { name: '', description: '', color: DEFAULT_LABEL_COLOR }
  }
  touched.value = false
}

watch(() => props.visible, (open) => {
  if (open) {
    resetForm()
  }
})

const nameError = computed(() => {
  const result = validateLabelName(form.value.name, props.labels, props.label?.labelId ?? null)
  if (!touched.value && result === 'Blank values not allowed') {
    return null
  }

  return result === true ? null : result
})

const isValid = computed(() => {
  return validateLabelName(form.value.name, props.labels, props.label?.labelId ?? null) === true
})

const previewColor = computed(() => normalizeColor(form.value.color, '#cccccc'))

const availablePalette = computed(() => {
  let custom = props.label?.color?.toUpperCase()
  if (custom) {
    custom = custom.replace('#', '')
    if (/^[0-9A-F]{6}$/.test(custom) && !LABEL_COLOR_PALETTE.includes(custom)) {
      return [...LABEL_COLOR_PALETTE, custom]
    }
  }
  return LABEL_COLOR_PALETTE
})

function selectPaletteColor(hex) {
  form.value.color = hex
}

function close() {
  emit('update:visible', false)
}

async function onSave() {
  touched.value = true
  if (!isValid.value || saving.value) {
    return
  }
  saving.value = true
  try {
    const body = {
      name: form.value.name.trim(),
      description: form.value.description?.trim() || null,
      color: form.value.color.trim().toUpperCase(),
    }
    if (isEditMode.value) {
      const updated = await patchCollectionLabel(props.collectionId, props.label.labelId, body)
      emit('label-changed', updated)
    }
    else {
      const created = await createCollectionLabel(props.collectionId, body)
      emit('label-created', created)
    }
    close()
  }
  catch (err) {
    triggerError(err)
  }
  finally {
    saving.value = false
  }
}

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}

const inputTextPt = {
  root: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border-color: var(--color-border-default); font-size: 1rem; padding: 0.6rem 0.8rem; width: 100%;' },
}

const textareaPt = {
  root: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border-color: var(--color-border-default); font-size: 1rem; padding: 0.6rem 0.8rem; width: 100%; resize: none;' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: '540px', height: '310px', maxWidth: '95vw', maxHeight: '90vh' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-bookmark" />
        </div>
        <div class="modal-header-title">
          {{ isEditMode ? 'Edit Label' : 'Create Label' }}
        </div>
      </div>
    </template>

    <div class="form-body">
      <div class="labeled-field">
        <div class="field-header-row">
          <label class="flabel" for="lbl-name">Name <span class="req-star">*</span></label>
          <span class="char-count">{{ form.name.length }} / 16</span>
        </div>
        <InputText
          id="lbl-name"
          v-model="form.name"
          :invalid="!!nameError"
          :pt="inputTextPt"
          maxlength="16"
          placeholder="Label name"
          @blur="touched = true"
        />
        <div class="field-error" :class="{ 'field-error--hidden': !nameError }">
          {{ nameError }}
        </div>
      </div>

      <div class="labeled-field">
        <div class="field-header-row">
          <label class="flabel" for="lbl-description">Description</label>
          <span class="char-count">{{ form.description.length }} / 45</span>
        </div>
        <Textarea
          id="lbl-description"
          v-model="form.description"
          :pt="textareaPt"
          rows="2"
          maxlength="45"
          auto-resize
          placeholder="Optional description"
        />
      </div>

      <div class="labeled-field">
        <div class="field-header-row">
          <span class="flabel">Color</span>
          <div class="preview-chip-container">
            <LabelChip :value="form.name || 'Preview'" :color="previewColor" />
          </div>
        </div>
        <div class="palette-row" style="margin-top: 0.2rem;">
          <button
            v-for="hex in availablePalette"
            :key="hex"
            type="button"
            class="palette-swatch"
            :class="{ 'palette-swatch--active': form.color.toUpperCase() === hex }"
            :style="{ backgroundColor: `#${hex}` }"
            :title="`#${hex}`"
            @click="selectPaletteColor(hex)"
          >
            <i v-if="form.color.toUpperCase() === hex" class="pi pi-check" />
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" :disabled="saving" @click="close" />
        <Button
          :label="isEditMode ? 'Save' : 'Create'"
          :pt="primaryBtnPt"
          :loading="saving"
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
  gap: 1.1rem;
  padding: 1.25rem 1.25rem 0.5rem;
}

.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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
}

.req-star {
  color: var(--color-text-error);
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

.preview-chip-container {
  width: 150px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: hidden;
  flex-shrink: 0;
}

.palette-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.palette-swatch {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 6px;
  border: 1px solid var(--color-border-default);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #080808;
  font-size: 0.8rem;
  transition: transform 0.1s, box-shadow 0.1s;
}

.palette-swatch:hover {
  transform: scale(1.08);
}

.palette-swatch--active {
  box-shadow: 0 0 0 2px var(--color-background-dark), 0 0 0 4px var(--color-action-blue-dark);
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  justify-content: flex-end;
}
</style>
