import { describe, expect, it } from 'vitest'
import {
  buildPrivilegeRows,
  buildTourRows,
  buildUserRows,
  formatLastAccess,
} from '../lib/adapters/userRows.js'

describe('buildUserRows', () => {
  it('flattens userInfo with role mappings', () => {
    const users = {
      userInfo: {
        5: {
          username: 'admin',
          created: '2024-10-23T10:29:57.000Z',
          lastAccess: 1754578353,
          privileges: ['create_collection', 'admin'],
          roles: { restricted: 0, full: 0, manage: 0, owner: 7 },
          tours: { shell: '2026-10-04', assetReview: '2026-11-02' },
        },
      },
    }

    const rows = buildUserRows(users)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userId: '5',
      username: 'admin',
      owner: 7,
      restricted: 0,
      privileges: ['create_collection', 'admin'],
      tours: ['shell', 'assetReview'],
    })
  })

  it('tolerates missing roles and privileges', () => {
    const rows = buildUserRows({ userInfo: { 1: { username: 'bare' } } })

    expect(rows[0]).toMatchObject({
      privileges: [],
      tours: [],
      owner: null,
      lastAccess: null,
    })
  })

  it('returns no rows for a missing section', () => {
    expect(buildUserRows(null)).toEqual([])
  })
})

describe('buildPrivilegeRows', () => {
  it('maps a count object to key/value rows', () => {
    expect(buildPrivilegeRows({ admin: 2, none: 8 })).toEqual([
      { key: 'admin', value: 2 },
      { key: 'none', value: 8 },
    ])
  })

  it('returns no rows for a missing category', () => {
    expect(buildPrivilegeRows(null)).toEqual([])
  })
})

describe('buildTourRows', () => {
  it('maps the tour counts to key/value rows', () => {
    expect(buildTourRows({ none: 8, shell: 4, assetReview: 2 })).toEqual([
      { key: 'none', value: 8 },
      { key: 'shell', value: 4 },
      { key: 'assetReview', value: 2 },
    ])
  })

  it('returns no rows for a report without tour counts', () => {
    expect(buildTourRows(null)).toEqual([])
  })
})

describe('formatLastAccess', () => {
  it('renders epoch seconds as an ISO string', () => {
    expect(formatLastAccess(1754578353)).toBe('2025-08-07T14:52:33.000Z')
  })

  it('renders missing values as a dash', () => {
    expect(formatLastAccess(null)).toBe('-')
    expect(formatLastAccess(0)).toBe('-')
  })
})
