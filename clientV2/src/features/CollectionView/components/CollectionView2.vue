<script setup>
import { storeToRefs } from 'pinia'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { computed, ref } from 'vue'
import { useNavTreeStore } from '../../../shared/stores/navTreeStore.js'
import CollectionMetrics from '../../CollectionMetrics/components/CollectionMetrics.vue'
import { useCollectionAssetSummary } from '../composeables/useCollectionAssetSummary.js'
import { useDeleteCollection } from '../composeables/useDeleteCollection.js'
import ChecklistTable from './ChecklistTable.vue'
import MetricsSummaryGrid from './MetricsSummaryGrid.vue'

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
const { assets: assetsSummary, isLoading, errorMessage } = useCollectionAssetSummary(collectionIdRef)

const activeTab = ref('assets')

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
          <Tab value="assets">
            Assets/Stigs
          </Tab>
          <Tab value="dashboard">
            Dashboard
          </Tab>
          <Tab value="users">
            Users
          </Tab>
          <Tab value="settings">
            Settings
          </Tab>
          <Tab value="manage">
            Manage
          </Tab>
        </TabList>
        <TabPanels :pt="tabPanelsPt">
          <TabPanel value="assets" :pt="tabPanelPt">
            <MetricsSummaryGrid
              :api-metrics-summary="assetsSummary"
              :is-loading="isLoading"
              :error-message="errorMessage"
            />
          </TabPanel>
          <TabPanel value="dashboard" :pt="tabPanelPt">
            <CollectionMetrics :collection-id="collectionId" />
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
          <TabPanel value="manage" :pt="tabPanelPt">
            <div class="placeholder-panel">
              <h2>Manage Panel</h2>
              <p>Management content will go here.</p>
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

.assets-grid {
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

.placeholder-panel {
  padding: 2rem;
  text-align: center;
  color: #a1a1aa;
}
</style>
