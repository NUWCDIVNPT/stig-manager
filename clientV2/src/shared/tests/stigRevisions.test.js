import { describe, expect, it } from 'vitest'
import { earlierRevisions } from '../lib/stigRevisions.js'

describe('earlierRevisions', () => {
  it('drops the latest revision by name, whatever the list order', () => {
    expect(earlierRevisions({ lastRevisionStr: 'V1R1', revisionStrs: ['V1R0', 'V1R1'] })).toEqual(['V1R0'])
    expect(earlierRevisions({ lastRevisionStr: 'V2R2', revisionStrs: ['V2R2', 'V2R1', 'V1R9'] })).toEqual(['V2R1', 'V1R9'])
  })

  it('returns [] for a single revision or missing data', () => {
    expect(earlierRevisions({ lastRevisionStr: 'V1R1', revisionStrs: ['V1R1'] })).toEqual([])
    expect(earlierRevisions(null)).toEqual([])
  })
})
