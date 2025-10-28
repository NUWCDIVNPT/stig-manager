<script setup>
import { defineModel, ref } from 'vue'
import { navTreeConfig } from '../composeables/navTreeConfig'
import { useKeyboardNav } from '../composeables/useKeyboardNav'
import { useNavTreeData } from '../composeables/useNavTreeData'
import { useNavTreeNodes } from '../composeables/useNavTreeNodes'
import { useOutsideClick } from '../composeables/useOutsideClick'

import NavTreeContent from './NavTreeContent.vue'
import NavTreeDrawer from './NavTreeDrawer.vue'
import NavTreeHeader from './NavTreeHeader.vue'
import NavTreeTab from './NavTreeTab.vue'

const visible = defineModel('open', { type: Boolean, default: true })
const peekMode = defineModel('peekMode', { type: Boolean, default: false })

const { collections, loading } = useNavTreeData()
const nodes = useNavTreeNodes(collections, navTreeConfig)

const wrapperRef = ref(null)
function closePeek() {
  if (!peekMode.value) {
    return
  }
  visible.value = false
  peekMode.value = false
}

useOutsideClick(wrapperRef, () => closePeek(), { active: peekMode })

useKeyboardNav({ Escape: () => closePeek() })

function toggle() {
  visible.value = true
  peekMode.value = true
}

function toggleAlt() {
  peekMode.value = false
  visible.value = !visible.value
}

function handleLogout() {
  console.log('Logout clicked')
}

function handleClose() {
  visible.value = false
  peekMode.value = false
}

function onNodeSelect(node) {
  if (node.key === 'new-collection-action') {
    console.log('Create new collection action triggered')
  }
}
</script>

<template>
  <div ref="wrapperRef" class="root">
    <NavTreeTab @toggle="toggle" @toggle-alt="toggleAlt" />
    <NavTreeDrawer :visible="visible" :peek-mode="peekMode">
      <template #header>
        <NavTreeHeader @logout="handleLogout" @close="handleClose" />
      </template>
      <NavTreeContent :nodes="nodes" :loading="loading" @node-select="onNodeSelect" />
    </NavTreeDrawer>
  </div>
</template>

<style scoped>
.root {
  position: relative;
}
</style>
