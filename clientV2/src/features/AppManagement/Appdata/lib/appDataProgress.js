// Pure reducer for the replaceAppData response's JSONL progress-event stream.
// See app-management-appdata-import-export-implementation.md section 7 for
// the record shapes. A terminal `{status:"success"}` is required for
// success — HTTP 200 and end-of-stream are not sufficient on their own,
// since the service converts caught processing errors into a `fail` event
// rather than a non-200 response.

export function createInitialUploadState() {
  return {
    totalRows: 0,
    insertedRows: 0,
    currentTable: '',
    isDone: false,
    isSuccess: false,
    error: null,
  }
}

// Mutates `state` in place to reflect one progress event.
export function applyUploadEvent(state, event) {
  if (!event || typeof event !== 'object') {
    return
  }

  if (Array.isArray(event.tables) && Number.isFinite(event.totalRows)) {
    state.totalRows = event.totalRows
    return
  }

  if (typeof event.table === 'string' && typeof event.valueCount === 'number') {
    state.currentTable = event.table
    // valueCount is 0 for the truncate event — only inserts count as rows.
    if (event.valueCount > 0) {
      state.insertedRows += event.valueCount
    }
    return
  }

  if (event.status === 'success') {
    state.isDone = true
    state.isSuccess = true
    return
  }

  if (event.status === 'fail') {
    state.isDone = true
    state.isSuccess = false
    state.error = event.error || 'Import failed'
  }

  // {migration, status:"started"|"finished"} and {sql} events carry no
  // row-progress information; they're surfaced via formatUploadLogLine only.
}

export function uploadProgressRatio(state) {
  if (!state.totalRows) {
    return 0
  }
  return Math.min(1, state.insertedRows / state.totalRows)
}

export function formatUploadLogLine(event) {
  if (!event || typeof event !== 'object') {
    return ''
  }
  if (Array.isArray(event.tables)) {
    return `Received summary: ${event.tables.length} table(s), ${event.totalRows} total row(s).`
  }
  if (typeof event.table === 'string' && typeof event.valueCount === 'number') {
    return event.valueCount === 0
      ? `Truncated table: ${event.table}`
      : `Inserted ${event.valueCount} row(s) into ${event.table}`
  }
  if (event.migration != null && event.status) {
    return `Migration ${event.migration} ${event.status}`
  }
  if (typeof event.sql === 'string') {
    return event.sql
  }
  if (event.status === 'success') {
    return 'Import completed successfully.'
  }
  if (event.status === 'fail') {
    return `Import failed: ${event.error}`
  }
  return JSON.stringify(event)
}
