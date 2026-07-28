import JSZip from 'jszip'
import { computed, reactive } from 'vue'
import { useNotifications } from '../../../../shared/composables/useNotifications.js'
import { importStigFile } from '../api/stigsAdminApi.js'
import StigImportProgressNotification from '../components/StigImportProgressNotification.vue'

// Module-level so a running import (and its rows) survives the modal — and the
// whole STIGManage page — unmounting while the user navigates elsewhere.
const state = reactive({
  running: false,
  isDone: false,
  cancelled: false,
  paused: false,
  // Each row: { id, filename, source, size, kind: 'xml'|'zip',
  //   status: 'pending'|'running'|'success'|'error',
  //   action: 'inserted'|'replaced'|'preserved'|null, message, detail }
  rows: [],
  currentLabel: '',
  // Set true when the notification's "View Results" is clicked; the modal
  // consumes it to reopen with the finished table intact.
  reopenRequested: false,
})

// File/JSZip handles stay out of the reactive proxy; keyed by row id
const payloads = new Map()

const counts = computed(() => {
  const c = { pending: 0, running: 0, inserted: 0, replaced: 0, preserved: 0, failed: 0, total: state.rows.length }
  for (const r of state.rows) {
    if (r.status === 'pending') {
      c.pending++
    }
    else if (r.status === 'running') {
      c.running++
    }
    else if (r.status === 'error') {
      c.failed++
    }
    else if (r.action === 'replaced') {
      c.replaced++
    }
    else if (r.action === 'preserved') {
      c.preserved++
    }
    else {
      c.inserted++
    }
  }
  c.processed = c.total - c.pending - c.running
  return c
})

let abortController = null
let _clobber = false
let _notifId = null
let _resumeGate = null

export function useStigImportStore() {
  const notifs = useNotifications()

  function makeRow({ id, filename, source = '', size = null, kind }) {
    return { id, filename, source, size, kind, status: 'pending', action: null, message: '', detail: '' }
  }

  // Rebuilds pending rows from the drop zone's file list; no-op once started
  function setPendingFiles(files) {
    if (state.running || state.isDone) {
      return
    }
    payloads.clear()
    state.rows = files.map((file) => {
      const kind = file.name.split('.').pop().toLowerCase() === 'zip' ? 'zip' : 'xml'
      const row = makeRow({ id: `${file.name}::${file.size}`, filename: file.name, size: file.size, kind })
      payloads.set(row.id, { file })
      return row
    })
  }

  function pauseGate() {
    if (!state.paused) {
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      _resumeGate = resolve
    })
  }

  function pause() {
    if (state.running && !state.isDone) {
      state.paused = true
    }
  }

  function resume() {
    state.paused = false
    _resumeGate?.()
    _resumeGate = null
  }

  function stop() {
    if (!state.running || state.cancelled) {
      return
    }
    state.cancelled = true
    abortController?.abort()
    // release a paused loop so it observes cancellation and exits
    resume()
  }

  async function uploadRow(row) {
    row.status = 'running'
    state.currentLabel = row.filename
    const payload = payloads.get(row.id)
    try {
      const blob = payload.file ?? await payload.zipEntry.async('blob')
      const result = await importStigFile(blob, row.filename, _clobber, abortController?.signal)
      row.action = result?.action ?? 'inserted'
      const rev = result?.revisionStr ?? ''
      row.message = rev ? `${row.action} (${rev})` : row.action
      row.status = 'success'
    }
    catch (err) {
      if (err?.name === 'AbortError') {
        // Stop aborted the in-flight request — leave the row unprocessed
        row.status = 'pending'
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
      row.status = 'error'
      row.action = null
      row.message = message
      row.detail = detail
    }
  }

  // Replaces a zip row with rows for its inner xml/zip entries at the same index
  async function expandZipRow(row, index) {
    row.status = 'running'
    state.currentLabel = row.filename
    const payload = payloads.get(row.id)
    let zip
    try {
      const data = payload.file ?? await payload.zipEntry.async('arraybuffer')
      zip = await JSZip.loadAsync(data)
    }
    catch {
      row.status = 'error'
      row.message = 'Could not open ZIP archive'
      return
    }

    const source = row.source ? `${row.source} → ${row.filename}` : row.filename
    const children = []
    for (const [name, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) {
        continue
      }
      const ext = name.split('.').pop().toLowerCase()
      if (ext !== 'xml' && ext !== 'zip') {
        continue
      }
      const child = makeRow({ id: `${row.id}::${name}`, filename: name.split('/').pop(), source, kind: ext })
      payloads.set(child.id, { zipEntry })
      children.push(child)
    }
    payloads.delete(row.id)

    if (!children.length) {
      row.status = 'error'
      row.message = 'No XML files found in archive'
      return
    }
    state.rows.splice(index, 1, ...children)
  }

  async function start(clobber) {
    dismiss()
    state.running = true
    state.isDone = false
    state.cancelled = false
    state.paused = false
    state.currentLabel = ''
    _clobber = clobber
    abortController = new AbortController()

    try {
      let i = 0
      while (i < state.rows.length) {
        if (state.cancelled) {
          break
        }
        await pauseGate()
        if (state.cancelled) {
          break
        }
        const row = state.rows[i]
        if (row.status !== 'pending') {
          i++
          continue
        }
        if (row.kind === 'zip') {
          // children are spliced in at this index, so the loop revisits it
          await expandZipRow(row, i)
          if (row.status === 'error') {
            i++
          }
          continue
        }
        await uploadRow(row)
        i++
      }
    }
    finally {
      state.running = false
      state.paused = false
      state.isDone = true
      state.currentLabel = state.cancelled ? 'Stopped' : 'Finished'
    }
  }

  function reset() {
    dismiss()
    state.running = false
    state.isDone = false
    state.cancelled = false
    state.paused = false
    state.rows = []
    state.currentLabel = ''
    state.reopenRequested = false
    payloads.clear()
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

  return { state, counts, setPendingFiles, start, pause, resume, stop, reset, startBackground, dismiss, isActive, requestReopen, consumeReopenRequest }
}
