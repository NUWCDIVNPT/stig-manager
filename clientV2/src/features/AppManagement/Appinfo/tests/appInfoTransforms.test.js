import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateSharable } from '../lib/appInfoSharing.js'
import {
  CURRENT_APP_INFO_SCHEMA,
  transformPreviousSchemas,
} from '../lib/appInfoTransforms.js'

describe('transformPreviousSchemas', () => {
  it('returns a current report unchanged', () => {
    const report = { schema: CURRENT_APP_INFO_SCHEMA }

    expect(transformPreviousSchemas(report)).toBe(report)
  })

  it('rejects unrecognized data', () => {
    expect(transformPreviousSchemas({})).toBe(false)
  })

  it('upgrades a v1.0 report to v1.1', () => {
    const report = {
      schema: 'stig-manager-appinfo-v1.0',
      date: '2026-01-01T00:00:00.000Z',
      version: '1.0.0',
      collections: {
        7: {
          name: 'Example',
          aclCounts: {
            users: {
              3: {
                uniqueAssets: 2,
              },
            },
          },
          grantCounts: {
            restricted: 1,
          },
        },
      },
      requests: {},
      users: {},
      mysql: {},
      nodejs: {},
    }

    const transformed = transformPreviousSchemas(report)

    expect(transformed.schema).toBe(CURRENT_APP_INFO_SCHEMA)
    expect(transformed.groups).toEqual({})
    expect(transformed.collections['7'].roleCounts).toEqual({ restricted: 1 })
    expect(transformed.collections['7'].grants['3']).toMatchObject({
      grantId: '3',
      grantee: { userId: '3', groupId: null },
      uniqueAssets: 2,
    })
  })
})

describe('generateSharable', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('anonymizes identifiers without changing the source report', () => {
    vi.stubGlobal('STIGMAN', { Env: { oauth: { clientId: 'browser' } } })

    const report = {
      collections: { 12: { name: 'Secret collection' } },
      users: { userInfo: { 5: { username: 'alice' } } },
      groups: { 9: { name: 'operators' } },
      requests: {
        operationIds: {
          getAppInfo: {
            clients: { browser: 4, integration: 2, unknown: 1 },
          },
        },
      },
      nodejs: { environment: { STIGMAN_DB_HOST: 'db.internal' } },
    }

    const sharable = generateSharable(report, {
      collectionName: true,
      userAndGroupName: true,
      clientId: true,
      envvar: true,
    })

    expect(sharable.collections['12'].name).toBe('12')
    expect(sharable.users.userInfo['5'].username).toBe('5')
    expect(sharable.groups['9'].name).toBe('9')
    expect(sharable.requests.operationIds.getAppInfo.clients).toEqual({
      webapp: 4,
      client1: 2,
      unknown: 1,
    })
    expect(sharable.nodejs).not.toHaveProperty('environment')
    expect(report.collections['12'].name).toBe('Secret collection')
    expect(report.nodejs).toHaveProperty('environment')
  })
})
