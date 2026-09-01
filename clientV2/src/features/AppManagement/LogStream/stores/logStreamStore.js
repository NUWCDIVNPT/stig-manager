import { computed, effectScope, reactive, watch } from 'vue'
import { useStateWorker } from '../../../../auth/useStateWorker.js'
import { useStreamSocket } from '../../../../shared/composables/useStreamSocket.js'
import { createLogBuffer, toLogRecord } from '../lib/logBuffer.js'
import { applyResponse, requestRow, transactionRow } from '../lib/transactions.js'

// Module-singleton store for the Log Stream. Because the connection and the
// captured buffer live here — at module scope, not inside a component — they
// survive route changes: the socket keeps streaming and lines keep buffering
// while the user is elsewhere in the app. The route
// component (LogStream.vue) is just a view that hydrates from this on mount and
// unsubscribes on unmount, never disconnecting. Modeled on importProgressStore.
//
// Split of concerns: durable state (connection, buffer, streaming/filter/
// recording) lives here; ephemeral view state (scroll, wrap, popover) stays in
// the component.

const SOCKET_PATH = 'socket/log-socket'
const MAX_TRANSACTIONS = 1000
// Bounds requestMap so requests that never get a paired response can't leak.
const MAX_PENDING_REQUESTS = 1000

// Exported factory so tests can build an isolated store with a fake socket. The
// app uses the single shared instance created below.
export function createLogStreamStore({ createSocket = useStreamSocket, useApiState = useStateWorker, maxLines } = {}) {
  const buffer = createLogBuffer(maxLines)

  const state = reactive({
    status: 'idle', // idle | connecting | authorizing | open | reconnecting | closed
    isAuthorized: false,
    isStreaming: false,
    preserveLog: true,
    filter: null,
    lineCount: 0,
    isRecording: false,
    recordingName: '',
    recordingError: '',
    lastError: null,
    // Rows for the "API Transactions" grid, capped like the legacy client.
    transactions: [],
  })

  // Live-append subscribers (the mounted viewer). Deliberately plain callbacks,
  // not reactive state — the viewer renders each record imperatively.
  const appendListeners = new Set()
  const clearListeners = new Set()
  let recordingWritable = null
  // Pending `request` frames awaiting their `response`, keyed by requestId.
  const requestMap = new Map()

  function ingest(message) {
    if (message.type !== 'log') {
      return
    }
    const logObj = message.data
    const text = JSON.stringify(logObj)
    const record = { ...toLogRecord(logObj, text), obj: logObj }
    buffer.push(record)
    state.lineCount = buffer.size
    if (recordingWritable) {
      recordingWritable.write(`${text}\n`).catch((err) => {
        console.warn('[log-stream] recording write failed:', err)
        state.recordingError = 'Recording stopped: could not write to the file.'
        stopRecording()
      })
    }
    // Fan the log line out to the live view first: it is already buffered, and
    // the grid below is best-effort — a frame it can't parse must never hide the
    // log line (this is the order the legacy client relied on).
    for (const fn of appendListeners) {
      fn(record)
    }
    try {
      ingestTransaction(logObj)
    }
    catch {
      // Ignore a malformed rest frame the transaction grid can't build a row from.
    }
  }

  // Feeds REST frames into the transaction grid: a `transaction` frame is a
  // finished row; separate `request`/`response` frames are paired by requestId.
  function ingestTransaction(logObj) {
    if (logObj.component !== 'rest') {
      return
    }
    if (logObj.type === 'transaction') {
      pushTransaction(transactionRow(logObj))
    }
    else if (logObj.type === 'request') {
      requestMap.set(logObj.data.requestId, requestRow(logObj))
      // Evict the oldest unpaired request (Map keeps insertion order) so orphaned
      // requests whose response never arrives can't grow the map without bound.
      if (requestMap.size > MAX_PENDING_REQUESTS) {
        requestMap.delete(requestMap.keys().next().value)
      }
    }
    else if (logObj.type === 'response') {
      const pending = requestMap.get(logObj.data.requestId)
      if (pending) {
        pushTransaction(applyResponse(pending, logObj))
        requestMap.delete(logObj.data.requestId)
      }
    }
  }

  function pushTransaction(row) {
    state.transactions.push(row)
    if (state.transactions.length > MAX_TRANSACTIONS) {
      state.transactions.splice(0, state.transactions.length - MAX_TRANSACTIONS)
    }
  }

  const socket = createSocket({
    path: SOCKET_PATH,
    onMessage: ingest,
    onStatusChange: (status) => { state.status = status },
  })

  // Watches created at module scope are detached — they live for the app's
  // lifetime rather than being torn down with any component.
  watch(socket.isAuthorized, (authorized) => {
    state.isAuthorized = authorized
    // Resume streaming after (re)authorization — covers the initial connect
    // race and recovery after a reconnect.
    if (authorized && state.isStreaming) {
      sendStart()
    }
  })
  watch(socket.lastError, (err) => {
    state.lastError = err
  })

  // Reconnect when the API comes back. The state worker already announces
  // recovery (it is what lifts the GlobalServiceOverlay mask), so a socket that
  // exhausted its retries while the API was down is revived by that signal
  // rather than by polling; the isAuthorized watch above then re-sends
  // stream-start if streaming was on. The condition mirrors the overlay's
  // (candidate for a shared useApiAvailability composable if a third consumer
  // appears).
  const { state: apiState, error: apiError } = useApiState()
  const apiDown = computed(() =>
    !!apiError.value
    || !(apiState.value?.dependencies?.db ?? true)
    || !(apiState.value?.dependencies?.oidc ?? true))
  watch(apiDown, (down) => {
    if (!down && state.status === 'closed') {
      ensureConnected()
    }
  })

  function sendStart() {
    const extra = state.filter ? { filter: state.filter } : {}
    socket.sendCommand('stream-start', extra)
  }

  // Idempotent: opens the socket if it isn't already connected. Safe to call on
  // every mount — a stream already running in the background is left untouched.
  function ensureConnected() {
    socket.connect()
  }

  function startStreaming(nextFilter = state.filter) {
    state.filter = nextFilter ?? null
    if (!state.preserveLog) {
      clear()
    }
    state.isStreaming = true
    // Consult the socket's authoritative flag, not the reactive mirror (which
    // lags a tick); if not yet authorized, the isAuthorized watch resumes.
    if (socket.isAuthorized.value) {
      sendStart()
    }
  }

  function stopStreaming() {
    state.isStreaming = false
    if (socket.isAuthorized.value) {
      socket.sendCommand('stream-stop')
    }
  }

  function clear() {
    buffer.clear()
    state.lineCount = 0
    state.transactions.splice(0)
    requestMap.clear()
    for (const fn of clearListeners) {
      fn()
    }
  }

  // Full teardown — stops the background stream and closes the socket.
  function disconnect() {
    state.isStreaming = false
    stopRecording()
    socket.disconnect()
  }

  async function startRecording() {
    state.recordingError = ''
    try {
      const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-')
      const handle = await window.showSaveFilePicker({
        suggestedName: `log-${stamp}.jsonl`,
        types: [{ description: 'JSONL Files', accept: { 'application/jsonl': ['.jsonl'] } }],
      })
      recordingWritable = await handle.createWritable()
      state.recordingName = handle.name
      state.isRecording = true
    }
    catch (err) {
      state.isRecording = false
      // AbortError is the user dismissing the picker — not a failure to report.
      if (err?.name !== 'AbortError') {
        console.warn('[log-stream] could not start recording:', err)
        state.recordingError = `Could not start recording: ${err?.message || 'unknown error'}`
      }
    }
  }

  function stopRecording() {
    if (recordingWritable) {
      recordingWritable.close().catch(() => {})
      recordingWritable = null
    }
    state.recordingName = ''
    state.isRecording = false
  }

  function setPreserveLog(value) {
    state.preserveLog = value
  }

  // Viewer subscribes on mount to receive live records and clear events, and
  // seeds itself from snapshot(). Returns an unsubscribe.
  function subscribe({ onAppend, onClear }) {
    if (onAppend) {
      appendListeners.add(onAppend)
    }
    if (onClear) {
      clearListeners.add(onClear)
    }
    return () => {
      if (onAppend) {
        appendListeners.delete(onAppend)
      }
      if (onClear) {
        clearListeners.delete(onClear)
      }
    }
  }

  function snapshot() {
    return buffer.snapshot()
  }

  return {
    state,
    ensureConnected,
    startStreaming,
    stopStreaming,
    clear,
    disconnect,
    startRecording,
    stopRecording,
    setPreserveLog,
    subscribe,
    snapshot,
  }
}

let store = null

export function useLogStreamStore() {
  if (!store) {
    // Create lazily (so nothing touches the socket/globals at import time) and
    // inside a DETACHED effect scope, so the store's watches belong to the app
    // rather than to whichever component first triggered creation — otherwise
    // they'd be disposed when that first view unmounts, breaking background
    // stream resume.
    effectScope(true).run(() => {
      store = createLogStreamStore()
    })
  }
  return store
}
