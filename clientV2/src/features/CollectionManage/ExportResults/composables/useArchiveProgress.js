import { saveAs } from 'file-saver-es'
import { computed, reactive, ref } from 'vue'
import { formatBytes } from '../../../../shared/lib.js'
import { downloadArchive } from '../api/exportResultsApi.js'
import { archiveFilename } from '../exportResultsLogic.js'

function initialState() {
  return { active: false, bytesReceived: 0, totalBytes: null, filename: '', log: [] }
}

/**
 * State and handlers for the archive download progress dialog
 * (ArchiveProgressDialog.vue). The on* handlers match the archive events
 * emitted by the export modals; `download` drives them directly for callers
 * that bypass the modal.
 */
export function useArchiveProgress() {
  const visible = ref(false)
  const progress = reactive(initialState())

  function reset() {
    Object.assign(progress, initialState())
  }

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
    reset()
    progress.active = true
    progress.filename = filename ?? ''
    visible.value = true
    appendLog(`Starting download (${format}${mode ? ` / ${mode}` : ''}).`)
    appendLog('When the stream has finished you will be prompted to save the data to disk. The final size of the archive is unknown during streaming.')
  }

  function onProgress({ bytesReceived, totalBytes }) {
    progress.bytesReceived = bytesReceived ?? 0
    if (totalBytes) {
      progress.totalBytes = totalBytes
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

  function close() {
    if (progress.active) {
      return
    }
    visible.value = false
    reset()
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
      onError(err)
    }
  }

  return {
    visible,
    progress,
    fetchedLabel,
    onStarted,
    onProgress,
    onComplete,
    onError,
    close,
    saveLog,
    download,
  }
}
