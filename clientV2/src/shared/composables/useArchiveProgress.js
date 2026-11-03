import { saveAs } from 'file-saver-es'
import { computed, reactive } from 'vue'
import { archiveFilename, downloadArchive } from '../api/archiveApi.js'
import { formatBytes } from '../lib.js'
import { useGlobalError } from './useGlobalError.js'

function initialState() {
  return { visible: false, active: false, bytesReceived: 0, totalBytes: null, filename: '', log: [] }
}

const nextFrame = globalThis.requestAnimationFrame ?? (cb => setTimeout(cb, 16))

/**
 * State for the archive download progress dialog (ArchiveProgressDialog.vue)
 * and the single place that runs an archive download against it.
 */
export function useArchiveProgress() {
  const { triggerError } = useGlobalError()
  const progress = reactive(initialState())

  function appendLog(message) {
    progress.log.push(message)
  }

  const fetchedLabel = computed(() => {
    const got = formatBytes(progress.bytesReceived)
    if (progress.totalBytes) {
      const pct = Math.round((progress.bytesReceived / progress.totalBytes) * 100)
      return `Fetched: ${got} of ${formatBytes(progress.totalBytes)} (${pct}%)`
    }
    return `Fetched: ${got}`
  })

  function onStarted({ format, mode, filename }) {
    Object.assign(progress, initialState(), { visible: true, active: true, filename })
    appendLog(`Starting download (${format}${mode ? ` / ${mode}` : ''}).`)
    appendLog('When the stream has finished you will be prompted to save the data to disk. The final size of the archive is unknown during streaming.')
  }

  // Stream chunks arrive far faster than frames; apply the latest once per frame.
  let pending = null
  function onProgress(update) {
    const schedule = pending === null
    pending = update
    if (schedule) {
      nextFrame(() => {
        progress.bytesReceived = pending.bytesReceived ?? 0
        if (pending.totalBytes) {
          progress.totalBytes = pending.totalBytes
        }
        pending = null
      })
    }
  }

  function onComplete({ filename } = {}) {
    progress.active = false
    if (filename) {
      progress.filename = filename
    }
    appendLog('Streaming is complete.')
  }

  function onError(err) {
    progress.active = false
    appendLog(`Error: ${err?.message ?? String(err)}`)
  }

  // Closable while streaming, as in the legacy client; the download continues and still prompts to save.
  function close() {
    if (progress.active) {
      progress.visible = false
      return
    }
    Object.assign(progress, initialState())
  }

  function saveLog() {
    if (progress.log.length === 0) {
      return
    }
    const text = progress.log.join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const base = progress.filename
      ? progress.filename.replace(/\.zip$/i, '')
      : 'archive-download'
    saveAs(blob, `${base}.log.txt`)
  }

  /**
   * Downloads an archive and reports it through this dialog. Service-worker
   * downloads are handed to the browser and show no dialog.
   */
  async function download({ collectionId, collectionName, format, mode, selections }) {
    // One download per dialog; a repeat request reopens the running one.
    if (progress.active) {
      progress.visible = true
      return
    }
    const filename = archiveFilename(collectionName, format)
    try {
      const result = await downloadArchive({
        collectionId,
        format,
        mode,
        selections,
        onStreamStart: () => onStarted({ format, mode, filename }),
        onProgress,
      })
      if (result?.via !== 'service-worker') {
        onComplete({ filename: result?.filename ?? filename })
      }
    }
    catch (err) {
      // Global error modal, as the legacy client's SM.Error.handleError
      triggerError(err)
      onError(err)
    }
  }

  return { progress, fetchedLabel, close, saveLog, download }
}
