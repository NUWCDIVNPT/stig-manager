import { describe, expect, it } from 'vitest'
import { useFileQueue } from '../composables/useFileQueue.js'

function makeFile(name, { lastModified = 1700000000000 } = {}) {
  return new File(['content'], name, { type: 'text/plain', lastModified })
}

function makeFileEntry(file) {
  return {
    isFile: true,
    isDirectory: false,
    name: file.name,
    fullPath: `/${file.name}`,
    file: (resolve) => { resolve(file) },
  }
}

function makeDirEntry(name, children) {
  let read = false
  return {
    isFile: false,
    isDirectory: true,
    name,
    fullPath: `/${name}`,
    createReader: () => ({
      readEntries: (resolve) => {
        if (read) { resolve([]); return }
        read = true
        resolve(children)
      },
    }),
  }
}

function makeDataTransferItem(entry) {
  return { webkitGetAsEntry: () => entry }
}

function makeDropEvent(entries) {
  return { dataTransfer: { items: entries.map(makeDataTransferItem) } }
}

describe('useFileQueue', () => {
  describe('initial state', () => {
    it('starts with empty queue, no selection, no drag-over', () => {
      const q = useFileQueue()
      expect(q.sourceFiles.value).toEqual([])
      expect(q.selectedQueueRows.value).toEqual([])
      expect(q.isDragOver.value).toBe(false)
      expect(q.canContinue.value).toBe(false)
    })
  })

  describe('addFilesToQueue', () => {
    it('adds files and assigns _queueId', () => {
      const q = useFileQueue()
      const f = makeFile('a.ckl')
      q.addFilesToQueue([f])
      expect(q.sourceFiles.value).toHaveLength(1)
      expect(q.sourceFiles.value[0]._queueId).toBe(`a.ckl-${f.size}-${f.lastModified}`)
      expect(q.canContinue.value).toBe(true)
    })

    it('dedupes identical files (same name/size/lastModified)', () => {
      const q = useFileQueue()
      const f1 = new File(['x'], 'dup.ckl', { lastModified: 111 })
      const f2 = new File(['x'], 'dup.ckl', { lastModified: 111 })
      q.addFilesToQueue([f1, f2])
      expect(q.sourceFiles.value).toHaveLength(1)
    })

    it('treats files with different lastModified as distinct even when names match', () => {
      const q = useFileQueue()
      q.addFilesToQueue([
        new File(['x'], 'same.ckl', { lastModified: 1 }),
        new File(['x'], 'same.ckl', { lastModified: 2 }),
      ])
      expect(q.sourceFiles.value).toHaveLength(2)
    })

    it('handles empty array as a no-op', () => {
      const q = useFileQueue()
      q.addFilesToQueue([])
      expect(q.sourceFiles.value).toEqual([])
      expect(q.canContinue.value).toBe(false)
    })

    it('appends new files to an existing queue and dedupes against it', () => {
      const q = useFileQueue()
      const f1 = new File(['x'], 'a.ckl', { lastModified: 1 })
      const f2 = new File(['x'], 'b.ckl', { lastModified: 2 })
      q.addFilesToQueue([f1])
      q.addFilesToQueue([f1, f2])
      expect(q.sourceFiles.value.map(f => f.name)).toEqual(['a.ckl', 'b.ckl'])
    })

    it('supports iterables (FileList-like objects)', () => {
      const q = useFileQueue()
      const files = [makeFile('x.ckl'), makeFile('y.cklb', { lastModified: 2 })]
      const fakeFileList = {
        length: 2,
        0: files[0],
        1: files[1],
        [Symbol.iterator]: function* () { yield files[0]; yield files[1] },
      }
      q.addFilesToQueue(fakeFileList)
      expect(q.sourceFiles.value).toHaveLength(2)
    })
  })

  describe('removeSelectedFromQueue', () => {
    it('removes only selected files and clears selection', () => {
      const q = useFileQueue()
      q.addFilesToQueue([
        makeFile('a.ckl', { lastModified: 1 }),
        makeFile('b.ckl', { lastModified: 2 }),
        makeFile('c.ckl', { lastModified: 3 }),
      ])
      q.selectedQueueRows.value = [q.sourceFiles.value[0], q.sourceFiles.value[2]]
      q.removeSelectedFromQueue()
      expect(q.sourceFiles.value.map(f => f.name)).toEqual(['b.ckl'])
      expect(q.selectedQueueRows.value).toEqual([])
    })

    it('is a no-op when nothing is selected', () => {
      const q = useFileQueue()
      q.addFilesToQueue([
        makeFile('a.ckl', { lastModified: 1 }),
        makeFile('b.ckl', { lastModified: 2 }),
      ])
      const before = [...q.sourceFiles.value]
      q.removeSelectedFromQueue()
      expect(q.sourceFiles.value).toEqual(before)
    })

    it('ignores selection entries that are not in sourceFiles', () => {
      const q = useFileQueue()
      q.addFilesToQueue([makeFile('a.ckl')])
      q.selectedQueueRows.value = [{ _queueId: 'unknown' }]
      q.removeSelectedFromQueue()
      expect(q.sourceFiles.value).toHaveLength(1)
      expect(q.selectedQueueRows.value).toEqual([])
    })

    it('can clear the queue entirely when all rows are selected', () => {
      const q = useFileQueue()
      q.addFilesToQueue([
        makeFile('a.ckl', { lastModified: 1 }),
        makeFile('b.ckl', { lastModified: 2 }),
      ])
      q.selectedQueueRows.value = [...q.sourceFiles.value]
      q.removeSelectedFromQueue()
      expect(q.sourceFiles.value).toEqual([])
      expect(q.canContinue.value).toBe(false)
    })
  })

  describe('drag handlers', () => {
    it('onDragOver flips isDragOver true; onDragLeave flips it back', () => {
      const q = useFileQueue()
      q.onDragOver()
      expect(q.isDragOver.value).toBe(true)
      q.onDragLeave()
      expect(q.isDragOver.value).toBe(false)
    })
  })

  describe('onDropFiles', () => {
    it('returns early and resets isDragOver when there is no dataTransfer', async () => {
      const q = useFileQueue()
      q.isDragOver.value = true
      await q.onDropFiles({})
      expect(q.isDragOver.value).toBe(false)
      expect(q.sourceFiles.value).toEqual([])
    })

    it('returns early when dataTransfer has no items', async () => {
      const q = useFileQueue()
      q.isDragOver.value = true
      await q.onDropFiles({ dataTransfer: {} })
      expect(q.isDragOver.value).toBe(false)
      expect(q.sourceFiles.value).toEqual([])
    })

    it('accepts only .ckl / .cklb / .xml files (case-insensitive) and ignores others', async () => {
      const q = useFileQueue()
      const event = makeDropEvent([
        makeFileEntry(makeFile('keep1.ckl', { lastModified: 1 })),
        makeFileEntry(makeFile('keep2.CKLB', { lastModified: 2 })),
        makeFileEntry(makeFile('keep3.xml', { lastModified: 3 })),
        makeFileEntry(makeFile('skip.txt', { lastModified: 4 })),
        makeFileEntry(makeFile('skip.pdf', { lastModified: 5 })),
      ])
      await q.onDropFiles(event)
      const names = q.sourceFiles.value.map(f => f.name).sort()
      expect(names).toEqual(['keep1.ckl', 'keep2.CKLB', 'keep3.xml'])
    })

    it('recursively walks directories and collects supported files', async () => {
      const q = useFileQueue()
      const nested = makeDirEntry('inner', [
        makeFileEntry(makeFile('deep.ckl', { lastModified: 1 })),
        makeFileEntry(makeFile('ignored.txt', { lastModified: 2 })),
      ])
      const root = makeDirEntry('outer', [
        makeFileEntry(makeFile('top.cklb', { lastModified: 3 })),
        nested,
      ])
      await q.onDropFiles(makeDropEvent([root]))
      const names = q.sourceFiles.value.map(f => f.name).sort()
      expect(names).toEqual(['deep.ckl', 'top.cklb'])
    })

    it('skips items where webkitGetAsEntry returns null', async () => {
      const q = useFileQueue()
      const event = {
        dataTransfer: {
          items: [
            { webkitGetAsEntry: () => null },
            makeDataTransferItem(makeFileEntry(makeFile('good.ckl'))),
          ],
        },
      }
      await q.onDropFiles(event)
      expect(q.sourceFiles.value.map(f => f.name)).toEqual(['good.ckl'])
    })

    it('skips items where webkitGetAsEntry is missing', async () => {
      const q = useFileQueue()
      const event = {
        dataTransfer: {
          items: [
            {},
            makeDataTransferItem(makeFileEntry(makeFile('good.ckl'))),
          ],
        },
      }
      await q.onDropFiles(event)
      expect(q.sourceFiles.value.map(f => f.name)).toEqual(['good.ckl'])
    })

    it('clears isDragOver after a successful drop', async () => {
      const q = useFileQueue()
      q.isDragOver.value = true
      await q.onDropFiles(makeDropEvent([makeFileEntry(makeFile('x.ckl'))]))
      expect(q.isDragOver.value).toBe(false)
    })

    it('dedupes files added via drop against ones already in queue', async () => {
      const q = useFileQueue()
      const f = new File(['x'], 'dup.ckl', { lastModified: 42 })
      q.addFilesToQueue([f])
      await q.onDropFiles(makeDropEvent([makeFileEntry(f)]))
      expect(q.sourceFiles.value).toHaveLength(1)
    })

    it('handles directories that produce entries across multiple read batches', async () => {
      const q = useFileQueue()
      const reads = [
        [makeFileEntry(makeFile('a.ckl', { lastModified: 1 }))],
        [makeFileEntry(makeFile('b.ckl', { lastModified: 2 }))],
        [],
      ]
      const dir = {
        isFile: false,
        isDirectory: true,
        name: 'batched',
        fullPath: '/batched',
        createReader: () => ({
          readEntries: (resolve) => { resolve(reads.shift() ?? []) },
        }),
      }
      await q.onDropFiles(makeDropEvent([dir]))
      const names = q.sourceFiles.value.map(f => f.name).sort()
      expect(names).toEqual(['a.ckl', 'b.ckl'])
    })

    it('sets file.fullPath from the entry when reading files', async () => {
      const q = useFileQueue()
      const file = makeFile('x.ckl')
      const entry = {
        isFile: true,
        isDirectory: false,
        name: file.name,
        fullPath: '/some/nested/x.ckl',
        file: (resolve) => { resolve(file) },
      }
      await q.onDropFiles(makeDropEvent([entry]))
      expect(q.sourceFiles.value[0].fullPath).toBe('/some/nested/x.ckl')
    })
  })

  describe('reset', () => {
    it('clears all state', () => {
      const q = useFileQueue()
      q.addFilesToQueue([makeFile('a.ckl')])
      q.selectedQueueRows.value = [...q.sourceFiles.value]
      q.isDragOver.value = true
      q.reset()
      expect(q.sourceFiles.value).toEqual([])
      expect(q.selectedQueueRows.value).toEqual([])
      expect(q.isDragOver.value).toBe(false)
      expect(q.canContinue.value).toBe(false)
    })
  })
})
