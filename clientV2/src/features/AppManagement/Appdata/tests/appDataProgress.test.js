import { describe, expect, it } from 'vitest'
import {
  applyUploadEvent,
  createInitialUploadState,
  formatUploadLogLine,
  uploadProgressRatio,
} from '../lib/appDataProgress.js'

describe('applyUploadEvent', () => {
  it('initializes totalRows from the echoed summary', () => {
    const state = createInitialUploadState()
    applyUploadEvent(state, { tables: [{ table: 'asset', rowCount: 2 }], totalRows: 3 })
    expect(state.totalRows).toBe(3)
  })

  it('does not count a truncate event (valueCount 0) as an inserted row', () => {
    const state = createInitialUploadState()
    applyUploadEvent(state, { seq: 1, table: 'asset', valueCount: 0 })
    expect(state.insertedRows).toBe(0)
    expect(state.currentTable).toBe('asset')
  })

  it('accumulates insertedRows across multiple insert batches', () => {
    const state = createInitialUploadState()
    applyUploadEvent(state, { seq: 1, table: 'asset', valueCount: 0 })
    applyUploadEvent(state, { seq: 2, table: 'asset', valueCount: 5000 })
    applyUploadEvent(state, { seq: 3, table: 'asset', valueCount: 3 })
    expect(state.insertedRows).toBe(5003)
  })

  it('ignores migration and DDL events for row-progress purposes', () => {
    const state = createInitialUploadState()
    applyUploadEvent(state, { migration: 34, status: 'started' })
    applyUploadEvent(state, { sql: 'DROP TABLE foo' })
    expect(state.insertedRows).toBe(0)
    expect(state.isDone).toBe(false)
  })

  it('marks success only on a terminal {status:"success"} record', () => {
    const state = createInitialUploadState()
    applyUploadEvent(state, { status: 'success' })
    expect(state.isDone).toBe(true)
    expect(state.isSuccess).toBe(true)
  })

  it('marks failure on a terminal {status:"fail"} record and records the error', () => {
    const state = createInitialUploadState()
    applyUploadEvent(state, { status: 'fail', error: 'boom' })
    expect(state.isDone).toBe(true)
    expect(state.isSuccess).toBe(false)
    expect(state.error).toBe('boom')
  })

  it('ignores null/non-object events', () => {
    const state = createInitialUploadState()
    applyUploadEvent(state, null)
    applyUploadEvent(state, undefined)
    expect(state.isDone).toBe(false)
  })
})

describe('uploadProgressRatio', () => {
  it('guards against division by zero when totalRows is 0', () => {
    const state = createInitialUploadState()
    expect(uploadProgressRatio(state)).toBe(0)
  })

  it('computes insertedRows / totalRows, capped at 1', () => {
    const state = createInitialUploadState()
    state.totalRows = 10
    state.insertedRows = 4
    expect(uploadProgressRatio(state)).toBe(0.4)
    state.insertedRows = 999
    expect(uploadProgressRatio(state)).toBe(1)
  })
})

describe('formatUploadLogLine', () => {
  it('formats a summary event', () => {
    expect(formatUploadLogLine({ tables: [{ table: 'asset', rowCount: 2 }], totalRows: 2 }))
      .toBe('Received summary: 1 table(s), 2 total row(s).')
  })

  it('formats a truncate event distinctly from an insert event', () => {
    expect(formatUploadLogLine({ table: 'asset', valueCount: 0 })).toBe('Truncated table: asset')
    expect(formatUploadLogLine({ table: 'asset', valueCount: 5 })).toBe('Inserted 5 row(s) into asset')
  })

  it('formats migration and DDL events', () => {
    expect(formatUploadLogLine({ migration: 34, status: 'started' })).toBe('Migration 34 started')
    expect(formatUploadLogLine({ sql: 'DROP TABLE foo' })).toBe('DROP TABLE foo')
  })

  it('formats terminal success and failure events', () => {
    expect(formatUploadLogLine({ status: 'success' })).toBe('Import completed successfully.')
    expect(formatUploadLogLine({ status: 'fail', error: 'boom' })).toBe('Import failed: boom')
  })
})
