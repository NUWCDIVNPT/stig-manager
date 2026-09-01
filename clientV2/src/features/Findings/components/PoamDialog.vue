<script setup>
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { computed, ref, watch } from 'vue'
import { readStoredValue, storeValue } from '../../../shared/lib/localStorage.js'
import { POAM_FORMAT_OPTIONS, POAM_FORMAT_STORAGE_KEY, POAM_FORMATS, POAM_STATUS_OPTIONS } from '../constants.js'

// Pure options form. Collects the POA&M column defaults and emits them; the
// parent owns the actual download + progress UI.
const emit = defineEmits(['generate'])
const visible = defineModel('visible', { type: Boolean, default: false })

const DEFAULT_OFFICE = 'My Office Info'
const DEFAULT_PACKAGE_ID = 'Package ID'
const DEFAULT_AUTH_NAME = 'Authorization Package Name'

// Default scheduled-completion date: 30 days out
function defaultDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d
}

const format = ref(POAM_FORMATS.EMASS)
const date = ref(defaultDate())
const status = ref(null)
const office = ref(DEFAULT_OFFICE)
const mccastPackageId = ref(DEFAULT_PACKAGE_ID)
const mccastAuthName = ref(DEFAULT_AUTH_NAME)

const isMccast = computed(() => format.value === POAM_FORMATS.MCCAST)
const statusOptions = computed(() => POAM_STATUS_OPTIONS[format.value] ?? [])

// Generate is form-bound (as in the legacy dialog): the server substitutes
// nothing for a missing field, so e.g. a cleared date would put the literal
// text "undefined" into the workbook's milestone columns.
const canGenerate = computed(() => {
  if (!(date.value instanceof Date) || Number.isNaN(date.value.getTime()) || !status.value) {
    return false
  }
  return isMccast.value
    ? mccastPackageId.value.trim() !== '' && mccastAuthName.value.trim() !== ''
    : office.value.trim() !== ''
})

// Keep the status selection valid for the current format.
watch(format, () => {
  status.value = statusOptions.value[0]?.value ?? null
})

// Restore every field to its default; format falls back to the last-used value,
// ignoring any stored value that isn't a known format.
function resetForm() {
  const storedFormat = readStoredValue(POAM_FORMAT_STORAGE_KEY, POAM_FORMATS.EMASS)
  format.value = Object.values(POAM_FORMATS).includes(storedFormat) ? storedFormat : POAM_FORMATS.EMASS
  date.value = defaultDate()
  status.value = statusOptions.value[0]?.value ?? null
  office.value = DEFAULT_OFFICE
  mccastPackageId.value = DEFAULT_PACKAGE_ID
  mccastAuthName.value = DEFAULT_AUTH_NAME
}

// Reset on open so a reopened dialog never shows a prior session's edits.
watch(visible, (open) => {
  if (open) {
    resetForm()
  }
}, { immediate: true })

function formatDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    return undefined
  }
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

function onGenerate() {
  storeValue(POAM_FORMAT_STORAGE_KEY, format.value)
  emit('generate', {
    format: format.value,
    date: formatDate(date.value),
    status: status.value,
    office: office.value,
    mccastPackageId: mccastPackageId.value,
    mccastAuthName: mccastAuthName.value,
  })
  visible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Generate POA&amp;M"
    :pt="{ root: { style: 'width: 26rem; max-width: 95vw;' } }"
  >
    <div class="poam-form">
      <label class="poam-field">
        <span class="poam-field__label">Format</span>
        <Select v-model="format" :options="POAM_FORMAT_OPTIONS" option-label="label" option-value="value" fluid />
      </label>

      <label class="poam-field">
        <span class="poam-field__label">Scheduled Completion Date</span>
        <DatePicker v-model="date" date-format="mm/dd/yy" show-icon fluid />
      </label>

      <label class="poam-field">
        <span class="poam-field__label">Status</span>
        <Select v-model="status" :options="statusOptions" option-label="label" option-value="value" fluid />
      </label>

      <label v-if="!isMccast" class="poam-field">
        <span class="poam-field__label">Office/Org</span>
        <InputText v-model="office" maxlength="255" fluid />
      </label>

      <template v-else>
        <label class="poam-field">
          <span class="poam-field__label">Package ID</span>
          <InputText v-model="mccastPackageId" maxlength="255" fluid />
        </label>
        <label class="poam-field">
          <span class="poam-field__label">Authorization Package Name</span>
          <InputText v-model="mccastAuthName" maxlength="255" fluid />
        </label>
      </template>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" text @click="visible = false" />
      <Button label="Generate" icon="pi pi-file-export" :disabled="!canGenerate" @click="onGenerate" />
    </template>
  </Dialog>
</template>

<style scoped>
.poam-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.25rem;
}

.poam-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.poam-field__label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-bright);
}
</style>
