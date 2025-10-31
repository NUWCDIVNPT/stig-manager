<script setup>
import { ref } from 'vue'

import ApiTree from '../features/NavTree/components/NavTree.vue'
import { useNavTreeStore } from '../features/NavTree/stores/navTreeStore.js'
import TabList from '../features/TabList/components/TabList.vue'

const { selectedData } = useNavTreeStore()
const navOpen = ref(true)
const peekMode = ref(false)
</script>

<template>
  <div
    class="appGrid"
    :style="navOpen ? (peekMode ? { '--aside': '322px' } : { '--aside': '300px' }) : { '--aside': '22px' }"
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
  height: calc(100vh - 10px);
  max-height: calc(100vh - 10px);
  overflow: hidden;
  transition: grid-template-columns 180ms ease;
  padding-bottom: 10px;
}

.aside {
  grid-area: sidebar;
  padding-right: 10px;
  overflow: hidden;
}

.main {
  grid-area: main;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  padding: 4px 8px 10px 10px;
  min-height: 0;
}
</style>
