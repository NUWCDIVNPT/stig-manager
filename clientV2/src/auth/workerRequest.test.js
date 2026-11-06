import { describe, expect, it } from 'vitest'
import { sendWorkerRequest } from './workerRequest.js'

function fakePort() {
  const listeners = new Set()
  return {
    sent: [],
    listeners,
    postMessage(message) {
      this.sent.push(message)
    },
    addEventListener(_type, handler) {
      listeners.add(handler)
    },
    removeEventListener(_type, handler) {
      listeners.delete(handler)
    },
    reply(data) {
      for (const handler of [...listeners]) {
        handler({ data })
      }
    },
  }
}

describe('sendWorkerRequest', () => {
  it('resolves with the response for its own requestId', async () => {
    const port = fakePort()
    const pending = sendWorkerRequest(port, { request: 'getStatus' })
    const { requestId } = port.sent[0]

    port.reply({ requestId: 'someone-else', response: 'wrong' })
    port.reply({ requestId, response: { initialized: true } })

    await expect(pending).resolves.toEqual({ initialized: true })
    expect(port.sent[0].request).toBe('getStatus')
  })

  it('rejects with the worker\'s error rather than resolving undefined', async () => {
    const port = fakePort()
    const pending = sendWorkerRequest(port, { request: 'nope' })

    port.reply({ requestId: port.sent[0].requestId, error: 'Unknown request' })

    await expect(pending).rejects.toThrow('Unknown request')
  })

  it('removes its listener once answered', async () => {
    const port = fakePort()
    const pending = sendWorkerRequest(port, { request: 'getStatus' })

    port.reply({ requestId: port.sent[0].requestId, response: {} })
    await pending

    expect(port.listeners.size).toBe(0)
  })
})
