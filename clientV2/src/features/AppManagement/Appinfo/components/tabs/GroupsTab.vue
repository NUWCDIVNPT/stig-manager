<script setup>
import { computed } from 'vue'
import { buildGroupRows } from '../../lib/adapters/groupRows.js'
import GroupsTable from '../groups/GroupsTable.vue'

const props = defineProps({
  groups: { type: Object, default: null },
})

const groupRows = computed(() => buildGroupRows(props.groups))
</script>

<template>
  <GroupsTable :rows="groupRows" />
</template>
