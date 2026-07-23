import JSZip from 'jszip'
import { reactive } from 'vue'
import { useNotifications } from '../../../shared/composables/useNotifications.js'
import { importStigFile } from '../api/stigsAdminApi.js'
import StigImportProgressNotification from '../components/StigImportProgressNotification.vue'

// Module-level so a running import (and its log) survives the modal — and the
// whole STIGManage page — unmounting while the user navigates elsewhere.
const state = reactive({
  running: false,
  isDone: false,
  cancelled: false,
  // Each entry: { id, filename, status: 'running'|'success'|'preserved'|'error', message, detail }
  logEntries: [],
  completedCount: 0,
  totalCount: 0,
  progressText: '',
  // Set true when the notification's "View Results" is clicked; the modal
  // consumes it to reopen with the finished log intact.
  reopenRequested: false,
})

let entryId = 0
let abortController = null
let _clobber = false
let _notifId = null

export function useStigImportStore() {
  const notifs = useNotifications()

  function addEntry(filename) {
    const entry = { id: entryId++, filename, status: 'running', message: '', detail: '' }
    state.logEntries.push(entry)
    state.progressText = filename
    return entry
  }

  function updateEntry(entry, status, message, detail = '') {
    entry.status = status
    entry.message = message
    entry.detail = detail
  }

  async function uploadXml(blob, filename, logLabel = filename) {
    const entry = addEntry(logLabel)
    try {
      const result = await importStigFile(blob, filename, _clobber, abortController?.signal)
      const action = result?.action ?? 'unknown'
      const rev = result?.revisionStr ?? ''
      updateEntry(entry, action === 'preserved' ? 'preserved' : 'success', rev ? `${action} (${rev})` : action)
    }
    catch (err) {
      if (err?.name === 'AbortError') {
        updateEntry(entry, 'error', 'Cancelled')
        return
      }
      const body = err?.body
      let message, detail
      if (body && typeof body === 'object') {
        message = body.error ?? body.message ?? err?.message ?? 'Upload failed'
        detail = body.detail ?? ''
      }
      else if (typeof body === 'string' && body) {
        message = body
        detail = ''
      }
      else {
        message = err?.message ?? 'Upload failed'
        detail = ''
      }
      updateEntry(entry, 'error', message, detail)
    }
  }

  async function processZip(data, contextName) {
    let zip
    try {
      zip = await JSZip.loadAsync(data)
    }
    catch {
      const entry = addEntry(contextName)
      updateEntry(entry, 'error', 'Could not open ZIP archive')
      return
    }

    for (const [name, zipEntry] of Object.entries(zip.files)) {
      if (state.cancelled) {
        return
      }
      if (zipEntry.dir) {
        continue
      }
      const ext = name.split('.').pop().toLowerCase()
      const displayName = contextName ? `${contextName} → ${name}` : name

      try {
        if (ext === 'xml') {
          const blob = await zipEntry.async('blob')
          await uploadXml(blob, name, displayName)
        }
        else if (ext === 'zip') {
          const nested = await zipEntry.async('arraybuffer')
          await processZip(nested, displayName)
        }
      }
      catch {
        // a corrupt entry must not abort the rest of the archive
        const entry = addEntry(displayName)
        updateEntry(entry, 'error', 'Could not extract file from ZIP archive')
      }
    }
  }

  async function start(files, clobber) {
    dismiss()
    state.running = true
    state.isDone = false
    state.cancelled = false
    state.logEntries = []
    state.completedCount = 0
    state.totalCount = files.length
    state.progressText = ''
    _clobber = clobber
    abortController = new AbortController()

    try {
      for (const file of files) {
        if (state.cancelled) {
          break
        }
        const ext = file.name.split('.').pop().toLowerCase()
        if (ext === 'xml') {
          await uploadXml(file, file.name)
        }
        else {
          await processZip(file, file.name)
        }
        if (!state.cancelled) {
          state.completedCount++
        }
      }
    }
    finally {
      state.running = false
      state.isDone = true
      state.progressText = state.cancelled ? 'Cancelled' : 'Finished'
    }
  }

  function cancel() {
    if (!state.running) {
      return
    }
    state.cancelled = true
    abortController?.abort()
  }

  function reset() {
    dismiss()
    state.running = false
    state.isDone = false
    state.cancelled = false
    state.logEntries = []
    state.completedCount = 0
    state.totalCount = 0
    state.progressText = ''
    state.reopenRequested = false
  }

  function startBackground() {
    dismiss()
    _notifId = notifs.push(StigImportProgressNotification, { state })
  }

  function dismiss() {
    if (_notifId !== null) {
      notifs.remove(_notifId)
      _notifId = null
    }
  }

  function isActive() {
    return _notifId !== null
  }

  function requestReopen() {
    state.reopenRequested = true
    dismiss()
  }

  function consumeReopenRequest() {
    if (!state.reopenRequested) {
      return false
    }
    state.reopenRequested = false
    return true
  }

  return { state, start, cancel, reset, startBackground, dismiss, isActive, requestReopen, consumeReopenRequest }
}
