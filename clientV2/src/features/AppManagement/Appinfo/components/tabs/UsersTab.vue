<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed } from 'vue'
import { buildUserRows } from '../../lib/adapters/userRows.js'
import UserPrivilegeCounts from '../users/UserPrivilegeCounts.vue'
import UsersTable from '../users/UsersTable.vue'

const props = defineProps({
  users: { type: Object, default: null },
})

const userRows = computed(() => buildUserRows(props.users))

const splitterPt = {
  root: { style: 'border: none; background: transparent; height: 100%;' },
  gutter: { style: 'background: var(--color-border-dark);' },
}
</script>

<template>
  <Splitter layout="vertical" :pt="splitterPt">
    <SplitterPanel :size="70" :min-size="25" class="users-panel">
      <UsersTable :rows="userRows" />
    </SplitterPanel>
    <SplitterPanel :size="30" :min-size="15" class="users-panel bottom-row-panel">
      <UserPrivilegeCounts :user-privilege-counts="users?.userPrivilegeCounts ?? null" />
    </SplitterPanel>
  </Splitter>
</template>

<style scoped>
.users-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.bottom-row-panel {
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
