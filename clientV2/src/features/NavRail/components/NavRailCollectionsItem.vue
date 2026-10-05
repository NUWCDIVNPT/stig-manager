<script setup>
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Popover from 'primevue/popover'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import CollectionQuickCreateModal from './CollectionQuickCreateModal.vue'

defineProps({
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
const router = useRouter()
const collectionsPopover = ref(null)

const collectionsPopoverPt = {
  root: { class: 'nav-popover', style: 'min-width: 22rem; max-width: 30rem; padding: 0' },
}
const collectionSearchTerm = ref('')
const collectionsExpanded = ref(true)

// Derive the list from the current user's grants rather than fetching it.
// The grants are the single source of truth and are refreshed (via
// useCurrentUser().refreshUser) after create/clone/rename/delete, so the nav
// updates reactively instead of going stale.
const { user, canCreateCollection, refreshUser } = useCurrentUser()

const collectionsLoading = computed(() => !user.value)

const collections = computed(() =>
  (user.value?.collectionGrants ?? []).map(g => ({
    collectionId: String(g.collection.collectionId),
    name: g.collection.name,
  })),
)

const filteredCollections = computed(() => {
  let list = collections.value
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

// Quick create: name + description only; the creator becomes the first Owner
// and lands on the new Collection's Management page.
const quickCreateVisible = ref(false)

function openQuickCreate() {
  collectionsPopover.value.hide()
  quickCreateVisible.value = true
}

async function onQuickCreated(created) {
  // The nav list is grant-derived, so refresh grants before navigating or the
  // route guard will not yet see the new Owner grant.
  await refreshUser()
  router.push({ name: 'collection-management', params: { collectionId: String(created.collectionId) } })
}
</script>

<template>
  <div class="nav-rail-collection-container">
    <!-- The row itself is the accordion toggle so the chevron and the space
         around the (+) still toggle the list; the (+) opts out with .stop -->
    <div
      v-if="expanded"
      class="nav-rail-item"
      :class="{ 'nav-rail-item--active': active }"
      @click="toggleCollectionsList"
    >
      <button
        type="button"
        class="nav-rail-item-toggle"
        :aria-expanded="collectionsExpanded"
      >
        <span
          class="nav-rail-item-icon nav-icon"
          :class="iconClass"
        />
        <span class="nav-rail-item-label">{{ label }}</span>
      </button>
      <button
        v-if="canCreateCollection"
        v-tooltip.bottom="'Create New Collection'"
        type="button"
        class="nav-rail-icon-btn"
        aria-label="Create New Collection"
        @click.stop="openQuickCreate"
      >
        <span class="icon-collection-new nav-rail-item-add-icon" />
      </button>
      <span class="nav-rail-item-chevron">
        <i :class="collectionsExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
      </span>
    </div>

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

    <div v-show="expanded && collectionsExpanded" class="nav-rail-collections-list nav-scroller">
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
        <button
          v-if="canCreateCollection"
          v-tooltip.bottom="'Create New Collection'"
          type="button"
          class="nav-rail-icon-btn"
          aria-label="Create New Collection"
          @click="openQuickCreate"
        >
          <span class="icon-collection-new nav-rail-item-add-icon" />
        </button>
      </div>
      <div class="collections-popover-search">
        <IconField class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="collectionSearchTerm"
            placeholder="Search collections..."
            class="w-full"
          />
        </IconField>
      </div>
      <div class="collections-popover-list nav-scroller">
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

    <CollectionQuickCreateModal
      v-model:visible="quickCreateVisible"
      @created="onQuickCreated"
    />
  </div>
</template>

<style scoped>
@import './style.css';

.nav-rail-collection-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.nav-rail-item-chevron {
  font-size: var(--text-md);
  color: var(--color-text-dim);
}

/* Expanded header: the icon + label toggle, the (+) and the chevron are flex
   siblings of one .nav-rail-item row (a button may not nest inside a button).
   The toggle takes the free space so the label gives way first at narrow
   widths and the (+) and chevron keep their place at the right edge */
.nav-rail-item-toggle {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.nav-rail-item-toggle .nav-rail-item-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Same footprint as .nav-rail-item-icon so it matches the rail's Collections icon */
.nav-rail-item-add-icon {
  width: 1.6rem;
  height: 1.6rem;
  opacity: 0.85;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.nav-rail-icon-btn:hover .nav-rail-item-add-icon {
  opacity: 1;
  transform: scale(1.1);
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
  font-size: var(--text-md);
}

.collection-list-name {
  font-size: var(--text-lg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collections-loading,
.collections-empty {
  padding: 0.5rem;
  font-size: var(--text-md);
  color: var(--color-text-dim);
  text-align: center;
}

.collections-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem 0.5rem 1.1rem;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-default);
}

.collections-popover-search {
  padding: 0.75rem 1.1rem 0;
}

.collections-popover-list {
  max-height: 36rem;
  overflow-y: auto;
  padding: 0.75rem 0.6rem;
}
</style>
