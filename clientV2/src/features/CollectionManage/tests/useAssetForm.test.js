import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { fetchCollectionAssetSummary, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { fetchStigs } from '../../../shared/api/stigsApi.js'
import { createAsset, fetchAssetWithStigs, replaceAsset } from '../api/assetManageApi.js'
import { useAssetForm } from '../composables/useAssetForm.js'

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionAssetSummary: vi.fn(),
  fetchCollectionLabels: vi.fn(),
}))

vi.mock('../../../shared/api/stigsApi.js', () => ({
  fetchStigs: vi.fn(),
}))

vi.mock('../api/assetManageApi.js', () => ({
  createAsset: vi.fn(),
  replaceAsset: vi.fn(),
  fetchAssetWithStigs: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  fetchCollectionLabels.mockResolvedValue([])
  fetchStigs.mockResolvedValue([])
  fetchCollectionAssetSummary.mockResolvedValue([])
})

function setupCreate() {
  return useAssetForm({
    collectionId: ref('c1'),
    assetId: ref(null),
  })
}

function setupEdit(assetId = 'a1') {
  return useAssetForm({
    collectionId: ref('c1'),
    assetId: ref(assetId),
  })
}

describe('useAssetForm — derived state', () => {
  it('isEditMode reflects whether assetId is set', () => {
    expect(setupCreate().isEditMode.value).toBe(false)
    expect(setupEdit().isEditMode.value).toBe(true)
  })

  it('isValid requires a non-blank trimmed name', () => {
    const f = setupCreate()
    expect(f.isValid.value).toBe(false)
    f.form.name = '   '
    expect(f.isValid.value).toBe(false)
    f.form.name = 'asset-1'
    expect(f.isValid.value).toBe(true)
  })
})

describe('useAssetForm — label helpers', () => {
  function withLabels(labels) {
    const f = setupCreate()
    f.collectionLabels.value = labels
    return f
  }

  it('labels.getLabelById finds the matching label or returns undefined', () => {
    const f = withLabels([{ labelId: '1', name: 'prod' }, { labelId: '2', name: 'staging' }])
    expect(f.labels.getLabelById('1')).toEqual({ labelId: '1', name: 'prod' })
    expect(f.labels.getLabelById('missing')).toBeUndefined()
  })

  it('labels.labelColor uses normalizeColor with a #888888 default', () => {
    const f = setupCreate()
    expect(f.labels.labelColor({ color: 'ff0000' })).toBe('#ff0000')
    expect(f.labels.labelColor({ color: '#abcdef' })).toBe('#abcdef')
    expect(f.labels.labelColor(null)).toBe('#888888')
    expect(f.labels.labelColor({})).toBe('#888888')
  })
})

describe('useAssetForm — initialize / loadFormData', () => {
  it('clears every form field and reloads labels + stigs in create mode', async () => {
    fetchCollectionLabels.mockResolvedValue([{ labelId: '1', name: 'prod' }])
    fetchStigs.mockResolvedValue([{ benchmarkId: 'B1' }, { benchmarkId: 'B2' }])
    const f = setupCreate()
    // dirty the form first
    f.form.name = 'leftover'
    f.form.labelIds = ['stale']
    f.metadataRows.value = [{ key: 'k', value: 'v' }]
    f.assignedStigs.value = [{ benchmarkId: 'BX' }]

    await f.initialize()

    expect(f.form.name).toBe('')
    expect(f.form.labelIds).toEqual([])
    expect(f.metadataRows.value).toEqual([])
    expect(f.collectionLabels.value).toEqual([{ labelId: '1', name: 'prod' }])
    // available STIGs are surfaced via pickListValue ([available, assigned])
    expect(f.pickListValue.value[0]).toEqual([{ benchmarkId: 'B1' }, { benchmarkId: 'B2' }])
    expect(f.assignedStigs.value).toEqual([])
    expect(fetchAssetWithStigs).not.toHaveBeenCalled()
  })

  it('populates the form from the asset and partitions stigs in edit mode', async () => {
    fetchCollectionLabels.mockResolvedValue([{ labelId: '1', name: 'prod' }])
    fetchStigs.mockResolvedValue([
      { benchmarkId: 'B1' },
      { benchmarkId: 'B2' },
      { benchmarkId: 'B3' },
    ])
    fetchAssetWithStigs.mockResolvedValue({
      name: 'existing',
      noncomputing: true,
      fqdn: 'host.example',
      ip: '10.0.0.1',
      mac: 'aa:bb',
      labels: [{ labelId: '1' }],
      metadata: { foo: 'bar', baz: 'qux' },
      stigs: [{ benchmarkId: 'B1' }, { benchmarkId: 'B3' }],
    })

    const f = setupEdit('a1')
    await f.initialize()

    expect(f.form.name).toBe('existing')
    expect(f.form.noncomputing).toBe(true)
    expect(f.form.fqdn).toBe('host.example')
    expect(f.form.ip).toBe('10.0.0.1')
    expect(f.form.mac).toBe('aa:bb')
    expect(f.form.labelIds).toEqual(['1'])
    expect(f.metadataRows.value).toEqual([
      { key: 'foo', value: 'bar' },
      { key: 'baz', value: 'qux' },
    ])
    expect(f.assignedStigs.value.map(s => s.benchmarkId)).toEqual(['B1', 'B3'])
    expect(f.pickListValue.value[0].map(s => s.benchmarkId)).toEqual(['B2'])
  })

  it('handles missing fields on the loaded asset with sensible defaults', async () => {
    fetchAssetWithStigs.mockResolvedValue({})
    fetchCollectionLabels.mockResolvedValue([])
    fetchStigs.mockResolvedValue([])
    const f = setupEdit('a1')
    await f.initialize()
    expect(f.form.name).toBe('')
    expect(f.form.noncomputing).toBe(false)
    expect(f.form.labelIds).toEqual([])
    expect(f.metadataRows.value).toEqual([])
    expect(f.assignedStigs.value).toEqual([])
  })

  it('reacts to visible flipping true by running initialize', async () => {
    fetchCollectionLabels.mockResolvedValue([])
    fetchStigs.mockResolvedValue([])
    const visible = ref(false)
    useAssetForm({
      collectionId: ref('c1'),
      assetId: ref(null),
      visible,
    })
    expect(fetchCollectionLabels).not.toHaveBeenCalled()
    visible.value = true
    await nextTick()
    // initialize calls loadFormData which fires fetchCollectionLabels
    await Promise.resolve()
    expect(fetchCollectionLabels).toHaveBeenCalledTimes(1)
  })
})

describe('useAssetForm — buildPayload', () => {
  it('serializes the happy-path payload with trimmed name and label-id → name mapping', () => {
    const f = setupCreate()
    f.collectionLabels.value = [{ labelId: '1', name: 'prod' }, { labelId: '2', name: 'staging' }]
    f.form.name = '  asset-x  '
    f.form.noncomputing = true
    f.form.fqdn = 'h'
    f.form.ip = '1.2.3.4'
    f.form.mac = 'aa:bb'
    f.form.labelIds = ['1', '2']
    f.assignedStigs.value = [{ benchmarkId: 'B1' }, { benchmarkId: 'B2' }]
    f.metadataRows.value = [{ key: 'env', value: 'prod' }, { key: 'tier', value: '1' }]

    expect(f.buildPayload()).toEqual({
      name: 'asset-x',
      description: null,
      noncomputing: true,
      fqdn: 'h',
      ip: '1.2.3.4',
      mac: 'aa:bb',
      collectionId: 'c1',
      metadata: { env: 'prod', tier: '1' },
      stigs: ['B1', 'B2'],
      labelNames: ['prod', 'staging'],
    })
  })

  it('drops label ids that do not resolve to a known label', () => {
    const f = setupCreate()
    f.collectionLabels.value = [{ labelId: '1', name: 'prod' }]
    f.form.name = 'x'
    f.form.labelIds = ['1', 'unknown']
    expect(f.buildPayload().labelNames).toEqual(['prod'])
  })

  it('maps empty optional fields to null (not empty strings)', () => {
    const f = setupCreate()
    f.form.name = 'x'
    const p = f.buildPayload()
    expect(p.fqdn).toBeNull()
    expect(p.ip).toBeNull()
    expect(p.mac).toBeNull()
  })

  it('drops metadata rows with blank/whitespace-only keys but keeps blank values', () => {
    const f = setupCreate()
    f.form.name = 'x'
    f.metadataRows.value = [
      { key: 'good', value: 'v' },
      { key: '   ', value: 'orphaned' },
      { key: '', value: 'also orphaned' },
      { key: '  trimmed  ', value: '' },
    ]
    expect(f.buildPayload().metadata).toEqual({ good: 'v', trimmed: '' })
  })
})

describe('useAssetForm — save()', () => {
  it('returns null and does not call the API when the form is invalid', async () => {
    const f = setupCreate()
    const result = await f.save()
    expect(result).toBeNull()
    expect(createAsset).not.toHaveBeenCalled()
    expect(replaceAsset).not.toHaveBeenCalled()
  })

  it('creates the asset, fetches the metric summary, and returns the merged row', async () => {
    createAsset.mockResolvedValue({ assetId: 'new', collection: { collectionId: 'c1', name: 'Coll' } })
    fetchCollectionAssetSummary.mockResolvedValue([{ assetId: 'new', name: 'asset-x', metrics: { assessments: 5 } }])
    const f = setupCreate()
    f.form.name = 'asset-x'

    const row = await f.save()
    expect(createAsset).toHaveBeenCalledTimes(1)
    expect(replaceAsset).not.toHaveBeenCalled()
    expect(fetchCollectionAssetSummary).toHaveBeenCalledWith('c1', { assetId: 'new' })
    expect(row).toEqual({
      assetId: 'new',
      name: 'asset-x',
      metrics: { assessments: 5 },
      collection: { collectionId: 'c1', name: 'Coll' },
    })
  })

  it('uses replaceAsset in edit mode and forwards the assetId', async () => {
    replaceAsset.mockResolvedValue({ assetId: 'a1', collection: { collectionId: 'c1' } })
    fetchCollectionAssetSummary.mockResolvedValue([{ assetId: 'a1', name: 'edited' }])
    const f = setupEdit('a1')
    f.form.name = 'edited'

    await f.save()
    expect(replaceAsset).toHaveBeenCalledWith('a1', expect.objectContaining({ name: 'edited' }))
    expect(createAsset).not.toHaveBeenCalled()
  })

  it('returns null and sets nameError on a 409 (does NOT throw — caller stays open)', async () => {
    const err = Object.assign(new Error('conflict'), { status: 409 })
    createAsset.mockRejectedValue(err)
    const f = setupCreate()
    f.form.name = 'dupe'

    const result = await f.save()
    expect(result).toBeNull()
    expect(f.nameError.value).toMatch(/already exists/)
    expect(fetchCollectionAssetSummary).not.toHaveBeenCalled()
  })

  it('rethrows non-conflict errors and resets isSubmitting', async () => {
    const err = new Error('500 boom')
    createAsset.mockRejectedValue(err)
    const f = setupCreate()
    f.form.name = 'x'

    await expect(f.save()).rejects.toThrow('500 boom')
    expect(f.isSubmitting.value).toBe(false)
    expect(f.nameError.value).toBeNull()
  })

  it('clears a stale nameError before attempting save', async () => {
    createAsset.mockResolvedValue({ assetId: 'new', collection: { collectionId: 'c1' } })
    fetchCollectionAssetSummary.mockResolvedValue([{ assetId: 'new' }])
    const f = setupCreate()
    f.form.name = 'x'
    f.nameError.value = 'stale conflict'
    await f.save()
    expect(f.nameError.value).toBeNull()
  })

  it('toggles isSubmitting true → false across the call', async () => {
    let release
    createAsset.mockImplementation(() => new Promise((resolve) => {
      release = resolve
    }))
    const f = setupCreate()
    f.form.name = 'x'
    const p = f.save()
    await Promise.resolve()
    expect(f.isSubmitting.value).toBe(true)
    release({ assetId: 'new', collection: {} })
    fetchCollectionAssetSummary.mockResolvedValueOnce([])
    await p
    expect(f.isSubmitting.value).toBe(false)
  })

  it('returns a row with empty-object collection when summary is empty', async () => {
    createAsset.mockResolvedValue({ assetId: 'new', collection: { collectionId: 'c1' } })
    fetchCollectionAssetSummary.mockResolvedValue([])
    const f = setupCreate()
    f.form.name = 'x'
    const row = await f.save()
    expect(row).toEqual({ collection: { collectionId: 'c1' } })
  })
})
