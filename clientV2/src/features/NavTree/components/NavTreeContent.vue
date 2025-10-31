<script setup>
import Tree from 'primevue/tree'
import { ref, watch } from 'vue'
import { useNavTreeStore } from '../stores/navTreeStore'

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['node-select'])

const expandedKeys = ref({ collections: true })
const selectionKeys = ref({})

const navTreeStore = useNavTreeStore()

function findNodeByKey(key, list) {
  for (const node of list ?? []) {
    if (node.key === key) {
      return node
    }
    if (node.children?.length) {
      const hit = findNodeByKey(key, node.children)
      if (hit) {
        return hit
      }
    }
  }
  return null
}

watch(selectionKeys, (map) => {
  const key = Object.keys(map ?? {}).find(k => map[k])
  const node = key ? findNodeByKey(key, props.nodes) : null
  navTreeStore.select(node ?? null)
})

function onNodeSelect(node) {
  emit('node-select', node)
}
</script>

<template>
  <div class="scroll">
    <Tree
      v-model:expanded-keys="expandedKeys"
      v-model:selection-keys="selectionKeys"
      :value="nodes"
      :loading="loading"
      selection-mode="single"
      :pt="{
        root: { class: 'tree-root' },
        nodeContent: { class: 'tree-node' },
        nodeToggleButton: { class: 'tree-toggle-btn' },
        nodeToggleIcon: { class: 'tree-toggle-ico' },
        nodeChildren: { class: 'tree-children' },
      }"
      @node-select="onNodeSelect"
    >
      <template #default="{ node }">
        <span class="node-inner">
          <span class="icon sm-icon" :class="[node.icon]" aria-hidden="true" />
          <span class="node-text" :class="{ 'is-italic': node.data?.italic }">
            {{ node.label }}
          </span>
        </span>
      </template>
    </Tree>
  </div>
</template>

<style scoped>
.scroll {
  flex: 1;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: auto;
  background: #1f1f1f;
  color: #e4e4e7;
}

.icon {
  display: inline-block;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.icon-app-management {
  background-image: url('/src/assets/gear.svg');
}

.icon-collection-color {
  background-image: url('/src/assets/collection-color.svg');
}

.icon-collection {
  background-image: url('/src/assets/collection.svg');
}

.icon-stig-library {
  background-image: url('/src/assets/library.svg');
}

.icon-add {
  background-color: var(--icon-color, #ffffff);
  -webkit-mask: url('/src/assets/icons8-add-16.png') no-repeat center / contain;
  mask: url('/src/assets/icons8-add-16.png') no-repeat center / contain;
}

.icon-user,
.icon-user-group,
.icon-green-shield,
.icon-wrench,
.icon-info-circle,
.icon-database,
.icon-moon {
  background-image: url('/src/assets/gear.svg');
}

.icon-folder {
  background-image: url('/src/assets/library.svg');
}

:deep(.tree-root) {
  padding: 0;
  --z-navtab: 900;
  --z-drawer: 1100;
  min-width: max-content;
  height: 100%;
  width: 100%;
}

:deep(.tree-node) {
  display: flex;
  width: 100%;
  align-items: center;
  min-width: 0;
  line-height: 1.3;
  border-radius: 3px;
  padding: 4px 0px 2px 0px;
}

:deep(.tree-toggle-btn) {
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 5px;
}

:deep(.tree-toggle-btn:focus) {
  outline: none;
}

:deep(.tree-toggle-ico) {
  width: 12px;
  height: 12px;
  color: #b6b3b3d2;
}

:deep(.tree-children) {
  font-size: 13px;
  padding-left: 20px;
  overflow: hidden;
  transform-origin: top left;
  animation: treeFadeSlideIn 1000ms cubic-bezier(0.4, 0.8, 0.2, 1) both;
}

.node-inner {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
}

.node-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-italic {
  font-style: italic;
}

.sm-icon {
  width: 14px;
  height: 14px;
  display: inline-block;
  margin-right: 6px;
  border-radius: 2px;
}

@keyframes treeFadeSlideIn {
  from {
    opacity: 0.1;
    transform: translateY(-6px) scaleY(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
