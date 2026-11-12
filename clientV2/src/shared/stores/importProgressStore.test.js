import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { useNotifications } from '../composables/useNotifications.js'
import { useImportProgressStore } from './importProgressStore.js'

function makeExecutor() {
  return {
    importProgressText: ref(''),
    importStatusRows: ref([]),
    importIsDone: ref(false),
  }
}

function finishImport(executor, rows) {
  executor.importStatusRows.value = rows
  executor.importProgressText.value = 'Finished'
  executor.importIsDone.value = true
}

describe('useImportProgressStore', () => {
  const store = useImportProgressStore()
  const { notifications } = useNotifications()

  beforeEach(() => {
    store.dismiss()
    store.closeResults()
  })

  it('mirrors the executor into the notification state', async () => {
    const executor = makeExecutor()
    executor.importStatusRows.value = [{ assetName: 'a' }]
    executor.importProgressText.value = 'a'
    store.startBackground({ totalCount: 3, executor })

    expect(store.state.completedCount).toBe(1)

    executor.importProgressText.value = 'b'
    executor.importStatusRows.value.push({ assetName: 'b' })
    await nextTick()

    expect(store.state.progressText).toBe('b')
    expect(store.state.completedCount).toBe(2)
    expect(store.state.isDone).toBe(false)
  })

  it('finishes after the component that started the import unmounts', async () => {
    const executor = makeExecutor()
    const host = createApp({
      setup() {
        store.startBackground({ totalCount: 1, executor })
        return () => h('div')
      },
    })
    host.mount(document.createElement('div'))
    host.unmount()

    finishImport(executor, [{ assetName: 'a', error: 'failed' }])
    await nextTick()

    expect(store.state.isDone).toBe(true)
    expect(store.state.rows).toEqual([{ assetName: 'a', error: 'failed' }])
  })

  it('keeps the results when the executor resets for another import', async () => {
    const executor = makeExecutor()
    store.startBackground({ totalCount: 1, executor })
    finishImport(executor, [{ assetName: 'a' }])
    await nextTick()

    executor.importStatusRows.value = []
    executor.importProgressText.value = ''
    executor.importIsDone.value = false
    await nextTick()

    expect(store.state.isDone).toBe(true)
    expect(store.state.rows).toEqual([{ assetName: 'a' }])
  })

  it('stops following an import once its notification is dismissed', async () => {
    const executor = makeExecutor()
    store.startBackground({ totalCount: 2, executor })
    store.dismiss()

    executor.importStatusRows.value.push({ assetName: 'a' })
    await nextTick()

    expect(store.state.completedCount).toBe(0)
    expect(store.isActive()).toBe(false)
  })

  it('follows only the most recent background import', async () => {
    const first = makeExecutor()
    const second = makeExecutor()
    store.startBackground({ totalCount: 1, executor: first })
    store.startBackground({ totalCount: 2, executor: second })

    finishImport(first, [{ assetName: 'old' }])
    await nextTick()

    expect(store.state.isDone).toBe(false)
    expect(store.state.totalCount).toBe(2)
    expect(notifications).toHaveLength(1)
  })

  it('opens the results and removes the notification on View Results', async () => {
    const executor = makeExecutor()
    store.startBackground({ totalCount: 1, executor })
    finishImport(executor, [{ assetName: 'a' }])
    await nextTick()

    store.requestViewResults()

    expect(store.state.resultsVisible).toBe(true)
    expect(store.state.rows).toEqual([{ assetName: 'a' }])
    expect(store.isActive()).toBe(false)

    store.closeResults()

    expect(store.state.resultsVisible).toBe(false)
    expect(store.state.rows).toEqual([])
  })
})
