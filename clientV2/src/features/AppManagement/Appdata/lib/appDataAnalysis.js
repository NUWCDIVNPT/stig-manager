// Pure, streaming-friendly analysis of an AppData JSONL document, applied one
// line at a time so a huge export can be validated without holding the whole
// file (or its row data) in memory.
//
// This intentionally validates more than the legacy Ext.js analyzer, which
// only checks for a summary record and a `lastMigration` that isn't greater
// than the API's. See app-management-appdata-import-export-implementation.md
// section 6.1: a hardened analyzer should also require a valid integer
// migration, exactly one summary, well-formed table headers, row-array
// widths that match their header, and accurate declared counts.

export function createInitialAnalysisState() {
  return {
    metadata: null,
    metadataCount: 0,
    summary: null,
    summaryCount: 0,
    tables: new Map(),
    tableOrder: [],
    currentTable: null,
    rowsBeforeHeader: 0,
    duplicateHeaders: [],
    rowWidthMismatches: new Map(),
    malformedLines: 0,
    malformedSamples: [],
  }
}

// Applies one raw JSONL line (no trailing newline) to `state`, mutating it in
// place — cloning a Map per line would make analysis of a large export
// quadratic. Returns a small event describing what was learned, for a caller
// that wants to stream status-log lines to the user, or `null` for lines
// that don't warrant one (rows, blank lines, malformed JSON).
export function applyAnalysisLine(state, rawLine) {
  const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
  if (line.trim() === '') {
    return null
  }

  let value
  try {
    value = JSON.parse(line)
  }
  catch {
    state.malformedLines += 1
    if (state.malformedSamples.length < 5) {
      state.malformedSamples.push(line.slice(0, 120))
    }
    return null
  }

  if (Array.isArray(value)) {
    if (!state.currentTable) {
      state.rowsBeforeHeader += 1
      return null
    }
    state.currentTable.actualRowCount += 1
    if (value.length !== state.currentTable.expectedColumnCount) {
      // Aggregated per table — a systematic mismatch (e.g. a header whose
      // column list parses to the wrong width) would otherwise accumulate one
      // entry per row of a multi-million-row table.
      const name = state.currentTable.name
      let mismatch = state.rowWidthMismatches.get(name)
      if (!mismatch) {
        mismatch = { expected: state.currentTable.expectedColumnCount, count: 0, widths: new Set() }
        state.rowWidthMismatches.set(name, mismatch)
      }
      mismatch.count += 1
      if (mismatch.widths.size < 5) {
        mismatch.widths.add(value.length)
      }
    }
    return null
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  if (Array.isArray(value.tables) && Number.isFinite(value.totalRows)) {
    state.summaryCount += 1
    state.summary = { tables: value.tables, totalRows: value.totalRows }
    return { type: 'summary', tableCount: value.tables.length, totalRows: value.totalRows }
  }

  if (typeof value.table === 'string' && typeof value.columns === 'string') {
    const name = value.table
    if (state.tables.has(name)) {
      state.duplicateHeaders.push(name)
    }
    const expectedColumnCount = value.columns.length > 0 ? value.columns.split(',').length : 0
    const tableEntry = {
      name,
      declaredRowCount: value.rowCount,
      expectedColumnCount,
      actualRowCount: 0,
    }
    state.tables.set(name, tableEntry)
    state.tableOrder.push(name)
    state.currentTable = tableEntry
    return { type: 'table', table: name, rowCount: value.rowCount }
  }

  if ('version' in value || 'lastMigration' in value) {
    state.metadataCount += 1
    state.metadata = {
      version: value.version,
      commit: value.commit,
      date: value.date,
      lastMigration: value.lastMigration,
    }
    return { type: 'metadata', version: value.version, date: value.date, lastMigration: value.lastMigration }
  }

  return null
}

// Reduces the accumulated state into a final verdict. `currentMigration` is
// this API's `lastMigration` (from getConfiguration), used to reject a file
// from a newer schema.
export function finalizeAnalysis(state, currentMigration) {
  const reasons = []
  const migration = state.metadata?.lastMigration

  if (!Number.isInteger(migration)) {
    reasons.push('The file\'s metadata record is missing a valid integer "lastMigration".')
  }
  else if (Number.isInteger(currentMigration) && migration > currentMigration) {
    reasons.push(`The file is from migration v${migration}, which is newer than this API's migration v${currentMigration}.`)
  }

  if (state.metadataCount !== 1) {
    reasons.push(`Expected exactly one export-metadata record, found ${state.metadataCount}.`)
  }
  if (state.summaryCount !== 1) {
    reasons.push(`Expected exactly one table-summary record, found ${state.summaryCount}.`)
  }
  if (state.tables.size === 0) {
    reasons.push('No table headers were found in the file.')
  }
  if (state.malformedLines > 0) {
    reasons.push(`${state.malformedLines} line(s) could not be parsed as JSON.`)
  }
  if (state.rowsBeforeHeader > 0) {
    reasons.push(`${state.rowsBeforeHeader} row array(s) appeared before any table header.`)
  }
  if (state.duplicateHeaders.length > 0) {
    reasons.push(`Duplicate table header(s): ${[...new Set(state.duplicateHeaders)].join(', ')}.`)
  }
  if (state.rowWidthMismatches.size > 0) {
    const parts = [...state.rowWidthMismatches.entries()]
      .map(([name, m]) => `${name} (expected ${m.expected} column(s), ${m.count} row(s) had ${[...m.widths].join('/')})`)
    reasons.push(`Row column count didn't match the table header for: ${parts.join(', ')}.`)
  }

  const countMismatches = []
  for (const table of state.tables.values()) {
    if (Number.isInteger(table.declaredRowCount) && table.declaredRowCount !== table.actualRowCount) {
      countMismatches.push(`${table.name} (declared ${table.declaredRowCount}, found ${table.actualRowCount})`)
    }
  }
  if (countMismatches.length > 0) {
    reasons.push(`Declared row count did not match actual rows for: ${countMismatches.join(', ')}.`)
  }

  if (state.summary) {
    const summaryNames = new Set(state.summary.tables.map(t => t.table))
    const headerNames = new Set(state.tables.keys())
    const missingFromSummary = [...headerNames].filter(n => !summaryNames.has(n))
    const missingFromHeaders = [...summaryNames].filter(n => !headerNames.has(n))
    if (missingFromSummary.length > 0) {
      reasons.push(`Table(s) present in the file but not declared in the summary: ${missingFromSummary.join(', ')}.`)
    }
    if (missingFromHeaders.length > 0) {
      reasons.push(`Table(s) declared in the summary but not found in the file: ${missingFromHeaders.join(', ')}.`)
    }
    const actualTotal = [...state.tables.values()].reduce((sum, t) => sum + t.actualRowCount, 0)
    if (Number.isInteger(state.summary.totalRows) && state.summary.totalRows !== actualTotal) {
      reasons.push(`Declared totalRows (${state.summary.totalRows}) does not match the actual row count (${actualTotal}).`)
    }
  }

  return {
    isValid: reasons.length === 0,
    reasons,
    metadata: state.metadata,
    summary: state.summary,
    tables: state.tableOrder.map(name => state.tables.get(name)),
  }
}
