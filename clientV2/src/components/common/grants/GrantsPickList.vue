<script setup>
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import Popover from 'primevue/popover'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { computed, ref } from 'vue'
import RolePopover from './RolePopover.vue'
import { roleOptions, roleMap } from './roleOptions.js'
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
})

const emit = defineEmits(['save', 'cancel'])

// Component is v-if guarded by parent, so direct initialization is safe
const localSource = ref([...props.source])
const localTarget = ref([...props.target])
const selectionSource = ref([])
const selectionTarget = ref([])
const popoverRef = ref()

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
    popoverRef.value.hide()
  }
}

const onMoveRight = (event) => {
  // if we have additional options, open the popover using the op ref, toggle is a popover method
  if (roleOptions.length > 0) {
    popoverRef.value.toggle(event)
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
        <h4 class="list-header">
          Available Grantees
        </h4>
        <div class="filter-container">
          <IconField class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchText" placeholder="Search By Name" fluid />
          </IconField>
          <div class="filter-group">
            <label class="filter-label">User Last Active:</label>
            <Select v-model="selectedFilter" :options="filterOptions" option-label="label" />
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
          :pt="{
            root: { style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column;' },
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
        <Button icon="pi pi-angle-double-right" text @click="onMoveAllRight" />
        <Button icon="pi pi-angle-right" text :disabled="selectionSource.length === 0" @click="onMoveRight" />
        <Button icon="pi pi-angle-left" text :disabled="selectionTarget.length === 0" @click="onMoveLeft" />
        <Button icon="pi pi-angle-double-left" text @click="onMoveAllLeft" />
      </div>

      <div class="list-column">
        <!-- Spacer to align list heights with left column filter area -->
        <div class="filter-spacer" />
        <h4 class="list-header" style="display: flex; align-items: center; gap: 0.5rem;">
          New Grants
          <RolePopover />
        </h4>
        <Listbox
          v-model="selectionTarget"
          :options="localTarget"
          :option-label="itemLabel"
          multiple
          :pt="{
            root: { style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column;' },
          }"
        >
          <template #option="slotProps">
            <div class="target-option-item">
              <div class="target-option-name">
                <i :class="slotProps.option.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
                <span>{{ slotProps.option[itemLabel] }}</span>
              </div>
              <Tag
                v-if="slotProps.option.roleId"
                :value="roleMap[slotProps.option.roleId] || slotProps.option.roleId"
                :class="`role-tag-${slotProps.option.roleId}`"
              />
            </div>
          </template>
        </Listbox>
      </div>
    </div>

    <!-- op ref is in control of this popover -->
    <Popover ref="popoverRef">
      <div class="popover-container">
        <span class="popover-header">Assign Role:</span>
        <div v-for="option in roleOptions" :key="option.value">
          <Button
            :label="option.label"
            text
            :pt="{
              root: { style: 'width: 100%; justify-content: flex-start; text-align: left;' },
            }"
            @click="onSelectRole(option)"
          />
        </div>
      </div>
    </Popover>

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
}

.list-header {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  flex: 0 0 auto;
}

.filter-container {
  margin-bottom: 0.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.filter-spacer {
  height: 3.5rem;
  flex: 0 0 auto;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.controls-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-item i {
  font-size: 1.3rem;
}

.search-field {
  flex: 1;
}

.popover-container {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.2rem;
}

.popover-header {
  font-weight: bold;
  margin-bottom: 0.2rem;
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

/* last resort */
:deep(.p-listbox-list-container) {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  max-height: none !important;
  overflow: auto;
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
}

.target-option-name i {
  font-size: 1.3rem;
}

.role-tag-1 {
  background: var(--role-restricted);
  color: var(--color-text-bright);
}
.role-tag-2 {
  background: var(--role-full);
  color: var(--color-text-bright);
}
.role-tag-3 {
  background: var(--role-manage);
  color: var(--color-text-bright);
}
.role-tag-4 {
  background: var(--role-owner);
  color: var(--color-text-bright);
}
</style>
