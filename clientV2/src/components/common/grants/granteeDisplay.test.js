import { describe, expect, it } from 'vitest'
import { granteeLabel, granteeLabels } from './granteeDisplay.js'

describe('granteeLabel', () => {
  it('labels a user grantee "Direct"', () => {
    expect(granteeLabel({ userId: 'u1', name: 'ignored' })).toBe('Direct')
  })

  it('labels a group grantee with its name', () => {
    expect(granteeLabel({ name: 'Admins' })).toBe('Admins')
  })

  it('is null-safe', () => {
    expect(granteeLabel(null)).toBeUndefined()
  })
})

describe('granteeLabels', () => {
  it('maps a mixed list of grantees', () => {
    expect(granteeLabels([{ userId: 'u1' }, { name: 'Admins' }])).toEqual(['Direct', 'Admins'])
  })

  it('defaults to an empty array', () => {
    expect(granteeLabels()).toEqual([])
  })
})
