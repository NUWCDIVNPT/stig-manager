import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiCall } from '../../../shared/api/apiClient.js'
import { downloadPoam } from '../api/findingsApi.js'

vi.mock('../../../shared/api/apiClient.js', () => ({
  apiCall: vi.fn(),
}))

vi.mock('file-saver-es', () => ({
  saveAs: vi.fn(),
}))

const { saveAs } = await import('file-saver-es')

function mockResponse({ disposition = 'attachment; filename="poam.xlsx"' } = {}) {
  return {
    headers: { get: name => (name.toLowerCase() === 'content-disposition' ? disposition : null) },
    blob: vi.fn().mockResolvedValue(new Blob(['x'])),
  }
}

describe('downloadPoam', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiCall.mockResolvedValue(mockResponse())
  })

  it('requires a collectionId', async () => {
    await expect(downloadPoam(null, { format: 'EMASS' })).rejects.toThrow(/collectionId/)
  })

  it('drops empty params and MCCAST fields for EMASS, requesting the raw response', async () => {
    await downloadPoam('42', {
      aggregator: 'groupId',
      format: 'EMASS',
      date: '08/19/2026',
      status: 'Ongoing',
      office: 'My Office',
      mccastPackageId: 'PKG',
      mccastAuthName: '',
    })

    expect(apiCall).toHaveBeenCalledWith(
      'getPoamByCollection',
      { collectionId: '42', aggregator: 'groupId', format: 'EMASS', date: '08/19/2026', status: 'Ongoing', office: 'My Office' },
      undefined,
      { responseType: 'response' },
    )
  })

  it('drops the office field for MCCAST', async () => {
    await downloadPoam('7', {
      aggregator: 'ruleId',
      format: 'MCCAST',
      office: 'Should be dropped',
      mccastPackageId: 'PKG',
      mccastAuthName: 'Auth',
    })

    const params = apiCall.mock.calls[0][1]
    expect(params).not.toHaveProperty('office')
    expect(params).toMatchObject({ mccastPackageId: 'PKG', mccastAuthName: 'Auth', format: 'MCCAST' })
  })

  it('saves the blob using the Content-Disposition filename', async () => {
    await downloadPoam('1', { format: 'EMASS' })
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'poam.xlsx')
  })

  it('falls back to a default filename when the header is missing', async () => {
    apiCall.mockResolvedValue(mockResponse({ disposition: null }))
    await downloadPoam('99', { format: 'EMASS' })
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'poam-99.xlsx')
  })

  it('takes the Content-Disposition filename verbatim (a literal % is not decoded)', async () => {
    apiCall.mockResolvedValue(mockResponse({ disposition: 'attachment; filename="50% Complete POAM.xlsx"' }))
    await downloadPoam('1', { format: 'EMASS' })
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), '50% Complete POAM.xlsx')
  })
})
