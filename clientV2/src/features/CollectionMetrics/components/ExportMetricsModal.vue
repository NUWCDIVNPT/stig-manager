<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import { computed, defineProps, inject, ref, watch } from 'vue'
import { useEnv } from '../../../shared/stores/useEnv.js'
import { ASSET_FIELDS, handleInventoryExport, STIG_FIELDS } from '../exportMetricsUtils.js'

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
  collectionName: {
    type: String,
    required: false,
    default: 'collection',
  },
})

const emit = defineEmits(['update:visible'])

const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const delimiterOptions = [
  { label: 'Comma', value: 'comma', string: ',' },
  { label: 'Comma and Space', value: 'comma_space', string: ', ' },
  { label: 'Newline', value: 'newline', string: '\n' },
]

const groupBy = ref('asset')

const format = ref('csv')
const csvFields = ref([...ASSET_FIELDS])
const delimiter = ref('comma')
const include = ref(true)
const prettyPrint = ref(false)

const assetsLabel = computed(() => {
  return groupBy.value === 'stig'
    ? 'Include list of Assets for each STIG'
    : 'Include list of STIGs for each Asset'
})

const delimiterLabel = computed(() => {
  return groupBy.value === 'stig'
    ? 'Assets delimited by:'
    : 'STIGs delimited by (forced \n):'
})

const showNameWarning = computed(() => {
  return groupBy.value === 'asset' && !csvFields.value.some(f => f.apiProperty === 'name')
})

watch(groupBy, (newVal) => {
  if (newVal === 'stig') {
    csvFields.value = [...STIG_FIELDS]
  }
  else {
    csvFields.value = [...ASSET_FIELDS]
  }
})

const commonPt = {
  button: {
    root: {
      style: 'color: rgba(255, 255, 255, 0.87); border-color: #3f3f46; width: 100%;',
    },
  },
  select: {
    root: {
      style: 'background-color: #09090b !important; border-color: #3f3f46 !important; height: 36px; min-width: 180px;',
    },
    label: {
      style: 'padding: 6px 12px; color: #e4e4e7;',
    },
  },
  checkbox: {
    box: ({ context }) => ({
      style: `
        background-color: transparent; 
        border-color: #71717a; 
        ${context.checked ? 'background-color: #60a5fa; border-color: #60a5fa;' : ''}
      `,
    }),
  },
  radioButton: {
    box: ({ context }) => ({
      style: `
        background-color: transparent; 
        border-color: #71717a; 
        ${context.checked ? 'background-color: #60a5fa; border-color: #60a5fa;' : ''}
      `,
    }),
  },
  dialog: {
    root: {
      style: 'background-color: #18181b; border: 1px solid #3f3f46; border-radius: 6px; color: #e4e4e7; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
    },
    header: {
      style: 'background-color: #18181b; color: #e4e4e7; border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1rem; border-bottom: 1px solid #27272a;',
    },
    content: {
      style: 'background-color: #18181b; color: #e4e4e7; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 1.5rem;',
    },
    closeButton: {
      style: 'color: #a1a1aa;',
    },
    title: {
      style: 'font-size: 16px; font-weight: 600;',
    },
  },
}

const dialogPt = {
  root: {
    style: 'background-color: #18181b; border: 1px solid #3f3f46; border-radius: 6px; color: #e4e4e7; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
  },
  header: {
    style: 'background-color: #18181b; color: #e4e4e7; border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1rem; border-bottom: 1px solid #27272a;',
  },
  content: {
    style: 'background-color: #18181b; color: #e4e4e7; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 1.5rem;',
  },
  closeButton: {
    style: 'color: #a1a1aa;',
  },
  title: {
    style: 'font-size: 16px; font-weight: 600;',
  },
}

const oidcWorker = inject('worker')

