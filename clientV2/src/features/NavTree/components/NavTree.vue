<script setup>
import { useQueryClient } from '@tanstack/vue-query'
import { defineModel, inject, ref } from 'vue'
import { useNavTreeStore } from '../../../shared/stores/navTreeStore.js'
import { navTreeConfig } from '../composeables/navTreeConfig'
import { useKeyboardNav } from '../composeables/useKeyboardNav'
import { useNavTreeData } from '../composeables/useNavTreeData'
import { useNavTreeNodes } from '../composeables/useNavTreeNodes'
import { useOutsideClick } from '../composeables/useOutsideClick'
import CreateCollectionModal from './CreateCollectionModal.vue'
import NavTreeContent from './NavTreeContent.vue'
import NavTreeDrawer from './NavTreeDrawer.vue'
import NavTreeHeader from './NavTreeHeader.vue'
import NavTreeTab from './NavTreeTab.vue'

const queryClient = useQueryClient() // needed for logout
const oidcWorker = inject('worker')

// these are two way binded props
const visible = defineModel('open', { type: Boolean, default: true })
const peekMode = defineModel('peekMode', { type: Boolean, default: false })

const navTreeStore = useNavTreeStore()
const { collections, loading } = useNavTreeData() // fetch the data
const nodes = useNavTreeNodes(collections, navTreeConfig)

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
  <div ref="wrapperRef" class="root">
    <NavTreeTab :peek-mode="peekMode" @peak="peak" @open="open" />
    <NavTreeDrawer :visible="visible" :peek-mode="peekMode">
      <template #header>
        <NavTreeHeader @logout="handleLogout" @close="handleClose" />
      </template>
      <NavTreeContent :nodes="nodes" :loading="loading" @node-select="onNodeSelect" />
    </NavTreeDrawer>
    <CreateCollectionModal v-model:visible="showCreateCollectionModal" @created="handleCollectionCreated" />
  </div>
</template>

<style scoped>
.root {
  position: relative;
}
</style>
