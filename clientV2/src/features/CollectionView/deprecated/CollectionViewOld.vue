<script setup>
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useNavTreeStore } from '../../../shared/stores/navTreeStore.js'
import { useDeleteCollection } from '../composeables/useDeleteCollection.js'
import CollectionAssetTable from './CollectionAssetTable.vue'
import MetricsSummaryGrid from './MetricsSummaryGrid.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

const navTreeStore = useNavTreeStore()
const { selectedData } = storeToRefs(navTreeStore)

// 1. Try to get from store (primary source - instant)
const storeCollection = computed(() => selectedData.value || null)

const selectedCollection = computed(() => storeCollection.value)

const collectionIdRef = computed(() => props.collectionId)
const collectionName = computed(() => selectedCollection.value?.label || selectedCollection.value?.data?.name || 'Collection')
const hasCollection = computed(() => Boolean(selectedCollection.value))

// composable to handle deleting the collection
const { deleteCollection } = useDeleteCollection(collectionIdRef)

const selectedBenchmarkId = ref(null)

function handleStigSelect(benchmarkId) {
  selectedBenchmarkId.value = benchmarkId
}
</script>

<template>
  <div class="collection-view">
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

    <div class="content-scroll-area">
      <section class="data-pane-section">
        <CollectionDataPane :collection-id="collectionId" />
      </section>

      <!-- Tables Grid -->
      <section class="tables-grid">
        <div class="table-container">
          <StigAssetLabelTable
            :collection-id="collectionId"
            @select-stig="handleStigSelect"
          />
        </div>
        <div class="table-container">
          <ChecklistTable
            :collection-id="collectionId"
            :benchmark-id="selectedBenchmarkId"
          />
        </div>
      </section>
    </div>
    <template v-else>
      <header class="collection-view__header">
        <div>
          <p class="collection-view__eyebrow">
            Collection
          </p>
          <h1 class="collection-view__title">
            {{ collectionName }}
          </h1>
          <p class="collection-view__meta">
            ID: {{ collectionId }}
          </p>
        </div>
        <div class="collection-view__actions">
          <div class="collection-view__stats">
            <div class="collection-view__stat">
              <span class="collection-view__stat-value">{{ assetCount }}</span>
              <span class="collection-view__stat-label">Assets</span>
            </div>
          </div>
          <button
            class="collection-view__delete-button"
            type="button"
            :disabled="isDeleting"
            @click="deleteCollection"
          >
            {{ isDeleting ? 'Deleting…' : 'Delete Collection' }}
          </button>
        </div>
      </header>

      <p v-if="deleteErrorMessage" class="collection-view__delete-error">
        {{ deleteErrorMessage }}
      </p>

      <MetricsSummaryGrid
        :api-metrics-summary="assets"
        :is-loading="isLoading"
        :error-message="errorMessage"
      />
      <!-- <CollectionAssetTable
        :assets="assets"
        :is-loading="isLoading"
        :error-message="errorMessage"
        :collection-name="collectionName"
      /> -->
    </template>
    </section>
  </div>
</template>

<style scoped>
.collection-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #000000;
  color: #e4e4e7;
}

/* Fixed Header */
.collection-header {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #1f1f1f;
  border-bottom: 1px solid #3a3d40;
  z-index: 10;
}

.header-info {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.collection-title {
  margin: 0;
  font-size: 1.5rem;
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
  transition: color 0.2s, background-color 0.2s;
}

.delete-btn:hover {
  color: #f16969;
  background-color: rgba(241, 105, 105, 0.1);
}

.content-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 0.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.data-pane-section {
  flex: 0 0 200px;
  min-height: 400px;
}

.tables-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  min-height: 400px;
}

.table-container {
  min-width: 0;
  height: 100%;
}
</style>
