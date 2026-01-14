<script setup>
import { computed, ref } from 'vue'
import Menu from '../features/Menu/components/Menu.vue'
import MenuBar from '../features/MenuBar/components/MenuBar.vue'
import { useGlobalAppStore } from '../shared/stores/globalAppStore.js'

const globalAppState = useGlobalAppStore()

const menuDrawerOpen = ref(false)

// check if banner is shown based on classification
const bannerHeight = computed(() => {
  const cls = globalAppState.classification
  return cls && cls !== 'NONE' ? '20px' : '0px'
})

function toggleMenuDrawer() {
  menuDrawerOpen.value = !menuDrawerOpen.value
}
</script>

<template>
  <div
    class="appGrid"
    :style="{
      '--banner-height': bannerHeight,
    }"
  >
    <MenuBar style="grid-area: header" @toggle-menu="toggleMenuDrawer" />
    <Menu v-model:open="menuDrawerOpen" />
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.appGrid {
  display: grid;
  grid-template-areas:
    'header header'
    'main main';
  grid-template-rows: auto 1fr;
  width: 100vw;
  height: 100vh;
  overflow-y: hidden;
  overflow-x: auto;
  min-width: 300px;
}
.main {
  grid-area: main;
  overflow: hidden;
  position: relative;
}
</style>
