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
  canModifyOwners: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:visible', 'save', 'cancel'])

// Only an Owner (or an elevated caller) may assign the Owner role.
const availableRoleOptions = computed(() =>
  props.canModifyOwners ? roleOptions : roleOptions.filter(option => option.value !== 4),
)

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
        <span class="section-label">Available Grantees</span>

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
          class="grantee-listbox"
          :pt="{
            listContainer: { style: 'max-height: none;' },
            list: { style: 'padding: 0;' },
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
              <div class="radio-circle" :class="{ selected: isOptionSelected(slotProps.option) }">
                <div class="radio-dot" />
              </div>

              <i class="option-icon" :class="slotProps.option.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
              <span class="option-name">{{ slotProps.option[itemLabel] }}</span>
            </div>
          </template>
        </Listbox>
      </div>

      <!-- Bottom Section: Modified Grant -->
      <div class="modified-section">
        <span class="section-label">Modified Grant</span>
        <div class="modified-content">
          <div class="field-row">
            <label>Grantee</label>
            <div class="grantee-box">
              <div v-if="currentGrantee" class="grantee-details">
                <i :class="currentGrantee.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
                <div class="grantee-text">
                  <span class="grantee-name">{{ currentGrantee.displayName }}</span>
                  <span v-if="currentGrantee.username && currentGrantee.username !== currentGrantee.displayName" class="grantee-sub">{{ currentGrantee.username }}</span>
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

.section-label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-dim);
}

.available-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 0.6rem;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--color-border-default);
  background-color: var(--color-background-subtle);
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
  overflow-y: auto;
}

.group-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.35rem 0.4rem;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-dim);
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.5rem;
  margin: 0.1rem 0;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.option-item:hover {
  background-color: var(--color-background-light);
}

.option-item--selected {
  background-color: color-mix(in srgb, var(--p-primary-color) 16%, transparent);
}

.option-icon {
  font-size: 1.05rem;
  color: var(--color-text-dim);
}

.option-name {
  font-size: 0.92rem;
}

.radio-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--color-border-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.radio-circle.selected {
  border-color: var(--p-primary-color);
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
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 0.75rem;
  background-color: var(--color-background-subtle);
}

.modified-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  font-size: 0.8rem;
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
