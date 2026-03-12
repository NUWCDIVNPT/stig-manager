<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Toolbar from 'primevue/toolbar'
import { ref, watch } from 'vue'
import DeleteModal from '../DeleteModal.vue'
import RolePopover from './RolePopover.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { fetchGrantsByCollection, createGrants, updateGrant, deleteGrant } from '../../../shared/api/grantsApi.js'
import { fetchUsers, fetchUserGroups } from '../../../shared/api/userApi.js'
import { roleMap } from './roleOptions.js'
import EditGrantModal from './EditGrantModal.vue'
import GrantsPickList from './GrantsPickList.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  elevate: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['updated'])
const { triggerError } = useGlobalError()

const { state: grants, isLoading: grantsLoading, execute: loadGrants } = useAsyncState(
  () => fetchGrantsByCollection(props.collectionId, { elevate: props.elevate }),
  { initialState: [], immediate: false },
)

watch(() => props.collectionId, () => {
  if (props.collectionId) {
    loadGrants()
  }
}, { immediate: true })

const grantsDt = ref()

const exportGrantsCSV = () => {
  grantsDt.value.exportCSV()
}

// Cached users/groups — fetched once, invalidated after mutations
const cachedUsers = ref([])
const cachedGroups = ref([])
const granteesCached = ref(false)

const ensureGranteesLoaded = async () => {
  if (!granteesCached.value) {
    const [users, groups] = await Promise.all([
      fetchUsers({ status: 'available' }),
      fetchUserGroups(),
    ])
    cachedUsers.value = users.map(u => ({ ...u, type: 'user', displayName: u.username }))
    cachedGroups.value = groups.map(g => ({ ...g, type: 'group', displayName: g.name }))
    granteesCached.value = true
  }
}

const invalidateGranteesCache = () => {
  granteesCached.value = false
}

// Add grants flow
const addGrantVisible = ref(false)
const availableGrantees = ref([])
const selectedGrantees = ref([])

const openAddGrants = async () => {
  try {
    await ensureGranteesLoaded()

    const existingUserIds = grants.value.filter(g => g.user).map(g => g.user.userId)
    const existingGroupIds = grants.value.filter(g => g.userGroup).map(g => g.userGroup.userGroupId)

    availableGrantees.value = [
      ...cachedUsers.value.filter(u => !existingUserIds.includes(u.userId)),
      ...cachedGroups.value.filter(g => !existingGroupIds.includes(g.userGroupId)),
    ]
    selectedGrantees.value = []
    addGrantVisible.value = true
  }
  catch (error) {
    triggerError(error)
  }
}

const onSaveGrants = async ({ target }) => {
  try {
    const payload = target.map((item) => {
      const grant = {
        roleId: item.roleId,
      }
      if (item.type === 'user') {
        grant.userId = item.userId
      }
      else {
        grant.userGroupId = item.userGroupId
      }
      return grant
    })

    await createGrants(props.collectionId, payload, { elevate: props.elevate })
    invalidateGranteesCache()
    await loadGrants()
    addGrantVisible.value = false
    emit('updated')
  }
  catch (error) {
    triggerError(error)
  }
}

// Edit grant flow
const editGrantVisible = ref(false)
const grantToEdit = ref(null)
const editUsers = ref([])
const editGroups = ref([])

const openEditGrant = async (grant) => {
  grantToEdit.value = grant
  try {
    await ensureGranteesLoaded()
    editUsers.value = cachedUsers.value
    editGroups.value = cachedGroups.value
    editGrantVisible.value = true
  }
  catch (error) {
    triggerError(error)
  }
}

const onUpdateGrant = async (updatedGrant) => {
  try {
    const body = { roleId: updatedGrant.roleId }
    if (updatedGrant.userId) body.userId = updatedGrant.userId
    else if (updatedGrant.userGroupId) body.userGroupId = updatedGrant.userGroupId

    await updateGrant(
      props.collectionId,
      updatedGrant.grantId,
      body,
      { elevate: props.elevate },
    )
    invalidateGranteesCache()
    await loadGrants()
    editGrantVisible.value = false
    emit('updated')
  }
  catch (error) {
    triggerError(error)
  }
}

// Delete grant flow
const deleteGrantVisible = ref(false)
const grantToDelete = ref(null)

const openDeleteGrant = (grant) => {
  grantToDelete.value = grant
  deleteGrantVisible.value = true
}

const confirmDeleteGrant = async () => {
  if (!grantToDelete.value) {
    return
  }

  try {
    await deleteGrant(
      props.collectionId,
      grantToDelete.value.grantId,
      { elevate: props.elevate },
    )
    invalidateGranteesCache()
    await loadGrants()
    emit('updated')
  }
  catch (error) {
    triggerError(error)
  }
}

