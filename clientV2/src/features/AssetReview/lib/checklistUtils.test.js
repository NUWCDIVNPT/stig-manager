import { describe, expect, it } from 'vitest'
import { calculateChecklistStats, getEngineDisplay, getResultDisplay } from './checklistUtils.js'

describe('getResultDisplay', () => {
  it('should map known results', () => {
    expect(getResultDisplay('pass')).toBe('NF')
    expect(getResultDisplay('fail')).toBe('O')
    expect(getResultDisplay('notapplicable')).toBe('NA')
    expect(getResultDisplay('notchecked')).toBe('NR')
    expect(getResultDisplay('informational')).toBe('I')
  })

  it('should return NR for unknown result values', () => {
    expect(getResultDisplay('something')).toBe('NR')
  })

  it('should return null for null/undefined', () => {
    expect(getResultDisplay(null)).toBeNull()
    expect(getResultDisplay(undefined)).toBeNull()
    expect(getResultDisplay('')).toBeNull()
  })
})

describe('getEngineDisplay', () => {
  it('should return null when no resultEngine', () => {
    expect(getEngineDisplay({})).toBeNull()
    expect(getEngineDisplay({ resultEngine: null })).toBeNull()
  })

  it('should return override when overrides has items', () => {
    expect(getEngineDisplay({ resultEngine: { overrides: [{ authority: 'a' }] } })).toBe('override')
  })

  it('should return engine when resultEngine exists without overrides', () => {
    expect(getEngineDisplay({ resultEngine: { product: 'eval' } })).toBe('engine')
    expect(getEngineDisplay({ resultEngine: { overrides: [] } })).toBe('engine')
  })
})

describe('calculateChecklistStats', () => {
  it('should return null for empty/null input', () => {
    expect(calculateChecklistStats(null)).toBeNull()
    expect(calculateChecklistStats([])).toBeNull()
  })

  it('should count results by category', () => {
    const data = [
      { result: 'pass' },
      { result: 'pass' },
      { result: 'fail' },
      { result: 'notapplicable' },
      { result: 'notchecked' },
      { result: null },
    ]
    const stats = calculateChecklistStats(data)
    expect(stats.results.pass).toBe(2)
    expect(stats.results.fail).toBe(1)
    expect(stats.results.notapplicable).toBe(1)
    expect(stats.results.other).toBe(2)
    expect(stats.total).toBe(6)
  })

  it('should count engine types', () => {
    const data = [
      { result: 'pass' },
      { result: 'fail', resultEngine: { product: 'eval' } },
      { result: 'pass', resultEngine: { overrides: [{ authority: 'a' }] } },
    ]
    const stats = calculateChecklistStats(data)
    expect(stats.engine.manual).toBe(1)
    expect(stats.engine.engine).toBe(1)
    expect(stats.engine.override).toBe(1)
  })

  it('should count statuses', () => {
    const data = [
      { result: 'pass', status: { label: 'saved' } },
      { result: 'fail', status: { label: 'submitted' } },
      { result: 'pass', status: { label: 'accepted' } },
      { result: 'fail', status: { label: 'rejected' } },
      { result: 'pass', status: { label: 'saved' } },
    ]
    const stats = calculateChecklistStats(data)
    expect(stats.statuses.saved).toBe(2)
    expect(stats.statuses.submitted).toBe(1)
    expect(stats.statuses.accepted).toBe(1)
    expect(stats.statuses.rejected).toBe(1)
  })

  it('should handle status as a string', () => {
    const data = [
      { result: 'pass', status: 'saved' },
    ]
    const stats = calculateChecklistStats(data)
    expect(stats.statuses.saved).toBe(1)
  })
})
