<script setup>
import Breadcrumb from 'primevue/breadcrumb'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, inject, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BreadcrumbSelect from '../../../components/common/BreadcrumbSelect.vue'
import AssetReview from '../../AssetReview/components/AssetReview.vue'
import { useAssetStigsQuery, useStigRevisionsQuery } from '../../AssetReview/queries/assetQueries.js'
import CollectionMetrics from '../../CollectionMetrics/components/CollectionMetrics.vue'
import ExportMetrics from '../../CollectionMetrics/components/ExportMetrics.vue'
import { useCollectionQuery } from '../queries/collectionQueries.js'
import {
  useCollectionAssetStigsQuery,
  useCollectionAssetSummaryQuery,
  useCollectionChecklistAssetsQuery,
  useCollectionLabelsQuery,
  useCollectionLabelSummaryQuery,
  useCollectionStigSummaryQuery,
} from '../queries/metricsQueries.js'
import LabelsView from './LabelsView.vue'
import MetricsSummaryGrid from './MetricsSummaryGrid.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

const route = useRoute()
const router = useRouter()

const collectionIdRef = computed(() => props.collectionId)

// OIDC worker for API queries
const oidcWorker = inject('worker')
const token = computed(() => oidcWorker?.token)

// Fetch collection details for name
const { collection } = useCollectionQuery({
  collectionId: collectionIdRef,
  token,
})

const collectionName = computed(() => collection.value?.name || 'Collection')

// Route-based review mode
const isReviewMode = computed(() => route.name === 'collection-asset-review')

// Review params from route
const reviewAssetId = computed(() => route.params.assetId || null)
const reviewBenchmarkId = computed(() => route.params.benchmarkId || null)
const reviewRevisionStr = computed(() => route.params.revisionStr || null)

// Template ref to access asset data from AssetReview component
const assetReviewRef = ref(null)

// Fetch STIGs for the asset being reviewed
const { stigs: assetStigs } = useAssetStigsQuery({
  assetId: reviewAssetId,
  token,
})

// Fetch available revisions for the selected benchmark
const { revisions: stigRevisions } = useStigRevisionsQuery({
  benchmarkId: reviewBenchmarkId,
  token,
})

// Watch for assetStigs to load and update route with revision if missing
watch(assetStigs, (stigs) => {
  if (isReviewMode.value && !reviewRevisionStr.value && stigs.length > 0) {
    const currentStig = stigs.find(s => s.benchmarkId === reviewBenchmarkId.value)
    if (currentStig?.revisionStr) {
      router.replace({
        name: 'collection-asset-review',
        params: {
          collectionId: props.collectionId,
          assetId: reviewAssetId.value,
          benchmarkId: reviewBenchmarkId.value,
          revisionStr: currentStig.revisionStr,
        },
      })
    }
  }
})

// Current STIG selection for dropdown - navigates on change
const selectedStigBenchmarkId = computed({
  get: () => reviewBenchmarkId.value,
  set: (newBenchmarkId) => {
    if (newBenchmarkId && isReviewMode.value) {
      // Find the revision for this benchmark from the asset's STIGs
      const stigData = assetStigs.value.find(s => s.benchmarkId === newBenchmarkId)
      router.push({
        name: 'collection-asset-review',
        params: {
          collectionId: props.collectionId,
          assetId: reviewAssetId.value,
          benchmarkId: newBenchmarkId,
          revisionStr: stigData?.revisionStr || undefined,
        },
      })
    }
  },
})

// Current revision selection for dropdown - navigates on change
const selectedRevisionStr = computed({
  get: () => reviewRevisionStr.value,
  set: (newRevisionStr) => {
    if (newRevisionStr && isReviewMode.value) {
      router.push({
        name: 'collection-asset-review',
        params: {
          collectionId: props.collectionId,
          assetId: reviewAssetId.value,
          benchmarkId: reviewBenchmarkId.value,
          revisionStr: newRevisionStr,
        },
      })
    }
  },
})

