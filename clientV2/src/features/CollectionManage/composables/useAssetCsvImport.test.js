import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiCall } from '../../../shared/api/apiClient.js'
import { useAssetCsvImport } from './useAssetCsvImport.js'

vi.mock('../../../shared/api/apiClient.js', () => ({
  apiCall: vi.fn(),
}))

const { parseMock } = vi.hoisted(() => ({ parseMock: vi.fn() }))
vi.mock('@nuwcdivnpt/stig-manager-client-modules', () => ({
  AssetParser: class {
    parse(...args) { return parseMock(...args) }
  },
}))

const COLLECTION_ID = 'col-1'
const getCollectionId = () => COLLECTION_ID

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAssetCsvImport — initial state', () => {
  it('starts empty with a "none" status and canSubmit=false', () => {
    const c = useAssetCsvImport(getCollectionId)
    expect(c.parsedAssets.value).toEqual([])
    expect(c.parserErrors.value).toEqual({})
    expect(c.validAssets.value).toEqual([])
    expect(c.newLabels.value).toEqual([])
    expect(c.serverErrors.value).toEqual([])
    expect(c.isValidating.value).toBe(false)
    expect(c.isSubmitting.value).toBe(false)
    expect(c.status.value.kind).toBe('none')
    expect(c.canSubmit.value).toBe(false)
    expect(c.errorCount.value).toBe(0)
    expect(c.allErrors.value).toEqual([])
  })
})

describe('useAssetCsvImport — reset', () => {
  it('clears every piece of in-memory state', () => {
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1 }]
    c.parserErrors.value = { 2: ['bad'] }
    c.validAssets.value = [{ name: 'b' }]
    c.newLabels.value = [{ labelName: 'x' }]
    c.serverErrors.value = [{ row: 1, messages: 'e' }]
    c.reset()
    expect(c.parsedAssets.value).toEqual([])
    expect(c.parserErrors.value).toEqual({})
    expect(c.validAssets.value).toEqual([])
    expect(c.newLabels.value).toEqual([])
    expect(c.serverErrors.value).toEqual([])
  })
})

describe('useAssetCsvImport — parseFile', () => {
  it('populates parsedAssets and parserErrors from the parser result', async () => {
    parseMock.mockResolvedValue({
      assets: [{ name: 'a', CSVRow: 1 }],
      errors: { 2: ['oops'] },
    })
    const c = useAssetCsvImport(getCollectionId)
    await c.parseFile('fakefile')
    expect(c.parsedAssets.value).toEqual([{ name: 'a', CSVRow: 1 }])
    expect(c.parserErrors.value).toEqual({ 2: ['oops'] })
  })

  it('defaults to [] and {} when parser returns nothing for those fields', async () => {
    parseMock.mockResolvedValue({})
    const c = useAssetCsvImport(getCollectionId)
    await c.parseFile('f')
    expect(c.parsedAssets.value).toEqual([])
    expect(c.parserErrors.value).toEqual({})
  })

  it('rethrows parser errors', async () => {
    parseMock.mockRejectedValue(new Error('boom'))
    const c = useAssetCsvImport(getCollectionId)
    await expect(c.parseFile('f')).rejects.toThrow('boom')
  })
})

describe('useAssetCsvImport — groupedParserErrors', () => {
  it('joins messages with newlines and parses row as a number', () => {
    const c = useAssetCsvImport(getCollectionId)
    c.parserErrors.value = { 3: ['one', 'two'], 7: ['three'] }
    expect(c.groupedParserErrors.value).toEqual([
      { row: 3, messages: 'one\ntwo' },
      { row: 7, messages: 'three' },
    ])
  })
})

describe('useAssetCsvImport — allErrors / errorCount', () => {
  it('concatenates parser errors and server errors', () => {
    const c = useAssetCsvImport(getCollectionId)
    c.parserErrors.value = { 1: ['p'] }
    c.serverErrors.value = [{ row: 2, messages: 's' }]
    expect(c.allErrors.value).toEqual([
      { row: 1, messages: 'p' },
      { row: 2, messages: 's' },
    ])
    expect(c.errorCount.value).toBe(2)
  })
})

