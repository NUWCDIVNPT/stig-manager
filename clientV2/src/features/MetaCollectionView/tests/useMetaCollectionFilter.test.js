import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MAX_SENT_IDS, parseCollectionIds, useMetaCollectionFilter } from '../composables/useMetaCollectionFilter.js'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

describe('useMetaCollectionFilter', () => {
  let route, replace

  beforeEach(() => {
    route = reactive({ query: {} })
    replace = vi.fn()
    useRoute.mockReturnValue(route)
    useRouter.mockReturnValue({ replace })
  })

  it('reads ids from the query, dropping duplicates and non-ids', () => {
    expect(parseCollectionIds({ collectionId: ['1', '1', 'x', '2'] })).toEqual(['1', '2'])
    expect(parseCollectionIds({ collectionId: '3' })).toEqual(['3'])
    expect(parseCollectionIds({})).toEqual([])
  })

  it('ignores ids past the request limit', () => {
    const collectionId = Array.from({ length: MAX_SENT_IDS + 10 }, (_, i) => String(i + 1))
    const ids = parseCollectionIds({ collectionId })
    expect(ids).toHaveLength(MAX_SENT_IDS)
    expect(ids.at(-1)).toBe(String(MAX_SENT_IDS))
  })

  it('writes the selection with router.replace, keeping unrelated query keys', () => {
    route.query = { foo: 'bar', collectionId: '1' }
    const { selectedCollectionIds } = useMetaCollectionFilter()
    selectedCollectionIds.value = ['2', '3']
    expect(replace).toHaveBeenCalledWith({ query: { foo: 'bar', collectionId: ['2', '3'] } })
    selectedCollectionIds.value = []
    expect(replace).toHaveBeenLastCalledWith({ query: { foo: 'bar' } })
  })

  it('keeps the selection identity across route changes that leave the filter alone', async () => {
    route.query = { collectionId: '1' }
    const { selectedCollectionIds } = useMetaCollectionFilter()
    const first = selectedCollectionIds.value
    const onChange = vi.fn()
    watch(selectedCollectionIds, onChange, { deep: true })

    route.query = { collectionId: '1', foo: 'bar' }
    await nextTick()
    expect(selectedCollectionIds.value).toBe(first)
    expect(onChange).not.toHaveBeenCalled()

    route.query = { collectionId: '2' }
    await nextTick()
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
