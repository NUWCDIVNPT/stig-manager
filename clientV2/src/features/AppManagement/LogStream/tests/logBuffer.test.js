import { describe, expect, it } from 'vitest'
import { createLogBuffer, logDataset, toLogRecord } from '../lib/logBuffer.js'

describe('logDataset', () => {
  it('maps level and component for non-rest records', () => {
    expect(logDataset({ level: 3, component: 'mysql' })).toEqual({
      level: 3,
      component: 'mysql',
    })
  })

  it('includes type and requestId for rest request/response records', () => {
    const req = { level: 3, component: 'rest', type: 'request', data: { requestId: 'abc' } }
    expect(logDataset(req)).toEqual({
      level: 3,
      component: 'rest',
      type: 'request',
      requestId: 'abc',
    })
  })

  it('pulls requestId from data.request for transaction records', () => {
    const tx = { level: 3, component: 'rest', type: 'transaction', data: { request: { requestId: 'xyz' } } }
    expect(logDataset(tx).requestId).toBe('xyz')
  })

  it('does not throw on a rest transaction missing request data', () => {
    const tx = { level: 3, component: 'rest', type: 'transaction', data: {} }
    expect(logDataset(tx).requestId).toBeUndefined()
  })
})

describe('toLogRecord', () => {
  it('keeps the serialized text verbatim alongside the dataset', () => {
    const obj = { level: 1, component: 'mysql' }
    const text = JSON.stringify(obj)
    expect(toLogRecord(obj, text)).toEqual({ text, dataset: { level: 1, component: 'mysql' } })
  })
})

describe('createLogBuffer', () => {
  it('accumulates records up to capacity', () => {
    const buf = createLogBuffer(3)
    buf.push({ text: 'a', dataset: {} })
    buf.push({ text: 'b', dataset: {} })
    expect(buf.size).toBe(2)
    expect(buf.snapshot().map(r => r.text)).toEqual(['a', 'b'])
  })

  it('drops the oldest record once over capacity (FIFO)', () => {
    const buf = createLogBuffer(2)
    buf.push({ text: 'a', dataset: {} })
    buf.push({ text: 'b', dataset: {} })
    buf.push({ text: 'c', dataset: {} })
    expect(buf.size).toBe(2)
    expect(buf.snapshot().map(r => r.text)).toEqual(['b', 'c'])
  })

  it('clear() empties the buffer', () => {
    const buf = createLogBuffer(2)
    buf.push({ text: 'a', dataset: {} })
    buf.clear()
    expect(buf.size).toBe(0)
    expect(buf.snapshot()).toEqual([])
  })

  it('snapshot() returns a copy, not the live array', () => {
    const buf = createLogBuffer(2)
    buf.push({ text: 'a', dataset: {} })
    const snap = buf.snapshot()
    buf.push({ text: 'b', dataset: {} })
    expect(snap.map(r => r.text)).toEqual(['a'])
  })
})
