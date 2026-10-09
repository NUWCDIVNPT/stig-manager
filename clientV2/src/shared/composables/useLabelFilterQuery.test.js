import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLabelFilterQuery } from './useLabelFilterQuery.js'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

describe('useLabelFilterQuery', () => {
  let route, replace

  beforeEach(() => {
    route = reactive({ query: {} })
    replace = vi.fn()
    useRoute.mockReturnValue(route)
    useRouter.mockReturnValue({ replace })
  })

  it('reads the selection and API params from the route query', () => {
    route.query = { labelName: ['a', 'b'], labelMatch: 'null' }
    const { selectedLabelNames, labelFilterParams, labelFilterKey } = useLabelFilterQuery()
    expect(selectedLabelNames.value).toEqual(['a', 'b', null])
    expect(labelFilterParams.value).toEqual({ labelName: ['a', 'b'], labelMatch: 'null' })
    expect(labelFilterKey.value).toBe(JSON.stringify(['a', 'b', null]))
  })

  it('writes a new selection with router.replace, keeping unrelated query keys', () => {
    route.query = { foo: 'bar', labelName: 'a' }
    const { selectedLabelNames } = useLabelFilterQuery()
    selectedLabelNames.value = ['b', null]
    expect(replace).toHaveBeenCalledWith({ query: { foo: 'bar', labelName: ['b'], labelMatch: 'null' } })
  })

  it('keeps the selection identity across route changes that leave the filter alone', async () => {
    route.query = { labelName: 'a' }
    const { selectedLabelNames } = useLabelFilterQuery()
    const first = selectedLabelNames.value
    const onChange = vi.fn()
    watch(selectedLabelNames, onChange, { deep: true })

    route.query = { labelName: 'a', foo: 'bar' }
    await nextTick()
    expect(selectedLabelNames.value).toBe(first)
    expect(onChange).not.toHaveBeenCalled()

    route.query = { labelName: 'b' }
    await nextTick()
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
