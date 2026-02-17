<script setup>
import Breadcrumb from 'primevue/breadcrumb'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import CollectionMetrics from '../../CollectionMetrics/components/CollectionMetrics.vue'
import ExportMetrics from '../../CollectionMetrics/components/ExportMetrics.vue'
import {
  fetchCollection,
} from '../api/collectionApi.js'
import CollectionAssetsTab from './CollectionAssetsTab.vue'
import CollectionLabelsTab from './CollectionLabelsTab.vue'
import CollectionStigsTab from './CollectionStigsTab.vue'

const props = defineProps({
  collectionId: {
    type: [String],
    required: true,
  },
})

const route = useRoute()
const router = useRouter()

// Fetch collection details for name
const { state: collection, execute: loadCollection } = useAsyncState(
  () => fetchCollection(props.collectionId),
  { immediate: false },
)

const collectionName = computed(() => collection.value?.name || 'Collection')

// Breadcrumb configuration
const breadcrumbHome = {
  label: 'Collections',
  route: '/collections',
}

const breadcrumbItems = computed(() => {
  return [
    {
      label: collectionName.value,
    },
  ]
})

// Initial Data Load
watch([() => props.collectionId], () => {
  loadCollection()
}, { immediate: true })

// Map route name to tab value
const routeToTab = {
  'collection-dashboard': 'dashboard',
  'collection-stigs': 'stigs',
  'collection-assets': 'assets',
  'collection-labels': 'labels',
  'collection-users': 'users',
  'collection-settings': 'settings',
}

const tabToRoute = {
  dashboard: 'collection-dashboard',
  stigs: 'collection-stigs',
  assets: 'collection-assets',
  labels: 'collection-labels',
  users: 'collection-users',
  settings: 'collection-settings',
}

// Active tab based on route
const activeTab = computed({
  get: () => routeToTab[route.name] || 'dashboard',
  set: (newTab) => {
    const routeName = tabToRoute[newTab]
    if (routeName) {
      router.push({
        name: routeName,
        params: { collectionId: props.collectionId },
      })
    }
  },
})

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

// Dashboard sidebar state (collapsed/expanded)
const dashboardCollapsed = ref(false)

function toggleDashboardSidebar() {
  dashboardCollapsed.value = !dashboardCollapsed.value
}
</script>

<template>
  <div class="collection-view">
    <header class="collection-header">
      <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems">
        <template #item="{ item, props: itemProps }">
          <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
            <a :href="href" v-bind="itemProps.action" class="breadcrumb-link" @click="navigate">
              {{ item.label }}
            </a>
          </router-link>
          <span v-else class="breadcrumb-current">{{ item.label }}</span>
        </template>
        <template #separator>
          <span class="breadcrumb-separator">/</span>
        </template>
      </Breadcrumb>
    </header>

    <!-- Normal Mode: Show Tabs -->
    <div class="tabs-container" :class="{ 'sidebar-collapsed': dashboardCollapsed }">
      <Tabs v-model:value="activeTab" :pt="tabsPt">
        <TabList>
          <Tab value="dashboard">
            Dashboard
          </Tab>
          <Tab value="stigs" class="tab-after-sidebar">
            STIGs
          </Tab>
          <Tab value="assets">
            Assets
          </Tab>
          <Tab value="labels">
            Labels
          </Tab>
          <Tab value="users">
            Users
          </Tab>
          <Tab value="settings">
            Settings
          </Tab>
        </TabList>

        <!-- Split layout: Dashboard sidebar + Tab content -->
        <div class="tab-content-wrapper">
          <!-- Dashboard Sidebar (always visible, collapsible) -->
          <aside
            class="dashboard-sidebar"
            :class="{ 'dashboard-sidebar--collapsed': dashboardCollapsed }"
          >
            <button
              type="button"
              class="sidebar-toggle"
              :title="dashboardCollapsed ? 'Expand Dashboard' : 'Collapse Dashboard'"
              @click="toggleDashboardSidebar"
            >
              <i :class="dashboardCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" />
            </button>
            <div v-show="!dashboardCollapsed" class="sidebar-content">
              <CollectionMetrics
                :collection-id="collectionId"
                :collection-name="collectionName"
                vertical
              />
              <div class="sidebar-export">
                <ExportMetrics
                  :collection-id="collectionId"
                  :collection-name="collectionName"
                />
              </div>
            </div>
          </aside>

          <!-- Main Content Area -->
          <div class="main-content-area">
            <TabPanels :pt="tabPanelsPt">
              <TabPanel value="dashboard" :pt="tabPanelPt">
                <div class="dashboard-placeholder">
                  <!-- Empty panel for now - future content will go here -->
                </div>
              </TabPanel>
              <TabPanel value="stigs" :pt="tabPanelPt">
                <CollectionStigsTab :collection-id="collectionId" />
              </TabPanel>
              <TabPanel value="assets" :pt="tabPanelPt">
                <CollectionAssetsTab :collection-id="collectionId" />
              </TabPanel>
              <TabPanel value="labels" :pt="tabPanelPt">
                <CollectionLabelsTab :collection-id="collectionId" />
              </TabPanel>
              <TabPanel value="users" :pt="tabPanelPt">
                <div class="placeholder-panel">
                  <h2>Users Panel</h2>
                  <p>User management content will go here.</p>
                </div>
              </TabPanel>
              <TabPanel value="settings" :pt="tabPanelPt">
                <div class="placeholder-panel">
                  <h2>Settings Panel</h2>
                  <p>Collection settings content will go here.</p>
                </div>
              </TabPanel>
            </TabPanels>
          </div>
        </div>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
