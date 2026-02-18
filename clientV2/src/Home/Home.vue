<script setup>
import { computed } from 'vue'
import MenuBar from '../features/MenuBar/components/MenuBar.vue'
import NavRail from '../features/NavRail/components/NavRail.vue'
import { useGlobalAppStore } from '../shared/stores/globalAppStore.js'

const globalAppState = useGlobalAppStore()

// check if banner is shown based on classification
const bannerHeight = computed(() => {
  const cls = globalAppState.classification
  return cls && cls !== 'NONE' ? '20px' : '0px'
})
</script>

<template>
  <div
    class="appGrid"
    :style="{
      '--banner-height': bannerHeight,
    }"
  >
    <MenuBar style="grid-area: header" />
    <NavRail />
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
    'rail main';
  grid-template-rows: auto 1fr;
  grid-template-columns: auto 1fr;
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
