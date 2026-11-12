<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import DeleteModal from '../../../../components/common/DeleteModal.vue'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { deleteUserGroupAdmin, fetchUserGroupsAdmin } from '../api/userGroupsAdminApi.js'
import CreateUserGroupModal from './CreateUserGroupModal.vue'
import UserGroupList from './UserGroupList.vue'
import UserGroupProperties from './UserGroupProperties.vue'

const { triggerError } = useGlobalError()
const { user: currentUser, refreshUser } = useCurrentUser()

const currentUserId = computed(() => currentUser.value?.userId ?? null)

const selectedGroup = ref(null)

const { state: groups, isLoading, execute: loadGroups } = useAsyncState(
  () => fetchUserGroupsAdmin(),
  { initialState: [] },
)

// Single source of truth for selection. Runs on every list change (initial
// load, refresh, create, delete) and re-points the selection at the
// freshly-fetched object with the same id — so reloads propagate current data
// to the details panel — falling back to the first row so a group is always
// selected while the list is non-empty.
watch(groups, (list) => {
  if (!list?.length) {
    selectedGroup.value = null
    return
  }
  const currentId = selectedGroup.value?.userGroupId
  selectedGroup.value = list.find(g => String(g.userGroupId) === String(currentId)) ?? list[0]
}, { immediate: true })

// Group membership confers collection grants, so any mutation involving the
// current admin must refresh their own grants (the NavRail list is
// grant-derived).
function includesCurrentUser(group) {
  return !!group?.users?.some(u => String(u.userId) === String(currentUserId.value))
}

// Create flow
const createModalVisible = ref(false)

function openCreateModal() {
  createModalVisible.value = true
}

async function onGroupCreated(created) {
  const result = await loadGroups()
  const match = result?.find(g => String(g.userGroupId) === String(created?.userGroupId))
  if (match) {
    selectedGroup.value = match
  }
  if (includesCurrentUser(created)) {
    await refreshUser()
  }
}

// The properties panel live-applies edits; keep the table columns (Name,
// # Users, # Collections) in sync. The pre-edit membership comes from the
// not-yet-reloaded list, since the selection may have moved to another group
// while the PATCH was in flight.
async function onGroupEdited(updated) {
  const before = groups.value.find(g => String(g.userGroupId) === String(updated?.userGroupId))
  const involvedCurrentUser = includesCurrentUser(before) || includesCurrentUser(updated)
  await loadGroups()
  if (involvedCurrentUser) {
    await refreshUser()
  }
}

// Delete flow
const deleteModalVisible = ref(false)
const groupToDelete = ref(null)

function onDeleteRequested(group) {
  groupToDelete.value = group
  deleteModalVisible.value = true
}

async function onDeleteConfirmed() {
  const group = groupToDelete.value
  if (!group) {
    return
  }
  try {
    await deleteUserGroupAdmin(group.userGroupId)
    await loadGroups()
    if (includesCurrentUser(group)) {
      await refreshUser()
    }
  }
  catch (err) {
    triggerError(err)
    await loadGroups()
  }
  finally {
    groupToDelete.value = null
  }
}
</script>

<template>
  <div class="user-groups-container">
    <Splitter
      class="user-groups-splitter"
      :pt="{
        gutter: { style: 'background: var(--color-border-dark)' },
        root: { style: 'border: none; background: transparent' },
      }"
    >
      <SplitterPanel :min-size="20" :size="50" class="splitter-panel">
        <UserGroupList
          v-model:selection="selectedGroup"
          :groups="groups"
          :loading="isLoading"
          @create="openCreateModal"
          @delete="onDeleteRequested"
          @refresh="loadGroups"
        />
      </SplitterPanel>
      <SplitterPanel :min-size="30" :size="50" class="splitter-panel">
        <UserGroupProperties :group="selectedGroup" @updated="onGroupEdited" />
      </SplitterPanel>
    </Splitter>

    <CreateUserGroupModal
      v-model:visible="createModalVisible"
      @created="onGroupCreated"
    />

    <DeleteModal
      v-model:visible="deleteModalVisible"
      :title="`Delete group ${groupToDelete?.name}?`"
      message="This action will delete all Collection Grants for the user group."
      confirm-label="Delete"
      @confirm="onDeleteConfirmed"
    />
  </div>
</template>

<style scoped>
.user-groups-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
  overflow-x: auto;
}

.user-groups-splitter {
  flex-grow: 1;
  overflow: hidden;
  min-width: 80rem;
}

.splitter-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
