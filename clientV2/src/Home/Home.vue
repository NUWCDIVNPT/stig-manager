<script setup>
import MenuBar from '../features/MenuBar/components/MenuBar.vue'
import NavRail from '../features/NavRail/components/NavRail.vue'
</script>

<template>
  <div class="appGrid">
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
  flex: 1 1 0;
  min-height: 0;
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
