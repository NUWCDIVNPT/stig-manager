<script setup>
import { computed, ref, watch } from 'vue'

import DeleteModal from '../../../components/common/DeleteModal.vue'
import { fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { deleteCollectionLabel } from '../api/labelManageApi.js'
import LabelFormModal from './Label/LabelFormModal.vue'
import LabelsTable from './Label/LabelsTable.vue'
import LabelsToolbar from './Label/LabelsToolbar.vue'
import TagAssetsModal from './Label/TagAssetsModal.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const { triggerError } = useGlobalError()

const { state: labels, isLoading, execute: loadLabels } = useAsyncState(
  () => fetchCollectionLabels(props.collectionId),
  { initialState: [], immediate: false },
)

watch(() => props.collectionId, loadLabels, { immediate: true })

function sortByName(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
}

const selectedLabels = ref([])

function clearSelection() {
  selectedLabels.value = []
}

// ── Create / Edit ─────────────────────────────────────────────────────────────

const formModalVisible = ref(false)
const editingLabel = ref(null)

function openCreateModal() {
  editingLabel.value = null
  formModalVisible.value = true
}

function openEditModal(label) {
  editingLabel.value = label
  formModalVisible.value = true
}

function applyLabelCreated(label) {
  labels.value = sortByName([...(labels.value ?? []), label])
}

function applyLabelChanged(label) {
  labels.value = sortByName(
    (labels.value ?? []).map(l => (l.labelId === label.labelId ? label : l)),
  )
  selectedLabels.value = selectedLabels.value.map(l => (l.labelId === label.labelId ? label : l))
}

// ── Delete ────────────────────────────────────────────────────────────────────

const deleteModalVisible = ref(false)

const deleteMessage = computed(() => {
  return selectedLabels.value.length === 1
    ? `You are about to delete Label "${selectedLabels.value[0]?.name}". Do you wish to continue?`
    : `You are about to delete ${selectedLabels.value.length} Labels. Do you wish to continue?`
})

function onDeleteLabels() {
  deleteModalVisible.value = true
}

async function onDeleteConfirmed() {
  const toDelete = [...selectedLabels.value]
  try {
    await Promise.all(toDelete.map(label => deleteCollectionLabel(props.collectionId, label.labelId)))
    const deletedIds = new Set(toDelete.map(l => l.labelId))
    labels.value = (labels.value ?? []).filter(l => !deletedIds.has(l.labelId))
    selectedLabels.value = []
  }
  catch (err) {
    triggerError(err)
    await loadLabels()
  }
}

// ── Tag Assets ────────────────────────────────────────────────────────────────

const tagAssetsModalVisible = ref(false)
const tagAssetsLabel = ref(null)

function openTagAssetsModal() {
  if (selectedLabels.value.length !== 1) {
    return
  }
  tagAssetsLabel.value = selectedLabels.value[0]
  tagAssetsModalVisible.value = true
}

function onTaggingChanged() {
  loadLabels()
}

function handleFooterAction(action) {
  if (action === 'refresh') {
    loadLabels()
  }
}
</script>

<template>
  <div class="manage-labels">
    <header class="page-header">
      <h2 class="page-title">
        Labels
      </h2>
      <p class="page-desc">
        Create, edit, and delete collection labels, and tag assets with them.
      </p>
    </header>

    <LabelsToolbar
      :has-selection="selectedLabels.length > 0"
      :single-selection="selectedLabels.length === 1"
      @create-label="openCreateModal"
      @edit-label="openEditModal(selectedLabels[0])"
      @tag-assets="openTagAssetsModal"
      @delete-labels="onDeleteLabels"
      @clear-selection="clearSelection"
    />

    <LabelFormModal
      v-model:visible="formModalVisible"
      :collection-id="props.collectionId"
      :label="editingLabel"
      :labels="labels ?? []"
      @label-created="applyLabelCreated"
      @label-changed="applyLabelChanged"
    />

    <DeleteModal
      v-model:visible="deleteModalVisible"
      title="Delete Labels"
      :message="deleteMessage"
      @confirm="onDeleteConfirmed"
    />

    <TagAssetsModal
      v-model:visible="tagAssetsModalVisible"
      :collection-id="props.collectionId"
      :label="tagAssetsLabel"
      @tagging-changed="onTaggingChanged"
    />

    <LabelsTable
      :labels="labels ?? []"
      :is-loading="isLoading"
      :selected-labels="selectedLabels"
      @update:selected-labels="selectedLabels = $event"
      @edit-label="openEditModal"
      @footer-action="handleFooterAction"
    />
  </div>
</template>

<style scoped>
.manage-labels {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 760px;
  padding: 1.5rem 3rem 3rem 3rem;
}

.page-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-default);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-default);
  margin-bottom: 0.25rem;
}

.page-desc {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}
</style>
