import { computed, ref } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchChecklist } from '../api/assetReviewApi.js'

export function useChecklistData({ assetId, benchmarkId, revisionStr }) {
  const accessMode = ref('r')

  const {
    state: checklistData,
    isLoading: isChecklistLoading,
    error: checklistError,
    execute: loadChecklist,
  } = useAsyncState(
    async () => {
      const response = await fetchChecklist(
        assetId.value,
        benchmarkId.value,
        revisionStr.value,
        ['comment', 'detail'],
      )
      accessMode.value = response.access ?? 'r'
      return response.checklist ?? []
    },
    { immediate: false, initialState: [], onError: null },
  )

  const gridData = computed(() => checklistData.value || [])

  const ruleLookupMap = computed(() => {
    const map = new Map()
    for (const item of gridData.value) {
      map.set(item.ruleId, item)
    }
    return map
  })

  function upsertReview(ruleId, review) {
    const idx = checklistData.value.findIndex(r => r.ruleId === ruleId)
    if (idx !== -1) {
      const updatedItem = { ...checklistData.value[idx], ...review }
      checklistData.value[idx] = updatedItem
    }
  }

  return {
    accessMode,
    checklistData,
    isChecklistLoading,
    checklistError,
    gridData,
    ruleLookupMap,
    loadChecklist,
    upsertReview,
  }
}
