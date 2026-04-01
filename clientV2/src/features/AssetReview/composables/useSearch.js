import { FilterMatchMode } from '@primevue/core/api'
import { computed, ref, watch } from 'vue'
import { calculateChecklistStats } from '../lib/checklistUtils.js'

// Shared state across all instances (since usually only one grid is active)
const searchFilter = ref('')

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const currentFilteredData = ref([])

// Registry for global search fields used by PrimeVue DataTable
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
    searchFilter.value = ''
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
  }
}
