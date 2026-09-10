import { describe, expect, it, vi } from 'vitest'
import { useBenchmarkList } from '../composables/useBenchmarkList.js'

vi.mock('../../../shared/api/stigsApi.js', () => ({
  fetchStigs: vi.fn(),
}))

const { fetchStigs } = await import('../../../shared/api/stigsApi.js')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

function bm(benchmarkId, title) {
  return { benchmarkId, title }
}

async function loaded(list) {
  fetchStigs.mockResolvedValue(list)
  const api = useBenchmarkList()
  await flushPromises()
  return api
}

describe('useBenchmarkList', () => {
  it('returns every benchmark while the filter is empty', async () => {
    const { filtered, totalCount } = await loaded([bm('RHEL_8', 'Red Hat 8'), bm('WIN_10', 'Windows 10')])
    expect(totalCount.value).toBe(2)
    expect(filtered.value).toHaveLength(2)
  })

  it('matches on title and on benchmarkId, case-insensitively', async () => {
    const { filter, filtered } = await loaded([bm('RHEL_8_STIG', 'Red Hat Enterprise Linux 8'), bm('WIN_10_STIG', 'Windows 10')])

    filter.value = 'windows'
    expect(filtered.value.map(b => b.benchmarkId)).toEqual(['WIN_10_STIG'])

    filter.value = 'rhel'
    expect(filtered.value.map(b => b.benchmarkId)).toEqual(['RHEL_8_STIG'])
  })

  it('ignores surrounding whitespace in the filter', async () => {
    const { filter, filtered } = await loaded([bm('RHEL_8', 'Red Hat 8'), bm('WIN_10', 'Windows 10')])
    filter.value = '   win  '
    expect(filtered.value.map(b => b.benchmarkId)).toEqual(['WIN_10'])
  })

  it('tolerates benchmarks missing a title or id', async () => {
    const { filter, filtered } = await loaded([{ benchmarkId: 'NO_TITLE' }, { title: 'no id' }])
    filter.value = 'no_title'
    expect(filtered.value).toHaveLength(1)
    filter.value = 'no id'
    expect(filtered.value).toHaveLength(1)
  })

  it('keeps totalCount at the unfiltered size while filteredCount tracks the filter', async () => {
    const { filter, totalCount, filteredCount } = await loaded([bm('A', 'a'), bm('B', 'b'), bm('C', 'c')])
    filter.value = 'a'
    expect(totalCount.value).toBe(3)
    expect(filteredCount.value).toBe(1)
  })

  it('routes load failures to onRouteError', async () => {
    const err = new Error('boom')
    fetchStigs.mockRejectedValue(err)
    const onRouteError = vi.fn()
    const { error } = useBenchmarkList({ onRouteError })
    await flushPromises()
    expect(onRouteError).toHaveBeenCalledWith(err)
    expect(error.value).toBe(err)
  })
})
