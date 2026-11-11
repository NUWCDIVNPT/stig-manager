import { afterEach, describe, expect, it } from 'vitest'
import { ApiError } from '../api/apiClient.js'
import { buildErrorReport } from '../composables/useGlobalError.js'

describe('buildErrorReport', () => {
  afterEach(() => {
    delete globalThis.STIGMAN
  })

  it('keeps ApiError request/response details and splits the stack', () => {
    const err = new ApiError('HTTP 500', 500, '/api/assets', { error: 'boom' }, 'POST', new Headers({ 'x-request-id': 'abc' }))
    const report = buildErrorReport(err)
    expect(report.message).toBe('HTTP 500')
    expect(report.error).toMatchObject({
      name: 'ApiError',
      status: 500,
      method: 'POST',
      url: '/api/assets',
      body: { error: 'boom' },
      responseHeaders: { 'x-request-id': 'abc' },
    })
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
