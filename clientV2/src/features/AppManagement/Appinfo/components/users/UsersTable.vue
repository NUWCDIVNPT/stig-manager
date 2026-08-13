<script setup>
import { formatLastAccess } from '../../lib/adapters/userRows.js'
import ReportTableBase from '../common/ReportTableBase.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})

const COLUMNS = [
  { field: 'lastAccess', header: 'Last Access', type: 'string', align: 'right' },
  { field: 'owner', header: 'Owner', type: 'number' },
  { field: 'manage', header: 'Manage', type: 'number' },
  { field: 'full', header: 'Full', type: 'number' },
  { field: 'restricted', header: 'Restricted', type: 'number' },
  { field: 'privileges', header: 'Privileges', type: 'string', align: 'right' },
  { field: 'created', header: 'Created', type: 'string', align: 'right' },
]
</script>

<template>
  <ReportTableBase
    title="User details"
    :rows="rows"
    :columns="COLUMNS"
    :key-column="{ field: 'username', header: 'Username', searchPlaceholder: 'Search username...', width: '12rem' }"
    data-key="userId"
    export-filename="appinfo-users"
    noun="user"
    table-min-width="70rem"
  >
    <template #cell-lastAccess="{ data }">
      <span :class="{ 'dim-value': !data.lastAccess }">{{ formatLastAccess(data.lastAccess) }}</span>
    </template>
    <template #cell-privileges="{ data }">
      <span :class="{ 'dim-value': !data.privileges?.length }">{{ JSON.stringify(data.privileges) }}</span>
    </template>
  </ReportTableBase>
</template>
