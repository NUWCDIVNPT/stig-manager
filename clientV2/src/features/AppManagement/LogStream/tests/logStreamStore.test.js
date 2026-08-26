import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createLogStreamStore } from '../stores/logStreamStore.js'

// Builds a fake stream socket that records the callbacks the store wires up, so
// a test can drive inbound frames and auth state without a real WebSocket.
function makeFakeSocket() {
  const isAuthorized = ref(false)
  const lastError = ref(null)
  const status = ref('idle')
  const sent = []
  let onMessage
  let onStatusChange
  const factory = (opts) => {
    onMessage = opts.onMessage
    onStatusChange = opts.onStatusChange
    return {
      isAuthorized,
      lastError,
      status,
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      sendCommand: (command, extra = {}) => sent.push({ command, ...extra }),
    }
  }
  return {
    factory,
    isAuthorized,
    lastError,
    status,
    sent,
    deliverLog: data => onMessage({ type: 'log', data }),
    setStatus: s => onStatusChange(s),
  }
}

function logFrame(overrides = {}) {
  return { level: 3, component: 'mysql', message: 'hi', ...overrides }
}

describe('logStreamStore', () => {
  let fake
  let store

  beforeEach(() => {
    fake = makeFakeSocket()
    store = createLogStreamStore({ createSocket: fake.factory })
  })

  it('buffers inbound log frames and tracks the line count', () => {
    fake.deliverLog(logFrame())
    fake.deliverLog(logFrame())
    expect(store.state.lineCount).toBe(2)
    expect(store.snapshot()).toHaveLength(2)
  })

  it('keeps the buffer across a mount/unmount cycle (survives navigation)', () => {
    fake.deliverLog(logFrame())
    // Simulate the view mounting, then unmounting (unsubscribe), then remounting.
    const unsub = store.subscribe({ onAppend: vi.fn(), onClear: vi.fn() })
    unsub()
    // A frame arriving while no view is mounted must still be captured.
    fake.deliverLog(logFrame())
    expect(store.snapshot()).toHaveLength(2)
  })

  it('fans out live records only to current subscribers', () => {
    const onAppend = vi.fn()
    const unsub = store.subscribe({ onAppend })
    fake.deliverLog(logFrame())
    expect(onAppend).toHaveBeenCalledTimes(1)
    unsub()
    fake.deliverLog(logFrame())
    expect(onAppend).toHaveBeenCalledTimes(1) // no more after unsubscribe
  })

  it('sends stream-start immediately when already authorized', () => {
    fake.isAuthorized.value = true
    store.startStreaming({ level: [1] })
    expect(store.state.isStreaming).toBe(true)
    expect(fake.sent).toContainEqual({ command: 'stream-start', filter: { level: [1] } })
  })

  it('defers stream-start until authorized, then resumes on (re)auth', async () => {
    store.startStreaming()
    expect(fake.sent).toHaveLength(0) // not authorized yet
    fake.isAuthorized.value = true // e.g. handshake completes / reconnect
    await nextTick() // isAuthorized watch flushes
    expect(fake.sent).toContainEqual({ command: 'stream-start' })
  })

  it('clears the buffer and notifies subscribers', () => {
    const onClear = vi.fn()
    store.subscribe({ onClear })
    fake.deliverLog(logFrame())
    store.clear()
    expect(store.state.lineCount).toBe(0)
    expect(store.snapshot()).toEqual([])
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('drops the buffer when starting a stream with preserve off', () => {
    fake.isAuthorized.value = true
    fake.deliverLog(logFrame())
    store.setPreserveLog(false)
    store.startStreaming()
    expect(store.state.lineCount).toBe(0)
  })

  it('builds a transaction row from a rest transaction frame', () => {
    fake.deliverLog({
      date: '2026-08-26T12:00:00.000Z',
      level: 3,
      component: 'rest',
      type: 'transaction',
      data: {
        request: { requestId: 'r1', source: '::1', method: 'GET', url: '/api/x', headers: { 'user-agent': 'Chrome/1' } },
        response: { status: 200, headers: {} },
        operationStats: { durationMs: 3, operationId: 'getX' },
      },
    })
    expect(store.state.transactions).toHaveLength(1)
    expect(store.state.transactions[0]).toMatchObject({ requestId: 'r1', status: '200', operationId: 'getX' })
  })

  it('pairs separate request and response frames into one row', () => {
    fake.deliverLog({
      date: '2026-08-26T12:00:00.000Z',
      component: 'rest',
      type: 'request',
      data: { requestId: 'r2', source: '::1', method: 'POST', url: '/api/y', headers: { 'user-agent': 'Firefox/2' } },
    })
    expect(store.state.transactions).toHaveLength(0) // response not seen yet
    fake.deliverLog({
      component: 'rest',
      type: 'response',
      data: { requestId: 'r2', status: 201, headers: {}, operationStats: { durationMs: 5, operationId: 'postY' } },
    })
    expect(store.state.transactions).toHaveLength(1)
    expect(store.state.transactions[0]).toMatchObject({ requestId: 'r2', status: '201', operationId: 'postY' })
  })

  it('clears transactions along with the buffer', () => {
    fake.deliverLog({
      date: '2026-08-26T12:00:00.000Z',
      component: 'rest',
      type: 'transaction',
      data: {
        request: { requestId: 'r3', method: 'GET', url: '/api/z', headers: {} },
        response: { status: 200, headers: {} },
        operationStats: { durationMs: 1, operationId: 'getZ' },
      },
    })
    store.clear()
    expect(store.state.transactions).toEqual([])
  })

  it('mirrors socket status and errors into state', async () => {
    fake.setStatus('open')
    expect(store.state.status).toBe('open')
    fake.lastError.value = 'boom'
    await nextTick() // lastError watch flushes
    expect(store.state.lastError).toBe('boom')
  })
})
