<script setup>
import Listbox from 'primevue/listbox'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import { computed, ref } from 'vue'
import { pickListListboxPt, pickListVirtualScrollerOptions } from '../../../shared/lib/pickListPt.js'
import PickListLayout from '../PickListLayout.vue'
import PickListPane from '../PickListPane.vue'
import { getAssignableRoleOptions } from './roleOptions.js'
import RolePopover from './RolePopover.vue'
import { useRolePickList } from './useRolePickList.js'

const props = defineProps({
  // Collections available for a direct grant: { collectionId, name }
  source: {
    type: Array,
    default: () => [],
  },
  // Staged grants: { collectionId, name, roleId }
  target: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:source', 'update:target'])

const VIRTUAL_SCROLLER_OPTIONS = pickListVirtualScrollerOptions()

// Elevated admin context, so every role (including Owner) is assignable.
const availableRoleOptions = getAssignableRoleOptions(true)

// Component is v-if guarded by parent, so direct initialization is safe
const {
  localSource,
  localTarget,
  selectionSource,
  selectionTarget,
  addMenu,
  addMenuItems,
  onRoleChange,
  onMoveRight,
  onMoveLeft,
  onMoveAllLeft,
} = useRolePickList({
  source: props.source,
  target: props.target,
  roleOptions: availableRoleOptions,
  emit,
})

const searchText = ref('')

const displaySource = computed(() => {
  const term = searchText.value.trim().toLowerCase()
  if (!term) {
    return localSource.value
  }
  return localSource.value.filter(c => c.name?.toLowerCase().includes(term))
})

// "Add All" moves only the visible (filtered) collections, so select those
// rather than the composable's default of everything.
function onMoveAllRight(event) {
  selectionSource.value = [...displaySource.value]
  onMoveRight(event)
}

const roleSelectPt = {
  root: { style: 'background-color: var(--color-background-light); border-color: var(--color-border-default); width: 8.5rem; flex-shrink: 0;' },
  label: { style: 'padding: 0.25rem 0.5rem; font-size: var(--text-md);' },
  option: { style: 'font-size: var(--text-md);' },
}
</script>

<template>
  <div class="grant-picklist-root">
    <PickListLayout
      :add-disabled="selectionSource.length === 0"
      :remove-disabled="selectionTarget.length === 0"
      @add="onMoveRight"
      @add-all="onMoveAllRight"
      @remove="onMoveLeft"
      @remove-all="onMoveAllLeft"
    >
      <template #source>
        <PickListPane v-model:search="searchText" show-search search-placeholder="Search collections...">
          <template #header>
            Available Collections
          </template>

          <Listbox
            v-model="selectionSource"
            :options="displaySource"
            option-label="name"
            multiple
            :virtual-scroller-options="VIRTUAL_SCROLLER_OPTIONS"
            :pt="pickListListboxPt"
          >
            <template #option="slotProps">
              <div class="option-item" :title="slotProps.option.name">
                <span>{{ slotProps.option.name }}</span>
              </div>
            </template>
          </Listbox>
        </PickListPane>
      </template>

      <template #target>
        <PickListPane>
          <template #header>
            <span>Direct Grants</span>
            <RolePopover />
          </template>
          <Listbox
            v-model="selectionTarget"
            :options="localTarget"
            option-label="name"
            multiple
            :virtual-scroller-options="VIRTUAL_SCROLLER_OPTIONS"
            :pt="pickListListboxPt"
          >
            <template #option="slotProps">
              <div class="target-option-item">
                <span class="target-option-name" :title="slotProps.option.name">{{ slotProps.option.name }}</span>
                <Select
                  v-if="slotProps.option.roleId"
                  :model-value="slotProps.option.roleId"
                  :options="availableRoleOptions"
                  option-label="label"
                  option-value="value"
                  size="small"
                  :pt="roleSelectPt"
                  @update:model-value="onRoleChange(slotProps.option, $event)"
                  @click.stop
                />
              </div>
            </template>
          </Listbox>
        </PickListPane>
      </template>
    </PickListLayout>

    <Menu ref="addMenu" :model="addMenuItems" popup />
  </div>
</template>

<style scoped>
.grant-picklist-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.option-item {
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  line-height: 1.4;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
