import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupOidcHandler, useOidcWorker } from './useOidcWorker.js'

vi.mock('./ActivityHandler.js', () => ({ default: { add: vi.fn(), remove: vi.fn() } }))

let channel

beforeEach(() => {
  vi.stubGlobal('BroadcastChannel', class {
    addEventListener(_type, handler) {
      channel = handler
    }
  })
  vi.stubGlobal('STIGMAN', { oidcWorker: { channelName: 'c', isLoggingOut: false } })
  useOidcWorker().noTokenMessage.value = null
  setupOidcHandler()
})

describe('setupOidcHandler', () => {
  const noToken = { type: 'noToken', isIdle: false, clientV2: { redirectOidc: 'https://op/auth', codeVerifier: 'v', state: 's' } }

  it('prompts this client to sign in again on noToken', async () => {
    await channel({ data: noToken })

    expect(useOidcWorker().noTokenMessage.value).toMatchObject({ redirectOidc: 'https://op/auth' })
  })

  it('does not prompt the tab that is signing out', async () => {
    globalThis.STIGMAN.oidcWorker.isLoggingOut = true

    await channel({ data: noToken })

    expect(useOidcWorker().noTokenMessage.value).toBeNull()
  })

  it('clears the prompt when a token arrives', async () => {
    await channel({ data: noToken })
    await channel({ data: { type: 'accessToken' } })

    expect(useOidcWorker().noTokenMessage.value).toBeNull()
  })
})
