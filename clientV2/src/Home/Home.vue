<script setup>
import MenuBar from '../features/MenuBar/components/MenuBar.vue'
import NavRail from '../features/NavRail/components/NavRail.vue'
import { classificationBanner } from '../shared/lib/classification.js'
import { useGlobalAppStore } from '../shared/stores/globalAppStore.js'

// The grid fills the viewport below the classification banner, when one is shown.
const bannerHeight = classificationBanner(useGlobalAppStore().classification).showBanner
  ? 'var(--classification-banner-height)'
  : '0px'
</script>

<template>
  <div class="appGrid" :style="{ '--banner-height': bannerHeight }">
    <MenuBar style="grid-area: header" />
    <NavRail class="home-content">
      <main class="main">
        <router-view />
      </main>
    </NavRail>
  </div>
</template>

<style scoped>
.appGrid {
  display: grid;
  grid-template-areas:
    'header'
    'content';
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  width: 100vw;
  height: calc(100vh - var(--banner-height, 0px));
  overflow-y: hidden;
  overflow-x: auto;
  min-width: 300px;
}

.home-content {
  grid-area: content;
}

.main {
  height: 100%;
  overflow: hidden;
  position: relative;
}
</style>
