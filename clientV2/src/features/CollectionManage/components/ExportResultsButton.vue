<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, reactive, ref } from 'vue'
import { primaryBtnPt } from '../../ImportWizard/lib/importDialogPt.js'
import ExportResultsModal from './ExportResultsModal.vue'

const props = defineProps({
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  selectedAssets: { type: Array, default: () => [] },
})

const eligibleAssets = computed(() =>
  props.selectedAssets.filter(a => (a.stigCnt ?? 0) > 0),
)

const disabled = computed(() => eligibleAssets.value.length === 0)

const modalVisible = ref(false)

// Progress sub-window state for collection export
const progressVisible = ref(false)
const progress = reactive({
  active: false,
  stages: [],
  result: null,
  error: null,
  dstCollectionId: null,
})

function resetProgress() {
  progress.active = false
  progress.stages = []
  progress.result = null
  progress.error = null
  progress.dstCollectionId = null
}

function openModal() {
  if (disabled.value) {
    return
  }
  modalVisible.value = true
}

function onExportStarted(detail) {
  if (detail.type === 'collection') {
    resetProgress()
    progress.active = true
    progress.dstCollectionId = detail.dstCollectionId
    progressVisible.value = true
  }
}

function onCollectionProgress(event) {
  // Each NDJSON line is a stage event. Capture stages in order.
  if (event && typeof event === 'object') {
    progress.stages.push(event)
    // server may emit a terminal "result" stage
    if (event.stage === 'result' || event.result) {
      progress.result = event
    }
  }
}

function onCollectionComplete() {
  progress.active = false
  if (!progress.result) {
    progress.result = { stage: 'complete' }
  }
}

function onCollectionError(err) {
  progress.active = false
  progress.error = err?.body ?? err?.message ?? String(err)
}

function closeProgress() {
  if (progress.active) {
    return
  }
  progressVisible.value = false
  resetProgress()
}

function stageLabel(s) {
  if (!s) {
    return ''
  }
  if (s.stage) {
    return s.stage
  }
  if (s.status) {
    return s.status
  }
  return JSON.stringify(s)
}
</script>

<template>
  <button
    type="button"
    class="action-btn"
    :disabled="disabled"
    title="Export selected assets and their results"
    @click="openModal"
  >
    <i class="pi pi-download icon-blue" /> Export results...
  </button>

  <ExportResultsModal
    v-model:visible="modalVisible"
    :collection-id="collectionId"
    :collection-name="collectionName"
    :selected-assets="selectedAssets"
    @export-started="onExportStarted"
    @collection-export-progress="onCollectionProgress"
    @collection-export-complete="onCollectionComplete"
    @collection-export-error="onCollectionError"
  />

  <Dialog
    v-model:visible="progressVisible"
    modal
    :draggable="false"
    :closable="!progress.active"
    :close-on-escape="!progress.active"
    :style="{ width: 'min(500px, 92vw)' }"
    header="Exporting to collection"
  >
    <div class="progress-body">
      <div v-if="progress.active" class="progress-active">
        <i class="pi pi-spin pi-spinner spinner-icon" />
        <div class="progress-text">
          Streaming export...
        </div>
      </div>
      <div v-else-if="progress.error" class="progress-error">
        <i class="pi pi-times-circle error-icon" />
        <div>
          <div class="progress-text">
            Export failed
          </div>
          <pre class="error-detail">{{ progress.error }}</pre>
        </div>
      </div>
      <div v-else class="progress-done">
        <i class="pi pi-check-circle done-icon" />
        <div class="progress-text">
          Export complete
        </div>
      </div>

      <ul v-if="progress.stages.length > 0" class="stage-list">
        <li v-for="(s, i) in progress.stages" :key="i" class="stage-item">
          <span class="stage-name">{{ stageLabel(s) }}</span>
          <span v-if="s.count != null" class="stage-meta">{{ s.count }}</span>
        </li>
      </ul>
    </div>
    <template #footer>
      <Button
        label="Close"
        :pt="primaryBtnPt"
        :disabled="progress.active"
        @click="closeProgress"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-background-subtle);
  color: var(--color-text-bright);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.action-btn i.icon-blue {
  color: #60a5fa;
}

.progress-body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.25rem 0;
}

.progress-active,
.progress-error,
.progress-done {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.spinner-icon {
  font-size: 1.6rem;
  color: var(--color-action-blue-dark);
}

.error-icon {
  font-size: 1.6rem;
  color: var(--color-text-error);
}

.done-icon {
  font-size: 1.6rem;
  color: var(--color-success);
}

.progress-text {
  font-size: 0.95rem;
  font-weight: 600;
}

.error-detail {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--color-text-dim);
  background: var(--color-background-light);
  padding: 0.5rem;
  border-radius: 4px;
  margin: 0.3rem 0 0 0;
  max-height: 160px;
  overflow: auto;
}

.stage-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  max-height: 220px;
  overflow: auto;
  background: var(--color-background-light);
}

.stage-item {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0.6rem;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 0.82rem;
}

.stage-item:last-child {
  border-bottom: none;
}

.stage-name {
  color: var(--color-text-primary);
}

.stage-meta {
  color: var(--color-text-dim);
}
</style>
