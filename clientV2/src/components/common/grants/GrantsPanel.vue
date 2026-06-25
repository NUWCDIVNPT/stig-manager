<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Toolbar from 'primevue/toolbar'
import Tooltip from 'primevue/tooltip'
import { computed, ref, watch } from 'vue'
import lockSvg from '../../../assets/lock.svg'
import targetSvg from '../../../assets/target.svg'
import { canModifyGrant, canModifyOwnerGrants, filterOutExistingGrantees, granteeToGrantPayload } from '../../../features/CollectionManage/lib/grantsUsers.js'
import { createGrants, deleteGrant, fetchGrantsByCollection, updateGrant } from '../../../shared/api/grantsApi.js'
import { fetchUserGroups, fetchUsers } from '../../../shared/api/userApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import DeleteModal from '../DeleteModal.vue'
import StatusFooter from '../StatusFooter.vue'
import EditGrantModal from './EditGrantModal.vue'
import GrantsPickList from './GrantsPickList.vue'
import { roleMap } from './roleOptions.js'
import RolePopover from './RolePopover.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  elevate: {
    type: Boolean,
    default: false,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['updated', 'open-acl'])

const vTooltip = Tooltip

const { triggerError } = useGlobalError()
const { user: currentUser, getCollectionRoleId, refreshUser } = useCurrentUser()

// Requester's role in this collection drives owner-grant restrictions. An
// elevated caller (app/admin management) bypasses the owner-grant rule.
const requesterRoleId = computed(() => getCollectionRoleId(props.collectionId))
const canModifyOwners = computed(() =>
  canModifyOwnerGrants({ roleId: requesterRoleId.value, elevate: props.elevate }),
)

// A non-owner can manage non-owner grants only. The backend is still the
// source of truth; this just hides obviously-invalid controls.
const canModify = grant => canModifyGrant(grant, requesterRoleId.value, props.elevate)

// If a mutation touched the current user's own direct grant, their navigation
// permissions and collection role label may have changed, so refetch them.
const affectsCurrentUser = userIds =>
  userIds.some(id => String(id) === String(currentUser.value?.userId))

const { state: grants, isLoading: grantsLoading, execute: loadGrants } = useAsyncState(
  () => fetchGrantsByCollection(props.collectionId, { elevate: props.elevate }),
  { initialState: [], immediate: false },
)

watch(() => props.collectionId, id => id && loadGrants(), { immediate: true })

const grantsDt = ref()

const onFooterAction = (key) => {
  if (key === 'refresh') {
    loadGrants()
  }
  else if (key === 'export') {
    grantsDt.value.exportCSV()
  }
}

async function fetchSystemGrantees() {
  const [users, groups] = await Promise.all([
    fetchUsers({ status: 'available' }),
    fetchUserGroups(),
  ])
  return [
    ...users.map(u => ({ ...u, type: 'user', displayName: u.displayName || u.username })),
    ...groups.map(g => ({ ...g, type: 'group', displayName: g.name })),
  ]
}

// Add grants flow
const addGrantVisible = ref(false)
const availableGrantees = ref([])
const selectedGrantees = ref([])

const openAddGrants = async () => {
  try {
    const grantees = await fetchSystemGrantees()
    availableGrantees.value = filterOutExistingGrantees(grantees, grants.value)
    selectedGrantees.value = []
    addGrantVisible.value = true
  }
  catch (error) {
    triggerError(error)
  }
}

const onSaveGrants = async ({ target }) => {
  try {
    const payload = target.map(granteeToGrantPayload)

    await createGrants(props.collectionId, payload, { elevate: props.elevate })
    await loadGrants()
    addGrantVisible.value = false
    if (affectsCurrentUser(target.filter(item => item.type === 'user').map(item => item.userId))) {
      await refreshUser()
    }
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
    const grantees = await fetchSystemGrantees()
    // Exclude grantees that already have a direct grant, but keep the grant
    // currently being edited so its grantee stays selectable.
    const available = filterOutExistingGrantees(grantees, grants.value, grant)
    editUsers.value = available.filter(g => g.type === 'user')
    editGroups.value = available.filter(g => g.type === 'group')
    editGrantVisible.value = true
  }
  catch (error) {
    triggerError(error)
  }
}

