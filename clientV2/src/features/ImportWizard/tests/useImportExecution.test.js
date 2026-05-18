import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const createAssetMock = vi.fn()
const updateAssetMock = vi.fn()
const postReviewsByAssetMock = vi.fn()

vi.mock('../api/importResultsApi.js', () => ({
  createAsset: (...args) => createAssetMock(...args),
  updateAsset: (...args) => updateAssetMock(...args),
  postReviewsByAsset: (...args) => postReviewsByAssetMock(...args),
}))

let useImportExecution

beforeEach(async () => {
  createAssetMock.mockReset()
  updateAssetMock.mockReset()
  postReviewsByAssetMock.mockReset()
  ;({ useImportExecution } = await import('../composables/useImportExecution.js'))
})

afterEach(() => {
  vi.resetModules()
})

function buildTaskAssets(assets) {
  const map = new Map()
  for (const [k, ta] of Object.entries(assets)) { map.set(k, ta) }
  return map
}

function makeChecklist(benchmarkId, reviews = []) {
  return { benchmarkId, reviews }
}

function makeAsset({
  name = 'host-a',
  assetId,
  collectionId = '9',
  knownAsset = true,
  hasNewAssignment = false,
  hasUpdatedAssetProps = false,
  stigs = [],
  ip = '1.1.1.1',
  fqdn = 'host.a',
  mac = 'aa:bb',
  noncomputing = false,
  metadata = { tag: 'x' },
  checklists = [],
} = {}) {
  const resolvedAssetId = assetId !== undefined ? assetId : (knownAsset ? 100 : null)
  const checklistMap = new Map()
  for (const c of checklists) {
    if (!checklistMap.has(c.benchmarkId)) { checklistMap.set(c.benchmarkId, []) }
    checklistMap.get(c.benchmarkId).push(c)
  }
  return {
    assetProps: { name, assetId: resolvedAssetId, collectionId, stigs, ip, fqdn, mac, noncomputing, metadata },
    knownAsset,
    hasNewAssignment,
    hasUpdatedAssetProps,
    checklists: checklistMap,
  }
}

function setup({ taskAssetsObj, importOptions = {}, allowNewObjects = true, canUpdateAssetProps = true, collectionId = '9', onImported } = {}) {
  const parseResults = ref({ taskAssets: buildTaskAssets(taskAssetsObj ?? {}) })
  const optionsRef = ref(importOptions)
  const newObjs = ref(allowNewObjects)
  const ex = useImportExecution({
    collectionId,
    canUpdateAssetProps,
    parseResults,
    importOptions: optionsRef,
    allowNewObjects: newObjs,
    onImported,
  })
  return { parseResults, optionsRef, allowNewObjects: newObjs, ...ex }
}

