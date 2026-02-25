<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import Select from 'primevue/select'
import { computed, inject, onMounted, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  grant: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'save', 'cancel'])

const worker = inject('worker')

const localVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const users = ref([])
const groups = ref([])
const selectedGranteeInList = ref(null)

const searchText = ref('')
const filterOptions = [
  { label: 'All', value: 0 },
  { label: '30 Days', value: 30 },
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
]
const selectedFilter = ref(filterOptions[0])
const collapsedGroups = ref({})

const selectedRoleId = ref(1)
const roleOptions = [
  { label: 'Restricted', value: 1 },
  { label: 'Full', value: 2 },
  { label: 'Manage', value: 3 },
  { label: 'Owner', value: 4 },
]

const itemLabel = 'displayName'

const fetchData = async () => {
  try {
    const [usersRes, groupsRes] = await Promise.all([
      fetch('http://localhost:64001/api/users?status=available', { headers: { Authorization: `Bearer ${worker.token}` } }),
      fetch('http://localhost:64001/api/user-groups', { headers: { Authorization: `Bearer ${worker.token}` } }),
    ])

    if (usersRes.ok) {
      const rawUsers = await usersRes.json()
      users.value = rawUsers.map(u => ({ ...u, type: 'user', displayName: u.username })) // Standardize
    }
    if (groupsRes.ok) {
      const rawGroups = await groupsRes.json()
      groups.value = rawGroups.map(g => ({ ...g, type: 'group', displayName: g.name })) // Standardize
    }
  }
  catch (error) {
    console.error('Failed to fetch grantees', error)
  }
}

watch(() => props.grant, (newVal) => {
  if (newVal) {
    selectedRoleId.value = newVal.roleId || 1
    selectedGranteeInList.value = null
  }
}, { immediate: true })

onMounted(() => {
  fetchData()
})

const displaySource = computed(() => {
  let filteredUsers = users.value
  let filteredGroups = groups.value

  if (searchText.value) {
    const lower = searchText.value.toLowerCase()
    filteredUsers = filteredUsers.filter(u => u[itemLabel].toLowerCase().includes(lower))
    filteredGroups = filteredGroups.filter(g => g[itemLabel].toLowerCase().includes(lower))
  }

  if (selectedFilter.value.value > 0) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - selectedFilter.value.value)
    filteredUsers = filteredUsers.filter((u) => {
      if (!u.lastAccess) {
        return false
      }
      return new Date(u.lastAccess) >= cutoffDate
    })
  }

  return [
    {
      label: 'User Groups',
      value: 'group',
      items: collapsedGroups.value.group ? [{ collapsed: true, [itemLabel]: '' }] : filteredGroups,
    },
    {
      label: 'Users',
      value: 'user',
      items: collapsedGroups.value.user ? [{ collapsed: true, [itemLabel]: '' }] : filteredUsers,
    },
  ]
})

const toggleGroup = (groupValue) => {
  collapsedGroups.value[groupValue] = !collapsedGroups.value[groupValue]
}

const currentGrantee = computed(() => {
  if (selectedGranteeInList.value) {
    return selectedGranteeInList.value
  }
  if (props.grant) {
    if (props.grant.user) {
      return { ...props.grant.user, type: 'user', displayName: props.grant.user.displayName || props.grant.user.username }
    }
    if (props.grant.userGroup) {
      return { ...props.grant.userGroup, type: 'group', displayName: props.grant.userGroup.name }
    }
  }
  return null
})

const onSave = () => {
  if (!currentGrantee.value) {
    return
  }

  const updatedGrant = {
    ...props.grant,
    roleId: selectedRoleId.value,
  }

  if (currentGrantee.value.type === 'user') {
    updatedGrant.userId = currentGrantee.value.userId
    if (updatedGrant.userGroupId) {
      delete updatedGrant.userGroupId
    }
  }
  else {
    updatedGrant.userGroupId = currentGrantee.value.userGroupId
    if (updatedGrant.userId) {
      delete updatedGrant.userId
    }
  }

  emit('save', updatedGrant)
  localVisible.value = false
}

