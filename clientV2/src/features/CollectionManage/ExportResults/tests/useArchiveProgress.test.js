import { saveAs } from 'file-saver-es'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadArchive } from '../api/exportResultsApi.js'
import { useArchiveProgress } from '../composables/useArchiveProgress.js'

vi.mock('file-saver-es', () => ({ saveAs: vi.fn() }))
vi.mock('../api/exportResultsApi.js', () => ({ downloadArchive: vi.fn() }))

const args = { collectionId: '21', collectionName: 'My Coll', format: 'ckl', mode: 'mono', selections: [{ assetId: '1' }] }

describe('useArchiveProgress.download', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows no dialog for a service-worker download', async () => {
    downloadArchive.mockResolvedValue({ via: 'service-worker' })
    const archive = useArchiveProgress()

    await archive.download(args)

    expect(archive.visible.value).toBe(false)
    expect(downloadArchive.mock.calls[0][0]).toMatchObject({ collectionId: '21', format: 'ckl', mode: 'mono', selections: args.selections })
  })

  it('drives the dialog through a streamed download and adopts the saved name', async () => {
    downloadArchive.mockImplementation(async ({ onStreamStart, onProgress }) => {
      onStreamStart()
      onProgress({ bytesReceived: 5, totalBytes: 10 })
      return { via: 'stream', bytes: 10, totalBytes: 10, filename: 'U_My Coll-CKL_x.zip' }
    })
    const archive = useArchiveProgress()

    await archive.download(args)

    expect(archive.visible.value).toBe(true)
    expect(archive.progress.active).toBe(false)
    expect(archive.progress.filename).toBe('U_My Coll-CKL_x.zip')
    expect(archive.progress.log.at(-1)).toBe('Streaming is complete.')

    archive.saveLog()
    expect(saveAs.mock.calls[0][1]).toBe('U_My Coll-CKL_x.log.txt')
  })

  it('logs a failed download and lets the dialog close', async () => {
    downloadArchive.mockImplementation(async ({ onStreamStart }) => {
      onStreamStart()
      throw new Error('boom')
    })
    const archive = useArchiveProgress()

    await archive.download(args)

    expect(archive.progress.active).toBe(false)
    expect(archive.progress.log.at(-1)).toBe('Error: boom')
    archive.close()
    expect(archive.visible.value).toBe(false)
  })
})
