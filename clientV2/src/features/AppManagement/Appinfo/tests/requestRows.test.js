import { describe, expect, it } from 'vitest'
import {
  buildOperationDetails,
  buildOperationRows,
  buildRequestsSummary,
  buildUsernameLookup,
} from '../lib/adapters/requestRows.js'

const requests = {
  totalRequests: 383,
  totalApiRequests: 78,
  totalRequestDuration: 1362,
  operationIds: {
    getUser: {
      totalRequests: 23,
      totalDuration: 302,
      minDuration: 6,
      maxDuration: 85,
      errors: { 500: 2, 403: 1 },
      users: { 1: 20, 42: 3 },
      clients: { webapp: 23 },
      projections: {
        stigs: { totalRequests: 5, totalDuration: 50 },
      },
    },
  },
}

describe('buildOperationRows', () => {
  it('flattens operationIds and computes errorCount and averageDuration', () => {
    const rows = buildOperationRows(requests)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      operationId: 'getUser',
      totalRequests: 23,
      errorCount: 3,
      averageDuration: 13,
    })
  })

  it('returns no rows for a missing section', () => {
    expect(buildOperationRows(null)).toEqual([])
  })
})

describe('buildRequestsSummary', () => {
  it('extracts the totals', () => {
    expect(buildRequestsSummary(requests)).toEqual({
      totalRequests: 383,
      totalApiRequests: 78,
      totalRequestDuration: 1362,
    })
  })
})

describe('buildUsernameLookup', () => {
  it('maps userId to username', () => {
    const users = { userInfo: { 1: { username: 'alice' }, 42: { username: 'bob' } } }

    expect(buildUsernameLookup(users)).toEqual({ 1: 'alice', 42: 'bob' })
  })
})

describe('buildOperationDetails', () => {
  it('builds child rows with username resolution', () => {
    const row = buildOperationRows(requests)[0]
    const details = buildOperationDetails(row, { 1: 'alice' })

    expect(details.users).toEqual([
      { key: 'alice', value: 20 },
      { key: 'unknown', value: 3 },
    ])
    expect(details.clients).toEqual([{ key: 'webapp', value: 23 }])
    expect(details.errors).toEqual([
      { key: '403', value: 1 },
      { key: '500', value: 2 },
    ])
    expect(details.projections).toEqual([
      { projection: 'stigs', totalRequests: 5, totalDuration: 50 },
    ])
  })

  it('returns empty row sets for a null row', () => {
    expect(buildOperationDetails(null)).toEqual({
      users: [],
      clients: [],
      errors: [],
      projections: [],
    })
  })
})
