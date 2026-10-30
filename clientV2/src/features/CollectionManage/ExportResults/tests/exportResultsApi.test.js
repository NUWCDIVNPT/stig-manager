import { saveAs } from 'file-saver-es'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDownloadUrl } from '../../../../shared/serviceWorker.js'
import { downloadArchive } from '../api/exportResultsApi.js'

vi.mock('file-saver-es', () => ({ saveAs: vi.fn() }))
vi.mock('../../../../shared/serviceWorker.js', () => ({ getDownloadUrl: vi.fn() }))

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
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends no attachment override to the service worker', async () => {
    const originalLocation = window.location
    Object.defineProperty(window, 'location', { writable: true, value: 'http://initial' })
    getDownloadUrl.mockResolvedValue('http://download-url')

    const result = await downloadArchive(args)

    expect(result).toEqual({ via: 'service-worker' })
    expect(getDownloadUrl.mock.calls[0][0]).not.toHaveProperty('attachment')
    expect(globalThis.fetch).not.toHaveBeenCalled()
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('saves the fallback download under the API\'s prefixed name', async () => {
    getDownloadUrl.mockResolvedValue(null)
    globalThis.fetch.mockResolvedValue(archiveResponse())

    const result = await downloadArchive(args)

    expect(saveAs.mock.calls[0][1]).toBe(API_NAME)
    expect(result.filename).toBe(API_NAME)
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