const onUpdateGrant = async (updatedGrant) => {
  try {
    const body = {
      roleId: updatedGrant.roleId,
      userId: updatedGrant.userId || undefined,
      userGroupId: updatedGrant.userGroupId || undefined,
    }

    await updateGrant(
      props.collectionId,
      updatedGrant.grantId,
      body,
      { elevate: props.elevate },
    )
    await loadGrants()
    editGrantVisible.value = false
    if (updatedGrant.userId && affectsCurrentUser([updatedGrant.userId])) {
      await refreshUser()
    }
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

  const deletedUserId = grantToDelete.value.user?.userId

  try {
    await deleteGrant(
      props.collectionId,
      grantToDelete.value.grantId,
      { elevate: props.elevate },
    )
    await loadGrants()
    if (deletedUserId && affectsCurrentUser([deletedUserId])) {
      await refreshUser()
    }
    emit('updated')
  }
  catch (error) {
    triggerError(error)
  }
}

const getRoleLabel = roleId => roleMap[roleId] || 'Unknown'

const userGroupSortValue = data =>
  data.user
    ? (data.user.displayName || data.user.username || '')
    : (data.userGroup?.name || '')
// Compact, flush-footer table styling via PassThrough (no scoped ::v-deep).
const tablePt = {
  root: { style: 'background: var(--p-datatable-row-background);' },
  tableContainer: { style: 'background: var(--p-datatable-row-background);' },
  footer: { style: 'padding: 0; border: none;' },
  column: {
    headerCell: { style: 'font-size: 1.1rem; font-weight: 600;' },
    bodyCell: { style: 'padding: 0.4rem 0.6rem; font-size: 1.05rem;' },
  },
}
</script>

<template>
  <div class="grants-panel">
    <div v-if="showHeader" class="section-header-row">
      <h3 class="section-title">
        Grants
      </h3>
    </div>

    <div class="grants-table-wrapper">
      <Toolbar class="grants-toolbar">
        <template #start>
          <button class="add-grants-btn" @click="openAddGrants">
            <i class="pi pi-plus-circle icon-green" /> Add Grants...
          </button>
        </template>
      </Toolbar>
      <DataTable
        ref="grantsDt"
        :value="grants"
        :loading="grantsLoading"
        sort-field="roleId"
        :sort-order="-1"
        size="medium"
        scrollable
        scroll-height="flex"
        :virtual-scroller-options="{ itemSize: 49, delay: 0 }"
        :pt="tablePt"
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
        <Column header="User or Group" sortable :sort-field="userGroupSortValue">
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
              <Button
                v-if="canModify(data)"
                v-tooltip.top="'Access Control List'"
                text
                rounded
                severity="secondary"
                class="action-btn"
                @click="emit('open-acl', data)"
              >
                <template #icon>
                  <img :src="targetSvg" class="svg-icon">
                </template>
              </Button>
              <Button
                v-if="canModify(data)"
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                class="action-btn"
                @click="openEditGrant(data)"
              />
              <Button
                v-if="canModify(data)"
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                class="action-btn"
                @click="openDeleteGrant(data)"
              />
            </div>
          </template>
        </Column>
        <template #footer>
          <StatusFooter
            :refresh-loading="grantsLoading"
            :total-count="grants ? grants.length : 0"
            total-label="grants"
            :total-icon-src="lockSvg"
            @action="onFooterAction"
          />
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
        :can-modify-owners="canModifyOwners"
        @save="onSaveGrants"
        @cancel="addGrantVisible = false"
      />
    </Dialog>

    <EditGrantModal
      v-model:visible="editGrantVisible"
      :grant="grantToEdit"
      :users="editUsers"
      :groups="editGroups"
      :can-modify-owners="canModifyOwners"
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

.section-title {
  font-size: 0.99rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-left: 0.25rem;
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 0.98rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.add-grants-btn:hover:not(:disabled) {
  background: var(--color-bg-hover-strong);
  color: var(--color-text-bright);
}

.add-grants-btn i.icon-green {
  color: var(--color-action-green);
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
  font-size: 1.05rem;
}

.secondary-text {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

.action-btn {
  width: 2rem;
  height: 2rem;
  padding: 0;
}

.action-btn .svg-icon {
  width: 1rem;
  height: 1rem;
}
</style>
