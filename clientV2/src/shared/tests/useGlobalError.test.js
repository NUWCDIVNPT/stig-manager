import { afterEach, describe, expect, it } from 'vitest'
import { ApiError } from '../api/apiClient.js'
import { buildErrorReport } from '../composables/useGlobalError.js'

describe('buildErrorReport', () => {
  afterEach(() => {
    delete globalThis.STIGMAN
  })

  it('keeps ApiError request/response details and splits the stack', () => {
    const err = new ApiError('HTTP 500', {
      request: { method: 'POST', url: '/api/assets', headers: { authorization: '<removed>' }, body: { name: 'a1' } },
      response: { status: 500, statusText: 'Internal Server Error', headers: { 'x-request-id': 'abc' }, body: { error: 'boom' } },
    })
    expect(err.status).toBe(500)
    expect(err.url).toBe('/api/assets')
    expect(err.body).toEqual({ error: 'boom' })

    const report = buildErrorReport(err)
    expect(report.message).toBe('HTTP 500 (POST /api/assets)')
    expect(report.error).toMatchObject({
      name: 'ApiError',
      request: { method: 'POST', url: '/api/assets', body: { name: 'a1' } },
      response: { status: 500, statusText: 'Internal Server Error', headers: { 'x-request-id': 'abc' }, body: { error: 'boom' } },
    })
    expect(report.error).not.toHaveProperty('status')
    expect(Array.isArray(report.error.stack)).toBe(true)
  })

  it('adds env and token claims with readable dates', () => {
    globalThis.STIGMAN = { Env: { version: '1.2.3' }, oidcWorker: { tokenParsed: { preferred_username: 'bob', exp: 1700000000 } } }
    const report = buildErrorReport('plain string')
    expect(report.message).toBe('plain string')
    expect(report.env).toEqual({ version: '1.2.3' })
    expect(report.tokenParsed.preferred_username).toBe('bob')
    expect(report.tokenParsed.exp).toMatch(/^1700000000 \(.+\)$/)
  })

  it('redacts Authorization and survives circular refs and causes', () => {
    const detail = { headers: { Authorization: 'Bearer secret' } }
    detail.self = detail
    const err = new Error('outer', { cause: new Error('inner') })
    err.detail = detail
    const report = buildErrorReport(err)
    expect(report.error.detail.headers.Authorization).toBe('<removed>')
    expect(report.error.detail.self).toBe('[Circular]')
    expect(report.error.cause.message).toBe('inner')
  })
})
