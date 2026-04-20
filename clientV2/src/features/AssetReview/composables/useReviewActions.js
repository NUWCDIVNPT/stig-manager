import { computed, ref } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { REVIEW_STATUS } from '../../../shared/lib/reviewConstants.js'
import { patchReview, putReview } from '../api/assetReviewApi.js'

export function useReviewActions({ collectionId, assetId }, deps) {
  const { gridData, upsertReview, currentReview } = deps

  const saveError = ref(null)

  function onSaveError(err) {
    saveError.value = err?.message ?? 'Failed to save review.'
  }

  function clearSaveError() {
    saveError.value = null
  }

  const { isLoading: isSavingReview, execute: executeSaveReview } = useAsyncState(
    async (ruleId, { result: newResult, detail, comment, status }) => {
      saveError.value = null
      const row = gridData.value.find(r => r.ruleId === ruleId)
      const resultChanged = row ? newResult !== row.result : true

      const body = {
        result: newResult,
        detail: detail ?? '',
        comment: comment ?? '',
        resultEngine: resultChanged ? null : (row?.resultEngine ?? null),
        status: status || REVIEW_STATUS.SAVED,
      }

      const result = await putReview(collectionId.value, assetId.value, ruleId, body)

      upsertReview(ruleId, result)
      currentReview.value = result

      return result
    },
    { immediate: false, onError: onSaveError },
  )

  function saveFullReview(ruleId, data) {
    executeSaveReview(ruleId, data)
  }

  const { isLoading: isSavingStatus, execute: executeSaveStatus } = useAsyncState(
    async (ruleId, actionType) => {
      saveError.value = null
      let status
      switch (actionType) {
        case 'accept':
          status = REVIEW_STATUS.ACCEPTED
          break
        case 'submit':
          status = REVIEW_STATUS.SUBMITTED
          break
        case 'unsubmit':
          status = REVIEW_STATUS.SAVED
          break
        default:
          return null
      }

      const result = await patchReview(collectionId.value, assetId.value, ruleId, { status })

      upsertReview(ruleId, result)
      currentReview.value = result

      return result
    },
    { immediate: false, onError: onSaveError },
  )

  function saveStatusAction(ruleId, actionType) {
    executeSaveStatus(ruleId, actionType)
  }

  const isSaving = computed(() => isSavingReview.value || isSavingStatus.value)

  return {
    isSaving,
    saveError,
    clearSaveError,
    saveFullReview,
    saveStatusAction,
  }
}
