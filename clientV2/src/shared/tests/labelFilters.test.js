import { describe, expect, it } from 'vitest'
import { buildLabelFilterParams, parseLabelFilterParams } from '../lib/labelFilters.js'

describe('labelFilters', () => {
  describe('parseLabelFilterParams', () => {
    it('returns an empty selection for a query without label keys', () => {
      expect(parseLabelFilterParams({})).toEqual([])
      expect(parseLabelFilterParams()).toEqual([])
    })

    it('accepts a single labelId string or a repeated-key array', () => {
      expect(parseLabelFilterParams({ labelId: 'a' })).toEqual(['a'])
      expect(parseLabelFilterParams({ labelId: ['a', 'b'] })).toEqual(['a', 'b'])
    })

    it('maps labelMatch=null to a null entry and drops empty ids', () => {
      expect(parseLabelFilterParams({ labelMatch: 'null' })).toEqual([null])
      expect(parseLabelFilterParams({ labelId: ['a', ''], labelMatch: 'null' })).toEqual(['a', null])
      expect(parseLabelFilterParams({ labelMatch: 'other' })).toEqual([])
    })
  })

  it('round-trips through buildLabelFilterParams', () => {
    for (const ids of [[], ['a'], ['a', 'b'], [null], ['a', null]]) {
      expect(parseLabelFilterParams(buildLabelFilterParams(ids))).toEqual(ids)
    }
  })
})
