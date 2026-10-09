import { describe, expect, it } from 'vitest'
import { buildLabelFilterParams, parseLabelFilterParams, pickLabelFilterQuery } from '../lib/labelFilters.js'

describe('labelFilters', () => {
  describe('parseLabelFilterParams', () => {
    it('returns an empty selection for a query without label keys', () => {
      expect(parseLabelFilterParams({})).toEqual([])
      expect(parseLabelFilterParams()).toEqual([])
    })

    it('accepts a single labelName string or a repeated-key array', () => {
      expect(parseLabelFilterParams({ labelName: 'a' })).toEqual(['a'])
      expect(parseLabelFilterParams({ labelName: ['a', 'b'] })).toEqual(['a', 'b'])
    })

    it('maps labelMatch=null to a null entry and drops empty names', () => {
      expect(parseLabelFilterParams({ labelMatch: 'null' })).toEqual([null])
      expect(parseLabelFilterParams({ labelName: ['a', ''], labelMatch: 'null' })).toEqual(['a', null])
      expect(parseLabelFilterParams({ labelMatch: 'other' })).toEqual([])
    })
  })

  it('writes label names under the labelName key', () => {
    expect(buildLabelFilterParams(['Alpha', null])).toEqual({ labelName: ['Alpha'], labelMatch: 'null' })
    // 'null' is an ordinary label name, not the "no label" marker
    expect(buildLabelFilterParams(['null'])).toEqual({ labelName: ['null'] })
  })

  it('picks only the label filter keys from a route query', () => {
    expect(pickLabelFilterQuery({ foo: 'bar', labelName: 'Alpha', labelMatch: 'null' })).toEqual({ labelName: ['Alpha'], labelMatch: 'null' })
    expect(pickLabelFilterQuery({ foo: 'bar' })).toEqual({})
  })

  it('round-trips through buildLabelFilterParams', () => {
    for (const names of [[], ['a'], ['a', 'b'], [null], ['a', null]]) {
      expect(parseLabelFilterParams(buildLabelFilterParams(names))).toEqual(names)
    }
  })
})