const onCancel = () => {
  localVisible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    header="Edit Grant"
    :modal="true"
    :style="{ width: '500px', height: '650px' }"
    :pt="{
      content: { style: 'display: flex; flex-direction: column; overflow: hidden; padding-bottom: 0;' },
    }"
  >
    <div class="edit-grant-layout">
      <!-- Top Section: Available Grantees -->
      <div class="available-section">
        <div class="section-header">
          Available Grantees
        </div>

        <div class="filter-row">
          <div class="filter-item">
            <span class="filter-label">Users:</span>
            <Select
              v-model="selectedFilter"
              :options="filterOptions"
              option-label="label"
              size="small"
              class="filter-select"
            />
          </div>
          <IconField class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchText" placeholder="Filter names" class="search-input" />
          </IconField>
        </div>

        <Listbox
          v-model="selectedGranteeInList"
          :options="displaySource"
          :option-label="itemLabel"
          option-group-label="label"
          option-group-children="items"
          option-disabled="collapsed"
          class="grantee-listbox"
          :pt="{
            listContainer: { style: 'max-height: none;' },
          }"
        >
          <template #optiongroup="slotProps">
            <div class="group-header" @click="toggleGroup(slotProps.option.value)">
              <i :class="collapsedGroups[slotProps.option.value] ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" />
              <span>{{ slotProps.option.label }}</span>
            </div>
          </template>
          <template #option="slotProps">
            <div v-if="!slotProps.option.collapsed" class="option-item">
              <!-- Selection indicator (radio button style logic managed by listbox selection) -->
              <div
                class="radio-circle"
                :class="{ selected: selectedGranteeInList && ((slotProps.option.type === 'user' && selectedGranteeInList.userId === slotProps.option.userId) || (slotProps.option.type === 'group' && selectedGranteeInList.userGroupId === slotProps.option.userGroupId)) }"
              >
                <div class="radio-dot" />
              </div>

              <i :class="slotProps.option.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
              <span>{{ slotProps.option[itemLabel] }}</span>
            </div>
          </template>
        </Listbox>
      </div>

      <!-- Bottom Section: Modified Grant -->
      <div class="modified-section">
        <div class="modified-header">
          Modified Grant
        </div>
        <div class="modified-content">
          <div class="field-row">
            <label>Grantee:</label>
            <div class="grantee-box">
              <div v-if="currentGrantee" class="grantee-details">
                <i :class="currentGrantee.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
                <div class="grantee-text">
                  <span class="grantee-name">{{ currentGrantee.displayName }}</span>
                  <span v-if="currentGrantee.username && currentGrantee.username !== currentGrantee.displayName" class="grantee-sub">{{ currentGrantee.username }}</span>
                </div>
              </div>
              <div v-else class="grantee-details">
                <span>No selection</span>
              </div>
            </div>
          </div>
          <div class="field-row">
            <label>Role:</label>
            <Select
              v-model="selectedRoleId"
              :options="roleOptions"
              option-label="label"
              option-value="value"
              class="role-select"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" class="p-button-secondary" @click="onCancel" />
      <Button label="Save" class="p-button-secondary" @click="onSave" />
    </template>
  </Dialog>
</template>

<style scoped>
.edit-grant-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.5rem;
  overflow: hidden;
}

.available-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--color-border-default);
}

.section-header {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #ddd;
}

.filter-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.9rem;
  white-space: nowrap;
}

.filter-select {
  width: 100px;
}

.search-field {
  flex: 1;
}

.search-input {
  width: 100%;
  padding-left: 0.5rem;
}
/* last ditch try to fix input padding */
:deep(.p-inputtext) {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}

.grantee-listbox {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  overflow-y: auto;
}

:deep(.p-listbox-list) {
  padding: 0;
}

.group-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.25rem ;
  gap: 0.25rem;
  font-weight: bold;
  color: #aaa;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.radio-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-circle.selected {
  border-color: var(--p-primary-color);
  background-color: rgba(var(--p-primary-color-rgb), 0.2);
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--p-primary-color);
  display: none;
}

.radio-circle.selected .radio-dot {
  display: block;
}

.modified-section {
  flex: 0 0 auto;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
}

.modified-header {
  padding: 0.5rem;
  font-weight: bold;
  color: #fff;
}

.modified-content {
  padding: 1rem;
  background-color: var(--color-background-subtle);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.field-row label {
  width: 70px;
  color: #ccc;
}

.grantee-box {
  flex: 1;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.5rem;
  background-color: #252525;
}

.grantee-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.grantee-details i {
  font-size: 1.5rem;
  color: #aaa;
}

.grantee-text {
  display: flex;
  flex-direction: column;
}

.grantee-name {
  font-weight: bold;
}

.grantee-sub {
  font-size: 0.8rem;
  color: #888;
}

.role-select {
  width: 155px;
}
</style>
