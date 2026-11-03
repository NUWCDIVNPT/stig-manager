import { describe, expect, it } from 'vitest'
import { HOSTED_DOCS_URL, resolveDocsUrl } from './docsUrl.js'

describe('resolveDocsUrl', () => {
  it('places docs beside the api mount at the origin root', () => {
    expect(resolveDocsUrl('https://stigman.example.test/api')).toBe('https://stigman.example.test/docs/')
  })

  it('keeps a path prefix (STIGMAN_CLIENT_PATH_PREFIX)', () => {
    expect(resolveDocsUrl('https://example.test/stigman/api')).toBe('https://example.test/stigman/docs/')
  })

  it('tolerates a trailing slash on the api url', () => {
    expect(resolveDocsUrl('https://example.test/stigman/api/')).toBe('https://example.test/stigman/docs/')
  })

  it('points at the hosted documentation when the API does not serve docs', () => {
    expect(resolveDocsUrl('https://stigman.example.test/api', true)).toBe(HOSTED_DOCS_URL)
  })

  it('points at the hosted documentation when the api url is not absolute', () => {
    expect(resolveDocsUrl('undefined/api')).toBe(HOSTED_DOCS_URL)
  })
})