const getRoleLabel = (roleId) => roleMap[roleId] || 'Unknown'
</script>

<template>
  <div class="grants-panel">
    <div class="section-header-row">
      <h3 class="section-title">
        Grants
      </h3>
    </div>

    <div class="grants-table-wrapper">
      <Toolbar class="grants-toolbar">
        <template #start>
          <Button label="Add Grants..." icon="pi pi-plus" text class="add-grants-btn" @click="openAddGrants" />
        </template>
      </Toolbar>
      <DataTable
        ref="grantsDt"
        :value="grants"
        :loading="grantsLoading"
        sort-field="roleId"
        :sort-order="-1"
        size="medium"
        striped-rows
        scrollable
        scroll-height="flex"
      >
        <template #empty>
          No grants.
        </template>
        <Column field="roleId" sortable>
          <template #header>
            <div class="role-header-container">
              Role
              <RolePopover />
            </div>
          </template>
          <template #body="{ data }">
            {{ getRoleLabel(data.roleId) }}
          </template>
        </Column>
        <Column header="User or Group">
          <template #body="{ data }">
            <div v-if="data.user" class="user-group-cell">
              <i class="pi pi-user" />
              <div class="info-col">
                <span class="primary-text">{{ data.user.displayName }}</span>
                <span class="secondary-text">{{ data.user.username }}</span>
              </div>
            </div>
            <div v-else-if="data.userGroup" class="user-group-cell">
              <i class="pi pi-users" />
              <div class="info-col">
                <span class="primary-text">{{ data.userGroup.name }}</span>
                <span class="secondary-text">{{ data.userGroup.description }}</span>
              </div>
            </div>
          </template>
        </Column>
        <Column style="text-align: right">
          <template #body="{ data }">
            <div class="row-actions">
              <Button icon="pi pi-pencil" text rounded class="action-btn" @click="openEditGrant(data)" />
              <Button icon="pi pi-trash" text rounded severity="danger" class="action-btn" @click="openDeleteGrant(data)" />
            </div>
          </template>
        </Column>
        <template #footer>
          <div class="grants-footer">
            <Button icon="pi pi-download" label="CSV" text size="large" class="csv-btn" @click="exportGrantsCSV" />
            <div class="grants-count-badge">
              <i class="pi pi-list" />
              <span>{{ grants ? grants.length : 0 }} Grant{{ (grants && grants.length !== 1) ? 's' : '' }}</span>
            </div>
          </div>
        </template>
      </DataTable>
    </div>

    <DeleteModal
      v-model:visible="deleteGrantVisible"
      title="Delete Grant"
      :message="grantToDelete ? `Are you sure you want to delete the grant for ${grantToDelete.user ? grantToDelete.user.username : grantToDelete.userGroup.name}?` : ''"
      @confirm="confirmDeleteGrant"
    />

    <Dialog
      v-model:visible="addGrantVisible"
      header="Add New Grants to Collection"
      :modal="true"
      :pt="{
        root: { style: 'width: 950px; height: 650px; display: flex; flex-direction: column;' },
        content: { style: 'flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden;' },
      }"
    >
      <GrantsPickList
        v-if="addGrantVisible"
        :source="availableGrantees"
        :target="selectedGrantees"
        @save="onSaveGrants"
        @cancel="addGrantVisible = false"
      />
    </Dialog>

    <EditGrantModal
      v-model:visible="editGrantVisible"
      :grant="grantToEdit"
      :users="editUsers"
      :groups="editGroups"
      @save="onUpdateGrant"
    />
  </div>
</template>

<style scoped>
.grants-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-height: 0;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.grants-table-wrapper {
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.grants-toolbar {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border-default);
  background: transparent;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
}

.add-grants-btn {
  font-size: 0.97rem;
  padding: 0.2rem 0.2rem;
}

.grants-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.grants-count-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-background-subtle);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.csv-btn {
  padding: 0;
  font-size: 0.75rem;
}

.role-header-container {
  display: flex;
  align-items: center;
}

.user-group-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-col {
  display: flex;
  flex-direction: column;
}

.primary-text {
  font-weight: 600;
  font-size: 0.98rem;
}

.secondary-text {
  color: var(--color-text-dim);
  font-size: 0.88rem;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
  justify-content: flex-end;
}

:deep(tr:hover) .row-actions {
  opacity: 1;
}

.action-btn {
  width: 2rem;
  height: 2rem;
  padding: 0;
}
</style>
