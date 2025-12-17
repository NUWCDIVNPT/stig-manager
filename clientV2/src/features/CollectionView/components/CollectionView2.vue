<script setup>
import Breadcrumb from 'primevue/breadcrumb'
import Select from 'primevue/select'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, inject, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AssetReview from '../../AssetReview/components/AssetReview.vue'
import { useAssetStigsQuery, useStigRevisionsQuery } from '../../AssetReview/queries/assetQueries.js'
import CollectionMetrics from '../../CollectionMetrics/components/CollectionMetrics.vue'
import { useCollectionQuery } from '../queries/collectionQueries.js'
import {
  useCollectionAssetSummaryQuery,
  useCollectionLabelsQuery,
  useCollectionLabelSummaryQuery,
  useCollectionStigSummaryQuery,
} from '../queries/metricsQueries.js'
import AssetsView from './AssetsView.vue'
import ChecklistTable from './ChecklistTable.vue'
import LabelsView from './LabelsView.vue'
import StigsView from './StigsView.vue'

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

// Navigate to asset review
function handleReviewAsset(reviewData) {
  router.push({
    name: 'collection-asset-review',
    params: {
      collectionId: props.collectionId,
      assetId: reviewData.assetId,
      benchmarkId: reviewData.benchmarkId,
    },
  })
}

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

// Get asset name from assetStigs or use assetId as fallback
const reviewAssetName = computed(() => {
  // We could fetch the asset name from the asset query, but for now use assetId
  // The asset name could be passed via query params or fetched separately
  return `Asset ${reviewAssetId.value}`
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
const { stigs } = useCollectionStigSummaryQuery({
  collectionId: computed(() => props.collectionId),
  token,
})

const { assets } = useCollectionAssetSummaryQuery({
  collectionId: computed(() => props.collectionId),
  token,
})

const { labels } = useCollectionLabelSummaryQuery({
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
</script>

<template>
  <div class="collection-view-2">
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
          <Select
            v-else-if="item.isStigDropdown"
            v-model="selectedStigBenchmarkId"
            :options="assetStigs"
            option-label="benchmarkId"
            option-value="benchmarkId"
            class="breadcrumb-stig-select"
            placeholder="Select STIG"
            :pt="{
              root: { class: 'breadcrumb-select-root' },
              label: { class: 'breadcrumb-select-label' },
              dropdown: { class: 'breadcrumb-select-dropdown' },
            }"
          />
          <Select
            v-else-if="item.isRevisionDropdown"
            v-model="selectedRevisionStr"
            :options="stigRevisions"
            option-label="revisionStr"
            option-value="revisionStr"
            class="breadcrumb-stig-select"
            placeholder="Select Revision"
            :pt="{
              root: { class: 'breadcrumb-select-root' },
              label: { class: 'breadcrumb-select-label' },
              dropdown: { class: 'breadcrumb-select-dropdown' },
            }"
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
      <AssetReview :asset-id="reviewAssetId" :collection-labels="rawLabels" />
    </div>

    <!-- Normal Mode: Show Tabs -->
    <div v-else class="tabs-container">
      <Tabs v-model:value="activeTab" :pt="tabsPt">
        <TabList>
          <Tab value="dashboard">
            Dashboard
          </Tab>
          <Tab value="stigs">
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
        <TabPanels :pt="tabPanelsPt">
          <TabPanel value="dashboard" :pt="tabPanelPt">
            <CollectionMetrics :collection-id="collectionId" />
          </TabPanel>
          <TabPanel value="stigs" :pt="tabPanelPt">
            <div class="stigs-grid">
              <div class="table-container">
                <StigsView
                  :collection-id="collectionId"
                  :stigs="stigs"
                  @select-stig="handleStigSelect"
                />
              </div>
              <div class="table-container">
                <ChecklistTable
                  :collection-id="collectionId"
                  :benchmark-id="selectedBenchmarkId"
                  @review-asset="handleReviewAsset"
                />
              </div>
            </div>
          </TabPanel>
          <TabPanel value="assets" :pt="tabPanelPt">
            <div class="view-container">
              <AssetsView :collection-id="collectionId" :assets="assets" />
            </div>
          </TabPanel>
          <TabPanel value="labels" :pt="tabPanelPt">
            <div class="view-container">
              <LabelsView :collection-id="collectionId" :labels="labels" />
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
</template>

<style scoped>
.collection-view-2 {
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
  font-size: 0.95rem;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: #e4e4e7;
  font-size: 0.95rem;
  font-weight: 600;
}

/* Subtle breadcrumb-style dropdown */
.breadcrumb-stig-select {
  display: inline-flex;
  align-items: center;
}

:deep(.breadcrumb-select-root) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  min-width: auto;
  cursor: pointer;
}

:deep(.breadcrumb-select-root:hover) {
  background: transparent;
}

:deep(.breadcrumb-select-label) {
  padding: 0;
  color: #e4e4e7;
  font-size: 0.95rem;
  font-weight: 600;
}

:deep(.breadcrumb-select-label:hover) {
  text-decoration: underline;
}

:deep(.breadcrumb-select-dropdown) {
  color: #6b7280;
  width: auto;
  padding-left: 0.25rem;
}

:deep(.breadcrumb-select-dropdown .p-icon) {
  width: 0.75rem;
  height: 0.75rem;
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
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  height: 100%;
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
</style>
