import { describe, expect, it } from 'vitest'
import {
  applyAnalysisLine,
  createInitialAnalysisState,
  finalizeAnalysis,
} from '../lib/appDataAnalysis.js'

function analyzeLines(lines) {
  const state = createInitialAnalysisState()
  const events = []
  for (const line of lines) {
    const event = applyAnalysisLine(state, line)
    if (event) {
      events.push(event)
    }
  }
  return { state, events }
}

const VALID_LINES = [
  '{"version":"1.4.13","commit":{"branch":"main"},"date":"2024-08-18T15:29:16.784Z","lastMigration":33}',
  '{"tables":[{"table":"asset","rowCount":2},{"table":"collection","rowCount":1}],"totalRows":3}',
  '{"table":"asset","columns":"`assetId`,`collectionId`,`name`","rowCount":2}',
  '[1,10,"host-a"]',
  '[2,10,"host-b"]',
  '{"table":"collection","columns":"`collectionId`,`name`","rowCount":1}',
  '[10,"Example Collection"]',
]

describe('applyAnalysisLine', () => {
  it('parses a well-formed file into metadata, summary, and per-table counts', () => {
    const { state, events } = analyzeLines(VALID_LINES)
    expect(state.metadataCount).toBe(1)
    expect(state.metadata.lastMigration).toBe(33)
    expect(state.summaryCount).toBe(1)
    expect(state.tables.get('asset').actualRowCount).toBe(2)
    expect(state.tables.get('collection').actualRowCount).toBe(1)
    expect(state.malformedLines).toBe(0)
    expect(events.map(e => e.type)).toEqual(['metadata', 'summary', 'table', 'table'])
  })

  it('ignores blank lines', () => {
    const { state } = analyzeLines(['', '   ', ...VALID_LINES])
    expect(state.malformedLines).toBe(0)
  })

  it('counts malformed JSON lines instead of silently dropping them', () => {
    const { state } = analyzeLines(['not json', '{"unterminated":'])
    expect(state.malformedLines).toBe(2)
    expect(state.malformedSamples).toHaveLength(2)
  })

  it('flags a row array that appears before any table header', () => {
    const { state } = analyzeLines(['[1,2,3]'])
    expect(state.rowsBeforeHeader).toBe(1)
  })

  it('flags a row whose width does not match the table header column count', () => {
    const lines = [
      '{"table":"asset","columns":"`assetId`,`name`","rowCount":1}',
      '[1,10,"extra","column"]',
    ]
    const { state } = analyzeLines(lines)
    expect(state.rowWidthMismatches).toEqual([
      { table: 'asset', expected: 2, actual: 4 },
    ])
  })

  it('flags duplicate table headers', () => {
    const lines = [
      '{"table":"asset","columns":"`assetId`","rowCount":0}',
      '{"table":"asset","columns":"`assetId`","rowCount":0}',
    ]
    const { state } = analyzeLines(lines)
    expect(state.duplicateHeaders).toEqual(['asset'])
  })

  it('treats a table with zero declared rows as having no rows (empty tables still emit a header)', () => {
    const lines = ['{"table":"cci","columns":"`cci`","rowCount":0}']
    const { state } = analyzeLines(lines)
    expect(state.tables.get('cci').actualRowCount).toBe(0)
  })
})

describe('finalizeAnalysis', () => {
  it('accepts a well-formed file at or below the current migration', () => {
    const { state } = analyzeLines(VALID_LINES)
    const result = finalizeAnalysis(state, 33)
    expect(result.isValid).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('accepts a file older than the current migration', () => {
    const { state } = analyzeLines(VALID_LINES)
    const result = finalizeAnalysis(state, 40)
    expect(result.isValid).toBe(true)
  })

  it('rejects a file newer than the current migration', () => {
    const { state } = analyzeLines(VALID_LINES)
    const result = finalizeAnalysis(state, 10)
    expect(result.isValid).toBe(false)
    expect(result.reasons.some(r => r.includes('newer than'))).toBe(true)
  })

  it('rejects a file missing a valid integer lastMigration', () => {
    const lines = [
      '{"version":"1.0.0"}',
      '{"tables":[],"totalRows":0}',
    ]
    const { state } = analyzeLines(lines)
    const result = finalizeAnalysis(state, 33)
    expect(result.isValid).toBe(false)
    expect(result.reasons.some(r => r.includes('lastMigration'))).toBe(true)
  })

  it('rejects a file with no table-summary record', () => {
    const lines = [
      '{"version":"1.0.0","lastMigration":1}',
      '{"table":"asset","columns":"`assetId`","rowCount":0}',
    ]
    const { state } = analyzeLines(lines)
    const result = finalizeAnalysis(state, 33)
    expect(result.isValid).toBe(false)
    expect(result.reasons.some(r => r.includes('table-summary'))).toBe(true)
  })

  it('rejects a file with more than one table-summary record', () => {
    const lines = [
      '{"version":"1.0.0","lastMigration":1}',
      '{"tables":[],"totalRows":0}',
      '{"tables":[],"totalRows":0}',
    ]
    const { state } = analyzeLines(lines)
    const result = finalizeAnalysis(state, 33)
    expect(result.isValid).toBe(false)
  })

  it('rejects when the summary and the actual table headers disagree', () => {
    const lines = [
      '{"version":"1.0.0","lastMigration":1}',
      '{"tables":[{"table":"other","rowCount":0}],"totalRows":0}',
      '{"table":"asset","columns":"`assetId`","rowCount":0}',
    ]
    const { state } = analyzeLines(lines)
    const result = finalizeAnalysis(state, 33)
    expect(result.isValid).toBe(false)
    expect(result.reasons.some(r => r.includes('not declared in the summary'))).toBe(true)
    expect(result.reasons.some(r => r.includes('not found in the file'))).toBe(true)
  })

  it('rejects when declared row counts do not match actual rows', () => {
    const lines = [
      '{"version":"1.0.0","lastMigration":1}',
      '{"tables":[{"table":"asset","rowCount":5}],"totalRows":5}',
      '{"table":"asset","columns":"`assetId`","rowCount":5}',
      '[1]',
    ]
    const { state } = analyzeLines(lines)
    const result = finalizeAnalysis(state, 33)
    expect(result.isValid).toBe(false)
    expect(result.reasons.some(r => r.includes('declared 5, found 1'))).toBe(true)
  })

  it('rejects a zero-migration-mismatch-free file that still has malformed lines', () => {
    const { state } = analyzeLines([...VALID_LINES, 'garbage'])
    const result = finalizeAnalysis(state, 33)
    expect(result.isValid).toBe(false)
    expect(result.reasons.some(r => r.includes('could not be parsed'))).toBe(true)
  })
})
