import { afterEach, describe, expect, it } from 'vitest'
import { isAppDataEnabled, isExperimentalEnabled } from '../lib/featureFlags.js'

afterEach(() => {
  delete globalThis.STIGMAN
})

describe('isExperimentalEnabled', () => {
  it('returns false when STIGMAN.Env is entirely absent', () => {
    delete globalThis.STIGMAN
    expect(isExperimentalEnabled('appData')).toBe(false)
  })

  it('returns false when the flag is the string "false"', () => {
    globalThis.STIGMAN = { Env: { experimental: { appData: 'false' } } }
    expect(isExperimentalEnabled('appData')).toBe(false)
  })

  it('returns false for any value other than the exact string "true"', () => {
    globalThis.STIGMAN = { Env: { experimental: { appData: true } } }
    expect(isExperimentalEnabled('appData')).toBe(false)
  })

  it('returns true only for the exact string "true"', () => {
    globalThis.STIGMAN = { Env: { experimental: { appData: 'true' } } }
    expect(isExperimentalEnabled('appData')).toBe(true)
  })

  it('reads any flag name, not just appData', () => {
    globalThis.STIGMAN = { Env: { experimental: { logStream: 'true' } } }
    expect(isExperimentalEnabled('logStream')).toBe(true)
    expect(isExperimentalEnabled('appData')).toBe(false)
  })
})

describe('isAppDataEnabled', () => {
  it('reads the appData flag', () => {
    globalThis.STIGMAN = { Env: { experimental: { appData: 'true' } } }
    expect(isAppDataEnabled()).toBe(true)
  })
})
