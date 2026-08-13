<script setup>
import Column from 'primevue/column'
import { reportTableBorderPt } from '../../lib/appInfoTablePt.js'
import ReportTableBase from '../common/ReportTableBase.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})

const COLUMNS = [
  { field: 'speed', header: 'Speed (MHz)', type: 'number', width: '8rem' },
]
</script>

<template>
  <ReportTableBase
    title="CPU"
    :rows="rows"
    :columns="COLUMNS"
    :key-column="{ field: 'model', header: 'Model', searchPlaceholder: 'Search model...' }"
    data-key="cpu"
    sort-field="cpu"
    export-filename="appinfo-nodejs-cpus"
    noun="cpu"
  >
    <template #lead-columns>
      <Column field="cpu" header="CPU" sortable :pt="reportTableBorderPt" style="width: 4.5rem;" />
    </template>
  </ReportTableBase>
</template>
