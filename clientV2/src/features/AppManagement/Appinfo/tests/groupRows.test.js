import { describe, expect, it } from 'vitest'
import { buildGroupRows } from '../lib/adapters/groupRows.js'

describe('buildGroupRows', () => {
  it('flattens keyed groups with role mappings', () => {
    const groups = {
      9: {
        name: 'operators',
        members: 4,
        created: '2024-10-23T10:29:57.000Z',
        roles: { restricted: 0, full: 2, manage: 1, owner: 0 },
      },
    }

    const rows = buildGroupRows(groups)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userGroupId: '9',
      name: 'operators',
      members: 4,
      full: 2,
      manage: 1,
    })
  })

  it('tolerates missing roles and members', () => {
    const rows = buildGroupRows({ 1: { name: 'bare' } })

    expect(rows[0]).toMatchObject({
      members: null,
      owner: null,
      created: null,
    })
  })

  it('returns no rows for a missing section', () => {
    expect(buildGroupRows(null)).toEqual([])
  })
})
