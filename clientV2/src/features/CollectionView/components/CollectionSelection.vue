<script setup>
import { computed, ref } from 'vue'
import { useSelectedCollectionStore } from '../../../shared/stores/selectedCollection.js'
import { useCollectionsData } from '../composeables/useCollectionsData.js'

// const router = useRouter()
const { collections, loading } = useCollectionsData()
const selectedCollectionStore = useSelectedCollectionStore()
// const oidcWorker = inject('worker') // Unused for now

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
  background-color: #18181b;
  color: #e4e4e7;
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
  color: #fff;
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
  color: #71717a;
}

.search-input {
  background: #27272a; /* zinc-800 */
  border: 1px solid #3f3f46; /* zinc-700 */
  color: #fff;
  padding: 0.5rem 1rem 0.5rem 2.2rem;
  border-radius: 6px;
  outline: none;
  width: 250px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #6366f1; /* indigo-500 */
}

.btn-primary {
  background: #6366f1;
  color: white;
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
  background: #4f46e5;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.collection-card {
  background: #27272a;
  border: 1px solid #3f3f46;
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
  background: #3f3f46;
  border-color: #52525b;
  transform: translateY(-2px);
}

.card-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
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
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  margin: 0;
  font-size: 0.85rem;
  color: #a1a1aa;
}

.card-arrow {
  color: #52525b;
}

.collection-card:hover .card-arrow {
  color: #e4e4e7;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #a1a1aa;
  gap: 1rem;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #71717a;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px dashed #3f3f46;
}
</style>
