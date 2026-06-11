<script setup>
import { ref, watch } from 'vue'
import MetadataEditor from '../../../components/common/MetadataEditor.vue'
import SaveStatusBadge from '../../../components/common/SaveStatusBadge.vue'
import { fetchCollection, putCollectionMetadata } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const { triggerError } = useGlobalError()

const metadataRows = ref([])
const saveStatus = ref('idle')

const { state: collection, isLoading, execute: fetchCollectionAction } = useAsyncState(
  id => fetchCollection(id),
  { immediate: false },
)

function metadataObjectToRows(metadata = {}) {
  return Object.entries(metadata)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

function metadataRowsToObject(rows) {
  return Object.fromEntries(rows.map(row => [row.key, row.value]))
}

const loadCollection = async () => {
  if (!props.collectionId) {
    return
  }
  const data = await fetchCollectionAction(props.collectionId)
  if (data) {
    metadataRows.value = metadataObjectToRows(data.metadata || {})
    saveStatus.value = 'saved'
  }
}

watch(() => props.collectionId, loadCollection, { immediate: true })

const performSave = async () => {
  if (!collection.value) {
    return
  }

  // Validate
  const rows = metadataRows.value
  const keys = new Set()
  let hasError = false

  for (const row of rows) {
    const k = row.key?.trim() || ''
    if (k === '') {
      if (row.value?.trim()) {
        triggerError('Blank metadata keys are not allowed.')
        hasError = true
        break
      }
      continue // Skip completely blank row
    }
    if (keys.has(k)) {
      triggerError(`Duplicate metadata key not allowed: "${k}"`)
      hasError = true
      break
    }
    keys.add(k)
  }

  if (hasError) {
    saveStatus.value = 'error'
    return
  }

  // Build valid rows
  const validRows = rows.filter(r => r.key?.trim())
  const payload = metadataRowsToObject(validRows)

  try {
    const returnedMetadata = await putCollectionMetadata(props.collectionId, payload)

    collection.value.metadata = returnedMetadata
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

function hasChanges() {
  if (!collection.value) {
    return false
  }
  const validRows = metadataRows.value.filter(r => r.key?.trim())
  const currentPayload = metadataRowsToObject(validRows)
  const lastSaved = collection.value.metadata || {}

  const currentKeys = Object.keys(currentPayload)
  const lastSavedKeys = Object.keys(lastSaved)
  if (currentKeys.length !== lastSavedKeys.length) {
    return true
  }

  for (const key of currentKeys) {
    if (currentPayload[key] !== lastSaved[key]) {
      return true
    }
  }
  return false
}

const saveMetadata = async () => {
  // Check if there are any invalid rows (value but no key)
  const hasInvalidRows = metadataRows.value.some(r => !r.key?.trim() && r.value?.trim())
  if (hasInvalidRows) {
    saveStatus.value = 'error'
    return
  }

  if (!hasChanges()) {
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
          Custom Attributes
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
@import "./collection-manage.css";

.manage-metadata {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.editor-wrapper {
  margin-top: 0.5rem;
}
</style>