describe('useImportExecution', () => {
  describe('initial state', () => {
    it('starts blank', () => {
      const e = setup({ taskAssetsObj: {} })
      expect(e.importProgressText.value).toBe('')
      expect(e.importStatusRows.value).toEqual([])
      expect(e.importIsDone.value).toBe(false)
      expect(e.selectedStatusRow.value).toBeNull()
    })
  })

  describe('runImport - asset writes', () => {
    it('creates a new asset when knownAsset is false', async () => {
      createAssetMock.mockResolvedValue({ assetId: 555, name: 'host-a' })
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })

      const e = setup({
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: false,
            checklists: [makeChecklist('B1', [{ id: 'r1' }])],
          }),
        },
      })
      await e.runImport()

      expect(createAssetMock).toHaveBeenCalledTimes(1)
      expect(updateAssetMock).not.toHaveBeenCalled()
      expect(postReviewsByAssetMock).toHaveBeenCalledWith('9', 555, [{ id: 'r1' }], expect.objectContaining({ signal: expect.any(AbortSignal) }))
      expect(e.importStatusRows.value[0]).toMatchObject({ assetId: 555, created: true, addedStigs: false })
    })

    it('updates an existing asset when it has a new STIG assignment', async () => {
      updateAssetMock.mockResolvedValue({ assetId: 100, name: 'host-a' })
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 1, updated: 2 }, rejected: [] })

      const e = setup({
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: true,
            hasNewAssignment: true,
            stigs: ['S1'],
            checklists: [makeChecklist('B1', [{ id: 'r1' }])],
          }),
        },
      })
      await e.runImport()
      expect(updateAssetMock).toHaveBeenCalledWith(100, { collectionId: '9', stigs: ['S1'] }, expect.objectContaining({ signal: expect.any(AbortSignal) }))
      expect(createAssetMock).not.toHaveBeenCalled()
      expect(e.importStatusRows.value[0]).toMatchObject({ created: false, addedStigs: true, inserted: 1, updated: 2 })
    })

    it('updates asset props only when updateAssetProps option AND canUpdateAssetProps are both true', async () => {
      updateAssetMock.mockResolvedValue({ assetId: 100, name: 'host-a' })
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })

      const e = setup({
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: true,
            hasUpdatedAssetProps: true,
            checklists: [makeChecklist('B1', [{ id: 'r1' }])],
          }),
        },
        importOptions: { updateAssetProps: true },
        canUpdateAssetProps: true,
      })
      await e.runImport()
      expect(updateAssetMock).toHaveBeenCalledWith(100, {
        collectionId: '9',
        ip: '1.1.1.1',
        fqdn: 'host.a',
        mac: 'aa:bb',
        noncomputing: false,
        metadata: { tag: 'x' },
      }, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    })

    it('skips asset write when only hasUpdatedAssetProps but option is disabled', async () => {
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: true,
            hasUpdatedAssetProps: true,
            checklists: [makeChecklist('B1', [{ id: 'r1' }])],
          }),
        },
        importOptions: { updateAssetProps: false },
        canUpdateAssetProps: true,
      })
      await e.runImport()
      expect(updateAssetMock).not.toHaveBeenCalled()
      expect(createAssetMock).not.toHaveBeenCalled()
    })

    it('skips asset write when option is enabled but canUpdateAssetProps is false', async () => {
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: true,
            hasUpdatedAssetProps: true,
            checklists: [makeChecklist('B1', [{ id: 'r1' }])],
          }),
        },
        importOptions: { updateAssetProps: true },
        canUpdateAssetProps: false,
      })
      await e.runImport()
      expect(updateAssetMock).not.toHaveBeenCalled()
    })

    it('does not write any new assets when allowNewObjects is false', async () => {
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: false,
            checklists: [makeChecklist('B1', [{ id: 'r1' }])],
          }),
        },
        allowNewObjects: false,
      })
      await e.runImport()
      expect(createAssetMock).not.toHaveBeenCalled()
    })

    it('skips an unknown asset (no review post) when allowNewObjects is false', async () => {
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: false,
            checklists: [makeChecklist('B1', [{ id: 'r1' }])],
          }),
        },
        allowNewObjects: false,
      })
      await e.runImport()
      expect(createAssetMock).not.toHaveBeenCalled()
      expect(postReviewsByAssetMock).not.toHaveBeenCalled()
      expect(e.importStatusRows.value).toHaveLength(1)
      expect(e.importStatusRows.value[0]).toMatchObject({
        assetId: null,
        inserted: 0,
        updated: 0,
        rejected: [],
      })
      expect(e.importStatusRows.value[0].error).toBeTruthy()
    })

    it('uses ref values for canUpdateAssetProps', async () => {
      updateAssetMock.mockResolvedValue({ assetId: 100, name: 'host-a' })
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })

      const canUpdate = ref(true)
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: true,
            hasUpdatedAssetProps: true,
            checklists: [makeChecklist('B1', [{ id: 'r1' }])],
          }),
        },
        importOptions: { updateAssetProps: true },
        canUpdateAssetProps: canUpdate,
      })
      await e.runImport()
      expect(updateAssetMock).toHaveBeenCalled()
    })

    it('unwraps a ref-shaped collectionId in postReviewsByAsset', async () => {
      updateAssetMock.mockResolvedValue({ assetId: 100, name: 'host-a' })
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })

      const collectionId = ref('99')
      const e = setup({
        collectionId,
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: true,
            hasNewAssignment: true,
            stigs: ['S1'],
            checklists: [makeChecklist('B1', [{ id: 'r1' }])],
          }),
        },
      })
      await e.runImport()
      expect(postReviewsByAssetMock).toHaveBeenCalledWith('99', 100, [{ id: 'r1' }], expect.objectContaining({ signal: expect.any(AbortSignal) }))
    })
  })

  describe('runImport - reviews', () => {
    it('aggregates reviews across all benchmark checklists for the asset', async () => {
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 3, updated: 1 }, rejected: ['r-bad'] })

      const e = setup({
        taskAssetsObj: {
          a: makeAsset({
            knownAsset: true,
            checklists: [
              makeChecklist('B1', [{ id: 'a' }, { id: 'b' }]),
              makeChecklist('B2', [{ id: 'c' }]),
            ],
          }),
        },
      })
      await e.runImport()
      const reviewsArg = postReviewsByAssetMock.mock.calls[0][2]
      expect(reviewsArg).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
      expect(e.importStatusRows.value[0]).toMatchObject({ inserted: 3, updated: 1, rejected: ['r-bad'] })
    })

    it('skips postReviewsByAsset when there are no reviews', async () => {
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({ knownAsset: true, checklists: [makeChecklist('B1', [])] }),
        },
      })
      await e.runImport()
      expect(postReviewsByAssetMock).not.toHaveBeenCalled()
      expect(e.importStatusRows.value[0]).toMatchObject({ inserted: 0, updated: 0, rejected: [] })
    })

    it('uses the freshly created assetId when posting reviews', async () => {
      createAssetMock.mockResolvedValue({ assetId: 9001, name: 'fresh' })
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({ knownAsset: false, assetId: null, checklists: [makeChecklist('B1', [{ id: 'r' }])] }),
        },
      })
      await e.runImport()
      expect(postReviewsByAssetMock).toHaveBeenCalledWith('9', 9001, [{ id: 'r' }], expect.objectContaining({ signal: expect.any(AbortSignal) }))
    })
  })

  describe('runImport - error handling', () => {
    it('records an error row when asset creation fails and skips review post', async () => {
      createAssetMock.mockRejectedValue(new Error('create fail'))
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({ knownAsset: false, checklists: [makeChecklist('B1', [{ id: 'r' }])] }),
        },
      })
      await e.runImport()
      expect(postReviewsByAssetMock).not.toHaveBeenCalled()
      expect(e.importStatusRows.value[0]).toMatchObject({ error: 'create fail', inserted: 0, updated: 0, rejected: [] })
    })

    it('records an error row when review post fails but keeps known assetId', async () => {
      postReviewsByAssetMock.mockRejectedValue(new Error('reviews fail'))
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({ knownAsset: true, checklists: [makeChecklist('B1', [{ id: 'r' }])] }),
        },
      })
      await e.runImport()
      expect(e.importStatusRows.value[0]).toMatchObject({
        assetId: 100,
        error: 'reviews fail',
        inserted: 0,
        updated: 0,
        rejected: [],
      })
    })

    it('continues processing remaining assets after one fails', async () => {
      postReviewsByAssetMock
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ affected: { inserted: 1, updated: 0 }, rejected: [] })

      const e = setup({
        taskAssetsObj: {
          a: makeAsset({ name: 'a', assetId: 1, knownAsset: true, checklists: [makeChecklist('B1', [{ id: 'r' }])] }),
          b: makeAsset({ name: 'b', assetId: 2, knownAsset: true, checklists: [makeChecklist('B1', [{ id: 'r' }])] }),
        },
      })
      await e.runImport()
      expect(e.importStatusRows.value).toHaveLength(2)
      expect(e.importStatusRows.value[0].error).toBe('boom')
      expect(e.importStatusRows.value[1].error).toBeUndefined()
      expect(e.importStatusRows.value[1].inserted).toBe(1)
    })
  })

  describe('runImport - finalization', () => {
    it('sets importIsDone, fires onImported and updates progress text', async () => {
      const onImported = vi.fn()
      const e = setup({ taskAssetsObj: {}, onImported })
      expect(e.importIsDone.value).toBe(false)
      await e.runImport()
      expect(e.importIsDone.value).toBe(true)
      expect(e.importProgressText.value).toBe('Finished')
      expect(onImported).toHaveBeenCalledTimes(1)
    })

    it('does not throw when onImported is omitted', async () => {
      const e = setup({ taskAssetsObj: {} })
      await expect(e.runImport()).resolves.toBeUndefined()
    })

    it('resets importStatusRows between runs', async () => {
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({ knownAsset: true, checklists: [makeChecklist('B1', [{ id: 'r' }])] }),
        },
      })
      await e.runImport()
      expect(e.importStatusRows.value).toHaveLength(1)
      // second run with same state should not append on top
      await e.runImport()
      expect(e.importStatusRows.value).toHaveLength(1)
    })
  })

  describe('reset', () => {
    it('clears every reactive field', async () => {
      postReviewsByAssetMock.mockResolvedValue({ affected: { inserted: 0, updated: 0 }, rejected: [] })
      const e = setup({
        taskAssetsObj: {
          a: makeAsset({ knownAsset: true, checklists: [makeChecklist('B1', [{ id: 'r' }])] }),
        },
      })
      await e.runImport()
      e.selectedStatusRow.value = e.importStatusRows.value[0]

      e.reset()
      expect(e.importProgressText.value).toBe('')
      expect(e.importStatusRows.value).toEqual([])
      expect(e.importIsDone.value).toBe(false)
      expect(e.selectedStatusRow.value).toBeNull()
    })
  })
})
