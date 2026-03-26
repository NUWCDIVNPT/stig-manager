import { computed, ref } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchChecklist, fetchReviewsByAsset } from '../api/assetReviewApi.js'

export function useChecklistData({ collectionId, assetId, benchmarkId, revisionStr }) {
  const accessMode = ref('r')

  // --- Checklist data ---
  // onError: null — we expose checklistError so AssetReview.vue can show an inline
  // page-level banner. We must NOT redirect on a checklist 404/403 because that
  // can mean the STIG was simply unassigned, not that the whole route is gone.
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
      )
      accessMode.value = response.access ?? 'r'
      return response.checklist ?? []
    },
    { immediate: false, initialState: [], onError: null },
  )

  // --- All reviews (for grid mode) ---
  // Errors here are shown via global modal (default behaviour).
  const {
    state: allReviews,
    execute: loadAllReviews,
  } = useAsyncState(
    () => fetchReviewsByAsset(collectionId.value, assetId.value, benchmarkId.value),
    { immediate: false, initialState: [] },
  )

  // Merged grid data: checklist items + review detail/comment
  const gridData = computed(() => {
    if (!checklistData.value?.length) {
      return []
    }
    const reviewMap = new Map()
    for (const r of allReviews.value) {
      reviewMap.set(r.ruleId, r)
      if (r.ruleIds) {
        for (const id of r.ruleIds) {
          reviewMap.set(id, r)
        }
      }
    }
    return checklistData.value.map((item) => {
      const review = reviewMap.get(item.ruleId)
      return {
        ...item,
        result: review?.result ?? item.result,
        detail: review?.detail ?? '',
        comment: review?.comment ?? '',
        username: review?.username ?? item.username ?? '',
        status: review?.status ?? item.status,
        ts: review?.ts ?? item.ts,
        touchTs: review?.touchTs ?? item.touchTs,
        resultEngine: review?.resultEngine ?? item.resultEngine ?? null,
      }
    })
  })

  function upsertReview(ruleId, review) {
    const idx = allReviews.value.findIndex(r => r.ruleId === ruleId)
    if (idx !== -1) {
      allReviews.value = [
        ...allReviews.value.slice(0, idx),
        review,
        ...allReviews.value.slice(idx + 1),
      ]
    }
    else {
      allReviews.value = [...allReviews.value, review]
    }
  }

  return {
    accessMode,
    checklistData,
    isChecklistLoading,
    checklistError,
    allReviews,
    gridData,
    loadChecklist,
    loadAllReviews,
    upsertReview,
  }
}
