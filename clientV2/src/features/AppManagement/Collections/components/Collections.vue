<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { inject, onMounted, ref } from 'vue'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import CollectionDetails from './CollectionDetails.vue'
import CollectionList from './CollectionList.vue'

const collections = ref([])
const selectedCollection = ref(null)
const loading = ref(false)
const worker = inject('worker')

const fetchData = async (background = false) => {
  if (!background) {
    loading.value = true
  }
  try {
    const response = await fetch('http://localhost:64001/api/collections?elevate=true&projection=owners&projection=statistics', {
      headers: { Authorization: `Bearer ${worker.token}` },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    collections.value = data

    if (selectedCollection.value) {
      const updatedSelection = data.find(c => c.collectionId === selectedCollection.value.collectionId)
      if (updatedSelection) {
        selectedCollection.value = updatedSelection
      }
    }
  }
  catch (error) {
    const { triggerError } = useGlobalError()
    triggerError(error)
  }
  finally {
    if (!background) {
      loading.value = false
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="collections-container">
    <Splitter class="collections-splitter">
      <SplitterPanel :min-size="20" :size="80" class="splitter-panel">
        <CollectionList
          v-model:selection="selectedCollection"
          :collections="collections"
          :loading="loading"
        />
      </SplitterPanel>
      <SplitterPanel :min-size="5" :size="20" class="splitter-panel">
        <CollectionDetails :collection="selectedCollection" @updated="() => fetchData(true)" />
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
  border: 0.5px solid var(--common-border);
  border-radius: 6px;
  overflow: hidden;
}

.splitter-panel {
  display: flex;
  flex-direction: column;
}
</style>
