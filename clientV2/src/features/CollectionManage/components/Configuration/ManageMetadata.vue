<script setup>
import { ref, watch } from 'vue'
import MetadataEditor from '../../../../components/common/MetadataEditor.vue'
import SaveStatusBadge from '../../../../components/common/SaveStatusBadge.vue'
import { putCollectionMetadata } from '../../../../shared/api/collectionsApi.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { useCollectionResource } from '../../composables/useCollectionResource.js'
import {
  hasInvalidMetadataRows,
  metadataHasChanges,
  metadataObjectToRows,
  metadataRowsToObject,
  validateMetadataRows,
} from './metadataLogic.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const { triggerError } = useGlobalError()

const metadataRows = ref([])
const saveStatus = ref('idle')

const { collection, isLoading, setCollection } = useCollectionResource()

// Seed the editor rows from the shared collection whenever it (re)loads.
watch(collection, (data) => {
  if (data) {
    metadataRows.value = metadataObjectToRows(data.metadata || {})
    saveStatus.value = 'saved'
  }
}, { immediate: true })

const performSave = async () => {
  if (!collection.value) {
    return
  }

  const validationError = validateMetadataRows(metadataRows.value)
  if (validationError) {
    triggerError(validationError)
    saveStatus.value = 'error'
    return
  }

  const validRows = metadataRows.value.filter(row => row.key?.trim())
  const payload = metadataRowsToObject(validRows)

  try {
    const returnedMetadata = await putCollectionMetadata(props.collectionId, payload)

    setCollection({ ...collection.value, metadata: returnedMetadata })
    saveStatus.value = 'saved'
  }
  catch (err) {
    saveStatus.value = 'error'
    triggerError(err)
    if (collection.value?.metadata) {
      metadataRows.value = metadataObjectToRows(collection.value.metadata)
    }
  }
}

const saveMetadata = async () => {
  // A row with a value but no key can't be saved.
  if (hasInvalidMetadataRows(metadataRows.value)) {
    saveStatus.value = 'error'
    return
  }

  if (!collection.value || !metadataHasChanges(metadataRows.value, collection.value.metadata || {})) {
    return
  }
  saveStatus.value = 'saving'
  await performSave()
}
</script>

<template>
  <div class="manage-metadata">
    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner" /> Loading metadata...
    </div>
    <div v-else class="metadata-content">
      <div class="panel-status-row">
        <SaveStatusBadge :status="saveStatus" />
      </div>
      <div class="settings-group">
        <h3 class="group-title">
          Metadata
        </h3>
        <p class="group-desc">
          Add custom key-value tracking pairs for this collection.
        </p>
        <div class="editor-wrapper">
          <MetadataEditor v-model="metadataRows" @save="saveMetadata" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../collection-manage.css";

.editor-wrapper {
  margin-top: 0.5rem;
}
</style>
