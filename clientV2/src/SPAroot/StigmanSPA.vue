<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router' // Import useRoute

import NavTree from '../features/NavTree/components/NavTree.vue'
import TabList from '../features/TabList/components/TabList.vue'
import { useGlobalAppStore } from '../shared/stores/globalAppStore.js'

const globalAppState = useGlobalAppStore()
const navOpen = ref(true)
const peekMode = ref(false)
const route = useRoute() // Get current route

// Determine if we should show the TabList (only for collection context)
const showTabList = computed(() => {
  // User requested TabList only for "opening a collection"
  // We whitelist the collection-specific routes.
  const collectionRoutes = ['collection', 'collection-manage', 'asset-review']
  return collectionRoutes.includes(route.name)
})

// check if banner is shown based on classification
const bannerHeight = computed(() => {
  const cls = globalAppState.classification
  return cls && cls !== 'NONE' ? '20px' : '0px'
})

// Note: Syncing Route -> Selection is harder here because we don't have the full tree data.
// Ideally, NavTree should watch the route and update itself.
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
      <NavTree v-model:open="navOpen" v-model:peek-mode="peekMode" />
    </aside>

    <main class="main">
      <TabList v-if="showTabList" />
      <router-view v-else />
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