describe('useAssetCsvImport — status', () => {
  it('reports "parsing" while isValidating is true (overrides everything else)', () => {
    const c = useAssetCsvImport(getCollectionId)
    c.validAssets.value = [{ name: 'a' }]
    c.serverErrors.value = [{ row: 1, messages: 'x' }]
    c.isValidating.value = true
    expect(c.status.value.kind).toBe('parsing')
  })

  it('reports "valid" with only valid assets', () => {
    const c = useAssetCsvImport(getCollectionId)
    c.validAssets.value = [{ name: 'a' }]
    expect(c.status.value.kind).toBe('valid')
  })

  it('reports "mixed" with valid assets AND errors', () => {
    const c = useAssetCsvImport(getCollectionId)
    c.validAssets.value = [{ name: 'a' }]
    c.serverErrors.value = [{ row: 1, messages: 'x' }]
    expect(c.status.value.kind).toBe('mixed')
  })

  it('reports "invalid" with only errors', () => {
    const c = useAssetCsvImport(getCollectionId)
    c.serverErrors.value = [{ row: 1, messages: 'x' }]
    expect(c.status.value.kind).toBe('invalid')
  })

  it('reports "none" on empty state', () => {
    const c = useAssetCsvImport(getCollectionId)
    expect(c.status.value.kind).toBe('none')
  })
})

describe('useAssetCsvImport — canSubmit', () => {
  it('is only true when validAssets exist and neither isValidating nor isSubmitting', () => {
    const c = useAssetCsvImport(getCollectionId)
    expect(c.canSubmit.value).toBe(false)

    c.validAssets.value = [{ name: 'a' }]
    expect(c.canSubmit.value).toBe(true)

    c.isValidating.value = true
    expect(c.canSubmit.value).toBe(false)
    c.isValidating.value = false

    c.isSubmitting.value = true
    expect(c.canSubmit.value).toBe(false)
  })
})

describe('useAssetCsvImport — runDryRun (happy paths)', () => {
  it('204-style empty response marks every parsedAsset valid and clears prior labels/serverErrors', async () => {
    apiCall.mockResolvedValue(null)
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1 }]
    c.newLabels.value = [{ labelName: 'stale' }]
    c.serverErrors.value = [{ row: 99, messages: 'stale' }]
    await c.runDryRun()
    expect(c.validAssets.value).toEqual([{ name: 'a', CSVRow: 1 }])
    expect(c.newLabels.value).toEqual([])
    expect(c.serverErrors.value).toEqual([])
  })

  it('strips CSVRow from the payload sent to apiCall and sets dryRun=true', async () => {
    apiCall.mockResolvedValue(null)
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1, ip: '1.1.1.1' }]
    await c.runDryRun()
    expect(apiCall).toHaveBeenCalledWith(
      'createAssets',
      { collectionId: COLLECTION_ID, dryRun: true },
      [{ name: 'a', ip: '1.1.1.1' }],
    )
  })

  it('toggles isValidating true → false across the call', async () => {
    let inFlight
    apiCall.mockImplementation(() => new Promise((resolve) => { inFlight = resolve }))
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1 }]
    const p = c.runDryRun()
    expect(c.isValidating.value).toBe(true)
    inFlight(null)
    await p
    expect(c.isValidating.value).toBe(false)
  })
})

