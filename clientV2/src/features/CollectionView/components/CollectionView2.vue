<script setup>
import { storeToRefs } from 'pinia'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, inject, ref } from 'vue'
import { useNavTreeStore } from '../../../shared/stores/navTreeStore.js'
import CollectionMetrics from '../../CollectionMetrics/components/CollectionMetrics.vue'
import { useDeleteCollection } from '../composeables/useDeleteCollection.js'
import {
  useCollectionAssetSummaryQuery,
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

const navTreeStore = useNavTreeStore()
const { selectedData } = storeToRefs(navTreeStore)
const storeCollection = computed(() => selectedData.value || null)
const selectedCollection = computed(() => storeCollection.value)
const collectionIdRef = computed(() => props.collectionId)
const collectionName = computed(() => selectedCollection.value?.label || selectedCollection.value?.data?.name || 'Collection')
const hasCollection = computed(() => Boolean(selectedCollection.value))

const { deleteCollection } = useDeleteCollection(collectionIdRef)

// OIDC worker for API queries
const oidcWorker = inject('worker')
const token = computed(() => oidcWorker?.token)

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
      <div class="header-info">
        <h1 class="collection-title">
          {{ collectionName }}
        </h1>
        <span class="collection-id">ID: {{ collectionId }}</span>
      </div>
      <div class="header-actions">
        <button
          v-if="hasCollection"
          type="button"
          class="delete-btn"
          title="Delete Collection"
          @click="deleteCollection"
        >
          <i class="pi pi-trash" />
        </button>
      </div>
    </header>

    <div class="tabs-container">
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
  padding: 0.5rem 1rem;
  background-color: #1f1f1f;
  border-bottom: 1px solid #3a3d40;
}

.header-info {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.collection-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.collection-id {
  color: #a6adba;
  font-size: 0.9rem;
  font-family: monospace;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #a6adba;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
}

.delete-btn:hover {
  color: #f16969;
  background-color: rgba(241, 105, 105, 0.1);
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