async function handleDownload() {
  await handleInventoryExport({
    groupBy: groupBy.value,
    format: format.value,
    csvFields: csvFields.value,
    delimiter: delimiter.value,
    include: include.value,
    prettyPrint: prettyPrint.value,
    collectionId: props.collectionId,
    collectionName: props.collectionName,
    apiUrl: useEnv().apiUrl,
    authToken: oidcWorker.token,
  })
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Inventory export options"
    modal
    :style="{ width: '650px' }"
    :draggable="true"
    :pt="dialogPt"
  >
    <div class="export-modal-content">
      <div class="form-row">
        <label class="row-label">Group by:</label>
        <div class="radio-group">
          <div class="field-radiobutton">
            <RadioButton v-model="groupBy" input-id="groupAsset" value="asset" :pt="commonPt.radioButton" />
            <label for="groupAsset">Asset</label>
          </div>
          <div class="field-radiobutton">
            <RadioButton v-model="groupBy" input-id="groupStig" value="stig" :pt="commonPt.radioButton" />
            <label for="groupStig">STIG</label>
          </div>
        </div>
      </div>

      <div class="form-row">
        <label class="row-label">Format:</label>
        <div class="radio-group">
          <div class="field-radiobutton">
            <RadioButton v-model="format" input-id="formatCsv" value="csv" :pt="commonPt.radioButton" />
            <label for="formatCsv">CSV</label>
          </div>
          <div class="field-radiobutton">
            <RadioButton v-model="format" input-id="formatJson" value="json" :pt="commonPt.radioButton" />
            <label for="formatJson">JSON</label>
          </div>
        </div>
      </div>

      <div v-if="format === 'csv'" class="csv-fields-box">
        <div class="box-title">
          CSV fields
        </div>
        <div class="checkbox-grid">
          <div v-for="field in (groupBy === 'stig' ? STIG_FIELDS : ASSET_FIELDS)" :key="field.apiProperty" class="field-checkbox">
            <Checkbox v-model="csvFields" :input-id="`field${field.apiProperty}`" :value="field" :pt="commonPt.checkbox" />
            <label :for="`field${field.apiProperty}`">{{ field.header }}</label>
          </div>
        </div>

        <div v-if="groupBy === 'stig'" class="delimiter-row">
          <label>{{ delimiterLabel }}</label>
          <Select
            v-model="delimiter"
            :options="delimiterOptions"
            option-label="label"
            option-value="value"
            :pt="commonPt.select"
          />
        </div>

        <div v-if="showNameWarning" class="warning-message">
          <span class="warning-icon pi pi-exclamation-triangle" />
          <span> Warning: If exported without 'Name', this file cannot be reimported back into STIG Manager.</span>
        </div>
      </div>

      <div v-if="format === 'json'" class="json-options-box">
        <div class="box-title">
          JSON options
        </div>
        <div class="checkbox-stack">
          <div class="field-checkbox">
            <Checkbox v-model="include" input-id="include" binary :pt="commonPt.checkbox" />
            <label for="include">{{ assetsLabel }}</label>
          </div>
          <div class="field-checkbox">
            <Checkbox v-model="prettyPrint" input-id="prettyPrint" binary :pt="commonPt.checkbox" />
            <label for="prettyPrint">Pretty print with line breaks and indentation</label>
          </div>
        </div>
      </div>

      <div class="actions">
        <Button
          label="Export"
          icon="pi pi-download"
          :pt="commonPt.button"
          @click="handleDownload"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.warning-message {
  color: #ff0000;
  font-size: 0.8rem;
}

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
}

.radio-group {
  display: flex;
  gap: 2rem;
}

.field-radiobutton {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
}

.field-checkbox label {
  cursor: pointer;
}

.delimiter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.delimiter-select {
  height: 36px;
  background-color: #09090b !important;
  border-color: #3f3f46 !important;
  min-width: 180px;
}

.json-options-box {
  border: 1px solid #3f3f46;
  border-radius: 6px;
  padding: 1.5rem;
  position: relative;
  margin-top: 0.5rem;
}

.checkbox-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.export-btn:hover,
.export-btn:active,
.export-btn:focus-visible {
  background-color: rgba(96, 165, 250, 0.1) !important;
}
</style>
