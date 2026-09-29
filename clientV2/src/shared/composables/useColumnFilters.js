import { computed, reactive, toValue, watch } from 'vue'
import { applyColumnFilters, createFilter, isActive } from '../lib/columnFilters.js'

function normalizeSpec(spec) {
  return Object.fromEntries(Object.entries(spec ?? {}).map(([key, entry]) => {
    const { kind, get } = typeof entry === 'string' ? { kind: entry } : entry
    return [key, { kind, get: get ?? (row => row[key]) }]
  }))
}

/**
 * Column filter state for one table.
 * @param {import('vue').MaybeRefOrGetter<object[]>} rows unfiltered rows
 * @param {import('vue').MaybeRefOrGetter<object>} spec key -> 'text' | 'values' | { kind, get }
 */
export function useColumnFilters(rows, spec) {
  const filters = reactive({})
  const columns = computed(() => normalizeSpec(toValue(spec)))

  // Only ever add entries, so a column leaving and returning keeps what the user typed.
  // Sync so a new key exists before the template binds to it.
  watch(columns, (cols) => {
    for (const [key, { kind }] of Object.entries(cols)) {
      if (!filters[key] || filters[key].kind !== kind) {
        filters[key] = createFilter(kind)
      }
    }
  }, { immediate: true, flush: 'sync' })

  // Keys outside the current spec keep their state but don't filter.
  const current = computed(() => Object.fromEntries(Object.keys(columns.value).map(key => [key, filters[key]])))
  const getters = computed(() => Object.fromEntries(Object.entries(columns.value).map(([key, c]) => [key, c.get])))

  const filteredRows = computed(() => applyColumnFilters(toValue(rows) ?? [], current.value, getters.value))
  const isFiltered = computed(() => Object.values(current.value).some(isActive))

  function clear(key) {
    const keys = key ? [key] : Object.keys(filters)
    for (const k of keys) {
      if (filters[k]) {
        filters[k] = createFilter(filters[k].kind)
      }
    }
  }

  return { filters, filteredRows, isFiltered, clear }
}
