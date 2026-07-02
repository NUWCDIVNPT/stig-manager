<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref, watch } from 'vue'
import DeleteModal from '../../../../components/common/DeleteModal.vue'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { deleteCollection, fetchCollectionsAdmin } from '../api/collectionsAdminApi.js'
import CollectionCreateModal from './CollectionCreateModal.vue'
import CollectionDetails from './CollectionDetails.vue'
import CollectionList from './CollectionList.vue'

const { triggerError } = useGlobalError()
const { refreshUser } = useCurrentUser()

const selectedCollection = ref(null)

const { state: collections, isLoading, execute: loadCollections } = useAsyncState(
  () => fetchCollectionsAdmin(),
  { initialState: [] },
)

// Single source of truth for selection. Runs on every list change (initial
// load, refresh, create, delete, edit) and re-points the selection at the
// freshly-fetched object with the same id — so reloads propagate current data
// to the details panel — falling back to the first row so a collection is
// always selected while the list is non-empty.
watch(collections, (list) => {
  if (!list?.length) {
    selectedCollection.value = null
    return
  }
  const currentId = selectedCollection.value?.collectionId
  selectedCollection.value = list.find(c => c.collectionId === currentId) ?? list[0]
}, { immediate: true })

// Create flow
const createModalVisible = ref(false)

function openCreateModal() {
  createModalVisible.value = true
}

async function onCollectionCreated(created) {
  const result = await loadCollections()
  const match = result?.find(c => c.collectionId === created?.collectionId)
  if (match) {
    selectedCollection.value = match
  }
  // Grants assigned at creation may include the current user, so refresh their
  // grants to reflect the new collection in the (grant-derived) NavRail list.
  await refreshUser()
}

// Delete flow
const deleteModalVisible = ref(false)
const collectionToDelete = ref(null)

function onDeleteRequested(collection) {
  collectionToDelete.value = collection
  deleteModalVisible.value = true
}

async function onDeleteConfirmed() {
  if (!collectionToDelete.value) {
    return
  }
  try {
    await deleteCollection(collectionToDelete.value.collectionId)
    // The watcher reconciles selection after the reload: the deleted id is gone,
    // so it falls back to the first row (or null when the list is now empty).
    await loadCollections()
    // The NavRail's collection list is derived from the current user's grants,
    // so refresh them to drop the deleted collection if the user had a grant.
    await refreshUser()
  }
  catch (err) {
    triggerError(err)
  }
  finally {
    collectionToDelete.value = null
  }
}
</script>

<template>
  <div class="collections-container">
    <Splitter
      class="collections-splitter"
      :pt="{
        gutter: { style: 'background: var(--color-border-dark)' },
        root: { style: 'border: none; background: transparent' },
      }"
    >
      <SplitterPanel :min-size="20" :size="70" class="splitter-panel">
        <CollectionList
          v-model:selection="selectedCollection"
          :collections="collections"
          :loading="isLoading"
          @create="openCreateModal"
          @delete="onDeleteRequested"
          @refresh="loadCollections"
        />
      </SplitterPanel>
      <SplitterPanel :min-size="15" :size="30" class="splitter-panel">
        <CollectionDetails
          :collection="selectedCollection"
          @updated="loadCollections"
          @grants-updated="loadCollections"
        />
      </SplitterPanel>
    </Splitter>

    <CollectionCreateModal
      v-model:visible="createModalVisible"
      @created="onCollectionCreated"
    />

    <DeleteModal
      v-model:visible="deleteModalVisible"
      title="Delete Collection"
      :message="collectionToDelete
        ? `Deleting the collection '${collectionToDelete.name}' will remove all data associated with it, including all Assets and their assessments. This action cannot be undone. Are you sure?`
        : ''"
      @confirm="onDeleteConfirmed"
    />
  </div>
</template>

<style scoped>
.collections-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.collections-splitter {
  flex-grow: 1;
  overflow: hidden;

}

.splitter-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
