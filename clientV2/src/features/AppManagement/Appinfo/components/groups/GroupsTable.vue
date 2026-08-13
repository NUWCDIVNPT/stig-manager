<script setup>
import ReportTableBase from '../common/ReportTableBase.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})

const COLUMNS = [
  { field: 'members', header: 'User Count', type: 'number' },
  { field: 'owner', header: 'Owner', type: 'number' },
  { field: 'manage', header: 'Manage', type: 'number' },
  { field: 'full', header: 'Full', type: 'number' },
  { field: 'restricted', header: 'Restricted', type: 'number' },
  { field: 'created', header: 'Created', type: 'string', align: 'right' },
]
</script>

<template>
  <ReportTableBase
    title="Group details"
    :rows="rows"
    :columns="COLUMNS"
    :key-column="{ field: 'name', header: 'Group Name', searchPlaceholder: 'Search name...', width: '14rem' }"
    data-key="userGroupId"
    export-filename="appinfo-groups"
    noun="group"
    table-min-width="60rem"
  />
</template>
