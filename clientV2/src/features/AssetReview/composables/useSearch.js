import { FilterMatchMode } from '@primevue/core/api'
import { computed, ref, watch } from 'vue'
import { useDebouncedRef } from '../../../shared/composables/useDebouncedRef.js'
import { calculateChecklistStats } from '../../../shared/lib/checklistUtils.js'

const searchFilter = useDebouncedRef('', 220)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  severity: { value: null, matchMode: FilterMatchMode.IN },
  result: { value: null, matchMode: FilterMatchMode.IN },
  _statusText: { value: null, matchMode: FilterMatchMode.IN },
  _engineDisplay: { value: null, matchMode: FilterMatchMode.IN },
})

const currentFilteredData = ref([])

export const dsFilterFields = [
  'ruleId',
  'groupId',
  'ruleTitle',
  'groupTitle',
  'detail',
  'comment',
  'username',
  'status.user.username',
  'resultEngine.product',
  'resultEngine.type',
  'resultEngine.version',
]

// Sync internal PrimeVue filter with the external searchFilter ref
watch(searchFilter, (val) => {
  filters.value.global.value = val
})

/**
 * Shared search and filtering state for the ChecklistGrid.
 * Uses module-level refs to allow communication between Header and Table
 * without prop drilling or render-storm cycles.
 */
export function useSearch(initialData = ref([])) {
  const isFiltered = computed(() => !!filters.value.global.value)

  const stats = computed(() => {
    const data = isFiltered.value ? currentFilteredData.value : initialData.value
    const result = calculateChecklistStats(data)
    if (!result) {
      return {
        results: { pass: 0, fail: 0, notapplicable: 0, other: 0 },
        engine: { manual: 0, engine: 0, override: 0 },
        statuses: { saved: 0, submitted: 0, accepted: 0, rejected: 0 },
      }
    }
    return result
  })

  function updateFilteredData(data) {
    currentFilteredData.value = data
  }

  function clearSearch() {
    searchFilter.immediate('')
  }

  function resetFilters() {
    searchFilter.immediate('')
    filters.value.global.value = null
    filters.value.severity.value = null
    filters.value.result.value = null
    filters.value._statusText.value = null
    filters.value._engineDisplay.value = null
  }

  return {
    searchFilter,
    filters,
    dsFilterFields,
    isFiltered,
    currentFilteredData,
    stats,
    updateFilteredData,
    clearSearch,
    resetFilters,
  }
}
