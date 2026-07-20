<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getHttpStatus } from '../../../shared/api/apiClient.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import {
  deleteRevisionByString,
  deleteStigById,
  fetchStigAdmin,
  fetchStigsAdmin,
} from '../api/stigsAdminApi.js'
import ImportStigModal from './ImportStigModal.vue'
import RemoveStigModal from './RemoveStigModal.vue'
import StigList from './StigList.vue'

const router = useRouter()
const { triggerError } = useGlobalError()

// Array — StigList uses multiple selection mode
const selectedStigs = ref([])

const { state: stigs, isLoading, execute: loadStigs } = useAsyncState(
  () => fetchStigsAdmin(),
  { initialState: [] },
)

// Reconcile selection against freshly loaded data
watch(stigs, (list) => {
  if (!list?.length) {
    selectedStigs.value = []
    return
  }
  const currentIds = new Set(selectedStigs.value.map(s => s.benchmarkId))
  selectedStigs.value = list.filter(s => currentIds.has(s.benchmarkId))
}, { immediate: true })

const importModalVisible = ref(false)

const pendingRemove = ref(null)
const removeModalVisible = ref(false)

function stigInUse(stig) {
  return (stig.collectionIds?.length ?? 0) > 0
}

function onRemoveStigRequested(targetStigs) {
  const forceRequired = targetStigs.some(stigInUse)
  const forceMessage = targetStigs.length === 1
    ? `${targetStigs[0].benchmarkId} is assigned to one or more collections. Removing it will unassign it from those collections.`
    : 'One or more selected STIGs are assigned to collections. Removing them will unassign those collections.'

  pendingRemove.value = {
    type: 'stigs',
    stigs: targetStigs,
    targets: targetStigs.map(s => s.benchmarkId),
    forceRequired,
    forceMessage,
  }
  removeModalVisible.value = true
}

// Called by StigList when user picks a specific revision from the dropdown.
function onRemoveRevisionRequested(stig, revisionStr) {
  const revision = stig.revisions?.find(r => r.revisionStr === revisionStr)
  const revisionIsPinned = (revision?.collectionIds?.length ?? 0) > 0
  const lastAssignedRevision = stigInUse(stig) && (stig.revisions?.length ?? 0) === 1
  const forceRequired = revisionIsPinned || lastAssignedRevision

  const forceMessage = lastAssignedRevision
    ? `${stig.benchmarkId} is assigned to one or more collections and this is its last revision. Removing it will unassign those collections.`
    : `${revisionStr} is pinned to one or more collections. Removing it will unpin those collections.`

  pendingRemove.value = {
    type: 'revision',
    stig,
    revisionStr,
    targets: [`${stig.benchmarkId} — ${revisionStr}`],
    forceRequired,
    forceMessage,
  }
  removeModalVisible.value = true
}

function reopenForForce(remainingStigs) {
  const targets = remainingStigs.map(s => s.benchmarkId)
  const forceMessage = remainingStigs.length === 1
    ? `${remainingStigs[0].benchmarkId} is assigned to one or more collections. Removing it will unassign it from those collections.`
    : 'One or more of the selected STIGs are assigned to collections. Removing them will unassign from those collections.'
  pendingRemove.value = {
    type: 'stigs',
    stigs: remainingStigs,
    targets,
    forceRequired: true,
    forceMessage,
  }
  removeModalVisible.value = true
}

async function onRemoveConfirmed() {
  const p = pendingRemove.value
  if (!p) {
    return
  }
  removeModalVisible.value = false

  try {
    if (p.type === 'stigs') {
      for (let i = 0; i < p.stigs.length; i++) {
        const stig = p.stigs[i]
        // Use forceRequired when the modal already confirmed force (covers the 422-reopen case)
        const force = p.forceRequired || stigInUse(stig)
        try {
          await deleteStigById(stig.benchmarkId, force)
        }
        catch (deleteErr) {
          if (getHttpStatus(deleteErr) === 422) {
            // 422 = in use; data didn't tell us — reopen modal with force checkbox for remaining
            reopenForForce(p.stigs.slice(i))
            return
          }
          throw deleteErr
        }
        stigs.value = stigs.value.filter(s => s.benchmarkId !== stig.benchmarkId)
        selectedStigs.value = selectedStigs.value.filter(s => s.benchmarkId !== stig.benchmarkId)
      }
    }
    else {
      const force = p.forceRequired || stigInUse(p.stig)
      try {
        await deleteRevisionByString(p.stig.benchmarkId, p.revisionStr, force)
      }
      catch (deleteErr) {
        if (getHttpStatus(deleteErr) === 422) {
          pendingRemove.value = {
            ...p,
            forceRequired: true,
            forceMessage: 'This revision is assigned to one or more collections. Removing it will unassign it from those collections.',
          }
          removeModalVisible.value = true
          return
        }
        throw deleteErr
      }
      try {
        const updated = await fetchStigAdmin(p.stig.benchmarkId)
        stigs.value = stigs.value.map(s => s.benchmarkId === p.stig.benchmarkId ? updated : s)
        selectedStigs.value = selectedStigs.value.map(s => s.benchmarkId === p.stig.benchmarkId ? updated : s)
      }
      catch (refetchErr) {
        if (getHttpStatus(refetchErr) === 404) {
          stigs.value = stigs.value.filter(s => s.benchmarkId !== p.stig.benchmarkId)
          selectedStigs.value = selectedStigs.value.filter(s => s.benchmarkId !== p.stig.benchmarkId)
        }
        else {
          throw refetchErr
        }
      }
    }
  }
  catch (err) {
    triggerError(err)
  }
  finally {
    // Don't clear pendingRemove if we re-opened the modal (return path above)
    if (!removeModalVisible.value) {
      pendingRemove.value = null
    }
  }
}

function onRemoveCancelled() {
  pendingRemove.value = null
}

// ── Library routing ──────────────────────────────────────────────────────────
function openLibrary() {
  const stig = selectedStigs.value[0]
  if (stig) {
    router.push({ name: 'stig-library-benchmark', params: { benchmarkId: stig.benchmarkId } })
  }
}
</script>

<template>
  <div class="stig-manage-container">
    <StigList
      v-model:selection="selectedStigs"
      :stigs="stigs"
      :loading="isLoading"
      @import="importModalVisible = true"
      @remove-stig="onRemoveStigRequested"
      @remove-revision="onRemoveRevisionRequested"
      @open-library="openLibrary"
      @refresh="loadStigs"
    />

    <ImportStigModal
      v-model:visible="importModalVisible"
      @imported="loadStigs"
    />

    <RemoveStigModal
      v-model:visible="removeModalVisible"
      :targets="pendingRemove?.targets ?? []"
      :force-required="pendingRemove?.forceRequired ?? false"
      :force-message="pendingRemove?.forceMessage ?? ''"
      @confirm="onRemoveConfirmed"
      @cancel="onRemoveCancelled"
    />
  </div>
</template>

<style scoped>
.stig-manage-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
  overflow-x: auto;
}
</style>
