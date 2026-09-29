import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'
import { textFilter, valuesFilter } from '../lib/columnFilters.js'
import { useColumnFilters } from './useColumnFilters.js'

function makeRows() {
  return ref([
    { id: 1, name: 'Web Server', status: 'available', labels: [{ name: 'prod' }] },
    { id: 2, name: 'DB Server', status: 'unavailable', labels: [{ name: 'staging' }] },
    { id: 3, name: 'Cache Server', status: 'available', labels: [] },
  ])
}

const ids = rows => rows.map(r => r.id)
const containing = value => textFilter({ value })

describe('useColumnFilters', () => {
  it('creates one filter per spec entry', () => {
    const { filters } = useColumnFilters(makeRows(), { name: 'text', status: 'values' })

    expect(filters.name).toEqual(textFilter())
    expect(filters.status).toEqual(valuesFilter())
  })

  it('returns every row until a filter is set', () => {
    const rows = makeRows()
    const { filteredRows, isFiltered } = useColumnFilters(rows, { name: 'text' })

    expect(filteredRows.value).toBe(rows.value)
    expect(isFiltered.value).toBe(false)
  })

  it('filters when a whole filter object is assigned, as v-model does', () => {
    const { filters, filteredRows, isFiltered } = useColumnFilters(makeRows(), { name: 'text', status: 'values' })

    filters.name = containing('server')
    filters.status = valuesFilter({ value: ['available'] })

    expect(ids(filteredRows.value)).toEqual([1, 3])
    expect(isFiltered.value).toBe(true)
  })

  it('reads cells through a spec getter', () => {
    const { filters, filteredRows } = useColumnFilters(makeRows(), {
      labels: { kind: 'values', get: r => r.labels.map(l => l.name) },
    })

    filters.labels = valuesFilter({ value: ['staging'] })

    expect(ids(filteredRows.value)).toEqual([2])
  })

  it('re-filters when the rows change', () => {
    const rows = makeRows()
    const { filters, filteredRows } = useColumnFilters(rows, { name: 'text' })
    filters.name = containing('web')

    rows.value = [...rows.value, { id: 4, name: 'Web Proxy', status: 'available', labels: [] }]

    expect(ids(filteredRows.value)).toEqual([1, 4])
  })

  it('adds new spec keys and keeps state for existing ones', () => {
    const withStatus = ref(false)
    const spec = computed(() => (withStatus.value ? { name: 'text', status: 'values' } : { name: 'text' }))
    const { filters } = useColumnFilters(makeRows(), spec)
    filters.name = containing('web')

    withStatus.value = true

    expect(filters.status).toEqual(valuesFilter())
    expect(filters.name.value).toBe('web')
  })

  it('stops applying a filter whose key leaves the spec, and restores it on return', () => {
    const withStatus = ref(true)
    const spec = computed(() => (withStatus.value ? { name: 'text', status: 'values' } : { name: 'text' }))
    const { filters, filteredRows, isFiltered } = useColumnFilters(makeRows(), spec)
    filters.status = valuesFilter({ value: ['unavailable'] })
    expect(ids(filteredRows.value)).toEqual([2])

    withStatus.value = false
    expect(ids(filteredRows.value)).toEqual([1, 2, 3])
    expect(isFiltered.value).toBe(false)

    withStatus.value = true
    expect(ids(filteredRows.value)).toEqual([2])
  })

  it('clears one filter by key', () => {
    const { filters, filteredRows, clear } = useColumnFilters(makeRows(), { name: 'text', status: 'values' })
    filters.name = containing('server')
    filters.status = valuesFilter({ value: ['available'] })

    clear('status')

    expect(filters.status).toEqual(valuesFilter())
    expect(filters.name.value).toBe('server')
    expect(ids(filteredRows.value)).toEqual([1, 2, 3])
  })

  it('clears every filter with no key', () => {
    const { filters, isFiltered, clear } = useColumnFilters(makeRows(), { name: 'text', status: 'values' })
    filters.name = containing('web')
    filters.status = valuesFilter({ value: ['available'] })

    clear()

    expect(filters.name).toEqual(textFilter())
    expect(filters.status).toEqual(valuesFilter())
    expect(isFiltered.value).toBe(false)
  })
})
