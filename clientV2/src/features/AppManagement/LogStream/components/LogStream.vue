<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import HelpIcon from '../../../../components/common/HelpIcon.vue'
import { TOOLTIPS } from '../../../../shared/lib/tooltips.js'
import { useLogStreamStore } from '../stores/logStreamStore.js'
import LogRecordPanel from './LogRecordPanel.vue'
import LogStreamToolbar from './LogStreamToolbar.vue'
import LogStreamViewer from './LogStreamViewer.vue'
import TransactionGrid from './TransactionGrid.vue'
import '../styles/logStream.css'

// This component is only a view. The connection and captured buffer live in the
// store, so they survive navigation — on mount we re-hydrate from the store and
// subscribe for live records; on unmount we only unsubscribe, never disconnect.
const store = useLogStreamStore()
const { state } = store

const viewer = ref(null)
const wrap = ref(false) // ephemeral view state — fine to reset each mount
let unsubscribe = null

// Cross-link state (ephemeral view state, reset per mount): the record shown in
// the JSON tree and the row highlighted in the transaction grid both follow
// whichever log line is currently selected.
const selectedRecord = ref(null)
const selectedTransaction = ref(null)

// Two-way binding for the durable "preserve log" toggle, proxied to the store.
const preserveLog = computed({
  get: () => state.preserveLog,
  set: value => store.setPreserveLog(value),
})

// Connection-state placeholder, shown only while the buffer is empty.
const emptyMessage = computed(() => {
  switch (state.status) {
    case 'connecting':
    case 'authorizing':
      return 'Connecting…'
    case 'open':
      return 'Socket connected and ready to stream.'
    case 'reconnecting':
      return 'Connection lost. Reconnecting…'
    case 'closed':
      return state.lastError || 'Connection closed.'
    default:
      return 'Connecting…'
  }
})

watch(emptyMessage, (message) => {
  if (state.lineCount === 0) {
    viewer.value?.applyEmpty(message)
  }
})

function onToggleStream(shouldStream) {
  if (shouldStream) {
    // Revive a terminally-closed socket first (no-op when already connected);
    // startStreaming defers stream-start until authorization completes.
    store.ensureConnected()
    store.startStreaming()
  }
  else {
    store.stopStreaming()
  }
}

function onApplyFilter(filter) {
  store.startStreaming(filter)
}

function onToggleRecord(shouldRecord) {
  if (shouldRecord) {
    store.startRecording()
  }
  else {
    store.stopRecording()
  }
}

function onClear() {
  store.clear()
}

// A log line was selected in the viewer: show its JSON and light up the matching
// transaction row (or clear the grid selection when the line isn't a request).
function onLineSelect(data) {
  selectedRecord.value = data
  const requestId = data?.data?.requestId || data?.data?.request?.requestId
  selectedTransaction.value = requestId
    ? state.transactions.find(t => t.requestId === requestId) || null
    : null
}

// A transaction row was clicked: jump the viewer to the request/transaction log
// line (single click) or the response line (double click). Selecting the line
// then drives onLineSelect, keeping the JSON panel and grid in sync.
function onTxRowClick(requestId) {
  viewer.value?.selectByRequestId(requestId, { types: ['request', 'transaction'] })
}

function onTxRowDblClick(requestId) {
  viewer.value?.selectByRequestId(requestId, { types: ['response'] })
}

function resetSelection() {
  selectedRecord.value = null
  selectedTransaction.value = null
}

// Match the app-wide splitter treatment: transparent gutter (the app's black
// background shows through as the gap between cards) that the global
// .p-splitter-gutter:hover rule lightens to grey on hover/drag.
const splitterPt = {
  root: { style: 'background: transparent; border: none; border-radius: 0;' },
  gutter: { style: 'background: transparent;' },
}

onMounted(() => {
  store.ensureConnected()
  // Restore whatever the store captured while we were away.
  viewer.value.hydrate(store.snapshot())
  if (state.lineCount === 0) {
    viewer.value.applyEmpty(emptyMessage.value)
  }
  unsubscribe = store.subscribe({
    onAppend: record => viewer.value?.append(record),
    onClear: () => {
      viewer.value?.clear()
      resetSelection()
    },
  })
})

onBeforeUnmount(() => {
  // Only detach the view — the store keeps streaming in the background.
  unsubscribe?.()
})
</script>

<template>
  <div class="logstream-page">
    <div class="page-header">
      <h2>Log Stream</h2>
      <span class="experimental-badge">Experimental</span>
      <HelpIcon :content="TOOLTIPS.logStream.experimental" />
    </div>

    <div class="logstream-panel">
      <Splitter layout="vertical" class="logstream-splitter" :pt="splitterPt">
        <SplitterPanel :size="62" :min-size="25" class="ls-panel">
          <Splitter class="logstream-splitter" :pt="splitterPt">
            <SplitterPanel :size="70" :min-size="30" class="ls-panel">
              <div class="ls-card logstream-log-pane">
                <LogStreamToolbar
                  v-model:preserve="preserveLog"
                  v-model:wrap="wrap"
                  :is-streaming="state.isStreaming"
                  :can-stream="state.isAuthorized"
                  :is-recording="state.isRecording"
                  :recording-name="state.recordingName"
                  :recording-error="state.recordingError"
                  :active-filter="state.filter"
                  @toggle-stream="onToggleStream"
                  @apply-filter="onApplyFilter"
                  @toggle-record="onToggleRecord"
                  @clear="onClear"
                />
                <LogStreamViewer
                  ref="viewer"
                  :wrap="wrap"
                  :empty-message="emptyMessage"
                  @line-select="onLineSelect"
                />
              </div>
            </SplitterPanel>
            <SplitterPanel :size="30" :min-size="15" class="ls-panel">
              <LogRecordPanel class="ls-card" :record="selectedRecord" />
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>
        <SplitterPanel :size="38" :min-size="15" class="ls-panel">
          <TransactionGrid
            v-model:selection="selectedTransaction"
            class="ls-card"
            :transactions="state.transactions"
            @row-click="onTxRowClick"
            @row-dblclick="onTxRowDblClick"
          />
        </SplitterPanel>
      </Splitter>
    </div>
  </div>
</template>

<style scoped>
.logstream-page {
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.9rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  flex-shrink: 0;
}

.page-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-text-bright);
}

.experimental-badge {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-warning-yellow);
  border: 1px solid color-mix(in srgb, var(--color-warning-yellow) 40%, transparent);
  background: color-mix(in srgb, var(--color-warning-yellow) 10%, transparent);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
}

.logstream-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logstream-splitter {
  height: 100%;
  min-height: 0;
}

.ls-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  padding: 0.25rem;
}

.ls-card {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
}

.logstream-log-pane {
  display: flex;
  flex-direction: column;
}
</style>
