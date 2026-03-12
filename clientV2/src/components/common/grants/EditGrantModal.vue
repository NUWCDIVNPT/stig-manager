<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import Select from 'primevue/select'
import { computed, ref, toRef, watch } from 'vue'
import { roleOptions } from './roleOptions.js'
import { useGranteeFilter } from './useGranteeFilter.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  grant: {
    type: Object,
    default: null,
  },
  users: {
    type: Array,
    default: () => [],
  },
  groups: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:visible', 'save', 'cancel'])

const localVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const selectedGranteeInList = ref(null)
const selectedRoleId = ref(1)

const {
  searchText,
  selectedFilter,
  filterOptions,
  itemLabel,
  displaySource,
  toggleGroup,
  collapsedGroups,
} = useGranteeFilter(toRef(props, 'users'), toRef(props, 'groups'))

watch(() => props.grant, (newVal) => {
  if (newVal) {
    selectedRoleId.value = newVal.roleId || 1
    selectedGranteeInList.value = null
  }
}, { immediate: true })

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
      <Button label="Cancel" text @click="onCancel" />
      <Button label="Save" @click="onSave" />
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
  color: var(--color-text-primary);
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
  color: var(--color-text-dim);
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
  border: 1px solid var(--color-border-default);
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
  color: var(--color-text-primary);
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
  color: var(--color-text-dim);
}

.grantee-box {
  flex: 1;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.5rem;
  background-color: var(--color-background-dark);
}

.grantee-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.grantee-details i {
  font-size: 1.5rem;
  color: var(--color-text-dim);
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
  color: var(--color-text-dim);
}

.role-select {
  width: 155px;
}
</style>
