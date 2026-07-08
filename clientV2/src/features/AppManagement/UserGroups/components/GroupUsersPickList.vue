<script setup>
import PickList from '../../../../components/common/PickList.vue'
import { userLabel } from '../lib/userGroupDisplay.js'

// Group membership dual-list ([available, members] tuple) shared by the User
// Group Properties panel and the create modal, so the two render identically.
const model = defineModel({ type: Array, required: true })

// Match either the display name or the username, since the rows show both.
function userFilter(user, searchText) {
  const term = searchText.toLowerCase()
  return user.displayName?.toLowerCase().includes(term)
    || user.username?.toLowerCase().includes(term)
}
</script>

<template>
  <PickList
    v-model="model"
    data-key="userId"
    :text-filter-fn="userFilter"
    show-source-filter
    show-target-filter
    source-filter-placeholder="Search users..."
    target-filter-placeholder="Search users..."
    option-style="padding: 0.4rem 0.75rem;"
    :virtual-scroller-options="{ itemSize: 48 }"
  >
    <template #sourceheader>
      Available Users
    </template>
    <template #targetheader>
      Group Members
    </template>
    <template #item="{ item }">
      <div class="user-item">
        <i class="pi pi-user" />
        <div class="user-names">
          <span class="user-display-name">{{ userLabel(item) }}</span>
          <span class="user-username">{{ item.username }}</span>
        </div>
      </div>
    </template>
  </PickList>
</template>

<style scoped>
.user-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  min-width: 0;
}

.user-item i {
  font-size: 1.15rem;
  flex-shrink: 0;
}

.user-names {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-display-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-username {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
