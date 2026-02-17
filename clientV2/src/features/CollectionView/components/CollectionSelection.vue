<script setup>
import { computed, ref } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useSelectedCollectionStore } from '../../../shared/stores/selectedCollection.js'
import { fetchCollections } from '../api/collectionApi.js'

const selectedCollectionStore = useSelectedCollectionStore()

const { state: collections, isLoading: loading } = useAsyncState(
  () => fetchCollections(),
)

const searchQuery = ref('')
/*
// const canCreateCollection = computed(() => {
//   const roles = oidcWorker?.tokenParsed?.realm_access?.roles || []
//   return roles.includes('create_collection')
// })
*/

const filteredCollections = computed(() => {
  if (!searchQuery.value) {
    return collections.value
  }
  const query = searchQuery.value.toLowerCase()
  return collections.value.filter(c => c.name.toLowerCase().includes(query))
})

function selectCollection(col) {
  selectedCollectionStore.select(col)
}

/*
function handleCreateCollection() {
  // Logic to open create collection modal
}
*/
</script>

<template>
  <div class="collection-selection-page">
    <div class="header">
      <h1>Collections</h1>
      <div class="actions">
        <span class="p-input-icon-left search-wrapper">
          <i class="pi pi-search" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search collections..."
            class="search-input"
          >
        </span>
        <!--
          TODO: Re-implement Create Collection functionality
          This was previously in NavTree.
        -->
        <!--
        <button v-if="canCreateCollection" class="btn-primary" @click="handleCreateCollection">
          <i class="pi pi-plus" /> New Collection
        </button>
        -->
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem" />
      <p>Loading collections...</p>
    </div>

    <div v-else class="collections-grid">
      <router-link
        v-for="col in filteredCollections"
        :key="col.collectionId"
        class="collection-card"
        :to="{ name: 'collection', params: { collectionId: col.collectionId } }"
        @click="selectCollection(col)"
      >
        <div class="card-icon">
          <img src="/src/assets/collection-color.svg" alt="Collection Icon">
        </div>
        <div class="card-content">
          <h3>{{ col.name }}</h3>
          <p class="meta">
            ID: {{ col.collectionId }}
          </p>
          <div class="stats" />
        </div>
        <div class="card-arrow">
          <i class="pi pi-chevron-right" />
        </div>
      </router-link>

      <div v-if="filteredCollections.length === 0" class="empty-state">
        <p>No collections found matching "{{ searchQuery }}"</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collection-selection-page {
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
  overflow-y: auto;
  background-color: var(--color-background-dark);
  color: var(--color-text-primary);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.actions {
  display: flex;
  gap: 1rem;
}

.search-wrapper {
  position: relative;
}

.search-wrapper i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-dim);
}

.search-input {
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-primary);
  padding: 0.5rem 1rem 0.5rem 2.2rem;
  border-radius: 6px;
  outline: none;
  width: 250px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--color-primary);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.collection-card {
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  text-decoration: none; /* Removed default underline */
  color: inherit; /* Inherit text color */
}

.collection-card:hover {
  background: var(--color-bg-hover-strong);
  border-color: var(--color-border-light);
  transform: translateY(-2px);
}

.card-icon {
  width: 48px;
  height: 48px;
  background: var(--color-bg-hover);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon img {
  width: 24px;
  height: 24px;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.card-arrow {
  color: var(--color-text-dim);
}

.collection-card:hover .card-arrow {
  color: var(--color-text-primary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--color-text-dim);
  gap: 1rem;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: var(--color-text-dim);
  background: var(--color-background-subtle);
  border-radius: 8px;
  border: 1px dashed var(--color-border-default);
}
</style>
