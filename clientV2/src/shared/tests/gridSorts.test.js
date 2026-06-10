import { describe, expect, it } from 'vitest'
import { resultSortValue, severitySortValue, statusSortValue } from '../lib/gridSorts.js'

describe('gridSorts', () => {
  describe('severitySortValue', () => {
    it('ranks severities by CAT number, not alphabetically', () => {
      const high = severitySortValue({ severity: 'high' })
      const medium = severitySortValue({ severity: 'medium' })
      const low = severitySortValue({ severity: 'low' })
      expect(high).toBeLessThan(medium)
      expect(medium).toBeLessThan(low)
    })

    it('sorts unknown or missing severity last in ascending order', () => {
      const low = severitySortValue({ severity: 'low' })
      expect(severitySortValue({ severity: 'mixed' })).toBeGreaterThan(low)
      expect(severitySortValue({ severity: undefined })).toBeGreaterThan(low)
      expect(severitySortValue({})).toBeGreaterThan(low)
    })

    it('orders a row set CAT 1 → CAT 3 ascending', () => {
      const rows = [{ severity: 'low' }, { severity: 'high' }, { severity: 'medium' }]
      rows.sort((a, b) => severitySortValue(a) - severitySortValue(b))
      expect(rows.map(r => r.severity)).toEqual(['high', 'medium', 'low'])
    })
  })

  describe('statusSortValue', () => {
    it('ranks statuses by workflow order', () => {
      const order = ['saved', 'submitted', 'rejected', 'accepted']
        .map(label => statusSortValue({ status: { label } }))
      expect(order).toEqual([...order].sort((a, b) => a - b))
      expect(new Set(order).size).toBe(4)
    })

    it('handles status as a bare string', () => {
      expect(statusSortValue({ status: 'saved' }))
        .toBe(statusSortValue({ status: { label: 'saved' } }))
    })

    it('sorts unknown or missing status last', () => {
      const accepted = statusSortValue({ status: { label: 'accepted' } })
      expect(statusSortValue({})).toBeGreaterThan(accepted)
      expect(statusSortValue({ status: 'bogus' })).toBeGreaterThan(accepted)
    })
  })

  describe('resultSortValue', () => {
    it('ranks results by badge display order: O, NF, NA, NR, I', () => {
      const order = ['fail', 'pass', 'notapplicable', 'notchecked', 'informational']
        .map(resultSortValue)
      expect(order).toEqual([...order].sort((a, b) => a - b))
    })

    it('groups results that share a badge', () => {
      expect(resultSortValue('fixed')).toBe(resultSortValue('pass'))
      expect(resultSortValue('unknown')).toBe(resultSortValue('notchecked'))
      expect(resultSortValue('error')).toBe(resultSortValue('notchecked'))
      expect(resultSortValue('notselected')).toBe(resultSortValue('notchecked'))
    })

    it('sorts unknown or missing result last', () => {
      const informational = resultSortValue('informational')
      expect(resultSortValue(undefined)).toBeGreaterThan(informational)
      expect(resultSortValue('')).toBeGreaterThan(informational)
    })
  })
})
