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
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import CollectionManage from '../../CollectionManage/components/CollectionManage.vue'
import CollectionExportMetrics from '../../CollectionMetrics/components/CollectionExportMetrics.vue'
import CollectionImportResults from '../../CollectionMetrics/components/CollectionImportResults.vue'
import CollectionMetrics from '../../CollectionMetrics/components/CollectionMetrics.vue'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'
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
const { getCollectionRoleId } = useCurrentUser()

const canManage = computed(() => {
  const roleId = getCollectionRoleId(props.collectionId)
  return roleId >= 3
})

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
    else if (routeName === 'collection-management') {
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
  'collection-management': 'management',
}

const tabToRoute = {
  stigs: 'collection-stigs',
  assets: 'collection-assets',
  labels: 'collection-labels',
  findings: 'collection-findings',
  management: 'collection-management',
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

const isManagement = computed(() => route.name === 'collection-management')

const sidebarTransitioning = ref(false)
watch(isManagement, () => {
  sidebarTransitioning.value = true
  setTimeout(() => { sidebarTransitioning.value = false }, 300)
})

// Lazy-mount tab panels: only render a tab's content after it has been visited
const visitedTabs = ref(new Set([activeTab.value]))
watch(activeTab, tab => visitedTabs.value.add(tab))

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
const refreshKey = ref(0)

function handleImported() {
  refreshKey.value++
}

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
        gutter: { style: isManagement ? 'display: none' : 'background: var(--color-border-dark)' },
        root: { style: 'border: none; border-radius: 0; background: transparent; height: 100%; overflow: hidden;' },
      }"
    >
      <!-- Dashboard Sidebar -->
      <SplitterPanel
        :size="14"
        :min-size="4"
        :pt="{ root: { class: { 'sidebar-panel--collapsed': dashboardCollapsed, 'sidebar-panel--animating': isAnimating || sidebarTransitioning, 'sidebar-panel--hidden': isManagement }, style: isManagement ? '' : 'min-width: 330px; max-width: 600px;' } }"
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
              v-model:selected-label-ids="selectedLabelIds"
              :collection-id="collectionId"
              :collection-name="collectionName"
              :refresh-key="refreshKey"
              vertical
            />
            <div class="sidebar-export">
              <CollectionImportResults
                :collection-id="collectionId"
                @imported="handleImported"
              />
              <CollectionExportMetrics
                :collection-id="collectionId"
                :collection-name="collectionName"
              />
            </div>
          </div>
        </aside>
      </SplitterPanel>

      <!-- Right Panel: Tabs + Content -->
      <SplitterPanel :size="86">
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
              <template v-if="canManage">
                <div class="tab-separator" />
                <Tab value="management">
                  <i class="pi pi-cog tab-icon" />
                  Management
                </Tab>
              </template>
            </TabList>

            <TabPanels :pt="tabPanelsPt">
              <TabPanel value="stigs" :pt="tabPanelPt">
                <CollectionStigsTab v-if="visitedTabs.has('stigs')" :collection-id="collectionId" :selected-label-ids="selectedLabelIds" :refresh-key="refreshKey" />
              </TabPanel>
              <TabPanel value="assets" :pt="tabPanelPt">
                <CollectionAssetsTab v-if="visitedTabs.has('assets')" :collection-id="collectionId" :selected-label-ids="selectedLabelIds" :refresh-key="refreshKey" />
              </TabPanel>
              <TabPanel value="labels" :pt="tabPanelPt">
                <CollectionLabelsTab v-if="visitedTabs.has('labels')" :collection-id="collectionId" :selected-label-ids="selectedLabelIds" />
              </TabPanel>
              <TabPanel value="findings" :pt="tabPanelPt">
                <div class="placeholder-panel">
                  <h2>Findings Panel</h2>
                  <p>Findings content will go here.</p>
                </div>
              </TabPanel>
              <TabPanel v-if="canManage" value="management" :pt="tabPanelPt">
                <Transition name="management-fade">
                  <CollectionManage v-if="isManagement" :collection-id="collectionId" @imported="handleImported" />
                </Transition>
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

:deep(.sidebar-panel--hidden) {
  flex: none !important;
  flex-basis: 0 !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.tab-separator {
  width: 1px;
  height: 1.5rem;
  background: var(--color-border-default);
  margin: 0 0.4rem;
  align-self: center;
}

.tab-icon {
  font-size: 0.85rem;
  opacity: 0.6;
  margin-right: 0.25rem;
}

.management-fade-enter-active {
  transition: opacity 0.2s ease 0.15s, transform 0.2s ease 0.15s;
}

.management-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
</style>
