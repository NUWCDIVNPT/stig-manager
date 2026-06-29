<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import Select from 'primevue/select'
import { computed, ref, toRef, watch } from 'vue'
import { getAssignableRoleOptions } from './roleOptions.js'
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
  canModifyOwners: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:visible', 'save'])

// Only an Owner (or an elevated caller) may assign the Owner role.
const availableRoleOptions = computed(() => getAssignableRoleOptions(props.canModifyOwners))

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

const isOptionSelected = option => !!selectedGranteeInList.value && (
  (option.type === 'user' && selectedGranteeInList.value.userId === option.userId)
  || (option.type === 'group' && selectedGranteeInList.value.userGroupId === option.userGroupId)
)

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
    :pt="{
      root: { style: 'width: 500px; height: 650px; display: flex; flex-direction: column;' },
      content: { style: 'flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding-bottom: 0;' },
    }"
  >
    <div class="edit-grant-layout">
      <!-- Top Section: Available Grantees -->
      <div class="available-section">
        <h4 class="col-header">
          Available Grantees
        </h4>
        <div class="section-content">
          <div class="filter-row">
            <IconField class="search-field">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchText"
                placeholder="Filter names"
                class="search-input"
                :pt="{ root: { style: 'padding-top: 0.4rem; padding-bottom: 0.4rem; background-color: var(--color-background-light); border-color: var(--color-border-default);' } }"
              />
            </IconField>
            <div class="filter-item">
              <span class="filter-label">Active:</span>
              <Select
                v-model="selectedFilter"
                :options="filterOptions"
                option-label="label"
                size="small"
                class="filter-select"
              />
            </div>
          </div>

          <Listbox
            v-model="selectedGranteeInList"
            :options="displaySource"
            :option-label="itemLabel"
            option-group-label="label"
            option-group-children="items"
            option-disabled="collapsed"
            :virtual-scroller-options="{ itemSize: 42 }"
            class="grantee-listbox"
            :pt="{
              root: { style: 'display: flex; flex-direction: column; min-height: 0;' },
              list: { style: 'padding: 0;' },
              option: { style: 'padding: 0;' },
              optionGroup: { style: 'padding: 0;' },
            }"
          >
            <template #optiongroup="slotProps">
              <div class="group-header" @click="toggleGroup(slotProps.option.value)">
                <i :class="collapsedGroups[slotProps.option.value] ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" />
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
            <template #option="slotProps">
              <div
                v-if="!slotProps.option.collapsed"
                class="option-item"
                :class="{ 'option-item--selected': isOptionSelected(slotProps.option) }"
              >
                <i :class="slotProps.option.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
                <span>{{ slotProps.option.displayName || slotProps.option.username || slotProps.option.name }}</span>
              </div>
            </template>
          </Listbox>
        </div>
      </div>

      <!-- Bottom Section: Modified Grant -->
      <div class="modified-section">
        <h4 class="col-header">
          Modified Grant
        </h4>
        <div class="section-content">
          <div class="field-row">
            <label>Grantee</label>
            <div class="grantee-box">
              <div v-if="currentGrantee" class="grantee-details">
                <i :class="currentGrantee.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
                <div class="grantee-text">
                  <span class="grantee-name">{{ currentGrantee.displayName || currentGrantee.username || currentGrantee.name }}</span>
                  <span v-if="currentGrantee.username" class="grantee-sub">{{ currentGrantee.username }}</span>
                </div>
              </div>
              <div v-else class="grantee-details grantee-details--empty">
                <i class="pi pi-info-circle" />
                <span>No selection</span>
              </div>
            </div>
          </div>
          <div class="field-row">
            <label>Role</label>
            <Select
              v-model="selectedRoleId"
              :options="availableRoleOptions"
              option-label="label"
              option-value="value"
              class="role-select"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" text @click="onCancel" />
        <Button label="Save" @click="onSave" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.edit-grant-layout {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: 1rem;
  overflow: hidden;
}

.col-header {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-bright);
  background: var(--p-datatable-row-background);
  border-bottom: 1px solid var(--color-border-default);
}

.available-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-radius: 6px;
  border: 1px solid var(--color-border-default);
  background-color: var(--color-background-subtle);
  overflow: hidden;
}

.section-content {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: 0.6rem;
  padding: 0.75rem;
}

.filter-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  background-color: var(--color-background-subtle);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.filter-label {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  white-space: nowrap;
}

.filter-select {
  width: 90px;
}

.search-field {
  flex: 1;
}

.search-input {
  width: 100%;
}

.grantee-listbox {
  flex: 1;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background: var(--color-background-light);
  padding: 0.25rem;
  overflow: hidden;
}

:deep(.grantee-listbox .p-listbox-list-container) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow: auto;
}

:deep(.grantee-listbox .p-virtualscroller) {
  height: 100% !important;
}

/* Rows match the Add Grants modal: simple icon + name, filling the fixed-height
   virtual-scroller slot so they read as uniform bands. */
.group-header {
  display: flex;
  align-items: center;
  height: 100%;
  cursor: pointer;
  padding: 0 0.4rem;
  gap: 0.3rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  padding: 0 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.15rem;
  transition: background-color 0.12s ease;
}

.option-item i {
  font-size: 1.3rem;
}

.option-item:hover {
  background-color: var(--color-background-light);
}

.option-item--selected {
  background-color: color-mix(in srgb, var(--p-primary-color) 16%, transparent);
}

.modified-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background-color: var(--color-background-subtle);
  overflow: hidden;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.field-row label {
  width: 64px;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.grantee-box {
  flex: 1;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-background-light);
}

.grantee-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.grantee-details i {
  font-size: 1.4rem;
  color: var(--color-text-dim);
}

.grantee-details--empty {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.grantee-details--empty i {
  font-size: 1rem;
}

.grantee-text {
  display: flex;
  flex-direction: column;
}

.grantee-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.grantee-sub {
  font-size: 0.9rem;
  color: var(--color-text-dim);
}

.role-select {
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding-top: 1rem;
}
</style>
