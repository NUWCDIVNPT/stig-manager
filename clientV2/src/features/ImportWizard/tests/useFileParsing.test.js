import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const reviewsFromCklMock = vi.fn()
const reviewsFromCklbMock = vi.fn()
const reviewsFromSccMock = vi.fn()

class FakeTaskObject {
  constructor({ apiAssets, apiStigs, parsedResults, options }) {
    FakeTaskObject.lastCall = { apiAssets, apiStigs, parsedResults, options }
    const { taskAssets = new Map(), errors = [] } = FakeTaskObject.nextResult ?? {}
    this.taskAssets = taskAssets
    this.errors = errors
  }
}
FakeTaskObject.nextResult = null
FakeTaskObject.lastCall = null

vi.mock('@nuwcdivnpt/stig-manager-client-modules', () => ({
  reviewsFromCkl: (...args) => reviewsFromCklMock(...args),
  reviewsFromCklb: (...args) => reviewsFromCklbMock(...args),
  reviewsFromScc: (...args) => reviewsFromSccMock(...args),
  TaskObject: FakeTaskObject,
}))

const fetchCollectionAssetsWithStigsMock = vi.fn()
const fetchInstalledStigsMock = vi.fn()
const fetchScapMapMock = vi.fn()

vi.mock('../api/importResultsApi.js', () => ({
  fetchCollectionAssetsWithStigs: (...args) => fetchCollectionAssetsWithStigsMock(...args),
  fetchInstalledStigs: (...args) => fetchInstalledStigsMock(...args),
  fetchScapMap: (...args) => fetchScapMapMock(...args),
}))

let useFileParsing

beforeEach(async () => {
  reviewsFromCklMock.mockReset()
  reviewsFromCklbMock.mockReset()
  reviewsFromSccMock.mockReset()
  fetchCollectionAssetsWithStigsMock.mockReset()
  fetchInstalledStigsMock.mockReset()
  fetchScapMapMock.mockReset()
  FakeTaskObject.nextResult = null
  FakeTaskObject.lastCall = null

  fetchCollectionAssetsWithStigsMock.mockResolvedValue([])
  fetchInstalledStigsMock.mockResolvedValue([])
  fetchScapMapMock.mockResolvedValue([])
  reviewsFromCklMock.mockImplementation(() => ({ source: 'ckl' }))
  reviewsFromCklbMock.mockImplementation(() => ({ source: 'cklb' }))
  reviewsFromSccMock.mockImplementation(() => ({ source: 'scc' }))

  ;({ useFileParsing } = await import('../composables/useFileParsing.js'))
})

afterEach(() => {
  vi.resetModules()
})

function setup(overrides = {}) {
  const collectionId = ref(overrides.collectionId ?? '9')
  const createObjects = ref(overrides.createObjects ?? true)
  const sourceFiles = ref(overrides.sourceFiles ?? [])
  const fieldSettings = ref(overrides.fieldSettings ?? { x: 1 })
  const canAccept = ref(overrides.canAccept ?? false)
  const importOptions = ref(overrides.importOptions ?? { unreviewed: 'never' })
  const result = useFileParsing({ collectionId, createObjects, sourceFiles, fieldSettings, canAccept, importOptions })
  return { collectionId, createObjects, sourceFiles, fieldSettings, canAccept, importOptions, ...result }
}

function makeFile(name, content = 'data', lastModified = 1700000000000) {
  return new File([content], name, { type: 'text/plain', lastModified })
}

function taskAssetMap(entries) {
  const map = new Map()
  for (const [key, value] of entries) { map.set(key, value) }
  return map
}

function makeTaskAsset({ name = 'host-a', assetId = 10, checklists = [], checklistsIgnored = [] } = {}) {
  const checklistMap = new Map()
  for (const c of checklists) {
    if (!checklistMap.has(c.benchmarkId)) { checklistMap.set(c.benchmarkId, []) }
    checklistMap.get(c.benchmarkId).push(c)
  }
  return {
    assetProps: { name, assetId },
    checklists: checklistMap,
    checklistsIgnored,
  }
}

