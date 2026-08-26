import { describe, expect, it } from 'vitest'
import { applyResponse, getBrowser, requestRow, statusClass, transactionRow } from '../lib/transactions.js'

describe('getBrowser', () => {
  it('detects known browsers', () => {
    expect(getBrowser('Mozilla/5.0 ... Chrome/125.0.0.0')).toBe('Chrome/125.0.0.0')
    expect(getBrowser('Mozilla/5.0 ... Firefox/126.0')).toBe('Firefox/126.0')
    expect(getBrowser('Mozilla/5.0 ... Edg/125.0.0.0')).toBe('Edge/125.0.0.0')
  })

  it('falls back to Unknown/0', () => {
    expect(getBrowser('curl/8.0')).toBe('Unknown/0')
    expect(getBrowser(undefined)).toBe('Unknown/0')
  })
})

describe('transactionRow', () => {
  it('flattens a transaction frame into a grid row', () => {
    const frame = {
      date: '2026-08-26T12:00:00.000Z',
      data: {
        request: {
          requestId: 'r1',
          source: '::1',
          method: 'GET',
          url: '/api/collections',
          headers: {
            'user-agent': 'Chrome/125.0.0.0',
            'accessToken': { preferred_username: 'alice' },
          },
        },
        response: { status: 200, headers: { 'content-length': '42' } },
        operationStats: { durationMs: 7, operationId: 'getCollections' },
      },
    }
    expect(transactionRow(frame)).toEqual({
      requestId: 'r1',
      timestamp: '2026-08-26T12:00:00.000Z',
      source: '::1',
      user: 'alice',
      browser: 'Chrome/125.0.0.0',
      url: 'GET /api/collections',
      status: '200',
      length: '42',
      duration: 7,
      operationId: 'getCollections',
    })
  })
})

describe('request/response pairing', () => {
  it('merges a response into a pending request row', () => {
    const requestFrame = {
      date: '2026-08-26T12:00:00.000Z',
      data: {
        requestId: 'r2',
        source: '::1',
        method: 'POST',
        url: '/api/reviews',
        headers: { 'user-agent': 'Firefox/126.0' },
      },
    }
    const responseFrame = {
      data: {
        requestId: 'r2',
        status: 500,
        headers: { 'content-length': '13' },
        operationStats: { durationMs: 99, operationId: 'postReviews' },
      },
    }
    const merged = applyResponse(requestRow(requestFrame), responseFrame)
    expect(merged).toMatchObject({
      requestId: 'r2',
      url: 'POST /api/reviews',
      status: '500',
      length: '13',
      duration: 99,
      operationId: 'postReviews',
    })
  })
})

describe('statusClass', () => {
  it('buckets by status range', () => {
    expect(statusClass('200')).toBe('sm-http-status-200')
    expect(statusClass(304)).toBe('sm-http-status-300')
    expect(statusClass('404')).toBe('sm-http-status-400')
    expect(statusClass(503)).toBe('sm-http-status-500')
    expect(statusClass('100')).toBe('')
  })
})
