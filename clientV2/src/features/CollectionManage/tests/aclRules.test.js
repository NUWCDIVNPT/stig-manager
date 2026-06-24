import { describe, expect, it } from 'vitest'
import { resourceParts, resourceSortKey } from '../lib/aclRules.js'

describe('resourceParts', () => {
  it('returns a single "collection" part when no asset/label/stig is set', () => {
    expect(resourceParts({})).toEqual([
      { type: 'collection', text: 'Whole Collection' },
    ])
  })

  it('maps an asset rule to an asset part', () => {
    expect(resourceParts({ assetName: 'web-01' })).toEqual([
      { type: 'asset', text: 'web-01' },
    ])
  })

  it('maps a label rule and normalizes the color (prefixes #)', () => {
    expect(resourceParts({ labelName: 'Prod', label: { color: 'ff0000' } })).toEqual([
      { type: 'label', text: 'Prod', color: '#ff0000' },
    ])
  })

  it('falls back to a default color when a label has none', () => {
    const [part] = resourceParts({ labelName: 'Prod' })
    expect(part.color).toBe('#cccccc')
  })

  it('combines an asset scope with an optional STIG (no collection part)', () => {
    expect(resourceParts({ assetName: 'web-01', benchmarkId: 'RHEL_8' })).toEqual([
      { type: 'asset', text: 'web-01' },
      { type: 'stig', text: 'RHEL_8' },
    ])
  })

  it('treats a STIG-only rule as STIG, not collection', () => {
    expect(resourceParts({ benchmarkId: 'RHEL_8' })).toEqual([
      { type: 'stig', text: 'RHEL_8' },
    ])
  })
})

describe('resourceSortKey', () => {
  it('joins the part texts into a stable sort string', () => {
    expect(resourceSortKey({ assetName: 'web-01', benchmarkId: 'RHEL_8' })).toBe('web-01 RHEL_8')
  })

  it('uses "Whole Collection" for an empty rule', () => {
    expect(resourceSortKey({})).toBe('Whole Collection')
  })
})
