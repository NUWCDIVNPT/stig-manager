<script setup>
import Button from 'primevue/button'
import Listbox from 'primevue/listbox'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import { computed } from 'vue'
import { pickListListboxPt, pickListVirtualScrollerOptions } from '../../../shared/lib/pickListPt.js'
import PickListLayout from '../PickListLayout.vue'
import PickListPane from '../PickListPane.vue'
import { getAssignableRoleOptions, roleMap } from './roleOptions.js'
import RolePopover from './RolePopover.vue'
import { useGranteeFilter } from './useGranteeFilter.js'
import { useRolePickList } from './useRolePickList.js'

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
  showFooter: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['save', 'cancel', 'update:source', 'update:target'])

const VIRTUAL_SCROLLER_OPTIONS = pickListVirtualScrollerOptions()

// Only an Owner (or an elevated caller) may grant the Owner role.
const availableRoleOptions = computed(() => getAssignableRoleOptions(props.canModifyOwners))

// Component is v-if guarded by parent, so direct initialization is safe
const {
  localSource,
  localTarget,
  selectionSource,
  selectionTarget,
  addMenu,
  addMenuItems,
  onMoveRight,
  onMoveLeft,
  onMoveAllLeft,
} = useRolePickList({
  source: props.source,
  target: props.target,
  roleOptions: availableRoleOptions,
  emit,
})

const sourceUsers = computed(() => localSource.value.filter(i => i.type === 'user'))
const sourceGroups = computed(() => localSource.value.filter(i => i.type === 'group'))

const {
  searchText,
  selectedFilter,
  filterOptions,
  itemLabel,
  displaySource,
  filteredSource,
  toggleGroup: toggleGroupSource,
  collapsedGroups: collapsedGroupsSource,
} = useGranteeFilter(sourceUsers, sourceGroups)

// "Add All" moves only the grantees matching the active search/last-active
// filters, so select those rather than the composable's default of everything.
function onMoveAllRight(event) {
  selectionSource.value = [...filteredSource.value]
  onMoveRight(event)
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
    <PickListLayout
      :add-disabled="selectionSource.length === 0"
      :remove-disabled="selectionTarget.length === 0"
      @add="onMoveRight"
      @add-all="onMoveAllRight"
      @remove="onMoveLeft"
      @remove-all="onMoveAllLeft"
    >
      <template #source>
        <PickListPane v-model:search="searchText" show-search search-placeholder="Search grantees...">
          <template #header>
            Available Grantees
          </template>
          <template #filter>
            <div class="filter-group">
              <label class="filter-label">User Last Active:</label>
              <Select
                v-model="selectedFilter"
                :options="filterOptions"
                option-label="label"
                :pt="{ label: { style: 'font-size: var(--text-lg);' } }"
              />
            </div>
          </template>

          <Listbox
            v-model="selectionSource"
            :options="displaySource"
            :option-label="itemLabel"
            option-group-label="label"
            option-group-children="items"
            option-disabled="collapsed"
            multiple
            :virtual-scroller-options="VIRTUAL_SCROLLER_OPTIONS"
            :pt="pickListListboxPt"
          >
            <template #optiongroup="slotProps">
              <div class="group-header" @click="toggleGroupSource(slotProps.option.value)">
                <i :class="collapsedGroupsSource[slotProps.option.value] ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" />
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
            <template #option="slotProps">
              <div v-if="!slotProps.option.collapsed" class="option-item" :title="slotProps.option[itemLabel]">
                <i :class="slotProps.option.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
                <span>{{ slotProps.option[itemLabel] }}</span>
              </div>
            </template>
          </Listbox>
        </PickListPane>
      </template>

      <template #target>
        <PickListPane>
          <template #header>
            <span>New Grants</span>
            <RolePopover />
          </template>
          <Listbox
            v-model="selectionTarget"
            :options="localTarget"
            :option-label="itemLabel"
            multiple
            :virtual-scroller-options="VIRTUAL_SCROLLER_OPTIONS"
            :pt="pickListListboxPt"
          >
            <template #option="slotProps">
              <div class="target-option-item">
                <div class="target-option-name" :title="slotProps.option[itemLabel]">
                  <i :class="slotProps.option.type === 'user' ? 'pi pi-user' : 'pi pi-users'" />
                  <span>{{ slotProps.option[itemLabel] }}</span>
                </div>
                <span v-if="slotProps.option.roleId" class="target-option-role">
                  {{ roleMap[slotProps.option.roleId] || slotProps.option.roleId }}
                </span>
              </div>
            </template>
          </Listbox>
        </PickListPane>
      </template>
    </PickListLayout>

    <Menu ref="addMenu" :model="addMenuItems" popup />

    <div v-if="showFooter" class="picklist-footer">
      <Button label="Cancel" icon="pi pi-times" text @click="onCancel" />
      <Button label="Save" icon="pi pi-check" :disabled="localTarget.length === 0" @click="onSave" />
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

.picklist-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  margin-top: auto;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-label {
  font-size: var(--text-lg);
  font-weight: 400;
  color: var(--color-text-bright);
}

/* Fixed-height single-line rows (virtual scroller requirement); the full
   name shows in the title tooltip on hover. */
.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.option-item i {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.option-item span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 700;
  font-size: var(--text-md);
  padding: 0.25rem 0rem;
  gap: 0.3rem;
}

.target-option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
  min-width: 0;
}

.target-option-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.target-option-name i {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.target-option-name span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.target-option-role {
  color: var(--color-text-bright);
}
</style>