/* Component-level CSS variables */
.tabs-container {
  --dashboard-sidebar-width: 33rem;
  --dashboard-sidebar-collapsed-width: 2.5rem;
}

.collection-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.collection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
}

.breadcrumb-link {
  color: var(--color-primary-highlight);
  text-decoration: none;
  font-size: 1.2rem;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: var(--color-text-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.breadcrumb-separator {
  color: var(--color-text-dim);
  margin: 0 0.5rem;
}

:deep(.p-breadcrumb) {
  background: transparent;
  border: none;
  padding: 0;
}

:deep(.p-breadcrumb-list) {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tabs-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.placeholder-panel {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-dim);
}

/* Dashboard Sidebar Layout */
.tab-content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.dashboard-sidebar {
  width: var(--dashboard-sidebar-width);
  min-width: var(--dashboard-sidebar-width);
  background-color: var(--color-background-dark);
  border-right: 1px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.2s ease, min-width 0.2s ease;
}

.dashboard-sidebar--collapsed {
  width: var(--dashboard-sidebar-collapsed-width);
  min-width: var(--dashboard-sidebar-collapsed-width);
}

.sidebar-toggle {
  position: absolute;
  top: 0.5rem;
  right: 0.25rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 0.25rem;
  color: var(--color-text-dim);
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.15s, color 0.15s;
}

.sidebar-toggle:hover {
  background-color: var(--color-bg-hover-strong);
  color: var(--color-text-primary);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding-top: 3rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Override ExportMetrics min-width in sidebar context */
.sidebar-export :deep(.export-card) {
  min-width: 0;
  max-width: none;
}

.main-content-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-dim);
  font-style: italic;
}

/* Tab Alignment - Dashboard tab over sidebar, others over main content */
:deep(.p-tablist) {
  display: flex;
}

:deep(.p-tablist .p-tab:first-child) {
  /* Dashboard tab - aligns with sidebar width */
  width: var(--dashboard-sidebar-width);
  min-width: var(--dashboard-sidebar-width);
  justify-content: center;
  transition: width 0.2s ease, min-width 0.2s ease;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-collapsed :deep(.p-tablist .p-tab:first-child) {
  width: var(--dashboard-sidebar-collapsed-width);
  min-width: var(--dashboard-sidebar-collapsed-width);
  font-size: 0;
}

.tab-after-sidebar {
  /* Visual separator before tabs that align with main content */
  border-left: 1px solid var(--color-border-default);
}
</style>
