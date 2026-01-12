import { saveAs } from 'file-saver-es'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiToCsv, handleInventoryExport } from '../exportMetricsUtils'

// Mock dependencies
vi.mock('file-saver-es', () => ({
  saveAs: vi.fn(),
}))

vi.mock('../../shared/serviceWorker.js', () => ({
  getDownloadUrl: vi.fn().mockResolvedValue(null),
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

  describe('apiToCsv', () => {
    it('should format simple fields correctly', () => {
      const data = [{ name: 'Asset1', ip: '1.2.3.4' }]
      const fields = [
        { apiProperty: 'name', header: 'Name' },
        { apiProperty: 'ip', header: 'IP' },
      ]
      const csv = apiToCsv(data, fields)
      expect(csv).toBe('Name,IP\nAsset1,1.2.3.4')
    })

    it('should escape fields with commas', () => {
      const data = [{ name: 'Asset,1', ip: '1.2.3.4' }]
      const fields = [
        { apiProperty: 'name', header: 'Name' },
        { apiProperty: 'ip', header: 'IP' },
      ]
      const csv = apiToCsv(data, fields)
      expect(csv).toBe('Name,IP\n"Asset,1",1.2.3.4')
    })

    it('should format delimited fields correctly', () => {
      const data = [{
        name: 'Asset1',
        stigs: [{ benchmarkId: 'STIG1' }, { benchmarkId: 'STIG2' }],
      }]
      const fields = [
        { apiProperty: 'name', header: 'Name' },
        { apiProperty: 'stigs', header: 'STIGs' },
      ]
      const csv = apiToCsv(data, fields, '\n')
      expect(csv).toContain('"STIG1\nSTIG2"')
    })
  })

  describe('handleInventoryExport', () => {
    it('should handle asset export with new fields', async () => {
      const mockAssets = [{
        assetId: '1',
        name: 'Asset1',
        noncomputing: true,
        metadata: { key: 'value' },
        labelIds: ['l1'],
      }]

      const mockLabels = [{ labelId: 'l1', name: 'Label1' }]

      // Mock fetch responses
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

      expect(text).toContain('TRUE') // noncomputing
      expect(text).toContain('Label1') // labels
      expect(text).toContain('"{""key"":""value""}"') // metadata (escaped JSON)
    })

    it('should include all headers even if fields are deselected (empty columns)', async () => {
      const mockAssets = [{
        assetId: '1',
        name: 'Asset1',
        ip: '1.2.3.4',
      }]
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
          // IP is NOT selected
        ],
        collectionId: 'col1',
        collectionName: 'Test',
        apiUrl: 'http://api',
        authToken: 'token',
        delimiter: 'comma',
      })

      expect(saveAs).toHaveBeenCalled()
      const blob = saveAs.mock.calls[0][0]
      const text = await blob.text()
      // Should have all headers
      expect(text).toContain('Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata')
      // Row: Name present, Description empty, IP empty (deselected), etc.
      // Asset1,,,,,,,,
      expect(text).toContain('Asset1,,,,,,,,')
    })
  })
})
