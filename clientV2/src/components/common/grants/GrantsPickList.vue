<script setup>
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import { computed, ref } from 'vue'
import { getAssignableRoleOptions, roleMap, roleOptions } from './roleOptions.js'
import RolePopover from './RolePopover.vue'
import { useGranteeFilter } from './useGranteeFilter.js'

const props = defineProps({
  source: {
    type: Array,
    default: () => [],
  },
  target: {
    type: Array,
    default: () => [],
  },
  canModifyOwners: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['save', 'cancel'])

// Only an Owner (or an elevated caller) may grant the Owner role.
const availableRoleOptions = computed(() => getAssignableRoleOptions(props.canModifyOwners))

// Component is v-if guarded by parent, so direct initialization is safe
const localSource = ref([...props.source])
const localTarget = ref([...props.target])
const selectionSource = ref([])
const selectionTarget = ref([])
const addMenu = ref()

const addMenuItems = computed(() => availableRoleOptions.value.map(option => ({
  label: `with ${option.label} role`,
  icon: 'pi pi-angle-right text-green-500',
  command: () => onSelectRole(option),
})))

const sourceUsers = computed(() => localSource.value.filter(i => i.type === 'user'))
const sourceGroups = computed(() => localSource.value.filter(i => i.type === 'group'))

const {
  searchText,
  selectedFilter,
  filterOptions,
  itemLabel,
  displaySource,
  toggleGroup: toggleGroupSource,
  collapsedGroups: collapsedGroupsSource,
} = useGranteeFilter(sourceUsers, sourceGroups)

const onSelectRole = (option) => {
  if (selectionSource.value.length > 0) {
    // get items from source to move to target
    const itemsToMove = [...selectionSource.value]

    // for each item, add the selected role option selected (roleId) to the items object
    itemsToMove.forEach((item) => {
      item.roleId = option.value
      localTarget.value.push(item)
    })

    // remove from source
    localSource.value = localSource.value.filter(item => !itemsToMove.includes(item))

    selectionSource.value = []

    // op is the popover ref this closes it
    addMenu.value?.hide()
  }
}

const onMoveRight = (event) => {
  // if we have additional options, open the popover using the op ref, toggle is a popover method
  if (roleOptions.length > 0) {
    addMenu.value.toggle(event)
  }
  else {
    // no opion so just move items from source to target
    if (selectionSource.value.length > 0) {
      // this is a bit over done
      const itemsToMove = [...selectionSource.value]
      localTarget.value.push(...itemsToMove)
      // remove items from source that are being moved
      localSource.value = localSource.value.filter(item => !itemsToMove.includes(item))
      selectionSource.value = []
    }
  }
}

const onMoveLeft = () => {
  if (selectionTarget.value.length > 0) {
    // grab items from target to move to source
    const itemsToMove = [...selectionTarget.value]
    // remove option when moving back
    itemsToMove.forEach(item => delete item.roleId)

    // add items to source
    localSource.value.push(...itemsToMove)
    // remove items from target that are being moved
    localTarget.value = localTarget.value.filter(item => !itemsToMove.includes(item))
    selectionTarget.value = []
  }
}

const onMoveAllRight = (event) => {
  // select all source values
  selectionSource.value = [...localSource.value]
  // move them to the right (event is neeed to close the popover )
  onMoveRight(event)
}

const onMoveAllLeft = () => {
  // select all target values
  selectionTarget.value = [...localTarget.value]
  // move them to the left
  onMoveLeft()
}

const onSave = () => {
  emit('save', {
    source: localSource.value,
    target: localTarget.value,
  })
}

const onCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="grants-picklist-root">
    <div class="picklist-container">
      <div class="list-column">
        <h4 class="col-header">
          Available Grantees
        </h4>
        <div class="filter-container">
          <IconField class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchText" placeholder="Search By Name" fluid />
          </IconField>
          <div class="filter-group">
            <label class="filter-label">User Last Active:</label>
            <Select
              v-model="selectedFilter"
              :options="filterOptions"
              option-label="label"
              :pt="{ label: { style: 'font-size: 1.15rem;' }, item: { style: 'font-size: 1.15rem;' } }"
            />
          </div>
        </div>

        <Listbox
          v-model="selectionSource"
          :options="displaySource"
          :option-label="itemLabel"
          option-group-label="label"
          option-group-children="items"
          option-disabled="collapsed"
          multiple
          :virtual-scroller-options="{ itemSize: 42 }"
          :pt="{
            root: { style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column; background: transparent; border: none;' },
            item: { style: 'font-size: 1.15rem;' },
          }"
        >
          <template #optiongroup="slotProps">
            <div class="group-header" @click="toggleGroupSource(slotProps.option.value)">
              <i :class="collapsedGroupsSource[slotProps.option.value] ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" />
              <span>{{ slotProps.option.label }}</span>
            </div>
          </template>
          <template #option="slotProps">
            <div v-if="!slotProps.option.collapsed" class="option-item">
              <i :class="slotProps.option.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
              <span>{{ slotProps.option[itemLabel] }}</span>
            </div>
          </template>
        </Listbox>
      </div>

      <div class="controls-column">
        <Button
          label="Add All"
          icon="pi pi-angle-double-right"
          icon-pos="right"
          severity="secondary"
          class="control-btn"
          :pt="{ icon: ({ context }) => ({ style: context?.disabled ? {} : { color: 'var(--color-success)' } }) }"
          @click="onMoveAllRight"
        />
        <Button
          label="Add"
          icon="pi pi-angle-right"
          icon-pos="right"
          severity="secondary"
          :disabled="selectionSource.length === 0"
          class="control-btn"
          :pt="{ icon: ({ context }) => ({ style: context?.disabled ? {} : { color: 'var(--color-success)' } }) }"
          @click="onMoveRight"
        />
        <Button
          label="Remove"
          icon="pi pi-angle-left"
          severity="secondary"
          :disabled="selectionTarget.length === 0"
          class="control-btn"
          :pt="{ icon: ({ context }) => ({ style: context?.disabled ? {} : { color: 'var(--color-action-red)' } }) }"
          @click="onMoveLeft"
        />
        <Button
          label="Remove All"
          icon="pi pi-angle-double-left"
          severity="secondary"
          class="control-btn"
          :pt="{ icon: ({ context }) => ({ style: context?.disabled ? {} : { color: 'var(--color-action-red)' } }) }"
          @click="onMoveAllLeft"
        />
      </div>

      <div class="list-column">
        <h4 class="col-header" style="display: flex; align-items: center; justify-content: space-between;">
          <span>New Grants</span>
          <RolePopover />
        </h4>
        <Listbox
          v-model="selectionTarget"
          :options="localTarget"
          :option-label="itemLabel"
          multiple
          :pt="{
            root: { style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column; background: transparent; border: none;' },
            item: { style: 'font-size: 1.15rem;' },
          }"
        >
          <template #option="slotProps">
            <div class="target-option-item">
              <div class="target-option-name">
                <i :class="slotProps.option.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
                <span>{{ slotProps.option[itemLabel] }}</span>
              </div>
              <span v-if="slotProps.option.roleId" class="target-option-role">
                {{ roleMap[slotProps.option.roleId] || slotProps.option.roleId }}
              </span>
            </div>
          </template>
        </Listbox>
      </div>
    </div>

    <Menu ref="addMenu" :model="addMenuItems" popup />

    <div class="picklist-footer">
      <Button label="Cancel" icon="pi pi-times" text @click="onCancel" />
      <Button label="Save" icon="pi pi-check" @click="onSave" />
    </div>
  </div>
</template>

<style scoped>
.grants-picklist-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picklist-container {
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  gap: 0.3rem;
  min-height: 0;
}

.picklist-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  margin-top: auto;
}

.list-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--color-background-subtle);
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

.filter-container {
  padding: 0.5rem 0.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  border-bottom: 1px solid var(--color-border-default);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-label {
  font-size: 1.1rem;
  font-weight: 400;
  color: var(--color-text-bright);
}

.controls-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: 1.2rem;
  padding: 0 0.25rem;
}

.control-btn {
  min-width: 8rem;
  padding: 0.6rem 1rem;
  font-size: 1.1rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
}

.option-item i {
  font-size: 1.3rem;
}

.search-field {
  flex: 1;
}

.group-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.1rem;
  padding: 0.25rem 0rem;
  gap: 0.3rem;
}

/* Make the list fill its column. Source list is virtualized (the inner
   .p-virtualscroller owns scrolling and exactly fills this container, so it
   never overflows); target list is plain, so this container is its scroller —
   overflow:auto serves both. */
:deep(.p-listbox-list-container) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow: auto;
}

:deep(.p-virtualscroller) {
  height: 100% !important;
}

.target-option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.target-option-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
}

.target-option-name i {
  font-size: 1.3rem;
}

.target-option-role {
  font-size: 1.05rem;
  color: var(--color-text-bright);
}
</style>
