<script setup>
import { storeToRefs } from 'pinia'
import Tree from 'primevue/tree'
import { ref, watch } from 'vue'
import { useNavTreeStore } from '../../../shared/stores/navTreeStore.js'

// nodes are items in the nav tree (collections)
const props = defineProps({
  nodes: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['node-select'])

const expandedKeys = ref({ collections: true })
const selectionKeys = ref({})

const navTreeStore = useNavTreeStore()
// need to use storeToRefs to keep the ref reactive
const { selectedData } = storeToRefs(navTreeStore)

// helper function to find a node by key
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

// watching the selectedKey in the Tree component to update the store.
watch(
  selectionKeys,
  (map) => {
    const key = Object.keys(map ?? {}).find(k => map[k])
    const node = key ? findNodeByKey(key, props.nodes) : null
    navTreeStore.select(node ?? null)
  },
  { deep: true },
)

// watching the selectedData in the store to update the selectionKeys in the Tree component.
watch(
  selectedData,
  (node) => {
    if (!node?.key) {
      selectionKeys.value = {}
      return
    }
    selectionKeys.value = { [node.key]: true }
  },
  { immediate: true },
)

function onNodeSelect(node) {
  emit('node-select', node)
}

function toggleNode(node) {
  if (node.children && node.children.length) {
    expandedKeys.value[node.key] = !expandedKeys.value[node.key]
  }
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
        root: {
          style: {
            'padding': '0',
            '--z-navtab': '900',
            '--z-drawer': '1100',
            'minWidth': 'max-content',
            'height': '100%',
            'width': '100%',
          },
        },
        nodeContent: {
          style: {
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            minWidth: '0',
            lineHeight: '1.3',
            borderRadius: '3px',
            padding: '4px 0px 2px 0px',
          },
        },
        nodeToggleButton: {
          style: {
            display: 'inline-grid',
            placeItems: 'center',
            width: '16px',
            height: '16px',
            padding: '0',
            background: 'transparent',
            border: '0',
            borderRadius: '5px',
            outline: 'none',
          },
        },
        nodeToggleIcon: {
          style: {
            width: '12px',
            height: '12px',
            color: '#b6b3b3d2',
          },
        },
        nodeChildren: {
          style: {
            fontSize: '13px',
            paddingLeft: '20px',
            overflow: 'hidden',
            transformOrigin: 'top left',
            animation: 'treeFadeSlideIn 400ms ease-out both',
          },
        },
      }"
      @node-select="onNodeSelect"
    >
      <template #default="{ node }">
        <span class="node-inner" @click="toggleNode(node)">
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
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
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
