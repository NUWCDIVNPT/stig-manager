<script setup>
import InputText from 'primevue/inputtext'
import Popover from 'primevue/popover'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchCollections } from '../../CollectionView/api/collectionApi.js'

const props = defineProps({
  expanded: {
    type: Boolean,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: 'Collections',
  },
  iconClass: {
    type: String,
    default: 'nav-icon-collection',
  },
})

const route = useRoute()
const collectionsPopover = ref(null)

const collectionsPopoverPt = {
  root: { style: 'min-width: 22rem; max-width: 27rem; padding: 0' },
}
const collectionSearchTerm = ref('')
const collectionsExpanded = ref(true)

const { state: collections, isLoading: collectionsLoading } = useAsyncState(
  () => fetchCollections(),
  { initialState: [], immediate: true },
)

const filteredCollections = computed(() => {
  let list = collections.value || []
  if (collectionSearchTerm.value) {
    const term = collectionSearchTerm.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(term))
  }
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
})

function toggleCollectionsList() {
  collectionsExpanded.value = !collectionsExpanded.value
}

function toggleCollectionsPopover(event) {
  collectionsPopover.value.toggle(event)
}
</script>

<template>
  <div class="nav-rail-collection-container">
    <button
      v-if="expanded"
      class="nav-rail-item"
      :class="{ 'nav-rail-item--active': active }"
      @click="toggleCollectionsList"
    >
      <span
        class="nav-rail-item-icon nav-icon"
        :class="iconClass"
      />
      <span class="nav-rail-item-label">{{ label }}</span>
      <span class="nav-rail-item-chevron">
        <i :class="collectionsExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
      </span>
    </button>

    <button
      v-else
      class="nav-rail-item nav-rail-item--icon-only"
      :class="{ 'nav-rail-item--active': active }"
      :title="label"
      @click="toggleCollectionsPopover"
    >
      <span
        class="nav-rail-item-icon nav-icon"
        :class="iconClass"
      />
    </button>

    <div v-show="expanded && collectionsExpanded" class="nav-rail-collections-list">
      <div class="collections-group dashboard-group">
        <div class="collection-list-item">
          <router-link
            to="/collections"
            class="collection-list-link"
            :class="{ 'collection-list-link--active': route.name === 'collections' }"
          >
            <span class="collection-list-icon pi pi-desktop collection-list-icon--dashboard" />
            <span class="collection-list-name">Collections Dashboard</span>
          </router-link>
        </div>
      </div>

      <div class="collections-group">
        <div v-if="collectionsLoading" class="collections-loading">
          <i class="pi pi-spin pi-spinner" /> Loading...
        </div>
        <div v-else-if="filteredCollections.length === 0" class="collections-empty">
          No collections found.
        </div>
        <template v-else>
          <div v-for="collection in filteredCollections" :key="`all-${collection.collectionId}`" class="collection-list-item">
            <router-link
              :to="`/collection/${collection.collectionId}`"
              class="collection-list-link"
              :class="{ 'collection-list-link--active': route.params.collectionId === collection.collectionId }"
            >
              <span class="collection-list-icon nav-icon nav-icon-collection" />
              <span class="collection-list-name">{{ collection.name }}</span>
            </router-link>
          </div>
        </template>
      </div>
    </div>

    <Popover ref="collectionsPopover" :pt="collectionsPopoverPt">
      <div class="collections-popover-header">
        <span>{{ label }}</span>
      </div>
      <div class="collections-popover-search">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText
            v-model="collectionSearchTerm"
            placeholder="Search collections..."
            class="w-full p-inputtext-sm search-input"
          />
        </span>
      </div>
      <div class="collections-popover-list">
        <div class="collections-group dashboard-group">
          <div class="collection-list-item">
            <router-link
              to="/collections"
              class="collection-list-link"
              :class="{ 'collection-list-link--active': route.name === 'collections' }"
              @click="collectionsPopover.hide()"
            >
              <span class="collection-list-icon pi pi-desktop collection-list-icon--dashboard" />
              <span class="collection-list-name">Collections Dashboard</span>
            </router-link>
          </div>
        </div>

        <div class="collections-group">
          <div v-if="collectionsLoading" class="collections-loading">
            <i class="pi pi-spin pi-spinner" /> Loading...
          </div>
          <div v-else-if="filteredCollections.length === 0" class="collections-empty">
            No collections found.
          </div>
          <template v-else>
            <div v-for="collection in filteredCollections" :key="`pop-all-${collection.collectionId}`" class="collection-list-item">
              <router-link
                :to="`/collection/${collection.collectionId}`"
                class="collection-list-link"
                :class="{ 'collection-list-link--active': route.params.collectionId === collection.collectionId }"
                @click="collectionsPopover.hide()"
              >
                <span class="collection-list-icon nav-icon nav-icon-collection" />
                <span class="collection-list-name">{{ collection.name }}</span>
              </router-link>
            </div>
          </template>
        </div>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