// Exit review mode - go back to dashboard
function exitReviewMode() {
  router.push({
    name: 'collection-dashboard',
    params: { collectionId: props.collectionId },
  })
}

// Breadcrumb configuration
const breadcrumbHome = {
  label: 'Collections',
  route: '/collections',
}

// Get asset name from AssetReview component, fallback to assetId while loading
const reviewAssetName = computed(() => {
  return assetReviewRef.value?.asset?.name || `Asset ${reviewAssetId.value}`
})

const breadcrumbItems = computed(() => {
  const items = [
    {
      label: collectionName.value,
      command: exitReviewMode,
    },
  ]

  if (isReviewMode.value) {
    items.push({
      label: reviewAssetName.value,
    })
    // STIG benchmark dropdown
    items.push({
      label: reviewBenchmarkId.value,
      isStigDropdown: true,
    })
    // STIG revision dropdown
    if (reviewRevisionStr.value) {
      items.push({
        label: reviewRevisionStr.value,
        isRevisionDropdown: true,
      })
    }
  }

  return items
})

// Data queries for STIGs, Assets, Labels
const { stigs, isLoading: stigsLoading, errorMessage: stigsError, refetch: refetchStigs } = useCollectionStigSummaryQuery({
  collectionId: computed(() => props.collectionId),
  token,
})

const { assets, isLoading: assetsLoading, errorMessage: assetsError, refetch: refetchAssets } = useCollectionAssetSummaryQuery({
  collectionId: computed(() => props.collectionId),
  token,
})

const { labels, refetch: refetchLabels } = useCollectionLabelSummaryQuery({
  collectionId: computed(() => props.collectionId),
  token,
})

// Raw labels with color property for AssetReview
const { labels: rawLabels } = useCollectionLabelsQuery({
  collectionId: computed(() => props.collectionId),
  token,
})

const selectedBenchmarkId = ref(null)
function handleStigSelect(benchmarkId) {
  selectedBenchmarkId.value = benchmarkId
}

// Auto-select first STIG when data loads and no selection exists
watch(stigs, (newStigs) => {
  if (newStigs.length > 0 && selectedBenchmarkId.value === null) {
    selectedBenchmarkId.value = newStigs[0].benchmarkId
  }
}, { immediate: true })

// Query for assets of the selected STIG (for STIGs tab child panel)
const {
  checklistAssets,
  isLoading: checklistAssetsLoading,
  errorMessage: checklistAssetsError,
  refetch: refetchChecklistAssets,
} = useCollectionChecklistAssetsQuery({
  collectionId: computed(() => props.collectionId),
  benchmarkId: selectedBenchmarkId,
  token,
})

// Handle row action from checklist assets grid to navigate to review
function handleChecklistAssetAction(rowData) {
  router.push({
    name: 'collection-asset-review',
    params: {
      collectionId: props.collectionId,
      assetId: rowData.assetId,
      benchmarkId: selectedBenchmarkId.value,
    },
  })
}

const selectedAssetId = ref(null)
function handleAssetSelect(assetId) {
  selectedAssetId.value = assetId
}

// Auto-select first asset when data loads and no selection exists
watch(assets, (newAssets) => {
  if (newAssets.length > 0 && selectedAssetId.value === null) {
    selectedAssetId.value = newAssets[0].assetId
  }
}, { immediate: true })

