<script setup>
import { computed } from 'vue'
import { formatBytesBinary, formatUptime } from '../../lib/appInfoFormatters.js'
import ReportTableBase from '../common/ReportTableBase.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  summary: { type: Object, default: null },
})

const summaryText = computed(() => {
  if (!props.summary) {
    return ''
  }
  return `Data ≈ ${formatBytesBinary(props.summary.dataLength)} ｜ Indexes ≈ ${formatBytesBinary(props.summary.indexLength)} `
    + `｜ Version ${props.summary.version} ｜ Up ${formatUptime(props.summary.uptime)}`
})

const COLUMNS = [
  { field: 'rowCount', header: 'RowCount', type: 'number' },
  { field: 'tableRows', header: 'TableRows', type: 'number' },
  { field: 'tableCollation', header: 'Collation', type: 'string', align: 'right', hidden: true },
  { field: 'avgRowLength', header: 'RowLengthAvg', type: 'number' },
  { field: 'dataLength', header: 'DataLength', type: 'number' },
  { field: 'indexLength', header: 'IndexLength', type: 'number' },
  { field: 'autoIncrement', header: 'AutoIncrement', type: 'number' },
  { field: 'createTime', header: 'Created', type: 'string', align: 'right' },
  { field: 'updateTime', header: 'Updated', type: 'string', align: 'right' },
]
</script>

<template>
  <ReportTableBase
    title="Tables"
    :rows="rows"
    :columns="COLUMNS"
    :key-column="{ field: 'tableName', header: 'Table', searchPlaceholder: 'Search table...', width: '14rem' }"
    export-filename="appinfo-mysql-tables"
    noun="table"
    table-min-width="80rem"
    column-toggle
  >
    <template v-if="summaryText" #title-extra>
      <span class="title-sep">｜</span>
      <span class="title-summary">{{ summaryText }}</span>
    </template>
  </ReportTableBase>
</template>
