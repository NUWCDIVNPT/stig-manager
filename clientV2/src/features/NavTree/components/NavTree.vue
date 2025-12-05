<script setup>
import { useQueryClient } from '@tanstack/vue-query'
import { computed, defineModel, inject, ref } from 'vue'
import { useNavTreeStore } from '../../../shared/stores/navTreeStore.js'
import { navTreeConfig } from '../composeables/navTreeConfig'
import { useKeyboardNav } from '../composeables/useKeyboardNav'
import { useNavTreeData } from '../composeables/useNavTreeData'
import { useNavTreeNodes } from '../composeables/useNavTreeNodes'
import { useOutsideClick } from '../composeables/useOutsideClick'
import CreateCollectionModal from './CreateCollectionModal.vue'
import NavTreeContent from './NavTreeContent.vue'
import NavTreeDrawer from './NavTreeDrawer.vue'
import NavTreeFooter from './NavTreeFooter.vue'
import NavTreeHeader from './NavTreeHeader.vue'
import NavTreeTab from './NavTreeTab.vue'

const queryClient = useQueryClient() // needed for logout
const oidcWorker = inject('worker')

// these are two way binded props
const visible = defineModel('open', { type: Boolean, default: true })
const peekMode = defineModel('peekMode', { type: Boolean, default: false })

const navTreeStore = useNavTreeStore()
const { collections, loading } = useNavTreeData() // fetch the data

const canCreateCollection = computed(() => {
  const roles = oidcWorker?.tokenParsed?.realm_access?.roles || []
  return roles.includes('create_collection')
})

const nodes = useNavTreeNodes(collections, navTreeConfig, canCreateCollection)

const wrapperRef = ref(null)
const showCreateCollectionModal = ref(false)

function closePeek() {
  if (!peekMode.value) {
    return
  }
  visible.value = false
  peekMode.value = false
}

useOutsideClick(wrapperRef, () => closePeek(), { active: peekMode })

useKeyboardNav({ Escape: () => closePeek() })

function peak() {
  visible.value = true
  peekMode.value = true
}

function open() {
  peekMode.value = false
  visible.value = !visible.value
}

function handleLogout() {
  queryClient.clear()
  const logoutHandler = oidcWorker.logout.bind(oidcWorker)
  logoutHandler()
}

function handleClose() {
  visible.value = false
  peekMode.value = false
}

function onNodeSelect(node) {
  // if the node is the new collection action, open the modal
  if (node.key === 'new-collection-action') {
    showCreateCollectionModal.value = true
  }
}

function handleCollectionCreated(collection) {
  // close modal and select the new colletion in the navTREE
  showCreateCollectionModal.value = false
  navTreeStore.select({
    key: String(collection.collectionId),
    label: collection.name,
    data: collection,
    component: 'CollectionView',
    icon: 'icon-collection',
  })
}
</script>

<template>
  <NavTreeTab :peek-mode="peekMode" :visible="visible" @peak="peak" @open="open" />
  <NavTreeDrawer :visible="visible" :peek-mode="peekMode">
    <template #header>
      <NavTreeHeader @close="handleClose" />
    </template>
    <NavTreeContent :nodes="nodes" :loading="loading" @node-select="onNodeSelect" />
    <div class="bottom-links">
      <button type="button" class="btn-unstyled nav-link" aria-label="Support">
        <i class="pi pi-flag nav-icon" />
        <span class="nav-label">Support</span>
      </button>
      <button type="button" class="btn-unstyled nav-link" aria-label="Settings">
        <i class="pi pi-cog nav-icon" />
        <span class="nav-label">Settings</span>
      </button>
    </div>
    <template #footer>
      <NavTreeFooter @logout="handleLogout" />
    </template>
  </NavTreeDrawer>
  <CreateCollectionModal v-model:visible="showCreateCollectionModal" @created="handleCollectionCreated" />
</template>

<style scoped>
.bottom-links {
  margin-top: auto;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  width: 100%;
  border-radius: 6px;
  color: #a1a1aa;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;
}

.nav-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.nav-label {
  flex: 1;
}

.btn-unstyled {
  background: none;
  border: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
</style>
