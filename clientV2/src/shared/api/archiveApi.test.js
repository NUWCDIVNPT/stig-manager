import { saveAs } from 'file-saver-es'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDownloadUrl } from '../serviceWorker.js'
import { archiveFilename, downloadArchive, stigRevisionSelections } from './archiveApi.js'

vi.mock('file-saver-es', () => ({ saveAs: vi.fn() }))
vi.mock('../serviceWorker.js', () => ({ getDownloadUrl: vi.fn() }))

const API_NAME = 'S_MyCollection-CKL_2026-10-30T1450Z.zip'
const args = { collectionId: '21', format: 'ckl', mode: 'mono', selections: [{ assetId: '1' }] }

function archiveResponse({ body = null } = {}) {
  return {
    ok: true,
    headers: new Headers({ 'Content-Disposition': `attachment; filename="${API_NAME}"` }),
    blob: () => Promise.resolve(new Blob(['zip'])),
    body,
  }
}

// Classification prefix in the ZIP name comes from the API, never the client.
describe('downloadArchive filename', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('sends no attachment override to the service worker', async () => {
    Object.defineProperty(window, 'location', { writable: true, value: 'http://initial' })
    getDownloadUrl.mockResolvedValue('http://download-url')

    const result = await downloadArchive(args)

    expect(result).toEqual({ via: 'service-worker' })
    expect(getDownloadUrl.mock.calls[0][0]).not.toHaveProperty('attachment')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('saves the fallback download under the API\'s prefixed name and returns it', async () => {
    getDownloadUrl.mockResolvedValue(null)
    globalThis.fetch.mockResolvedValue(archiveResponse())

    const result = await downloadArchive(args)

    expect(saveAs.mock.calls[0][1]).toBe(API_NAME)
    expect(result).toMatchObject({ via: 'fallback', filename: API_NAME })
  })

  it('keeps the prefixed name when streaming with progress', async () => {
    getDownloadUrl.mockResolvedValue(null)
    const chunks = [new Uint8Array([1, 2]), new Uint8Array([3])]
    const reader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: chunks[0] })
        .mockResolvedValueOnce({ done: false, value: chunks[1] })
        .mockResolvedValueOnce({ done: true }),
    }
    globalThis.fetch.mockResolvedValue(archiveResponse({ body: { getReader: () => reader } }))
    const onProgress = vi.fn()

    const result = await downloadArchive({ ...args, onProgress })

    expect(saveAs.mock.calls[0][1]).toBe(API_NAME)
    expect(result).toMatchObject({ via: 'stream', bytes: 3, filename: API_NAME })
    expect(onProgress).toHaveBeenLastCalledWith({ bytesReceived: 3, totalBytes: null })
  })
})

describe('archiveFilename', () => {
  const now = new Date('2026-03-05T14:23:45.678Z')

  it('formats name_format_timestamp.zip with the supplied date', () => {
    expect(archiveFilename('MyCollection', 'ckl', now))
      .toBe('MyCollection_ckl_2026-03-05T14-23-45-678.zip')
  })

  it('falls back to "collection" when name is empty / nullish', () => {
    expect(archiveFilename('', 'ckl', now)).toBe('collection_ckl_2026-03-05T14-23-45-678.zip')
    expect(archiveFilename(null, 'ckl', now)).toBe('collection_ckl_2026-03-05T14-23-45-678.zip')
    expect(archiveFilename(undefined, 'ckl', now)).toBe('collection_ckl_2026-03-05T14-23-45-678.zip')
  })

  it('replaces windows-illegal filename chars in the collection name with _', () => {
    expect(archiveFilename('a\\b/c:d*e?f"g<h>i|j', 'cklb', now))
      .toBe('a_b_c_d_e_f_g_h_i_j_cklb_2026-03-05T14-23-45-678.zip')
  })

  it('uses Date.now() by default when no date is supplied', () => {
    const name = archiveFilename('X', 'xccdf')
    expect(name).toMatch(/^X_xccdf_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}\.zip$/)
  })
})

describe('stigRevisionSelections', () => {
  it('pins each Asset to the one STIG revision, with string assetIds', () => {
    expect(stigRevisionSelections([{ assetId: 1 }, { assetId: '2' }], 'RHEL_8', 'V1R2')).toEqual([
      { assetId: '1', stigs: [{ benchmarkId: 'RHEL_8', revisionStr: 'V1R2' }] },
      { assetId: '2', stigs: [{ benchmarkId: 'RHEL_8', revisionStr: 'V1R2' }] },
    ])
  })

  it('returns an empty list for missing assets', () => {
    expect(stigRevisionSelections(null, 'RHEL_8', 'V1R2')).toEqual([])
  })
})
