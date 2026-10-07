import { computed, ref, toValue, watch } from 'vue'
import { readStoredValue, storeValue } from '../lib/localStorage.js'

function readOverrides(key) {
  if (!key) {
    return {}
  }
  try {
    const parsed = JSON.parse(readStoredValue(key, '{}'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => typeof v === 'boolean'))
  }
  catch {
    return {}
  }
}

/**
 * Column show/hide state for ColumnToggle. `locked` columns always show and `defaultHidden` ones
 * start off. Only departures from the defaults are saved, as { field: shown }, so a column added
 * later still arrives with its default.
 * @param {import('vue').MaybeRefOrGetter<{ field: string, locked?: boolean, defaultHidden?: boolean }[]>} columns
 * @param {import('vue').MaybeRefOrGetter<string|null>} [storageKey] no key keeps choices in memory only
 */
export function useColumnVisibility(columns, storageKey = null) {
  const allColumns = computed(() => toValue(columns) ?? [])
  const toggleableColumns = computed(() => allColumns.value.filter(c => !c.locked))

  const overrides = ref(readOverrides(toValue(storageKey)))
  watch(() => toValue(storageKey), (key) => {
    overrides.value = readOverrides(key)
  })

  function isShown(col) {
    return col.locked || (overrides.value[col.field] ?? !col.defaultHidden)
  }

  function save(next) {
    if (JSON.stringify(next) === JSON.stringify(overrides.value)) {
      return
    }
    overrides.value = next
    const key = toValue(storageKey)
    if (key) {
      storeValue(key, JSON.stringify(next))
    }
  }

  // Sets shown state by field, e.g. when a display mode swaps one column for another
  function setShown(changes) {
    const next = { ...overrides.value }
    for (const col of toggleableColumns.value) {
      if (!(col.field in changes)) {
        continue
      }
      if (changes[col.field] === !col.defaultHidden) {
        delete next[col.field]
      }
      else {
        next[col.field] = changes[col.field]
      }
    }
    save(next)
  }

  // Writable for v-model on ColumnToggle; matches on field since MultiSelect hands back copies
  const selectedColumns = computed({
    get: () => toggleableColumns.value.filter(isShown),
    set: (selected) => {
      const shown = new Set((selected ?? []).map(c => c.field))
      setShown(Object.fromEntries(toggleableColumns.value.map(c => [c.field, shown.has(c.field)])))
    },
  })

  const visibleColumns = computed(() => allColumns.value.filter(isShown))
  const visibleFields = computed(() => new Set(visibleColumns.value.map(c => c.field)))

  return { toggleableColumns, selectedColumns, visibleColumns, visibleFields, setShown }
}
