<script setup>
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import Menu from 'primevue/menu'
import { computed, ref } from 'vue'
import { getAssignableRoleOptions, roleMap } from '../../../../components/common/grants/roleOptions.js'
import RolePopover from '../../../../components/common/grants/RolePopover.vue'
import { useRolePickList } from '../../../../components/common/grants/useRolePickList.js'
import PickListControls from '../../../../components/common/PickListControls.vue'

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

// Make each list fill its column and own scrolling. The source list is
// virtualized (the virtual scroller exactly fills the container); the target
// list is plain, so the list container is its scroller.
const listboxPt = {
  root: { style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column; background: transparent; border: none;' },
  listContainer: { style: 'flex:1 1 auto; min-height:0; height:100%; max-height:none; overflow:auto;' },
  virtualScroller: { root: { style: 'flex:1 1 auto; min-height:0; height:100%; max-height:none;' } },
  option: { style: 'padding: 0.55rem 0.75rem;' },
}
</script>

<template>
  <div class="grant-picklist-root">
    <div class="picklist-container">
      <div class="list-column">
        <h4 class="col-header">
          Available Collections
        </h4>
        <div class="filter-container">
          <IconField class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchText" placeholder="Search By Name" fluid />
          </IconField>
        </div>

        <Listbox
          v-model="selectionSource"
          :options="displaySource"
          option-label="name"
          multiple
          :pt="listboxPt"
        >
          <template #option="slotProps">
            <div class="option-item">
              <span>{{ slotProps.option.name }}</span>
            </div>
          </template>
        </Listbox>
      </div>

      <PickListControls
        :add-disabled="selectionSource.length === 0"
        :remove-disabled="selectionTarget.length === 0"
        @add="onMoveRight"
        @add-all="onMoveAllRight"
        @remove="onMoveLeft"
        @remove-all="onMoveAllLeft"
      />

      <div class="list-column">
        <h4 class="col-header" style="display: flex; align-items: center; justify-content: space-between;">
          <span>Direct Grants</span>
          <RolePopover />
        </h4>
        <Listbox
          v-model="selectionTarget"
          :options="localTarget"
          option-label="name"
          multiple
          :pt="listboxPt"
        >
          <template #option="slotProps">
            <div class="target-option-item">
              <span class="target-option-name">{{ slotProps.option.name }}</span>
              <span v-if="slotProps.option.roleId" class="target-option-role">
                {{ roleMap[slotProps.option.roleId] || slotProps.option.roleId }}
              </span>
            </div>
          </template>
        </Listbox>
      </div>
    </div>

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

.picklist-container {
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  gap: 0.3rem;
  min-height: 0;
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

.search-field {
  flex: 1;
}

.option-item {
  font-size: 1rem;
  line-height: 1.4;
  word-break: break-word;
}

.target-option-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  gap: 0.5rem;
}

.target-option-name {
  font-size: 1rem;
  line-height: 1.4;
  word-break: break-word;
}

.target-option-role {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-bright);
  white-space: nowrap;
  padding-top: 0.05rem;
}
</style>
