<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { ref } from 'vue'
import MetaCollectionMetrics from '../../CollectionMetrics/components/MetaCollectionMetrics.vue'
import MetaCollectionsTab from './MetaCollectionsTab.vue'
import MetaStigsTab from './MetaStigsTab.vue'

const activeTab = ref('collections')
const dashboardCollapsed = ref(false)

function toggleDashboardSidebar() {
  dashboardCollapsed.value = !dashboardCollapsed.value
}

const tabsPt = {
  root: {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
  },
}

const tabPanelsPt = {
  root: {
    style: {
      flex: '1',
      padding: '0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
  },
}

const tabPanelPt = {
  root: {
    style: {
      flex: '1',
      overflowY: 'auto',
      height: '100%',
    },
  },
}
</script>

<template>
  <div class="meta-collection-view">
    <div class="content-wrapper">
      <aside
        class="dashboard-sidebar"
        :class="{ 'dashboard-sidebar--collapsed': dashboardCollapsed }"
      >
        <div class="sidebar-header">
          <span v-show="!dashboardCollapsed" class="sidebar-header-label">Dashboard</span>
          <button
            type="button"
            class="sidebar-toggle"
            :title="dashboardCollapsed ? 'Expand Dashboard' : 'Collapse Dashboard'"
            @click="toggleDashboardSidebar"
          >
            <i :class="dashboardCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" />
          </button>
        </div>
        <div v-show="!dashboardCollapsed" class="sidebar-content">
          <MetaCollectionMetrics vertical />
        </div>
      </aside>
      <div class="right-panel">
        <Tabs v-model:value="activeTab" :pt="tabsPt">
          <TabList>
            <Tab value="collections">
              Collections
            </Tab>
            <Tab value="stigs">
              STIGs
            </Tab>
          </TabList>

          <TabPanels :pt="tabPanelsPt">
            <TabPanel value="collections" :pt="tabPanelPt">
              <MetaCollectionsTab />
            </TabPanel>
            <TabPanel value="stigs" :pt="tabPanelPt">
              <MetaStigsTab />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meta-collection-view {
  --dashboard-sidebar-width: 33rem;
  --dashboard-sidebar-collapsed-width: 2.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Dashboard Sidebar */
.dashboard-sidebar {
  width: var(--dashboard-sidebar-width);
  min-width: var(--dashboard-sidebar-width);
  background-color: var(--color-background-dark);
  border-right: 1px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease, min-width 0.2s ease;
}

.dashboard-sidebar--collapsed {
  width: var(--dashboard-sidebar-collapsed-width);
  min-width: var(--dashboard-sidebar-collapsed-width);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;
  height: 2.5rem;
  min-height: 2.5rem;
  border-bottom: 1px solid var(--color-border-default);
}

.sidebar-header-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  padding-left: 0.5rem;
}

.sidebar-toggle {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  color: var(--color-text-dim);
  cursor: pointer;
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background-color: var(--color-bg-hover-strong);
  color: var(--color-text-primary);
  border-color: var(--color-border-default);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Right Panel */
.right-panel {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
