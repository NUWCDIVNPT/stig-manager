import { afterEach, describe, expect, it } from 'vitest'
import { isAppDataEnabled } from '../lib/appDataFlag.js'

describe('isAppDataEnabled', () => {
  afterEach(() => {
    delete globalThis.STIGMAN
  })

  it('returns false when STIGMAN.Env is entirely absent', () => {
    delete globalThis.STIGMAN
    expect(isAppDataEnabled()).toBe(false)
  })

  it('returns false when the flag is the string "false"', () => {
    globalThis.STIGMAN = { Env: { experimental: { appData: 'false' } } }
    expect(isAppDataEnabled()).toBe(false)
  })

  it('returns false for any value other than the exact string "true"', () => {
    globalThis.STIGMAN = { Env: { experimental: { appData: true } } }
    expect(isAppDataEnabled()).toBe(false)
  })

  it('returns true only for the exact string "true"', () => {
    globalThis.STIGMAN = { Env: { experimental: { appData: 'true' } } }
    expect(isAppDataEnabled()).toBe(true)
  })
})
