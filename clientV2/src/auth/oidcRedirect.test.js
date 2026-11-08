import { describe, expect, it } from 'vitest'
import { appRootUrl, classifyCallback, restoreTarget } from './oidcRedirect.js'

describe('appRootUrl', () => {
  it('uses the history base in history mode, whatever path the user landed on', () => {
    expect(appRootUrl({ origin: 'https://h.test', pathname: '/stigman/client-v2/collection/12/stigs', historyBase: '/stigman/' }))
      .toBe('https://h.test/stigman/client-v2/')
  })

  it('works with a history base of / at the origin root', () => {
    expect(appRootUrl({ origin: 'https://h.test', pathname: '/client-v2/collection/12', historyBase: '/' }))
      .toBe('https://h.test/client-v2/')
  })

  it('uses the page directory in hash mode', () => {
    expect(appRootUrl({ origin: 'https://h.test', pathname: '/client-v2/', historyBase: '' }))
      .toBe('https://h.test/client-v2/')
    expect(appRootUrl({ origin: 'https://h.test', pathname: '/stigman/client-v2/index.html', historyBase: '' }))
      .toBe('https://h.test/stigman/client-v2/')
  })

  it('uses the origin root in development', () => {
    expect(appRootUrl({ origin: 'http://localhost:5173', pathname: '/collection/12', historyBase: '', dev: true }))
      .toBe('http://localhost:5173/')
  })
})

describe('classifyCallback', () => {
  it('treats an app query string as no callback', () => {
    expect(classifyCallback('?labelName=prod', 'abc')).toEqual({ type: 'none' })
    expect(classifyCallback('', 'abc')).toEqual({ type: 'none' })
  })

  it('treats code with a matching state as a callback', () => {
    expect(classifyCallback('?code=c1&state=abc&session_state=x', 'abc'))
      .toEqual({ type: 'callback', params: { code: 'c1', state: 'abc', session_state: 'x' } })
  })

  it('treats an error with a matching state as a callback', () => {
    expect(classifyCallback('?error=access_denied&error_description=no&state=abc', 'abc'))
      .toEqual({ type: 'callback', params: { error: 'access_denied', error_description: 'no', state: 'abc' } })
  })

  it('treats a response whose state does not match as stale', () => {
    expect(classifyCallback('?code=c1&state=old', 'abc')).toEqual({ type: 'stale' })
    expect(classifyCallback('?code=c1&state=old', null)).toEqual({ type: 'stale' })
    expect(classifyCallback('?error=x&state=old', 'abc')).toEqual({ type: 'stale' })
  })

  it('treats code or error without a state as no callback', () => {
    expect(classifyCallback('?code=c1', 'abc')).toEqual({ type: 'none' })
    expect(classifyCallback('?error=x', null)).toEqual({ type: 'none' })
  })
})

describe('restoreTarget', () => {
  const root = 'https://h.test/stigman/client-v2/'

  it('restores a stashed path, query and hash', () => {
    expect(restoreTarget('/stigman/client-v2/collection/12/stigs?labelName=prod', 'https://h.test', root))
      .toBe('https://h.test/stigman/client-v2/collection/12/stigs?labelName=prod')
    expect(restoreTarget('/client-v2/#/collection/12?labelName=prod', 'https://h.test', root))
      .toBe('https://h.test/client-v2/#/collection/12?labelName=prod')
  })

  it('falls back to the app root when nothing was stashed', () => {
    expect(restoreTarget(null, 'https://h.test', root)).toBe(root)
    expect(restoreTarget('', 'https://h.test', root)).toBe(root)
  })

  it('refuses a stash that leaves the origin', () => {
    expect(restoreTarget('//evil.test/x', 'https://h.test', root)).toBe(root)
    expect(restoreTarget('https://evil.test/x', 'https://h.test', root)).toBe(root)
  })
})
