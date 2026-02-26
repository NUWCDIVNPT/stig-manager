<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref } from 'vue'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { fetchCollectionsAdmin } from '../api/collectionsAdminApi.js'
import CollectionDetails from './CollectionDetails.vue'
import CollectionList from './CollectionList.vue'

const selectedCollection = ref(null)

const { state: collections, isLoading, execute: loadCollections } = useAsyncState(
  () => fetchCollectionsAdmin(),
  { initialState: [] },
)

const onUpdated = async () => {
  const result = await loadCollections()
  if (selectedCollection.value && result) {
    const updatedSelection = result.find(c => c.collectionId === selectedCollection.value.collectionId)
    if (updatedSelection) {
      selectedCollection.value = updatedSelection
    }
  }
}
</script>

<template>
  <div class="collections-container">
    <Splitter class="collections-splitter">
      <SplitterPanel :min-size="20" :size="75" class="splitter-panel">
        <CollectionList
          v-model:selection="selectedCollection"
          :collections="collections"
          :loading="isLoading"
        />
      </SplitterPanel>
      <SplitterPanel :min-size="15" :size="25" class="splitter-panel">
        <CollectionDetails :collection="selectedCollection" @updated="onUpdated" />
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<style scoped>
.collections-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
}

.collections-splitter {
  flex-grow: 1;
  border: 0.5px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
}

.splitter-panel {
  display: flex;
  flex-direction: column;
}
</style>
