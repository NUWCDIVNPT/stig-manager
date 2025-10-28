<!-- <script setup>
import { ref, onMounted, watch } from 'vue'
import Tree from 'primevue/tree'
import { useNavTreeCollections } from '../composeables/useNavTreeCollections'
import Drawer from 'primevue/drawer'
const selectedData = defineModel('selectedData', { default: {} })

const { nodes, loading } = useNavTreeCollections()
const expandedKeys = ref({ collections: true })
const selectionKeys = ref({})
const visible = ref(true)

function findNodeByKey(key, list) {
  for (const node of list) {
    if (node.key === key) return node
    if (node.children?.length) {
      const hit = findNodeByKey(key, node.children)
      if (hit) return hit
    }
  }
  return null
}

function logout() {
  console.log('Logout clicked')
}

watch(selectionKeys, (map) => {
  const key = Object.keys(map).find((k) => map[k])
  const node = findNodeByKey(key, nodes.value)
  selectedData.value = node?.data ?? null
})

onMounted(() => {
  if (nodes.value.length) {
    const firstNode = nodes.value[0]
    selectionKeys.value = { [firstNode.key]: true }
    selectedData.value = firstNode.data
  }
})

function toggle() {
  visible.value = !visible.value
}
</script>
<template>
  <div class="api-tree-container" :class="{ collapsed: !visible }">
    <div
      class="drawer-tab"
      role="button"
      tabindex="0"
      :aria-controls="'nav-drawer'"
      :aria-expanded="visible"
      @click="visible = !visible"
      @keydown.enter="visible = !visible"
    ></div>
    <Drawer
      id="nav-drawer"
      v-model:visible="visible"
      :modal="false"
      :block-scroll="false"
      header="API Collections"
      position="left"
      :show-close-icon="false"
      :base-z-index="1000"
      :pt="{
        root: { class: 'api-drawer' },
        header: { class: 'drawer-header-compact' },
        content: { class: 'drawer-content' },
      }"
    >
      <template #header>
        <div class="drawer-header-content">
          <span class="drawer-title">Admin Burke</span>
          <div class="drawer-icons">
            <button class="icon-btn" aria-label="Log out" @click="logout">
              <span class="btn-icon logout-icon" aria-hidden="true"></span>
            </button>
            <button class="icon-btn" aria-label="Close Drawer" @click="visible = false">
              <span class="btn-icon close-icon" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </template>
      <div>
        <Tree
          v-model:expanded-keys="expandedKeys"
          v-model:selection-keys="selectionKeys"
          :value="nodes"
          :loading="loading"
          selection-mode="single"
          class="tree"
        >
          <template #default="{ node }">
            <span class="sm-node">
              <span v-if="node.icon" :class="['sm-icon', node.icon]" />
              <span class="sm-label">{{ node.label }}</span>
            </span>
          </template>
        </Tree>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.tree {
  --p-tree-padding: 0px;
  --p-tree-node-padding: 3px 4px;
  --p-tree-node-gap: 2px;
  --p-tree-indent: 8px;
}

:global(.drawer-header-compact) {
  background-color: #35393b;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  height: 30px;
  padding: 6px !important;
  border-bottom: 1px solid #3d4245;
}

:global(.drawer-header-content) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.p-button-secondary {
  background-color: 35393b;
  border: none;
  box-shadow: none;
  color: inherit;
}

:global(.drawer-title) {
  color: #dddad6;
  font-weight: bold;
  font-size: 11px;
}

:global(.btn-icon.close-icon) {
  width: 14px;
  height: 14px;
  background: url('collapse-left.svg') center/contain no-repeat;
  opacity: 0.8;
  transition:
    opacity 120ms ease,
    filter 120ms ease,
    transform 80ms ease;
}

:global(.icon-btn:hover .btn-icon.close-icon) {
  opacity: 1;
  filter: brightness(1.25);
}

:global(.icon-btn:active .btn-icon.close-icon) {
  filter: brightness(1.35);
  transform: translateY(0.5px);
}

:global(.icon-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

:global(.icon-btn:focus),
:global(.icon-btn:active) {
  outline: none;
  box-shadow: none;
  background: transparent;
}

:global(.btn-icon.logout-icon) {
  width: 15px;
  height: 15px;
  background: url('logout.svg') center/contain no-repeat;
  opacity: 0.8;
  transition:
    opacity 120ms ease,
    filter 120ms ease,
    transform 80ms ease;
}

:global(.icon-btn:hover .btn-icon.logout-icon) {
  opacity: 1;
  filter: brightness(1.25);
}

:global(.icon-btn:active .btn-icon.logout-icon) {
  filter: brightness(1.35);
  transform: translateY(0.7px);
  /* subtle press */
}

.drawer-tab {
  position: fixed;
  left: 0;
  top: 34px;
  bottom: 20px;
  width: 22px;
  background: #3d4245;
  cursor: pointer;
  background-image: url('collapse-right.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 10px 12px;
}

:global(.drawer-content) {
  padding: 0 !important;
}

:global(.api-drawer) {
  position: fixed !important;
  top: 25px !important;
  bottom: 10px !important;
  height: auto !important;
  width: 300px !important;
  border-radius: 12px !important;
}
:global(.p-tree-node-toggle-button:focus) {
  outline: none;
  box-shadow: none;
}
:global(.p-tree-node-toggle-button) {
  width: 16px !important;
  height: 16px !important;
  padding: 0 !important;
  margin-right: 2px !important;
}
:global(.p-tree-node-toggle-icon) {
  width: 8px;
  height: 8px;
  color: #a5a4a4;
}
:global(.p-tree-node-toggle-button:hover .p-tree-node-toggle-icon) {
  filter: brightness(1.2);
}
:global(.p-tree-node-toggle-button:active .p-tree-node-toggle-icon) {
  filter: brightness(1.35);
}

.sm-icon {
  width: 14px;
  height: 14px;
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.sm-node {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.sm-label {
  margin-left: 4px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.sm-collection-icon {
  background-image: url('/collection.svg');
}
.sm-stig-library-icon {
  background-image: url('/library.svg');
}

.sm-app-management-icon {
  background-image: url('/gear.svg');
}

.sm-collection-icon-color {
  background-image: url('/collection-color.svg');
}
</style> -->
