<script setup>
import { computed } from 'vue'
import { useCollectionAssetSummary } from '../composeables/useCollectionAssetSummary'
import CollectionAssetTable from './CollectionAssetTable.vue'

const props = defineProps({
  payload: {
    type: Object,
    default: () => ({}),
  },
})

const selectedCollection = computed(() => props.payload?.data || null)
const collectionId = computed(() => selectedCollection.value?.collectionId ?? null)
const collectionName = computed(() => selectedCollection.value?.name || 'Collection')
const hasCollection = computed(() => Boolean(collectionId.value))

const { assets, isLoading, errorMessage } = useCollectionAssetSummary(collectionId)
const assetCount = computed(() => assets.value.length)
</script>

<template>
  <section class="collection-view">
    <div v-if="!hasCollection" class="collection-view__empty">
      Select a collection from the navigation tree to view its assets.
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
        <div class="collection-view__stats">
          <div class="collection-view__stat">
            <span class="collection-view__stat-value">{{ assetCount }}</span>
            <span class="collection-view__stat-label">Assets</span>
          </div>
        </div>
      </header>

      <CollectionAssetTable
        :assets="assets"
        :is-loading="isLoading"
        :error-message="errorMessage"
        :collection-name="collectionName"
      />
    </template>
  </section>
</template>

<style scoped>
.collection-view {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  height: 100%;
  gap: 1rem;
}

.collection-view__empty {
  padding: 2rem;
  text-align: center;
  border: 1px dashed color-mix(in srgb, var(--sm-panel-border, #3a3d40) 65%, transparent);
  border-radius: 0.75rem;
  color: var(--sm-muted-text, #a6adba);
}

.collection-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.collection-view__eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sm-muted-text, #a6adba);
  margin-bottom: 0.25rem;
}

.collection-view__title {
  margin: 0;
  font-size: 1.6rem;
}

.collection-view__meta {
  margin: 0.25rem 0 0;
  color: var(--sm-muted-text, #a6adba);
}

.collection-view__stats {
  display: flex;
  gap: 1.5rem;
}

.collection-view__stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.collection-view__stat-value {
  font-size: 2rem;
  font-weight: 600;
}

.collection-view__stat-label {
  font-size: 0.85rem;
  color: var(--sm-muted-text, #a6adba);
}
</style>
