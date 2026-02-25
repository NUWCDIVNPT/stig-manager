<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MenuBar from '../features/MenuBar/components/MenuBar.vue'
import NavRail from '../features/NavRail/components/NavRail.vue'
import { useRecentViews } from '../shared/composables/useRecentViews.js'
import { useGlobalAppStore } from '../shared/stores/globalAppStore.js'

const globalAppState = useGlobalAppStore()
const router = useRouter()
const { addView } = useRecentViews()

// check if banner is shown based on classification
const bannerHeight = computed(() => {
  const cls = globalAppState.classification
  return cls && cls !== 'NONE' ? '20px' : '0px'
})

// --- Recent Views tracking ---

router.afterEach((to) => {
  const { name, fullPath } = to

  // Admin routes → one entry per admin section
  if (name?.startsWith('admin')) {
    const adminLabels = {
      'admin-collections': 'Admin / Collections',
      'admin-users': 'Admin / Users',
      'admin-user-groups': 'Admin / User Groups',
      'admin-stigs': 'Admin / STIGs',
      'admin-service-jobs': 'Admin / Service Jobs',
      'admin-app-info': 'Admin / App Info',
      'admin-transfer': 'Admin / Export & Import',
    }
    const label = adminLabels[name] || 'Admin'
    addView({
      key: name,
      url: fullPath,
      label,
      type: 'admin',
    })
    return
  }

  // STIG Library - TODO: when theres are routes for the library, we should add them here
  if (name === 'stig-library' || name === 'library') {
    addView({
      key: 'library',
      url: fullPath,
      label: 'STIG Library',
      type: 'library',
    })
  }
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
