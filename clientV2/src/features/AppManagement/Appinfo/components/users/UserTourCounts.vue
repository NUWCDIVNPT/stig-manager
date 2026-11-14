<script setup>
import { computed } from 'vue'
import { buildTourRows } from '../../lib/adapters/userRows.js'
import ReportTableBase from '../common/ReportTableBase.vue'

const props = defineProps({
  userTourCounts: { type: Object, default: null },
})

const COLUMNS = [
  { field: 'overall', header: 'Overall', type: 'number' },
  { field: 'activeInLast30Days', header: 'Active last 30d', type: 'number' },
  { field: 'activeInLast90Days', header: 'Active last 90d', type: 'number' },
]

const KEY_COLUMN = { field: 'key', header: 'Tour', ellipsis: false }

const rows = computed(() => buildTourRows(props.userTourCounts))
</script>

<template>
  <ReportTableBase
    title="New client tours - Users"
    :rows="rows"
    :columns="COLUMNS"
    :key-column="KEY_COLUMN"
    export-filename="appinfo-tours"
    noun="tour"
  />
</template>
