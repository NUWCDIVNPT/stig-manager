<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MenuBar from '../features/MenuBar/components/MenuBar.vue'
import NavRail from '../features/NavRail/components/NavRail.vue'
import { useNavCache } from '../shared/composables/useNavCache.js'
import { useRecentViews } from '../shared/composables/useRecentViews.js'
import { useGlobalAppStore } from '../shared/stores/globalAppStore.js'

const globalAppState = useGlobalAppStore()
const router = useRouter()
const navCache = useNavCache()
const { addView } = useRecentViews()

// check if banner is shown based on classification
const bannerHeight = computed(() => {
  const cls = globalAppState.classification
  return cls && cls !== 'NONE' ? '20px' : '0px'
})

// --- Recent Views tracking ---
const browsingTabs = new Set([
  'collection-stigs',
  'collection-assets',
  'collection-labels',
])
const manageTabs = new Set([
  'collection-settings',
  'collection-users',
  'collection-manage',
])

router.afterEach((to) => {
  const { name, params, fullPath } = to

  // Collection browsing tabs → one entry per collection
  if (browsingTabs.has(name)) {
    const collName = navCache.getCollectionName(params.collectionId)
      || `Collection ${params.collectionId}`
    addView({
      key: `collection:${params.collectionId}`,
      url: fullPath,
      label: collName,
      type: 'collection',
    })
    return
  }

  // Collection findings → own entry per collection
  if (name === 'collection-findings') {
    const collName = navCache.getCollectionName(params.collectionId)
      || `Collection ${params.collectionId}`
    addView({
      key: `collection-findings:${params.collectionId}`,
      url: fullPath,
      label: `${collName} / Findings`,
      type: 'collection',
    })
    return
  }

  // Collection manage/settings/users → one entry per collection
  if (manageTabs.has(name)) {
    const collName = navCache.getCollectionName(params.collectionId)
      || `Collection ${params.collectionId}`
    addView({
      key: `collection-manage:${params.collectionId}`,
      url: fullPath,
      label: `${collName} / Manage`,
      type: 'collection',
    })
    return
  }

  // Asset review — handled by AssetReview.vue component (needs async data)

  // Admin routes → one collapsed entry
  if (name?.startsWith('admin')) {
    addView({
      key: 'admin',
      url: fullPath,
      label: 'Admin',
      type: 'admin',
    })
    return
  }

  // STIG Library
  if (name === 'stig-library' || name === 'library') {
    addView({
      key: 'library',
      url: fullPath,
      label: 'STIG Library',
      type: 'library',
    })
  }

  // Everything else (home, collections list, whats-new, settings, support) — not tracked
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
