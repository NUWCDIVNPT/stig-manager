<script setup>
import { computed, ref } from 'vue'

import ApiTree from '../features/NavTree/components/NavTree.vue'
import { useNavTreeStore } from '../features/NavTree/stores/navTreeStore.js'
import TabList from '../features/TabList/components/TabList.vue'
import { useGlobalStateStore } from '../global-state/globalAuthState.js'

const { selectedData } = useNavTreeStore()
const globalState = useGlobalStateStore()
const navOpen = ref(true)
const peekMode = ref(false)

// check if banner is shown based on classification
const bannerHeight = computed(() => {
  const cls = globalState.classification
  return cls && cls !== 'NONE' ? '20px' : '0px'
})
</script>

<template>
  <div
    class="appGrid"
    :style="{
      '--aside': navOpen ? (peekMode ? '322px' : '300px') : '22px',
      '--banner-height': bannerHeight,
    }"
  >
    <aside class="aside">
      <ApiTree v-model:open="navOpen" v-model:peek-mode="peekMode" />
    </aside>

    <main class="main">
      <TabList :selection="selectedData" />
    </main>
  </div>
</template>

<style scoped>
.appGrid {
  display: grid;
  grid-template-areas: 'sidebar main';
  grid-template-columns: var(--aside, 0px) 1fr;
  height: calc(100vh - var(--banner-height, 0px));
  max-height: calc(100vh - var(--banner-height, 0px));
  overflow: hidden;
  transition: grid-template-columns 180ms ease;
}

.aside {
  grid-area: sidebar;
  padding-right: 10px;
  padding-bottom: 10px;
  overflow: hidden;
}

.main {
  grid-area: main;
  overflow: hidden;
  box-sizing: border-box;
  padding: 4px 8px 10px 10px;
  min-height: 0;
}
</style>
