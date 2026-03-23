<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { useRecentViews } from '../../../shared/composables/useRecentViews.js'
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
const DASHBOARD_STORAGE_KEY = 'stigman:collectionDashboardCollapsed'
const dashboardCollapsed = ref(localStorage.getItem(DASHBOARD_STORAGE_KEY) === 'true')
const selectedLabelIds = ref([])
const isAnimating = ref(false)

function toggleDashboardSidebar() {
  isAnimating.value = true
  dashboardCollapsed.value = !dashboardCollapsed.value

  setTimeout(() => {
    isAnimating.value = false
  }, 300)

  try {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, String(dashboardCollapsed.value))
  }
  catch {
    // localStorage unavailable
  }
}
</script>

<template>
  <div v-if="collection" class="collection-view">
    <Splitter
      :pt="{
        gutter: { style: 'background: var(--color-border-dark)' },
        root: { style: 'border: none; border-radius: 0; background: transparent; height: 100%; overflow: hidden;' },
      }"
    >
      <!-- Dashboard Sidebar -->
      <SplitterPanel
        :size="28"
        :min-size="4"
        :pt="{ root: { class: { 'sidebar-panel--collapsed': dashboardCollapsed, 'sidebar-panel--animating': isAnimating }, style: 'min-width: 330px; max-width: 600px;' } }"
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
      </SplitterPanel>

      <!-- Right Panel: Tabs + Content -->
      <SplitterPanel :size="72">
        <div class="right-panel">
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
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<style scoped>
.collection-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.sidebar-panel--animating) {
  transition: flex-basis 0.3s ease, width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease !important;
}

:deep(.sidebar-panel--collapsed) {
  flex: none !important;
  flex-basis: 3.25rem !important;
  width: 3.25rem !important;
  min-width: 3.25rem !important;
  max-width: 3.25rem !important;
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
  border-radius: 0;
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
  gap: 1rem;
  padding: 1.5rem 0;
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

.sidebar-export {
  padding: 0 12px 12px;
}

/* Right Panel */
.right-panel {
  height: 100%;
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