describe('useAssetCsvImport — runDryRun (server failure shapes)', () => {
  it('extracts label-only detail items into newLabels without blocking assets', async () => {
    apiCall.mockResolvedValue({
      error: 'X',
      detail: [{ detail: { labelName: 'NEW-LABEL' } }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1 }]
    await c.runDryRun()
    expect(c.newLabels.value).toEqual([{ labelName: 'NEW-LABEL' }])
    expect(c.serverErrors.value).toEqual([])
    expect(c.validAssets.value).toEqual([{ name: 'a', CSVRow: 1 }])
  })

  it('deduplicates labelNames across multiple detail items', async () => {
    apiCall.mockResolvedValue({
      error: 'X',
      detail: [
        { detail: { labelName: 'DUP' } },
        { detail: { labelName: 'DUP' } },
        { detail: { labelName: 'OTHER' } },
      ],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1 }]
    await c.runDryRun()
    expect(c.newLabels.value).toEqual([{ labelName: 'DUP' }, { labelName: 'OTHER' }])
  })

  it('maps a named-asset failure to the matching CSV row and blocks only that asset', async () => {
    apiCall.mockResolvedValue({
      error: 'X',
      detail: [{ failure: 'Bad data', detail: { name: 'badAsset' } }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [
      { name: 'goodAsset', CSVRow: 1 },
      { name: 'badAsset', CSVRow: 2 },
    ]
    await c.runDryRun()
    expect(c.serverErrors.value).toEqual([
      { row: 2, messages: 'Data error: Bad data\n• Asset Affected: badAsset' },
    ])
    expect(c.validAssets.value).toEqual([{ name: 'goodAsset', CSVRow: 1 }])
  })

  it('includes benchmarkId and benchmarkIdIndex lines when present', async () => {
    apiCall.mockResolvedValue({
      error: 'X',
      detail: [{
        failure: 'STIG missing',
        detail: { name: 'a', benchmarkId: 'X', benchmarkIdIndex: 0 },
      }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1 }]
    await c.runDryRun()
    expect(c.serverErrors.value[0].messages).toBe(
      'Data error: STIG missing\n• Asset Affected: a\n• STIG Unknown: X\n• STIG Unknown Index: 0',
    )
  })
})

describe('useAssetCsvImport — runDryRun (error handling & edge cases)', () => {
  it('rethrows API errors and clears validAssets while resetting isValidating', async () => {
    apiCall.mockRejectedValue(new Error('network down'))
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1 }]
    await expect(c.runDryRun()).rejects.toThrow('network down')
    expect(c.validAssets.value).toEqual([])
    expect(c.isValidating.value).toBe(false)
  })

  // EDGE CASE — short-circuit on empty parsedAssets should also clear stale labels/serverErrors,
  // otherwise the UI will display stale errors that no longer correspond to anything.
  it('clears stale labels AND serverErrors when parsedAssets is empty', async () => {
    const c = useAssetCsvImport(getCollectionId)
    c.newLabels.value = [{ labelName: 'stale' }]
    c.serverErrors.value = [{ row: 1, messages: 'stale' }]
    await c.runDryRun()
    expect(c.validAssets.value).toEqual([])
    expect(c.newLabels.value).toEqual([])
    expect(c.serverErrors.value).toEqual([])
  })

  // EDGE CASE — a server failure with no `name` field falls back to csvRow=0. If any
  // real asset happens to have CSVRow=0, it gets incorrectly dropped.
  it('does not falsely block an asset with CSVRow=0 when the server error has no asset name', async () => {
    apiCall.mockResolvedValue({
      error: 'X',
      detail: [{ failure: 'global problem', detail: {} }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [
      { name: 'a', CSVRow: 0 },
      { name: 'b', CSVRow: 2 },
    ]
    await c.runDryRun()
    expect(c.validAssets.value).toEqual([
      { name: 'a', CSVRow: 0 },
      { name: 'b', CSVRow: 2 },
    ])
  })
})

describe('useAssetCsvImport — submit', () => {
  it('creates labels first then assets (assets sent without CSVRow)', async () => {
    apiCall.mockResolvedValue(null)
    const c = useAssetCsvImport(getCollectionId)
    c.validAssets.value = [{ name: 'a', CSVRow: 1, ip: '1.1.1.1' }]
    c.newLabels.value = [{ labelName: 'NEW' }]
    await c.submit()
    expect(apiCall).toHaveBeenNthCalledWith(
      1,
      'createCollectionLabels',
      { collectionId: COLLECTION_ID },
      [{ name: 'NEW', description: '', color: '4568F2' }],
    )
    expect(apiCall).toHaveBeenNthCalledWith(
      2,
      'createAssets',
      { collectionId: COLLECTION_ID },
      [{ name: 'a', ip: '1.1.1.1' }],
    )
  })

  it('skips the label call when there are no new labels', async () => {
    apiCall.mockResolvedValue(null)
    const c = useAssetCsvImport(getCollectionId)
    c.validAssets.value = [{ name: 'a', CSVRow: 1 }]
    await c.submit()
    expect(apiCall).toHaveBeenCalledTimes(1)
    expect(apiCall).toHaveBeenCalledWith(
      'createAssets',
      { collectionId: COLLECTION_ID },
      [{ name: 'a' }],
    )
  })

  it('rethrows on failure and resets isSubmitting', async () => {
    apiCall.mockRejectedValue(new Error('500'))
    const c = useAssetCsvImport(getCollectionId)
    c.validAssets.value = [{ name: 'a', CSVRow: 1 }]
    await expect(c.submit()).rejects.toThrow('500')
    expect(c.isSubmitting.value).toBe(false)
  })

  it('no-ops silently when canSubmit is false (no validAssets)', async () => {
    const c = useAssetCsvImport(getCollectionId)
    await c.submit()
    expect(apiCall).not.toHaveBeenCalled()
  })
})
