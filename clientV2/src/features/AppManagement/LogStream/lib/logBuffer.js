// Pure helpers for the log-stream viewer: turning a raw log frame into the
// dataset attributes the viewer colors/selects on, and a capped ring buffer so
// a busy stream can't grow the DOM (or memory) without bound. Kept free of Vue
// and DOM so it stays trivially unit-testable.

export const DEFAULT_MAX_LINES = 1000

// Maps a parsed log object to the data-* attributes the viewer renders. rest
// records additionally carry a type and (for request/response/transaction) the
// requestId, which is what lets a future transaction grid cross-link to a line.
export function logDataset(logObj) {
  const dataset = { level: logObj.level, component: logObj.component }
  if (logObj.component === 'rest') {
    dataset.type = logObj.type
    if (logObj.type === 'request' || logObj.type === 'response') {
      dataset.requestId = logObj.data?.requestId
    }
    else if (logObj.type === 'transaction') {
      dataset.requestId = logObj.data?.request?.requestId
    }
  }
  return dataset
}

// Builds a viewer record from an already-parsed log object plus its serialized
// text (kept as-is so what the user sees/records matches the wire exactly).
export function toLogRecord(logObj, text) {
  return { text, dataset: logDataset(logObj) }
}

// Fixed-capacity FIFO of log records. Push returns nothing; once full the
// oldest record is dropped. snapshot() returns a shallow copy for rendering.
export function createLogBuffer(maxLines = DEFAULT_MAX_LINES) {
  let records = []
  return {
    push(record) {
      records.push(record)
      if (records.length > maxLines) {
        records = records.slice(records.length - maxLines)
      }
    },
    clear() {
      records = []
    },
    snapshot() {
      return records.slice()
    },
    get size() {
      return records.length
    },
    get maxLines() {
      return maxLines
    },
  }
}
