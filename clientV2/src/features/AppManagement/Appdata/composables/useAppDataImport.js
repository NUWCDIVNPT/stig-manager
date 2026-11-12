import { reactive } from 'vue'
import { readNdjson } from '../../../../shared/lib/ndjsonStream.js'
import {
  APPDATA_GZIP_CONTENT_TYPE,
  APPDATA_X_GZIP_CONTENT_TYPE,
  fetchAppDataConfig,
  uploadAppData,
} from '../api/appDataApi.js'
import {
  applyAnalysisLine,
  createInitialAnalysisState,
  finalizeAnalysis,
} from '../lib/appDataAnalysis.js'
import {
  applyUploadEvent,
  createInitialUploadState,
  formatUploadLogLine,
  uploadProgressRatio,
} from '../lib/appDataProgress.js'
import {
  createByteProgressStream,
  createLineSplitStream,
  detectGzipFile,
  iterateStream,
} from '../lib/appDataStream.js'

const GZIP_EXT_RE = /\.gz$/i

function formatAnalysisEvent(event, currentMigration) {
  switch (event.type) {
    case 'metadata': {
      const parts = [`File is from STIG Manager version ${event.version ?? 'unknown'}`]
      if (event.date) {
        parts.push(`dated ${event.date}`)
      }
      if (event.lastMigration != null) {
        parts.push(`source migration v${event.lastMigration} (current API migration v${currentMigration ?? '?'})`)
      }
      return parts.join(', ')
    }
    case 'summary':
      return `Found table summary: ${event.tableCount} table(s), ${event.totalRows} declared row(s).`
    case 'table':
      return `Found data for table: ${event.table}, rowCount: ${event.rowCount}`
    default:
      return null
  }
}

// Import state machine per the implementation guide, section 11:
//   no-file -> analyzing -> invalid
//                        -> ready -> confirming -> uploading -> succeeded
//                                                             -> failed
export function useAppDataImport() {
  const state = reactive({
    phase: 'no-file',
    fileName: '',
    isGzip: false,
    progress: 0,
    log: [],
    analysis: null,
    error: null,
  })

  let currentMigration = null
  let selectedFile = null

  async function ensureMigration() {
    if (currentMigration == null) {
      const config = await fetchAppDataConfig()
      currentMigration = config?.lastMigration ?? null
    }
    return currentMigration
  }

  function appendLog(line) {
    if (line) {
      state.log.push(line)
    }
  }

  function reset() {
    state.phase = 'no-file'
    state.fileName = ''
    state.isGzip = false
    state.progress = 0
    state.log = []
    state.analysis = null
    state.error = null
    selectedFile = null
  }

  // Reads and validates the file entirely client-side — nothing is uploaded
  // during analysis. Selecting a new file always resets prior analysis.
  async function selectFile(file) {
    reset()
    if (!file) {
      return
    }
    selectedFile = file
    state.fileName = file.name
    state.phase = 'analyzing'
    appendLog(`Selected file: ${file.name}`)

    try {
      const magicIsGzip = await detectGzipFile(file)
      const nameSuggestsGzip = GZIP_EXT_RE.test(file.name)
      const mimeSuggestsGzip = file.type === APPDATA_GZIP_CONTENT_TYPE || file.type === APPDATA_X_GZIP_CONTENT_TYPE
      if ((nameSuggestsGzip || mimeSuggestsGzip) && !magicIsGzip) {
        appendLog('Warning: the file name/type suggests GZip, but the GZip signature was not found. Reading it as plain JSONL.')
      }
      state.isGzip = magicIsGzip

      const migration = await ensureMigration()

      // Whole-percent granularity — a per-chunk write for every byte chunk of
      // a large file schedules thousands of re-renders for a bar with only
      // ~100 distinguishable states.
      let lastPct = -1
      let byteStream = file.stream()
        .pipeThrough(createByteProgressStream(file.size, (ratio) => {
          const pct = Math.round(ratio * 100)
          if (pct !== lastPct) {
            lastPct = pct
            state.progress = ratio
          }
        }))
      if (magicIsGzip) {
        byteStream = byteStream.pipeThrough(new DecompressionStream('gzip'))
      }
      const lineStream = byteStream
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(createLineSplitStream())

      const analysisState = createInitialAnalysisState()
      let paintedProgress = -1
      for await (const lines of iterateStream(lineStream)) {
        for (const rawLine of lines) {
          const event = applyAnalysisLine(analysisState, rawLine)
          if (event) {
            appendLog(formatAnalysisEvent(event, migration))
          }
        }
        // The loop churns through microtasks without reaching the browser's
        // paint phase, so the bar stays frozen until the end; yield a
        // macrotask whenever the displayed percentage advances.
        if (state.progress !== paintedProgress) {
          paintedProgress = state.progress
          await new Promise(resolve => setTimeout(resolve))
        }
      }

      const result = finalizeAnalysis(analysisState, migration)
      state.analysis = result
      state.progress = 1

      if (result.isValid) {
        state.phase = 'ready'
        appendLog('VALID source file — click "Replace Application Data" to continue.')
      }
      else {
        state.phase = 'invalid'
        for (const reason of result.reasons) {
          appendLog(`Invalid: ${reason}`)
        }
      }
    }
    catch (err) {
      state.phase = 'invalid'
      state.error = err?.message || String(err)
      appendLog(`Error analyzing file: ${state.error}`)
    }
  }

  // The legacy UI enables the destructive action immediately after analysis.
  // This adds the explicit confirmation step the doc recommends (section
  // 8.3) before anything is sent to the server.
  function requestConfirm() {
    if (state.phase === 'ready') {
      state.phase = 'confirming'
    }
  }

  function cancelConfirm() {
    if (state.phase === 'confirming') {
      state.phase = 'ready'
    }
  }

  async function confirmReplace() {
    if (state.phase !== 'confirming' || !selectedFile) {
      return
    }
    state.phase = 'uploading'
    state.progress = 0
    state.error = null
    appendLog('Sending file. Awaiting API response…')

    const uploadState = createInitialUploadState()
    try {
      const response = await uploadAppData({ file: selectedFile, isGzip: state.isGzip })

      for await (const event of readNdjson(response)) {
        applyUploadEvent(uploadState, event)
        appendLog(formatUploadLogLine(event))
        state.progress = uploadProgressRatio(uploadState)
      }

      if (uploadState.isSuccess) {
        state.phase = 'succeeded'
        state.progress = 1
        appendLog('Done. Reload the application to use the replaced data.')
      }
      else if (uploadState.isDone) {
        state.phase = 'failed'
        state.error = uploadState.error
      }
      else {
        // Stream ended without either terminal record — an indeterminate
        // outcome, not a success. The destination may be partially modified.
        state.phase = 'failed'
        state.error = 'The import stream ended without a success confirmation. The database may be partially modified — verify it (from a backup, if needed) before retrying.'
        appendLog(state.error)
      }
    }
    catch (err) {
      state.phase = 'failed'
      state.error = err?.message || String(err)
      appendLog(`Error: ${state.error}`)
    }
  }

  return {
    state,
    selectFile,
    requestConfirm,
    cancelConfirm,
    confirmReplace,
    reset,
  }
}
