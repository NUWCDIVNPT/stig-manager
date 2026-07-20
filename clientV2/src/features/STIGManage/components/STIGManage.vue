<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchStigsAdmin } from '../api/stigsAdminApi.js'
import { useStigRemoval } from '../composables/useStigRemoval.js'
import ImportStigModal from './ImportStigModal.vue'
import RemoveStigModal from './RemoveStigModal.vue'
import StigList from './StigList.vue'

const router = useRouter()

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

const {
  pendingRemove,
  removeModalVisible,
  requestRemoveStigs,
  requestRemoveRevision,
  confirmRemove,
  cancelRemove,
} = useStigRemoval(stigs, selectedStigs)

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
      @remove-stig="requestRemoveStigs"
      @remove-revision="requestRemoveRevision"
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
      @confirm="confirmRemove"
      @cancel="cancelRemove"
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
