import { describe, expect, it } from 'vitest'
import { resolveApiBase } from './apiBase.js'

const origin = 'https://example.test'

describe('resolveApiBase', () => {
  it('resolves the default beside client-v2 in hash mode', () => {
    expect(resolveApiBase({ apiBase: 'api', origin, href: `${origin}/client-v2/#/collections/12` }))
      .toBe(`${origin}/api`)
  })

  it('keeps a path prefix in hash mode', () => {
    expect(resolveApiBase({ apiBase: 'api', origin, href: `${origin}/np/client-v2/index.html` }))
      .toBe(`${origin}/np/api`)
  })

  it('resolves the default against the history base on a deep link', () => {
    expect(resolveApiBase({ apiBase: 'api', origin, href: `${origin}/np/client-v2/collections/12/stigs`, historyBase: '/np/' }))
      .toBe(`${origin}/np/api`)
  })

  it('resolves another relative value against the served path', () => {
    expect(resolveApiBase({ apiBase: 'stigapi', origin, href: `${origin}/np/client-v2/` }))
      .toBe(`${origin}/np/stigapi`)
    expect(resolveApiBase({ apiBase: 'stigapi', origin, href: `${origin}/np/client-v2/collections/12`, historyBase: '/np/' }))
      .toBe(`${origin}/np/stigapi`)
  })

  it('uses an absolute path as given', () => {
    expect(resolveApiBase({ apiBase: '/np/api', origin, href: `${origin}/np/client-v2/` }))
      .toBe(`${origin}/np/api`)
    expect(resolveApiBase({ apiBase: '/other/api', origin, href: `${origin}/np/client-v2/collections/12`, historyBase: '/np/' }))
      .toBe(`${origin}/other/api`)
  })

  it('uses a full URL as given', () => {
    expect(resolveApiBase({ apiBase: 'https://api.example.test/api', origin, href: `${origin}/client-v2/` }))
      .toBe('https://api.example.test/api')
  })

  it('drops a trailing slash', () => {
    expect(resolveApiBase({ apiBase: '/np/api/', origin, href: `${origin}/np/client-v2/` }))
      .toBe(`${origin}/np/api`)
  })

  it('falls back to the default when the value is missing', () => {
    expect(resolveApiBase({ origin, href: `${origin}/client-v2/` })).toBe(`${origin}/api`)
  })

  it('uses the dev server proxy in development', () => {
    expect(resolveApiBase({ apiBase: '/np/api', origin: 'http://localhost:5173', href: 'http://localhost:5173/collections/12', dev: true }))
      .toBe('http://localhost:5173/api')
  })
})
