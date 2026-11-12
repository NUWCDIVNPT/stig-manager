import { describe, expect, it } from 'vitest'
import { catLabel, exportDisplayValue, exportPct, exportTimestamp, labelNames } from '../lib/exportCells.js'

const cell = (field, data, record = {}) => exportDisplayValue({ data, field, record })

describe('exportDisplayValue', () => {
  it('derives the engine display from the whole row, including manual reviews with a null resultEngine', () => {
    expect(cell('resultEngine', null, { result: 'pass', resultEngine: null })).toBe('manual')
    expect(cell('resultEngine', { product: 'x' }, { result: 'pass', resultEngine: { product: 'x' } })).toBe('engine')
    expect(cell('resultEngine', { overrides: [{}] }, { resultEngine: { overrides: [{}] } })).toBe('override')
    expect(cell('resultEngine', null, { result: null })).toBe('')
  })

  it('abbreviates results the way the grid does and leaves unknown strings alone', () => {
    expect(cell('result', 'pass')).toBe('NF')
    expect(cell('result', 'fail')).toBe('O')
    expect(cell('result', 'notchecked')).toBe('NR')
    expect(cell('result', 'something-else')).toBe('something-else')
    expect(cell('result', null)).toBe(null)
  })

  it('exports review status objects and labels as capitalized text', () => {
    expect(cell('status', { label: 'submitted', ts: 'x', user: {} })).toBe('Submitted')
    expect(cell('status', 'saved')).toBe('Saved')
    expect(cell('_statusLabel', 'accepted')).toBe('Accepted')
  })

  it('passes non-review status values through (other grids reuse the field name)', () => {
    expect(cell('status', 'active')).toBe('active')
    expect(cell('status', 200)).toBe(200)
    expect(cell('status', { label: 'queued' })).toEqual({ label: 'queued' })
  })

  it('maps severity to a CAT label', () => {
    expect(cell('severity', 'high')).toBe('CAT 1')
    expect(cell('severity', 'low')).toBe('CAT 3')
    expect(cell('severity', 'weird')).toBe('weird')
    expect(catLabel('medium')).toBe('CAT 2')
    expect(catLabel(null)).toBe(null)
  })

  it('joins label and stig objects by their display names', () => {
    expect(cell('labels', [{ name: 'a', color: '000' }, { name: 'b' }])).toBe('a, b')
    expect(cell('assetLabels', [])).toBe('')
    expect(cell('label', [{ name: 'only' }])).toBe('only')
    expect(labelNames('not-an-array')).toBe('not-an-array')
    expect(cell('stigs', [{ benchmarkId: 'S1' }, 'S2'])).toBe('S1, S2')
  })

  it('passes unknown fields through unchanged', () => {
    const obj = { deep: true }
    expect(cell('anything', obj)).toBe(obj)
    expect(cell('touchTs', '2026-01-01T00:00:00Z')).toBe('2026-01-01T00:00:00Z')
  })
})

describe('display-twin exporters', () => {
  it('exportPct exports a plain 2-decimal number; partial never reads as 0 or 100', () => {
    expect(exportPct({ data: 99.5575221238938 })).toBe(99.56)
    expect(exportPct({ data: 100 })).toBe(100)
    expect(exportPct({ data: 0 })).toBe(0)
    expect(exportPct({ data: 99.996 })).toBe(99.99)
    expect(exportPct({ data: 0.003 })).toBe(0.01)
    expect(exportPct({ data: null })).toBe('')
  })

  it('exportTimestamp normalizes to ISO 8601 UTC, blank when missing', () => {
    expect(exportTimestamp({ data: '2025-07-03T04:00:36Z' })).toBe('2025-07-03T04:00:36Z')
    expect(exportTimestamp({ data: '2025-07-03T04:00:36.000Z' })).toBe('2025-07-03T04:00:36Z')
    expect(exportTimestamp({ data: new Date('2025-07-03T04:00:36.250Z') })).toBe('2025-07-03T04:00:36.250Z')
    expect(exportTimestamp({ data: null })).toBe('')
  })
})
