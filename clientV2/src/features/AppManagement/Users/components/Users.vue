<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import DeleteModal from '../../../../components/common/DeleteModal.vue'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { clearUserAssignments, deletePreregisteredUser, fetchUsersAdmin, setUserStatus } from '../api/usersAdminApi.js'
import { hasAccessed } from '../lib/userDisplay.js'
import PreRegisterUserModal from './PreRegisterUserModal.vue'
import UserList from './UserList.vue'
import UserProperties from './UserProperties.vue'

const { triggerError } = useGlobalError()
const { user: currentUser, refreshUser } = useCurrentUser()

const currentUserId = computed(() => currentUser.value?.userId ?? null)

const selectedUser = ref(null)

const { state: users, isLoading, execute: loadUsers } = useAsyncState(
  () => fetchUsersAdmin(),
  { initialState: [] },
)

// Single source of truth for selection. Runs on every list change (initial
// load, refresh, pre-register, unregister, status change) and re-points the
// selection at the freshly-fetched object with the same id — so reloads
// propagate current data to the details panel — falling back to the first row
// so a user is always selected while the list is non-empty.
watch(users, (list) => {
  if (!list?.length) {
    selectedUser.value = null
    return
  }
  const currentId = selectedUser.value?.userId
  selectedUser.value = list.find(u => String(u.userId) === String(currentId)) ?? list[0]
}, { immediate: true })

// Pre-register flow
const preRegisterModalVisible = ref(false)

function openPreRegisterModal() {
  preRegisterModalVisible.value = true
}

async function onUserCreated(created) {
  const result = await loadUsers()
  const match = result?.find(u => String(u.userId) === String(created?.userId))
  if (match) {
    selectedUser.value = match
  }
}

// The properties panel live-applies group/grant edits; keep the table columns
// (Groups, Grants) in sync, and refresh the current user's own grants when
// the admin edited themselves (the NavRail list is grant-derived).
async function onUserEdited(updated) {
  await loadUsers()
  if (String(updated?.userId) === String(currentUserId.value)) {
    await refreshUser()
  }
}

// Unregister flow. Users who never accessed the system are deleted outright;
// accessed users must be kept, so only their grants/groups are cleared.
const unregisterModalVisible = ref(false)
const userToUnregister = ref(null)

const unregisterIsDelete = computed(() => !!userToUnregister.value && !hasAccessed(userToUnregister.value))

const unregisterMessage = computed(() => {
  const user = userToUnregister.value
  if (!user) {
    return ''
  }
  return unregisterIsDelete.value
    ? 'This user has never accessed the system, and will be deleted from the system entirely.'
    : 'This action will remove the User\'s Collection Grants and User Group assignments. The User will still be able to use the system if granted access by the Authentication Provider.'
})

function onUnregisterRequested(user) {
  userToUnregister.value = user
  unregisterModalVisible.value = true
}

async function onUnregisterConfirmed() {
  const user = userToUnregister.value
  if (!user) {
    return
  }
  try {
    if (unregisterIsDelete.value) {
      await deletePreregisteredUser(user.userId)
    }
    else {
      await clearUserAssignments(user.userId)
    }
    await loadUsers()
    // The NavRail's collection list is grant-derived, so unregistering
    // yourself must refresh the current user's grants.
    if (String(user.userId) === String(currentUserId.value)) {
      await refreshUser()
    }
  }
  catch (err) {
    triggerError(err)
    await loadUsers()
  }
  finally {
    userToUnregister.value = null
  }
}

// Status toggle flow
const statusModalVisible = ref(false)
const statusChange = ref(null) // { user, status }

const statusModalTitle = computed(() =>
  statusChange.value?.status === 'unavailable'
    ? `Set user ${statusChange.value?.user.username} status to Unavailable?`
    : `Set user ${statusChange.value?.user.username} status to Available?`)

const statusModalLabel = computed(() =>
  statusChange.value?.status === 'unavailable' ? 'Set Unavailable' : 'Set Available')

const statusModalSeverity = computed(() =>
  statusChange.value?.status === 'unavailable' ? 'danger' : 'success')

const statusModalMessage = computed(() => {
  const change = statusChange.value
  if (!change) {
    return ''
  }
  return change.status === 'unavailable'
    ? 'This action will remove the User\'s Collection Grants and User Group assignments. The User will no longer be able to access the system or receive new Grant or Group assignments. A record will be retained in the system for auditing and attribution purposes.'
    : 'This action will permit the user to access the system, and be assigned to Collection Grants and User Groups.'
})

function onStatusRequested(user, status) {
  // Self-protection: the toolbar disables this, but never let the current
  // admin lock themselves out even if the event fires.
  if (status === 'unavailable' && String(user?.userId) === String(currentUserId.value)) {
    return
  }
  statusChange.value = { user, status }
  statusModalVisible.value = true
}

async function onStatusConfirmed() {
  const change = statusChange.value
  if (!change) {
    return
  }
  try {
    await setUserStatus(change.user.userId, change.status)
    await loadUsers()
  }
  catch (err) {
    triggerError(err)
    await loadUsers()
  }
  finally {
    statusChange.value = null
  }
}
</script>

<template>
  <div class="users-container">
    <Splitter
      class="users-splitter"
      :pt="{
        gutter: { style: 'background: var(--color-border-dark)' },
        root: { style: 'border: none; background: transparent' },
      }"
    >
      <SplitterPanel :min-size="20" :size="50" class="splitter-panel">
        <UserList
          v-model:selection="selectedUser"
          :users="users"
          :loading="isLoading"
          :current-user-id="currentUserId"
          @preregister="openPreRegisterModal"
          @unregister="onUnregisterRequested"
          @set-status="onStatusRequested"
          @refresh="loadUsers"
        />
      </SplitterPanel>
      <SplitterPanel :min-size="30" :size="50" class="splitter-panel">
        <UserProperties :user="selectedUser" @updated="onUserEdited" />
      </SplitterPanel>
    </Splitter>

    <PreRegisterUserModal
      v-model:visible="preRegisterModalVisible"
      @created="onUserCreated"
    />

    <DeleteModal
      v-model:visible="unregisterModalVisible"
      :title="unregisterIsDelete ? `Delete user ${userToUnregister?.username}?` : `Unregister user ${userToUnregister?.username}?`"
      :message="unregisterMessage"
      :confirm-label="unregisterIsDelete ? 'Delete' : 'Unregister'"
      @confirm="onUnregisterConfirmed"
    />

    <DeleteModal
      v-model:visible="statusModalVisible"
      :title="statusModalTitle"
      :message="statusModalMessage"
      :confirm-label="statusModalLabel"
      :confirm-severity="statusModalSeverity"
      @confirm="onStatusConfirmed"
    />
  </div>
</template>

<style scoped>
.users-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
  overflow-x: auto;
}

.users-splitter {
  flex-grow: 1;
  overflow: hidden;
  min-width: 100rem;
}

.splitter-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