// Query for STIGs of the selected asset (for Assets tab child panel)
const {
  assetStigs: selectedAssetStigs,
  isLoading: selectedAssetStigsLoading,
  errorMessage: selectedAssetStigsError,
  refetch: refetchSelectedAssetStigs,
} = useCollectionAssetStigsQuery({
  collectionId: computed(() => props.collectionId),
  assetId: selectedAssetId,
  token,
})

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
          <a
            v-else-if="item.command"
            v-bind="itemProps.action"
            class="breadcrumb-link"
            href="#"
            @click.prevent="item.command"
          >
            {{ item.label }}
          </a>
          <BreadcrumbSelect
            v-else-if="item.isStigDropdown"
            v-model="selectedStigBenchmarkId"
            :options="assetStigs"
            option-label="benchmarkId"
            option-value="benchmarkId"
            placeholder="Select STIG"
          />
          <BreadcrumbSelect
            v-else-if="item.isRevisionDropdown"
            v-model="selectedRevisionStr"
            :options="stigRevisions"
            option-label="revisionStr"
            option-value="revisionStr"
            placeholder="Select Revision"
          />
          <span v-else class="breadcrumb-current">{{ item.label }}</span>
        </template>
        <template #separator>
          <span class="breadcrumb-separator">/</span>
        </template>
      </Breadcrumb>
      <div class="header-actions">
        <div v-if="isReviewMode" class="search-reviews">
          <i class="pi pi-search search-reviews__icon" />
          <input
            type="text"
            class="search-reviews__input"
            placeholder="Search reviews..."
          >
        </div>
      </div>
    </header>

    <!-- Review Mode: Show AssetReview -->
    <div v-if="isReviewMode" class="review-container">
      <AssetReview ref="assetReviewRef" :asset-id="reviewAssetId" :collection-labels="rawLabels" />
    </div>

    <!-- Normal Mode: Show Tabs -->
    <div v-else class="tabs-container" :class="{ 'sidebar-collapsed': dashboardCollapsed }">
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
                <div class="metrics-grid">
                  <div class="table-container">
                    <MetricsSummaryGrid
                      :api-metrics-summary="stigs"
                      :is-loading="stigsLoading"
                      :error-message="stigsError"
                      :selected-key="selectedBenchmarkId"
                      selectable
                      data-key="benchmarkId"
                      show-row-action
                      show-refresh
                      @row-select="(row) => handleStigSelect(row.benchmarkId)"
                      @refresh="refetchStigs"
                    />
                  </div>
                  <div class="table-container">
                    <div class="child-panel">
                      <div class="child-panel__header">
                        <h3>Checklists</h3>
                        <span v-if="selectedBenchmarkId" class="stig-badge">{{ selectedBenchmarkId }}</span>
                      </div>
                      <div class="child-panel__body">
                        <div v-if="!selectedBenchmarkId" class="empty-state">
                          Select a STIG to view checklists.
                        </div>
                        <div v-else-if="checklistAssetsLoading" class="loading-state">
                          Loading checklists...
                        </div>
                        <div v-else-if="checklistAssetsError" class="error-state">
                          {{ checklistAssetsError }}
                        </div>
                        <div v-else-if="checklistAssets.length === 0" class="empty-state">
                          No checklists found for this STIG.
                        </div>
                        <MetricsSummaryGrid
                          v-else
                          :api-metrics-summary="checklistAssets"
                          :is-loading="checklistAssetsLoading"
                          parent-agg-type="stig"
                          show-asset-action
                          data-key="assetId"
                          show-refresh
                          @asset-action="handleChecklistAssetAction"
                          @refresh="refetchChecklistAssets"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value="assets" :pt="tabPanelPt">
                <div class="metrics-grid">
                  <div class="table-container">
                    <MetricsSummaryGrid
                      :api-metrics-summary="assets"
                      :is-loading="assetsLoading"
                      :error-message="assetsError"
                      :selected-key="selectedAssetId"
                      selectable
                      data-key="assetId"
                      show-refresh
                      @row-select="(row) => handleAssetSelect(row.assetId)"
                      @refresh="refetchAssets"
                    />
                  </div>
                  <div class="table-container">
                    <div class="child-panel">
                      <div class="child-panel__header">
                        <h3>Asset STIGs</h3>
                        <span v-if="selectedAssetId" class="asset-badge">Asset {{ selectedAssetId }}</span>
                      </div>
                      <div class="child-panel__body">
                        <div v-if="!selectedAssetId" class="empty-state">
                          Select an asset to view its STIGs.
                        </div>
                        <div v-else-if="selectedAssetStigsLoading" class="loading-state">
                          Loading STIGs...
                        </div>
                        <div v-else-if="selectedAssetStigsError" class="error-state">
                          {{ selectedAssetStigsError }}
                        </div>
                        <div v-else-if="selectedAssetStigs.length === 0" class="empty-state">
                          No STIGs found for this asset.
                        </div>
                        <MetricsSummaryGrid
                          v-else
                          :api-metrics-summary="selectedAssetStigs"
                          :is-loading="selectedAssetStigsLoading"
                          parent-agg-type="asset"
                          show-refresh
                          @refresh="refetchSelectedAssetStigs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value="labels" :pt="tabPanelPt">
                <div class="metrics-grid">
                  <div class="table-container">
                    <MetricsSummaryGrid
                      :api-metrics-summary="labels"
                      selectable
                      data-key="labelId"
                      show-refresh
                      @refresh="refetchLabels"
                    />
                  </div>
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
  background-color: #1f1f1f;
  border-bottom: 1px solid #3a3d40;
}

