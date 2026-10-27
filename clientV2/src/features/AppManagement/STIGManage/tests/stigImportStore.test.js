import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_ZIP_DEPTH } from '../../../../shared/lib/zipFiles.js'
import { makeZipFile, zipBytes } from '../../../../testUtils/zipFixtures.js'
import { importStigFile } from '../api/stigsAdminApi.js'
import { useStigImportStore } from '../stores/stigImportStore.js'

vi.mock('../api/stigsAdminApi.js', () => ({
  importStigFile: vi.fn(),
}))

vi.mock('../../../../shared/composables/useNotifications.js', () => ({
  useNotifications: () => ({ push: vi.fn(() => 1), remove: vi.fn() }),
}))

vi.mock('../components/StigImportProgressNotification.vue', () => ({ default: {} }))

describe('useStigImportStore', () => {
  let store

  beforeEach(() => {
    vi.mocked(importStigFile).mockReset()
    vi.mocked(importStigFile).mockResolvedValue({ action: 'inserted', revisionStr: 'V1R1' })
    store = useStigImportStore()
    store.reset()
  })

  it('replaces a zip row with rows for its xml entries and uploads them', async () => {
    const zip = await makeZipFile('bundle.zip', { 'a.xml': 'x', 'dir/b.xml': 'x', 'readme.txt': 'x' })
    store.setPendingFiles([zip])
    await store.start(false)

    expect(store.state.rows.map(r => [r.filename, r.source, r.status])).toEqual([
      ['a.xml', 'bundle.zip', 'success'],
      ['b.xml', 'bundle.zip', 'success'],
    ])
    expect(importStigFile).toHaveBeenCalledTimes(2)
  })

  it('marks a zip nested deeper than MAX_ZIP_DEPTH as an error without opening it', async () => {
    // level N archive holds levelN.xml and the level N+1 archive; the last one is past the limit
    let bytes = await zipBytes({ [`level${MAX_ZIP_DEPTH + 1}.xml`]: 'x' })
    for (let level = MAX_ZIP_DEPTH; level > 0; level--) {
      bytes = await zipBytes({ [`level${level}.xml`]: 'x', [`level${level + 1}.zip`]: bytes })
    }
    const zip = await makeZipFile('level0.zip', { 'level0.xml': 'x', 'level1.zip': bytes })
    store.setPendingFiles([zip])
    await store.start(false)

    const tooDeep = store.state.rows.find(r => r.filename === `level${MAX_ZIP_DEPTH + 1}.zip`)
    expect(tooDeep).toMatchObject({
      depth: MAX_ZIP_DEPTH + 1,
      status: 'error',
      message: `Nested more than ${MAX_ZIP_DEPTH} levels deep`,
    })

    const uploaded = vi.mocked(importStigFile).mock.calls.map(([, filename]) => filename).sort()
    const expected = Array.from({ length: MAX_ZIP_DEPTH + 1 }, (_, level) => `level${level}.xml`)
    expect(uploaded).toEqual(expected)
    expect(store.counts.value.failed).toBe(1)
  })
})
