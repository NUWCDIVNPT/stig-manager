import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiCall } from '../../../shared/api/apiClient.js'
import { useAssetCsvImport } from '../composables/useAssetCsvImport.js'

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

  it('clears prior validAssets, newLabels, and serverErrors when a new file is parsed', async () => {
    parseMock.mockResolvedValue({
      assets: [{ name: 'new', CSVRow: 1 }],
      errors: {},
    })
    const c = useAssetCsvImport(getCollectionId)
    c.validAssets.value = [{ name: 'old' }]
    c.newLabels.value = [{ labelName: 'old-label' }]
    c.serverErrors.value = [{ row: 5, messages: 'old error' }]
    await c.parseFile('newfile')
    expect(c.parsedAssets.value).toEqual([{ name: 'new', CSVRow: 1 }])
    expect(c.validAssets.value).toEqual([])
    expect(c.newLabels.value).toEqual([])
    expect(c.serverErrors.value).toEqual([])
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
      detail: [{ failure: 'name exists', detail: { assetIndex: 2, name: 'badAsset' } }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [
      { name: 'goodAsset', CSVRow: 1 },
      { name: 'badAsset', CSVRow: 2 },
    ]
    await c.runDryRun()
    expect(c.serverErrors.value).toEqual([
      { row: 2, messages: 'Data error: name exists\n• Asset Affected: badAsset' },
    ])
    expect(c.validAssets.value).toEqual([{ name: 'goodAsset', CSVRow: 1 }])
  })

  // Regression: assetIndex is a 1-based JSON_TABLE ordinal, not an array index. Reading it
  // as 0-based put the error on the wrong row and let the bad asset through. The row is
  // resolved by name, so assetIndex must not influence which asset is blocked.
  it('resolves the CSV row by name, not by assetIndex', async () => {
    apiCall.mockResolvedValue({
      error: 'X',
      detail: [{
        failure: 'unknown benchmarkId',
        detail: { assetIndex: 2, name: 'bad', benchmarkIdIndex: 1, benchmarkId: 'NOPE' },
      }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [
      { name: 'good', CSVRow: 2 },
      { name: 'bad', CSVRow: 3 },
    ]
    await c.runDryRun()
    expect(c.serverErrors.value).toHaveLength(1)
    expect(c.serverErrors.value[0].row).toBe(3)
    expect(c.validAssets.value).toEqual([{ name: 'good', CSVRow: 2 }])
  })

  it('blocks a single-asset failure whose assetIndex is 1', async () => {
    apiCall.mockResolvedValue({
      error: 'X',
      detail: [{
        failure: 'unknown benchmarkId',
        detail: { assetIndex: 1, name: 'only', benchmarkIdIndex: 1, benchmarkId: 'NOPE' },
      }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'only', CSVRow: 2 }]
    await c.runDryRun()
    expect(c.serverErrors.value[0].row).toBe(2)
    expect(c.validAssets.value).toEqual([])
  })

  it('includes benchmarkId and benchmarkIdIndex lines when present', async () => {
    apiCall.mockResolvedValue({
      error: 'X',
      detail: [{
        failure: 'STIG missing',
        detail: { assetIndex: 1, name: 'a', benchmarkId: 'X', benchmarkIdIndex: 2 },
      }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1 }]
    await c.runDryRun()
    expect(c.serverErrors.value[0].messages).toBe(
      'Data error: STIG missing\n• Asset Affected: a\n• STIG Unknown: X\n• STIG Unknown Index: 2',
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

  // A server failure with no asset `name` cannot be tied to a specific row.
  // The unmatched-row sentinel must be null (not 0) so a real CSVRow=0 asset is not
  // accidentally dropped from validAssets.
  it('keeps every asset valid when the server error cannot be tied to a named row', async () => {
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
    expect(c.serverErrors.value).toEqual([
      { row: null, messages: 'Data error: global problem' },
    ])
  })

  // The matched-asset path must use blockedRows.has(CSVRow) correctly even when
  // CSVRow is 0 — Set membership on 0 is the boundary that's easy to break with
  // truthy checks.
  it('blocks an asset with CSVRow=0 when the server error names it', async () => {
    apiCall.mockResolvedValue({
      error: 'X',
      detail: [{ failure: 'Bad data', detail: { name: 'rowZero' } }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [
      { name: 'rowZero', CSVRow: 0 },
      { name: 'other', CSVRow: 1 },
    ]
    await c.runDryRun()
    expect(c.validAssets.value).toEqual([{ name: 'other', CSVRow: 1 }])
    expect(c.serverErrors.value).toEqual([
      { row: 0, messages: 'Data error: Bad data\n• Asset Affected: rowZero' },
    ])
  })

  it('does not call the API and short-circuits when parsedAssets is empty', async () => {
    const c = useAssetCsvImport(getCollectionId)
    c.newLabels.value = [{ labelName: 'stale' }]
    c.serverErrors.value = [{ row: 1, messages: 'stale' }]
    await c.runDryRun()
    expect(apiCall).not.toHaveBeenCalled()
  })

  // The "else" branch handles a non-204, non-error-shaped response (e.g. an
  // unexpected 200 body). It must clear stale newLabels/serverErrors from a
  // prior failing dry-run so the UI doesn't show orphaned errors.
  it('clears stale newLabels and serverErrors when the response is non-204 and not an error shape', async () => {
    apiCall.mockResolvedValue({ ok: true })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [{ name: 'a', CSVRow: 1 }]
    c.newLabels.value = [{ labelName: 'stale' }]
    c.serverErrors.value = [{ row: 99, messages: 'stale' }]
    await c.runDryRun()
    expect(c.validAssets.value).toEqual([{ name: 'a', CSVRow: 1 }])
    expect(c.newLabels.value).toEqual([])
    expect(c.serverErrors.value).toEqual([])
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

  // The non-dry-run POST also returns 200 ClientErrorBadAssetPost on validation failure
  // (e.g. an asset name taken between dry run and submit). Nothing was created, so submit
  // must not resolve as success; the failing row is surfaced and removed from validAssets.
  it('throws and records row errors when the real POST returns a validation error body', async () => {
    apiCall.mockResolvedValue({
      error: 'Validation Error',
      detail: [{ failure: 'name exists', detail: { assetIndex: 2, name: 'b' } }],
    })
    const c = useAssetCsvImport(getCollectionId)
    c.parsedAssets.value = [
      { name: 'a', CSVRow: 2 },
      { name: 'b', CSVRow: 3 },
    ]
    c.validAssets.value = [...c.parsedAssets.value]
    c.serverErrors.value = [{ row: 9, messages: 'earlier' }]
    await expect(c.submit()).rejects.toThrow('Validation Error')
    expect(c.serverErrors.value).toEqual([
      { row: 9, messages: 'earlier' },
      { row: 3, messages: 'Data error: name exists\n• Asset Affected: b' },
    ])
    expect(c.validAssets.value).toEqual([{ name: 'a', CSVRow: 2 }])
    expect(c.isSubmitting.value).toBe(false)
  })

  it('no-ops silently when canSubmit is false (no validAssets)', async () => {
    const c = useAssetCsvImport(getCollectionId)
    await c.submit()
    expect(apiCall).not.toHaveBeenCalled()
  })
})
