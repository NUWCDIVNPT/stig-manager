<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'
import CollectionExportMetrics from '../../CollectionMetrics/components/CollectionExportMetrics.vue'
import CollectionMetrics from '../../CollectionMetrics/components/CollectionMetrics.vue'
import MetricsFilter from '../../CollectionMetrics/components/MetricsFilter.vue'
import { fetchCollection } from '../api/collectionApi.js'
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
const { removeView } = useRecentViews()
const { triggerError } = useGlobalError()
const { addView } = useRecentViews()

// Fetch collection details for name
const { state: collection, execute: loadCollection } = useAsyncState(
  () => fetchCollection(props.collectionId),
  {
    immediate: false,
    onError: (err) => {
      if (err.body?.error === 'User has insufficient privilege to complete this request.') {
        removeView(key => key.includes(`:${props.collectionId}`))
        router.push({ name: 'not-found', params: { pathMatch: route.path.substring(1).split('/') } })
      }
      else {
        triggerError(err)
      }
    },
  },
)

const collectionName = computed(() => collection.value?.name || 'Collection')

// Track Recent Views on data load and route change
watch([collection, () => route.name], ([col, routeName]) => {
  if (col?.name && routeName?.startsWith('collection')) {
    let label = col.name
    let key = `collection:${props.collectionId}`

    if (routeName === 'collection-findings') {
      label = `${col.name} / Findings`
      key = `collection-findings:${props.collectionId}`
    }
    else if (['collection-settings', 'collection-users'].includes(routeName)) {
      label = `${col.name} / Manage`
      key = `collection-manage:${props.collectionId}`
    }

    addView({
      key,
      url: route.fullPath,
      label,
      type: 'collection',
    })
  }
}, { immediate: true })

// Initial Data Load
watch([() => props.collectionId], () => {
  collection.value = null
  loadCollection()
}, { immediate: true })

// Map route name to tab value
const routeToTab = {
  'collection-stigs': 'stigs',
  'collection-assets': 'assets',
  'collection-labels': 'labels',
  'collection-findings': 'findings',
  'collection-users': 'users',
  'collection-settings': 'settings',
}

const tabToRoute = {
  stigs: 'collection-stigs',
  assets: 'collection-assets',
  labels: 'collection-labels',
  findings: 'collection-findings',
  users: 'collection-users',
  settings: 'collection-settings',
}

// Active tab based on route
const activeTab = computed({
  get: () => routeToTab[route.name] || 'stigs',
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
const selectedLabelIds = ref([])

function toggleDashboardSidebar() {
  dashboardCollapsed.value = !dashboardCollapsed.value
}
</script>

<template>
  <div v-if="collection" class="collection-view">
    <div class="content-wrapper">
      <!-- Dashboard Sidebar (always visible, collapsible) -->
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
        <div v-show="!dashboardCollapsed" v-if="collection" class="sidebar-content">
          <CollectionMetrics
            :collection-id="collectionId"
            :collection-name="collectionName"
            :selected-label-ids="selectedLabelIds"
            vertical
          />
          <div class="sidebar-export">
            <CollectionExportMetrics
              :collection-id="collectionId"
              :collection-name="collectionName"
            />
          </div>
        </div>
      </aside>

      <!-- Right Panel: Tabs + Content -->
      <div v-if="collection" class="right-panel">
        <Tabs v-model:value="activeTab" :pt="tabsPt">
          <TabList>
            <Tab value="stigs">
              STIGs
            </Tab>
            <Tab value="assets">
              Assets
            </Tab>
            <Tab value="labels">
              Labels
            </Tab>
            <Tab value="findings">
              Findings
            </Tab>
            <Tab value="users">
              Users
            </Tab>
            <Tab value="settings">
              Settings
            </Tab>

            <div class="tab-filter-container">
              <span class="filter-label">FILTER:</span>
              <MetricsFilter v-model="selectedLabelIds" type="label" :collection-id="collectionId" />
            </div>
          </TabList>

          <TabPanels :pt="tabPanelsPt">
            <TabPanel value="stigs" :pt="tabPanelPt">
              <CollectionStigsTab :collection-id="collectionId" :selected-label-ids="selectedLabelIds" />
            </TabPanel>
            <TabPanel value="assets" :pt="tabPanelPt">
              <CollectionAssetsTab :collection-id="collectionId" :selected-label-ids="selectedLabelIds" />
            </TabPanel>
            <TabPanel value="labels" :pt="tabPanelPt">
              <CollectionLabelsTab :collection-id="collectionId" :selected-label-ids="selectedLabelIds" />
            </TabPanel>
            <TabPanel value="findings" :pt="tabPanelPt">
              <div class="placeholder-panel">
                <h2>Findings Panel</h2>
                <p>Findings content will go here.</p>
              </div>
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
        </Tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-level CSS variables */
.collection-view {
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

/* Override ExportMetrics min-width in sidebar context */
.sidebar-export :deep(.export-card) {
  min-width: 0;
  max-width: none;
}

/* Right Panel */
.right-panel {
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
