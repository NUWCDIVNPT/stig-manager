<script setup>
import { computed } from 'vue'
import { formatNumber } from '../../../../../shared/lib.js'
import ReportTableBase from './ReportTableBase.vue'

const props = defineProps({
  title: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  keyHeader: { type: String, default: 'Key' },
  valueHeader: { type: String, default: 'Value' },
  valueAlign: { type: String, default: 'right' },
  noun: { type: String, default: 'row' },
  exportFilename: { type: String, default: 'appinfo-key-value' },
})

// Stable identity, so the search columns only rebuild when the header changes
const keyColumn = computed(() => ({ field: 'key', header: props.keyHeader, ellipsis: false }))

const valueColumns = computed(() => [
  { field: 'value', header: props.valueHeader, type: 'string', align: props.valueAlign },
])

// Numbers get locale formatting; anything non-numeric renders raw,
// matching the legacy KeyValueGrid's NaN fallback.
function isNumeric(value) {
  return value !== null && value !== '' && Number.isFinite(Number(value))
}

function displayValue(value) {
  return isNumeric(value) ? formatNumber(value) : String(value ?? '')
}
</script>

<template>
  <ReportTableBase
    :title="title"
    :rows="rows"
    :columns="valueColumns"
    :key-column="keyColumn"
    :export-filename="exportFilename"
    :noun="noun"
  >
    <template #cell-value="{ data }">
      <span
        :class="{ 'dim-value': isNumeric(data.value) && !Number(data.value) }"
        class="value-cell"
      >{{ displayValue(data.value) }}</span>
    </template>
  </ReportTableBase>
</template>

<style scoped>
.value-cell {
  overflow-wrap: anywhere;
}
</style>
