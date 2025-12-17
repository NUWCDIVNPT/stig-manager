<script setup>
import Breadcrumb from 'primevue/breadcrumb'
import Select from 'primevue/select'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, inject, ref, watch } from 'vue'
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

// Review mode state
const reviewingAsset = ref(null) // { assetId, assetName, benchmarkId, revisionStr }
const isReviewMode = computed(() => reviewingAsset.value !== null)

// Fetch STIGs for the asset being reviewed
const reviewingAssetId = computed(() => reviewingAsset.value?.assetId || null)
const { stigs: assetStigs } = useAssetStigsQuery({
  assetId: reviewingAssetId,
  token,
})

// Fetch available revisions for the selected benchmark
const selectedBenchmarkForRevisions = computed(() => reviewingAsset.value?.benchmarkId || null)
const { revisions: stigRevisions } = useStigRevisionsQuery({
  benchmarkId: selectedBenchmarkForRevisions,
  token,
})

// Current STIG selection for dropdown
const selectedStigBenchmarkId = computed({
  get: () => reviewingAsset.value?.benchmarkId || null,
  set: (newBenchmarkId) => {
    if (reviewingAsset.value && newBenchmarkId) {
      // Find the revision for this benchmark from the asset's STIGs
      const stigData = assetStigs.value.find(s => s.benchmarkId === newBenchmarkId)
      reviewingAsset.value = {
        ...reviewingAsset.value,
        benchmarkId: newBenchmarkId,
        revisionStr: stigData?.revisionStr || null,
      }
    }
  },
})

// Current revision selection for dropdown
const selectedRevisionStr = computed({
  get: () => reviewingAsset.value?.revisionStr || null,
  set: (newRevisionStr) => {
    if (reviewingAsset.value && newRevisionStr) {
      reviewingAsset.value = {
        ...reviewingAsset.value,
        revisionStr: newRevisionStr,
      }
    }
  },
})

function handleReviewAsset(reviewData) {
  reviewingAsset.value = {
    ...reviewData,
    revisionStr: null, // Will be populated when assetStigs loads
  }
}

// Watch for assetStigs to load and set initial revisionStr
watch(assetStigs, (stigs) => {
  if (reviewingAsset.value && !reviewingAsset.value.revisionStr && stigs.length > 0) {
    const currentStig = stigs.find(s => s.benchmarkId === reviewingAsset.value.benchmarkId)
    if (currentStig?.revisionStr) {
      reviewingAsset.value = {
        ...reviewingAsset.value,
        revisionStr: currentStig.revisionStr,
      }
    }
  }
})

function exitReviewMode() {
  reviewingAsset.value = null
}

// Breadcrumb configuration
const breadcrumbHome = {
  label: 'Collections',
  route: '/collections',
}

const breadcrumbItems = computed(() => {
  const items = [
    {
      label: collectionName.value,
      command: exitReviewMode,
    },
  ]

  if (isReviewMode.value) {
    items.push({
      label: reviewingAsset.value.assetName,
    })
    // STIG benchmark dropdown
    items.push({
      label: reviewingAsset.value.benchmarkId,
      isStigDropdown: true,
    })
    // STIG revision dropdown
    if (reviewingAsset.value.revisionStr) {
      items.push({
        label: reviewingAsset.value.revisionStr,
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

// Default active tab
const activeTab = ref('dashboard')

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
      <AssetReview :asset-id="reviewingAsset.assetId" :collection-labels="rawLabels" />
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
