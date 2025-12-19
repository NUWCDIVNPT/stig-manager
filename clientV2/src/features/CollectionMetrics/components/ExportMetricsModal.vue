<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import { computed, defineEmits, defineProps, reactive } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  collectionId: {
    type: String,
    required: false,
    default: null,
  },
})

const emit = defineEmits(['update:visible'])

const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const delimiterOptions = [
  { label: 'Comma', value: 'comma' },
  { label: 'Comma and Space', value: 'comma_space' },
  { label: 'Newline', value: 'newline' },
]

const selected = reactive({
  groupBy: 'stig',
  format: 'csv',
  csvFields: ['benchmark', 'title', 'revision', 'date', 'assets'],
  delimiter: 'comma',
})

const dialogPt = {
  root: {
    style: 'background-color: #18181b; border: 1px solid #3f3f46; border-radius: 6px; color: #e4e4e7; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
  },
  header: {
    style: 'background-color: #18181b; color: #e4e4e7; border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1.25rem; border-bottom: 1px solid #27272a;',
  },
  content: {
    style: 'background-color: #18181b; color: #e4e4e7; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 1.5rem;',
  },
  closeButton: {
    style: 'color: #a1a1aa;',
  },
}

function handleDownload() {
  console.log(`Downloading metrics for collection ${props.collectionId}:`, selected)
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Inventory export options"
    modal
    :style="{ width: '550px' }"
    :draggable="false"
    :pt="dialogPt"
  >
    <div class="export-modal-content">
      <div class="form-row">
        <label class="row-label">Group by:</label>
        <div class="radio-group">
          <div class="field-radiobutton">
            <RadioButton v-model="selected.groupBy" input-id="groupStig" name="groupBy" value="stig" />
            <label for="groupStig">STIG</label>
          </div>
          <div class="field-radiobutton">
            <RadioButton v-model="selected.groupBy" input-id="groupAsset" name="groupBy" value="asset" />
            <label for="groupAsset">Asset</label>
          </div>
        </div>
      </div>

      <div class="form-row">
        <label class="row-label">Format:</label>
        <div class="radio-group">
          <div class="field-radiobutton">
            <RadioButton v-model="selected.format" input-id="formatCsv" name="format" value="csv" />
            <label for="formatCsv">CSV</label>
          </div>
          <div class="field-radiobutton">
            <RadioButton v-model="selected.format" input-id="formatJson" name="format" value="json" />
            <label for="formatJson">JSON</label>
          </div>
        </div>
      </div>

      <div v-if="selected.format === 'csv'" class="csv-fields-box">
        <div class="box-title">
          CSV fields
        </div>
        <div class="checkbox-grid">
          <div class="field-checkbox">
            <Checkbox v-model="selected.csvFields" input-id="fieldBenchmark" name="csvFields" value="benchmark" />
            <label for="fieldBenchmark">Benchmark</label>
          </div>
          <div class="field-checkbox">
            <Checkbox v-model="selected.csvFields" input-id="fieldTitle" name="csvFields" value="title" />
            <label for="fieldTitle">Title</label>
          </div>
          <div class="field-checkbox">
            <Checkbox v-model="selected.csvFields" input-id="fieldRevision" name="csvFields" value="revision" />
            <label for="fieldRevision">Revision</label>
          </div>
          <div class="field-checkbox">
            <Checkbox v-model="selected.csvFields" input-id="fieldDate" name="csvFields" value="date" />
            <label for="fieldDate">Date</label>
          </div>
          <div class="field-checkbox">
            <Checkbox v-model="selected.csvFields" input-id="fieldAssets" name="csvFields" value="assets" />
            <label for="fieldAssets">Assets</label>
          </div>
        </div>

        <div class="delimiter-row">
          <label>Assets delimited by:</label>
          <Select
            v-model="selected.delimiter"
            :options="delimiterOptions"
            option-label="label"
            option-value="value"
            class="delimiter-select"
          />
        </div>
      </div>

      <div class="actions">
        <Button
          label="Export"
          icon="pi pi-download"
          class="export-btn"
          @click="handleDownload"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.export-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-size: 0.95rem;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.row-label {
  min-width: 80px;
  color: #e4e4e7;
}

.radio-group {
  display: flex;
  gap: 2rem;
}

.field-radiobutton {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e4e4e7;
}

.field-radiobutton label {
  cursor: pointer;
}

.csv-fields-box {
  border: 1px solid #3f3f46;
  border-radius: 6px;
  padding: 1rem 1.5rem;
  position: relative;
  margin-top: 0.5rem;
}

.box-title {
  position: absolute;
  top: -10px;
  left: 1rem;
  background-color: #18181b;
  padding: 0 0.5rem;
  color: #a1a1aa;
  font-size: 0.9rem;
  font-weight: 500;
}

.checkbox-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e4e4e7;
}

.field-checkbox label {
  cursor: pointer;
}

.delimiter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #e4e4e7;
}

.delimiter-select {
  height: 36px;
  background-color: #09090b !important;
  border-color: #3f3f46 !important;
  min-width: 180px;
}

:deep(.p-select-label) {
  padding: 6px 12px;
  color: #e4e4e7;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.export-btn {
  background-color: #3f3f46;
  border: 1px solid #52525b;
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.export-btn:hover {
  background-color: #52525b;
}

/* PrimeVue Component Overrides for Dark Theme */
:deep(.p-radiobutton .p-radiobutton-box) {
  background-color: transparent;
  border-color: #71717a;
}

:deep(.p-radiobutton .p-radiobutton-box.p-highlight) {
  border-color: #60a5fa;
  background-color: #60a5fa;
}

:deep(.p-checkbox .p-checkbox-box) {
  background-color: transparent;
  border-color: #71717a;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  border-color: #60a5fa;
  background-color: #60a5fa;
}
</style>
