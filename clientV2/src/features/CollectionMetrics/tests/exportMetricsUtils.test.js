import { saveAs } from 'file-saver-es'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDownloadUrl } from '../../../shared/serviceWorker.js'
import { generateCsv, handleDownload, handleInventoryExport } from '../exportMetricsUtils'

// Mock dependencies
vi.mock('file-saver-es', () => ({
  saveAs: vi.fn(),
}))

const { triggerErrorMock } = vi.hoisted(() => {
  return { triggerErrorMock: vi.fn() }
})

vi.mock('../../../shared/serviceWorker.js', () => ({
  getDownloadUrl: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({
    triggerError: triggerErrorMock,
  }),
}))

// Mock Blob globally
globalThis.Blob = class MockBlob {
  constructor(content) {
    this.content = content
  }

  text() {
    return Promise.resolve(this.content.join(''))
  }
}

describe('exportMetricsUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateCsv', () => {
    it('should format simple fields correctly', () => {
      const data = [{ name: 'Asset1', ip: '1.2.3.4' }]
      const fields = [
        { apiProperty: 'name', header: 'Name' },
        { apiProperty: 'ip', header: 'IP' },
      ]
      const csv = generateCsv(data, fields)
      expect(csv).toBe('Name,IP\nAsset1,1.2.3.4')
    })

    it('should escape fields with commas', () => {
      const data = [{ name: 'Asset,1', ip: '1.2.3.4' }]
      const fields = [
        { apiProperty: 'name', header: 'Name' },
        { apiProperty: 'ip', header: 'IP' },
      ]
      const csv = generateCsv(data, fields)
      expect(csv).toBe('Name,IP\n"Asset,1",1.2.3.4')
    })

    it('should format list fields with provided delimiter', () => {
      const data = [{
        name: 'Asset1',
        stigs: ['STIG1', 'STIG2'],
      }]
      const fields = [
        { apiProperty: 'name', header: 'Name' },
        { apiProperty: 'stigs', header: 'STIGs' },
      ]
      const csv = generateCsv(data, fields, '\n')
      expect(csv).toContain('"STIG1\nSTIG2"')
    })

    it('should handle missing properties (strict header enforcement)', () => {
      const data = [{ name: 'Asset1' }]
      const fields = [
        { apiProperty: 'name', header: 'Name' },
        { apiProperty: 'missing', header: 'Skipped' },
      ]
      const csv = generateCsv(data, fields)
      expect(csv).toBe('Name,Skipped\nAsset1,')
    })
  })

  describe('handleInventoryExport', () => {
    it('should handle asset export with newly active fields and formats', async () => {
      const mockAssets = [{
        assetId: '1',
        name: 'Asset1',
        noncomputing: true,
        metadata: { key: 'value' },
        labelIds: ['l1'],
        stigs: [{ benchmarkId: 'STIG1' }],
      }]

      const mockLabels = [{ labelId: 'l1', name: 'Label1' }]

      globalThis.fetch
        .mockResolvedValueOnce({ // Assets fetch
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockAssets)),
          json: () => Promise.resolve(mockAssets),
        })
        .mockResolvedValueOnce({ // Labels fetch
          ok: true,
          json: () => Promise.resolve(mockLabels),
        })

      await handleInventoryExport({
        groupBy: 'asset',
        format: 'csv',
        csvFields: [
          { apiProperty: 'name', header: 'Name' },
          { apiProperty: 'noncomputing', header: 'Non-Computing' },
          { apiProperty: 'labels', header: 'Labels' },
          { apiProperty: 'metadata', header: 'Metadata' },
          { apiProperty: 'stigs', header: 'STIGs' },
        ],
        collectionId: 'col1',
        collectionName: 'TestCollection',
        apiUrl: 'http://api',
        authToken: 'token',
        delimiter: 'comma',
      })

      expect(saveAs).toHaveBeenCalled()
      const blob = saveAs.mock.calls[0][0]
      const text = await blob.text()

      expect(text).toContain('Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata')

      expect(text).toContain('TRUE')
      expect(text).toContain('Label1')
      expect(text).toContain('"{""key"":""value""}"')
      expect(text).toContain('STIG1')
    })

    it('should produce empty columns for deselected fields (strict mode)', async () => {
      const mockAssets = [{ name: 'Asset1' }]
      const mockLabels = []

      globalThis.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockAssets)),
          json: () => Promise.resolve(mockAssets),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockLabels),
        })

      await handleInventoryExport({
        groupBy: 'asset',
        format: 'csv',
        csvFields: [
          { apiProperty: 'name', header: 'Name' },
        ],
        collectionId: 'col1',
        collectionName: 'TestCollection',
        apiUrl: 'http://api',
        authToken: 'token',
      })

      const blob = saveAs.mock.calls[0][0]
      const text = await blob.text()

      expect(text).toContain('Name,Description,IP,FQDN,MAC')
      expect(text).toContain('Asset1,,,,,,,,')
    })

    it('should catch errors and call triggerError', async () => {
      globalThis.fetch.mockRejectedValue(new Error('Network error'))

      await handleInventoryExport({
        groupBy: 'asset',
        format: 'csv',
        csvFields: [],
        collectionId: 'col1',
        collectionName: 'TestCollection',
        apiUrl: 'http://api',
        authToken: 'token',
      })

      expect(triggerErrorMock).toHaveBeenCalledWith(expect.any(Error))
      expect(triggerErrorMock.mock.calls[0][0].message).toBe('Network error')
    })
  })

  describe('handleDownload', () => {
    const params = {
      format: 'csv',
      style: 'summary',
      aggregation: 'collection',
      collectionId: 'col1',
      collectionName: 'TestCollection',
      apiUrl: 'http://api',
      authToken: 'token',
    }

    it('should use service worker download if available', async () => {
      getDownloadUrl.mockResolvedValue('http://download-url')

      // Mock window.location
      const originalLocation = window.location

      // Note: In JSDOM, window.location is protected. We use Object.defineProperty to mockp it.
      Object.defineProperty(window, 'location', {
        writable: true,
        value: 'http://initial',
      })

      await handleDownload(params)

      expect(getDownloadUrl).toHaveBeenCalled()
      expect(window.location).toBe('http://download-url')
      expect(globalThis.fetch).not.toHaveBeenCalled()

      // Restore
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      })
    })

    it('should fallback to fetch if service worker returns null', async () => {
      getDownloadUrl.mockResolvedValue(null)
      globalThis.fetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['content'])),
      })

      await handleDownload(params)

      expect(getDownloadUrl).toHaveBeenCalled()
      expect(globalThis.fetch).toHaveBeenCalled()
      expect(saveAs).toHaveBeenCalled()
    })

    it('should handle fetch errors', async () => {
      getDownloadUrl.mockResolvedValue(null)
      globalThis.fetch.mockRejectedValue(new Error('Fetch failed'))

      await handleDownload(params)

      expect(triggerErrorMock).toHaveBeenCalledWith(expect.any(Error))
      expect(triggerErrorMock.mock.calls[0][0].message).toBe('Fetch failed')
    })
  })
})
