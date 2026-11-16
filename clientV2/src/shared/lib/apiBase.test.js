import { describe, expect, it } from 'vitest'
import { appRootUrl } from '../../auth/oidcRedirect.js'
import { resolveApiBase } from './apiBase.js'

const origin = 'https://example.test'

// The app root as init.js derives it for a page under the /np/ path
const hashRoot = appRootUrl({ origin, pathname: '/np/client-v2/index.html', historyBase: '' })
const historyRoot = appRootUrl({ origin, pathname: '/np/client-v2/collections/12/stigs', historyBase: '/np/' })

describe('resolveApiBase', () => {
  it('resolves the default beside client-v2 at the origin root', () => {
    expect(resolveApiBase({ apiBase: 'api', appRoot: `${origin}/client-v2/` })).toBe(`${origin}/api`)
  })

  it('keeps a path prefix in hash mode', () => {
    expect(resolveApiBase({ apiBase: 'api', appRoot: hashRoot })).toBe(`${origin}/np/api`)
  })

  it('keeps a path prefix on a history mode deep link', () => {
    expect(resolveApiBase({ apiBase: 'api', appRoot: historyRoot })).toBe(`${origin}/np/api`)
  })

  it('resolves another relative value against the served path', () => {
    expect(resolveApiBase({ apiBase: 'stigapi', appRoot: hashRoot })).toBe(`${origin}/np/stigapi`)
    expect(resolveApiBase({ apiBase: 'stigapi', appRoot: historyRoot })).toBe(`${origin}/np/stigapi`)
  })

  it('uses an absolute path as given', () => {
    expect(resolveApiBase({ apiBase: '/np/api', appRoot: hashRoot })).toBe(`${origin}/np/api`)
    expect(resolveApiBase({ apiBase: '/other/api', appRoot: historyRoot })).toBe(`${origin}/other/api`)
  })

  it('uses a full URL as given', () => {
    expect(resolveApiBase({ apiBase: 'https://api.example.test/api', appRoot: hashRoot }))
      .toBe('https://api.example.test/api')
  })

  it('drops a trailing slash', () => {
    expect(resolveApiBase({ apiBase: '/np/api/', appRoot: hashRoot })).toBe(`${origin}/np/api`)
  })

  it('falls back to the default when the value is missing', () => {
    expect(resolveApiBase({ appRoot: `${origin}/client-v2/` })).toBe(`${origin}/api`)
  })

  it('uses the dev server proxy in development', () => {
    const appRoot = appRootUrl({ origin: 'http://localhost:5173', pathname: '/collections/12', historyBase: '', dev: true })
    expect(resolveApiBase({ apiBase: '/np/api', appRoot, dev: true })).toBe('http://localhost:5173/api')
  })
})
