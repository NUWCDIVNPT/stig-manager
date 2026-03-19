<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { ref, watch } from 'vue'
import MetaCollectionMetrics from '../../CollectionMetrics/components/MetaCollectionMetrics.vue'
import MetaExportMetrics from '../../CollectionMetrics/components/MetaExportMetrics.vue'
import MetricsFilter from '../../CollectionMetrics/components/MetricsFilter.vue'
import MetaCollectionsTab from './MetaCollectionsTab.vue'
import MetaStigsTab from './MetaStigsTab.vue'

const STORAGE_KEY = 'metaCollectionIds'

const activeTab = ref('collections')
const DASHBOARD_STORAGE_KEY = 'stigman:metaDashboardCollapsed'
const dashboardCollapsed = ref(localStorage.getItem(DASHBOARD_STORAGE_KEY) === 'true')
const selectedCollectionIds = ref(loadSelectedCollectionIds())

watch(selectedCollectionIds, (newIds) => {
  persistSelectedCollectionIds(newIds)
}, { deep: true })

function toggleDashboardSidebar() {
  dashboardCollapsed.value = !dashboardCollapsed.value
  try {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, String(dashboardCollapsed.value))
  }
  catch {
    // localStorage unavailable
  }
}

function loadSelectedCollectionIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    return JSON.parse(stored)
  }
  catch {
    return []
  }
}

function persistSelectedCollectionIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }
  catch {
    // localStorage unavailable
  }
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
    <Splitter
      :pt="{
        gutter: { style: 'background: var(--color-border-dark)' },
        root: { style: 'border: none; background: transparent; height: 100%; overflow: hidden;' },
      }"
    >
      <!-- Dashboard Sidebar -->
      <SplitterPanel
        :size="28"
        :min-size="4"
        :pt="{ root: { class: { 'sidebar-panel--collapsed': dashboardCollapsed }, style: 'min-width: 330px; max-width: 600px;' } }"
      >
        <aside class="dashboard-sidebar">
          <button
            class="sidebar-toggle"
            :aria-label="dashboardCollapsed ? 'Expand Dashboard' : 'Collapse Dashboard'"
            @click="toggleDashboardSidebar"
          >
            <i :class="dashboardCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" />
          </button>
          <div v-if="dashboardCollapsed" class="sidebar-dots">
            <span class="dot dot--unassessed" title="Unassessed" />
            <span class="dot dot--assessed" title="Assessed" />
            <span class="dot dot--submitted" title="Submitted" />
            <span class="dot dot--accepted" title="Accepted" />
            <span class="dot dot--rejected" title="Rejected" />
          </div>
          <div v-show="!dashboardCollapsed" class="sidebar-content">
            <MetaCollectionMetrics vertical :selected-collection-ids="selectedCollectionIds" />
            <MetaExportMetrics :selected-collection-ids="selectedCollectionIds" />
          </div>
        </aside>
      </SplitterPanel>

      <!-- Right Panel: Tabs + Content -->
      <SplitterPanel :size="72">
        <div class="right-panel">
          <Tabs v-model:value="activeTab" :pt="tabsPt">
            <TabList>
              <Tab value="collections">
                Collections
              </Tab>
              <Tab value="stigs">
                STIGs
              </Tab>

              <div class="tab-filter-container">
                <span class="filter-label">FILTER:</span>
                <MetricsFilter v-model="selectedCollectionIds" type="collection" />
              </div>
            </TabList>

            <TabPanels :pt="tabPanelsPt">
              <TabPanel value="collections" :pt="tabPanelPt">
                <MetaCollectionsTab :selected-collection-ids="selectedCollectionIds" />
              </TabPanel>
              <TabPanel value="stigs" :pt="tabPanelPt">
                <MetaStigsTab :selected-collection-ids="selectedCollectionIds" />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<style scoped>
.meta-collection-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.sidebar-panel--collapsed) {
  flex: none !important;
  width: 3.25rem !important;
  min-width: unset !important;
  max-width: unset !important;
  overflow: hidden;
}

/* Dashboard Sidebar */
.dashboard-sidebar {
  height: 100%;
  background-color: var(--color-background-dark);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 3.25rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border-default);
  color: var(--color-text-dim);
  cursor: pointer;
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  color: var(--color-text-primary);
  background-color: var(--color-button-hover-bg);
}

.sidebar-dots {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 0;
}

.dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot--unassessed { background-color: hsl(220, 18%, 42%); }
.dot--assessed { background-color: hsl(204, 91%, 45%); }
.dot--submitted { background-color: hsl(195, 80%, 52%); }
.dot--accepted { background-color: hsl(210, 75%, 62%); }
.dot--rejected { background-color: hsl(232, 58%, 52%); }

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Right Panel */
.right-panel {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-filter-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  padding-right: 1rem;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-text-dim);
}
</style>
