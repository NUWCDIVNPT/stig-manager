<script setup>
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import NavTree from '../features/NavTree/components/NavTree.vue'
import { useGlobalAppStore } from '../shared/stores/globalAppStore.js'
import { useNavTreeStore } from '../shared/stores/navTreeStore.js'

const router = useRouter()
const navTreeStore = useNavTreeStore()
// converts store state properties into reactive refs that stay connected to the store:
const { selectedData } = storeToRefs(navTreeStore)
const globalAppState = useGlobalAppStore()
const navOpen = ref(true)
const peekMode = ref(false)

// check if banner is shown based on classification
const bannerHeight = computed(() => {
  const cls = globalAppState.classification
  return cls && cls !== 'NONE' ? '20px' : '0px'
})

// Map component names/keys to route names
const componentToRoute = {
  CollectionManage: 'admin-collections',
  UserManage: 'admin-users',
  UserGroupManage: 'admin-user-groups',
  StigManage: 'admin-stigs',
  ServiceJobs: 'admin-service-jobs',
  AppInfo: 'admin-app-info',
  ExportImportManage: 'admin-transfer',
  StigLibrary: 'library',
  // Add others as needed
}

// Watch for selection changes in the store and navigate
watch(selectedData, (node) => {
  if (!node) {
    return
  }

  // If it's a collection
  if (node.component === 'CollectionView') {
    router.push({ name: 'collection', params: { collectionId: node.key } })
    return
  }

  // If it's a static admin page
  const routeName = componentToRoute[node.component]
  if (routeName) {
    router.push({ name: routeName })
  }
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
      <RouterView />
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
