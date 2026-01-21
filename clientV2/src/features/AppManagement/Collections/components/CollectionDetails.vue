<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Toolbar from 'primevue/toolbar'
import { inject, ref, watch } from 'vue'
import DeleteModal from '../../../../components/common/DeleteModal.vue'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import GrantsPickList from './GrantsPickList.vue'

import RolePopover from './RolePopover.vue'

const props = defineProps({
  collection: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['updated'])

//  state for editing to avoid direct prop mutation
const localCollection = ref({})
const grants = ref([])
const worker = inject('worker')

const addGrantVisible = ref(false)
const availableGrantees = ref([])
const selectedGrantees = ref([])

const fetchGrants = async (collectionId) => {
  try {
    const response = await fetch(`http://localhost:64001/api/collections/${collectionId}/grants?elevate=true`, {
      headers: {
        Authorization: `Bearer ${worker.token}`,
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    grants.value = await response.json()
  }
  catch (error) {
    const { triggerError } = useGlobalError()
    triggerError(error)
  }
}

watch(() => props.collection, async (newVal) => {
  if (newVal) {
    localCollection.value = { ...newVal }
    await fetchGrants(newVal.collectionId)
  }
  else {
    localCollection.value = {}
    grants.value = []
  }
}, { immediate: true })

const grantsDt = ref()

const exportGrantsCSV = () => {
  grantsDt.value.exportCSV()
}

const editGrant = (grant) => {
  console.log('Edit grant:', grant)
}

const deleteGrantVisible = ref(false)
const grantToDelete = ref(null)

const deleteGrant = (grant) => {
  grantToDelete.value = grant
  deleteGrantVisible.value = true
}

const confirmDeleteGrant = async () => {
  if (!grantToDelete.value) {
    return
  }

  try {
    const url = `http://localhost:64001/api/collections/${localCollection.value.collectionId}/grants/${grantToDelete.value.grantId}?elevate=true`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${worker.token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Refresh grants
    await fetchGrants(localCollection.value.collectionId)
  }
  catch (error) {
    const { triggerError } = useGlobalError()
    triggerError(error)
  }
}

const addGrants = async () => {
  try {
    // Fetch users and user groups
    const [usersRes, groupsRes] = await Promise.all([
      fetch('http://localhost:64001/api/users?status=available', { headers: { Authorization: `Bearer ${worker.token}` } }),
      fetch('http://localhost:64001/api/user-groups', { headers: { Authorization: `Bearer ${worker.token}` } }),
    ])

    let users = []
    let groups = []

    if (usersRes.ok) {
      users = await usersRes.json()
    }
    if (groupsRes.ok) {
      groups = await groupsRes.json()
    }

    // Filter out existing grants
    const existingUserIds = grants.value.filter(g => g.user).map(g => g.user.userId)
    const existingGroupIds = grants.value.filter(g => g.userGroup).map(g => g.userGroup.userGroupId)

    console.log(groups)

    const available = [
      ...users.filter(u => !existingUserIds.includes(u.userId)).map(u => ({ ...u, type: 'user', displayName: u.username })), // standardization for picklist label
      ...groups.filter(g => !existingGroupIds.includes(g.userGroupId)).map(g => ({ ...g, type: 'group', displayName: g.name })),
    ]

    availableGrantees.value = available
    selectedGrantees.value = []
    addGrantVisible.value = true
  }
  catch (error) {
    const { triggerError } = useGlobalError()
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

    await fetch(`http://localhost:64001/api/collections/${localCollection.value.collectionId}/grants?elevate=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${worker.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    await fetchGrants(localCollection.value.collectionId)
    addGrantVisible.value = false
  }
  catch (error) {
    const { triggerError } = useGlobalError()
    triggerError(error)
  }
}

const updateCollection = async (field) => {
  // no change
  if (localCollection.value[field] === props.collection[field]) {
    return
  }

  try {
    const payload = {}
    payload[field] = localCollection.value[field]

    const response = await fetch(`http://localhost:64001/api/collections/${localCollection.value.collectionId}?elevate=true&projection=labels`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${worker.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    emit('updated')
  }
  catch (error) {
    const { triggerError } = useGlobalError()
    triggerError(error)
  }
}
</script>

<template>
  <div class="details-container">
    <div class="details-header">
      <h2 class="details-title">
        Properties
      </h2>
    </div>

    <div v-if="collection" class="details-content">
      <div class="section">
        <h3 class="section-title">
          Information
        </h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="name" class="label">Name</label>
            <InputText
              id="name"
              v-model="localCollection.name"
              class="input-full"
              @blur="updateCollection('name')"
            />
          </div>
          <div class="form-group">
            <label for="description" class="label">Description</label>
            <Textarea
              id="description"
              v-model="localCollection.description"
              rows="3"
              class="input-full"
              @blur="updateCollection('description')"
            />
          </div>
        </div>
      </div>

      <div class="section full-height">
        <div class="section-header-row">
          <h3 class="section-title">
            Grants
          </h3>
        </div>

        <div class="grants-table-wrapper">
          <Toolbar class="grants-toolbar">
            <template #start>
              <Button label="Add Grants..." icon="pi pi-plus" text class="add-grants-btn" @click="addGrants" />
            </template>
          </Toolbar>
          <DataTable
            ref="grantsDt"
            :value="grants"
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
                {{ data.roleId === 1 ? 'Restricted' : (data.roleId === 2 ? 'Full' : (data.roleId === 3 ? 'Manage' : (data.roleId === 4 ? 'Owner' : 'Unknown'))) }}
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
                  <Button icon="pi pi-pencil" text rounded class="action-btn" @click="editGrant(data)" />
                  <Button icon="pi pi-trash" text rounded severity="danger" class="action-btn" @click="deleteGrant(data)" />
                </div>
              </template>
            </Column>
            <template #footer>
              <div class="grants-footer">
                <Button icon="pi pi-download" label="CSV" text size="large" class="csv-btn" @click="exportGrantsCSV" />
                <div class="grants-count-badge">
                  <i class="pi pi-list" style="font-size: 0.9rem;" />
                  <span>{{ grants ? grants.length : 0 }} Grant{{ (grants && grants.length !== 1) ? 's' : '' }}</span>
                </div>
              </div>
            </template>
          </DataTable>
        </div>
      </div>
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
  </div>
</template>

<style scoped>
.details-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid var(--common-border);
}

.details-header {
  padding: 1rem;
  border-bottom: 1px solid var(--common-border);
}

.details-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.details-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1 1 auto;
  overflow: hidden;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 0 0 auto;
}

.section.full-height {
  flex: 1 1 auto;
  min-height: 0;
}

.section-title {
  font-size: 0.99rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-left: 0.25rem;
}

.form-grid {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-weight: 500;
}

.input-full {
  width: 100%;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.grants-table-wrapper {
  border: 1px solid var(--common-border);
  border-radius: 6px;
  overflow: hidden;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.grants-count-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--common-secondary-background);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.grants-toolbar {
  padding: 0.5rem;
  border-bottom: 1px solid var(--common-border);
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
  color: #9ca3af;
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