.nav-rail-collection-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.nav-rail-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  height: 3.6rem;
  padding: 0 1.1rem;
  border-radius: 0.55rem;
  color: var(--color-text-dim);
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  background: none;
  border: none;
  width: 100%;
  font-size: inherit;
  font-family: inherit;
}

.nav-rail-item:hover {
  background-color: var(--color-button-hover-bg);
  color: var(--color-text-primary);
}

.nav-rail-item--active {
  background-color: var(--color-bg-hover-strong);
  color: var(--color-text-primary);
}

.nav-rail-item--icon-only {
  justify-content: center;
  padding: 0;
}

.nav-rail-item-icon {
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.nav-rail-item-label {
  font-size: 1.1rem;
  font-weight: 500;
}

.nav-rail-item-chevron {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.nav-rail-collections-list {
  display: flex;
  flex-direction: column;
  margin-left: 1.1rem;
  margin-top: 0.2rem;
  margin-bottom: 0.5rem;
  border-left: 1px solid var(--color-border-default);
  padding-left: 0.5rem;
  padding-right: 0.25rem;
  max-height: 26rem;
  overflow-y: auto;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.nav-rail-collections-list::-webkit-scrollbar {
  width: 6px;
}

.nav-rail-collections-list::-webkit-scrollbar-track {
  background: transparent;
}

.nav-rail-collections-list::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

.nav-rail-collections-list::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 999px;
  border: none;
  min-height: 28px;
}

.nav-rail-collections-list::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-border-hover);
}

.collections-group {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.collections-group.dashboard-group {
  margin-top: 1rem;
  margin-bottom: 0.25rem;
}

.collection-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.35rem;
  margin-bottom: 0.1rem;
}

.collection-list-item:hover {
  background-color: var(--color-button-hover-bg);
}

.collection-list-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  text-decoration: none;
  color: var(--color-text-dim);
  flex: 1;
  min-width: 0;
}

.collection-list-link:hover,
.collection-list-link--active {
  color: var(--color-text-primary);
}

.collection-list-link--active {
  background-color: var(--color-bg-hover-strong);
  border-radius: 0.35rem;
}

.collection-list-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  opacity: 0.7;
}

.collection-list-icon--dashboard {
  opacity: 0.7;
  font-size: 0.9em;
}

.collection-list-name {
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collections-loading,
.collections-empty {
  padding: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-dim);
  text-align: center;
}


.collections-popover-header {
  padding: 0.75rem 1.1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-default);
}

.collections-popover-search {
  padding: 0.75rem 1.1rem 0;
}

.collections-popover-list {
  max-height: 25rem;
  overflow-y: auto;
  padding: 0.75rem 0.6rem;
}

.nav-icon {
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.nav-icon-collection {
  background-image: url('/src/assets/collection-color.svg');
}
</style>