describe('useFileParsing', () => {
  describe('initial state', () => {
    it('starts with empty results and zero progress', () => {
      const p = setup()
      expect(p.parseProgressValue.value).toBe(0)
      expect(p.parseProgressText.value).toBe('')
      expect(p.parseProgressCurrent.value).toBe(0)
      expect(p.parseProgressTotal.value).toBe(0)
      expect(p.parseResults.value).toEqual({
        taskAssets: null,
        rows: [],
        dupedRows: [],
        errors: [],
        hasDuplicates: false,
        stopWizard: false,
      })
      expect(p.allowNewObjects.value).toBe(true)
      expect(p.previewRows.value).toEqual([])
    })
  })

  describe('startParsing - happy path', () => {
    it('parses ckl/cklb/xml and produces rows', async () => {
      const ta = makeTaskAsset({
        checklists: [
          { benchmarkId: 'A', newAssignment: false, sourceRef: { lastModified: 1 } },
        ],
      })
      FakeTaskObject.nextResult = { taskAssets: taskAssetMap([['k1', ta]]), errors: [] }

      const p = setup({
        sourceFiles: [makeFile('a.ckl'), makeFile('b.cklb', 'd', 2), makeFile('c.xml', 'd', 3)],
      })
      await p.startParsing()

      expect(reviewsFromCklMock).toHaveBeenCalledTimes(1)
      expect(reviewsFromCklbMock).toHaveBeenCalledTimes(1)
      expect(reviewsFromSccMock).toHaveBeenCalledTimes(1)
      expect(p.parseResults.value.errors).toEqual([])
      expect(p.parseResults.value.rows).toHaveLength(1)
      expect(p.parseResults.value.hasDuplicates).toBe(false)
      expect(p.parseResults.value.stopWizard).toBe(false)
    })

    it('passes a scapBenchmarkMap to parser built from fetchScapMap', async () => {
      fetchScapMapMock.mockResolvedValue([{ scapBenchmarkId: 's1', benchmarkId: 'B1' }])
      FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }

      const p = setup({ sourceFiles: [makeFile('x.xml')] })
      await p.startParsing()

      const arg = reviewsFromSccMock.mock.calls[0][0]
      expect(arg.scapBenchmarkMap).toBeInstanceOf(Map)
      expect(arg.scapBenchmarkMap.get('s1')).toBe('B1')
    })

    it('forwards fieldSettings, canAccept and importOptions to parsers', async () => {
      FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
      const p = setup({
        sourceFiles: [makeFile('a.ckl')],
        fieldSettings: { fancy: true },
        canAccept: true,
        importOptions: { unreviewed: 'always' },
      })
      await p.startParsing()
      const arg = reviewsFromCklMock.mock.calls[0][0]
      expect(arg.fieldSettings).toEqual({ fancy: true })
      expect(arg.allowAccept).toBe(true)
      expect(arg.importOptions).toEqual({ unreviewed: 'always' })
      expect(arg.sourceRef.name).toBe('a.ckl')
    })

    it('passes the resolved collectionId and createObjects to TaskObject', async () => {
      FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
      const p = setup({
        collectionId: '42',
        createObjects: false,
        sourceFiles: [makeFile('a.ckl')],
      })
      await p.startParsing()
      expect(FakeTaskObject.lastCall.options).toEqual({
        collectionId: '42',
        createObjects: false,
        strictRevisionCheck: false,
      })
    })

    it('sets stopWizard true when no rows survive parsing', async () => {
      FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
      const p = setup({ sourceFiles: [makeFile('a.ckl')] })
      await p.startParsing()
      expect(p.parseResults.value.stopWizard).toBe(true)
    })

    it('progress fields end at 100% with current === total', async () => {
      FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
      const p = setup({ sourceFiles: [makeFile('a.ckl'), makeFile('b.cklb', 'x', 2)] })
      await p.startParsing()
      expect(p.parseProgressTotal.value).toBe(2)
      expect(p.parseProgressCurrent.value).toBe(2)
      expect(p.parseProgressValue.value).toBe(100)
      expect(p.parseProgressText.value).toBe('')
    })

    it('handles an empty file list (no parser calls, no errors)', async () => {
      FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
      const p = setup({ sourceFiles: [] })
      await p.startParsing()
      expect(reviewsFromCklMock).not.toHaveBeenCalled()
      expect(p.parseResults.value.errors).toEqual([])
      expect(p.parseResults.value.stopWizard).toBe(true)
      expect(p.parseProgressTotal.value).toBe(0)
    })
  })

  describe('startParsing - error paths', () => {
    it('records an error for unsupported file extensions', async () => {
      FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
      const p = setup({ sourceFiles: [makeFile('weird.txt')] })
      await p.startParsing()
      expect(p.parseResults.value.errors).toHaveLength(1)
      expect(p.parseResults.value.errors[0].error).toMatch(/Unsupported extension: \.txt/)
    })

    it('records an error when a parser throws', async () => {
      reviewsFromCklMock.mockImplementation(() => { throw new Error('bad ckl') })
      FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
      const p = setup({ sourceFiles: [makeFile('a.ckl')] })
      await p.startParsing()
      expect(p.parseResults.value.errors).toEqual([
        expect.objectContaining({ error: 'bad ckl' }),
      ])
    })

    it('records an error when FileReader fails', async () => {
      const Real = globalThis.FileReader
      globalThis.FileReader = class {
        readAsText() { setTimeout(() => this.onerror?.({ message: 'io err' }), 0) }
      }
      try {
        FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
        const p = setup({ sourceFiles: [makeFile('a.ckl')] })
        await p.startParsing()
        expect(p.parseResults.value.errors[0].error).toMatch(/Could not read file/)
        // Parser should not have been called
        expect(reviewsFromCklMock).not.toHaveBeenCalled()
      }
      finally {
        globalThis.FileReader = Real
      }
    })

    it('treats file extension matching as case-insensitive', async () => {
      FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
      const p = setup({ sourceFiles: [makeFile('A.CKL'), makeFile('B.XML', 'd', 2)] })
      await p.startParsing()
      expect(reviewsFromCklMock).toHaveBeenCalledTimes(1)
      expect(reviewsFromSccMock).toHaveBeenCalledTimes(1)
      expect(p.parseResults.value.errors).toEqual([])
    })

    it('surfaces TaskObject errors mapped to { file, error }', async () => {
      FakeTaskObject.nextResult = {
        taskAssets: new Map(),
        errors: [{ sourceRef: { name: 'a.ckl' }, message: 'task fail' }],
      }
      const p = setup({ sourceFiles: [makeFile('a.ckl')] })
      await p.startParsing()
      expect(p.parseResults.value.errors).toEqual([
        { file: { name: 'a.ckl' }, error: 'task fail' },
      ])
    })

    it('combines raw failures with task errors', async () => {
      FakeTaskObject.nextResult = {
        taskAssets: new Map(),
        errors: [{ sourceRef: { name: 'b.ckl' }, message: 'task fail' }],
      }
      const p = setup({ sourceFiles: [makeFile('a.txt'), makeFile('b.ckl', 'd', 2)] })
      await p.startParsing()
      expect(p.parseResults.value.errors).toHaveLength(2)
      const messages = p.parseResults.value.errors.map(e => e.error)
      expect(messages.some(m => m.includes('Unsupported extension'))).toBe(true)
      expect(messages).toContain('task fail')
    })

    it('still produces a TaskObject when every file fails to read', async () => {
      const Real = globalThis.FileReader
      globalThis.FileReader = class {
        readAsText() { setTimeout(() => this.onerror?.({ message: 'io err' }), 0) }
      }
      try {
        FakeTaskObject.nextResult = { taskAssets: new Map(), errors: [] }
        const p = setup({ sourceFiles: [makeFile('a.ckl'), makeFile('b.cklb', 'd', 2)] })
        await p.startParsing()
        expect(FakeTaskObject.lastCall.parsedResults).toEqual([])
        expect(p.parseResults.value.errors).toHaveLength(2)
      }
      finally {
        globalThis.FileReader = Real
      }
    })
  })

  describe('duplicates and ignored checklists', () => {
    it('selects the most recently modified duplicate as the primary row', async () => {
      const c1 = { benchmarkId: 'A', newAssignment: false, sourceRef: { lastModified: 1, name: 'old' } }
      const c2 = { benchmarkId: 'A', newAssignment: false, sourceRef: { lastModified: 5, name: 'new' } }
      const c3 = { benchmarkId: 'A', newAssignment: false, sourceRef: { lastModified: 3, name: 'mid' } }
      const ta = makeTaskAsset({ checklists: [c1, c2, c3] })
      FakeTaskObject.nextResult = { taskAssets: taskAssetMap([['k', ta]]), errors: [] }

      const p = setup({ sourceFiles: [makeFile('x.ckl')] })
      await p.startParsing()
      expect(p.parseResults.value.hasDuplicates).toBe(true)
      expect(p.parseResults.value.rows).toHaveLength(1)
      expect(p.parseResults.value.rows[0].checklist.sourceRef.name).toBe('new')
      expect(p.parseResults.value.dupedRows.map(r => r.checklist.sourceRef.name)).toEqual(['mid', 'old'])
    })

    it('does not flag duplicates when each benchmarkId has only one checklist', async () => {
      const ta = makeTaskAsset({
        checklists: [
          { benchmarkId: 'A', newAssignment: false, sourceRef: { lastModified: 1 } },
          { benchmarkId: 'B', newAssignment: false, sourceRef: { lastModified: 2 } },
        ],
      })
      FakeTaskObject.nextResult = { taskAssets: taskAssetMap([['k', ta]]), errors: [] }
      const p = setup({ sourceFiles: [makeFile('a.ckl')] })
      await p.startParsing()
      expect(p.parseResults.value.hasDuplicates).toBe(false)
      expect(p.parseResults.value.dupedRows).toEqual([])
      expect(p.parseResults.value.rows).toHaveLength(2)
    })

    it('emits an error per checklistsIgnored entry', async () => {
      const ta = makeTaskAsset({
        checklists: [{ benchmarkId: 'A', newAssignment: false, sourceRef: { lastModified: 1 } }],
        checklistsIgnored: [
          { sourceRef: { name: 'old.ckl' }, benchmarkId: 'Z', revisionStr: 'V1R1', ignored: 'too old' },
        ],
      })
      FakeTaskObject.nextResult = { taskAssets: taskAssetMap([['k', ta]]), errors: [] }

      const p = setup({ sourceFiles: [makeFile('a.ckl')] })
      await p.startParsing()
      expect(p.parseResults.value.errors).toEqual([
        { file: { name: 'old.ckl' }, error: 'Ignoring Z V1R1. too old' },
      ])
    })
  })

  describe('previewRows', () => {
    it('returns all rows when allowNewObjects is true', async () => {
      const ta = makeTaskAsset({
        assetId: null,
        checklists: [{ benchmarkId: 'A', newAssignment: true, sourceRef: { lastModified: 1 } }],
      })
      ta.assetProps.assetId = null
      FakeTaskObject.nextResult = { taskAssets: taskAssetMap([['k', ta]]), errors: [] }
      const p = setup({ sourceFiles: [makeFile('a.ckl')] })
      await p.startParsing()
      expect(p.previewRows.value).toHaveLength(1)
    })

    it('filters out new assets and new-assignment rows when allowNewObjects is false', async () => {
      const keep = makeTaskAsset({
        assetId: 1,
        checklists: [{ benchmarkId: 'A', newAssignment: false, sourceRef: { lastModified: 1 } }],
      })
      const dropNoAsset = makeTaskAsset({
        assetId: null,
        checklists: [{ benchmarkId: 'B', newAssignment: false, sourceRef: { lastModified: 2 } }],
      })
      dropNoAsset.assetProps.assetId = null
      const dropNewAssignment = makeTaskAsset({
        assetId: 2,
        checklists: [{ benchmarkId: 'C', newAssignment: true, sourceRef: { lastModified: 3 } }],
      })

      FakeTaskObject.nextResult = {
        taskAssets: taskAssetMap([['a', keep], ['b', dropNoAsset], ['c', dropNewAssignment]]),
        errors: [],
      }

      const p = setup({ sourceFiles: [makeFile('a.ckl')] })
      await p.startParsing()
      p.allowNewObjects.value = false
      expect(p.previewRows.value).toHaveLength(1)
      expect(p.previewRows.value[0].taskAsset.assetProps.assetId).toBe(1)
    })
  })

  describe('reset', () => {
    it('reinitializes all state, including allowNewObjects', async () => {
      const ta = makeTaskAsset({
        checklists: [{ benchmarkId: 'A', newAssignment: false, sourceRef: { lastModified: 1 } }],
      })
      FakeTaskObject.nextResult = { taskAssets: taskAssetMap([['k', ta]]), errors: [] }
      const p = setup({ sourceFiles: [makeFile('a.ckl')] })
      await p.startParsing()
      p.allowNewObjects.value = false

      p.reset()
      expect(p.parseProgressValue.value).toBe(0)
      expect(p.parseProgressText.value).toBe('')
      expect(p.parseProgressCurrent.value).toBe(0)
      expect(p.parseProgressTotal.value).toBe(0)
      expect(p.parseResults.value).toEqual({
        taskAssets: null,
        rows: [],
        dupedRows: [],
        errors: [],
        hasDuplicates: false,
        stopWizard: false,
      })
      expect(p.allowNewObjects.value).toBe(true)
    })
  })
})