.breadcrumb-link {
  color: #60a5fa;
  text-decoration: none;
  font-size: var(--breadcrumb-font-size);
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: #e4e4e7;
  font-size: var(--breadcrumb-font-size);
  font-weight: 600;
}

.breadcrumb-separator {
  color: #6b7280;
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

.search-reviews {
  display: flex;
  align-items: center;
  position: relative;
}

.search-reviews__icon {
  position: absolute;
  left: 0.6rem;
  color: #6b7280;
  font-size: 0.85rem;
  pointer-events: none;
}

.search-reviews__input {
  background-color: #2a2a2a;
  border: 1px solid #3a3d40;
  border-radius: 4px;
  color: #e4e4e7;
  font-size: 0.85rem;
  padding: 0.4rem 0.6rem 0.4rem 2rem;
  width: 180px;
  outline: none;
  transition: border-color 0.15s, background-color 0.15s;
}

.search-reviews__input::placeholder {
  color: #6b7280;
}

.search-reviews__input:focus {
  border-color: #60a5fa;
  background-color: #1f1f1f;
}

.review-container {
  flex: 1;
  overflow: hidden;
}

.tabs-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stigs-grid {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0.5rem;
  height: 100%;
  padding: 0.5rem;
  overflow: hidden;
}

.metrics-grid {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0.5rem;
  height: calc(100% - 1rem);
  padding: 0.5rem;
  overflow: hidden;
}

.table-container {
  overflow: hidden;
  border: 1px solid #3a3d40;
  border-radius: 4px;
}

.view-container {
  height: 100%;
  padding: 0.5rem;
  overflow: hidden;
}

.placeholder-panel {
  padding: 2rem;
  text-align: center;
  color: #a1a1aa;
}

.assets-grid {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0.5rem;
  height: 100%;
  padding: 0.5rem;
  overflow: hidden;
}

.child-panel {
  background-color: #1f1f1f;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.child-panel__header {
  padding: 0.75rem 1rem;
  background-color: #262626;
  border-bottom: 1px solid #3a3d40;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.child-panel__header h3 {
  margin: 0;
  color: #e4e4e7;
  font-size: 1rem;
}

.asset-badge,
.stig-badge {
  font-size: 0.8rem;
  background-color: #3a3d40;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: #a6adba;
}

.child-panel__body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state,
.loading-state,
.error-state {
  padding: 2rem;
  text-align: center;
  color: #a6adba;
  font-style: italic;
}

.error-state {
  color: #f16969;
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
  background-color: #1a1a1a;
  border-right: 1px solid #3a3d40;
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
  background: #2a2a2a;
  border: 1px solid #3a3d40;
  border-radius: 0.25rem;
  color: #a1a1aa;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.15s, color 0.15s;
}

.sidebar-toggle:hover {
  background-color: #3a3d40;
  color: #e4e4e7;
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
  color: #6b7280;
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
  border-left: 1px solid #3a3d40;
}
</style>
