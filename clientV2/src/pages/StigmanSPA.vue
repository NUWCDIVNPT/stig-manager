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

:deep(.tabs-root) {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.tab-list) {
  display: flex;
  border-bottom: 3px solid #444;
  flex: 0 auto;
  align-items: center;
  background: #000000;
  min-height: 30px;
  gap: 1px;
  margin-bottom: 5px;
}

:deep(.p-tablist-active-bar) {
  bottom: 0;
  height: 2px;
  background: color-mix(in srgb, var(--p-primary-400), transparent 50%);
  transition: 250ms cubic-bezier(0.35, 0, 0.25, 1);
  border: none;
}

:deep(.tab-item) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 1px;
  margin-right: 1px;
  max-width: 50;
  padding: 4px 10px;
  border: none;
  border-top-right-radius: 5px;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background: #2d2d2d;
  cursor: pointer;
  height: 30px;
  box-sizing: border-box;
  color: #888;
  font-weight: normal;
}

:deep(.tab-item:focus),
:deep(.tab-item:focus-visible) {
  outline: none;
}

:deep(.tab-item[data-p-active='true']) {
  background: #444;
  color: #fff;
  font-weight: 600;
}

:deep(.tab-item:hover) {
  background: #383838;
  color: #fff;
}

:deep(.tab-panels) {
  flex: 1 1 auto;
  min-height: 0;
  padding-top: 8px;
}

:deep(.tab-panel) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.tabTitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1;
}

.tabClose {
  border: 0;
  background: none;
  font-size: 18px;
  line-height: 1;
  opacity: 0.6;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tabClose:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

:deep(.tabClose:focus),
:deep(.tabClose:focus-visible) {
  outline: none;
}

.panelInner {
  height: 100%;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
  padding: 12px;
}
</style>
