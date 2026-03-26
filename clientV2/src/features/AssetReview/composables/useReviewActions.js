import { computed, ref } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { patchReview, putReview } from '../api/assetReviewApi.js'

export function useReviewActions({ collectionId, assetId }, deps) {
  const { gridData, upsertReview, selectedRuleId, currentReview } = deps

  // Action error is shown inline in the popover, not as a global modal.
  const saveError = ref(null)

  function onSaveError(err) {
    saveError.value = err?.message ?? 'Failed to save review.'
  }

  function clearSaveError() {
    saveError.value = null
  }

  // --- Full review save (for grid popover) ---
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
        status: status || 'saved',
      }

      const result = await putReview(collectionId.value, assetId.value, ruleId, body)

      upsertReview(ruleId, result)

      if (ruleId === selectedRuleId.value) {
        currentReview.value = result
      }

      return result
    },
    { immediate: false, onError: onSaveError },
  )

  function saveFullReview(ruleId, data) {
    executeSaveReview(ruleId, data)
  }

  // --- Status action (for grid mode) ---
  const { isLoading: isSavingStatus, execute: executeSaveStatus } = useAsyncState(
    async (ruleId, actionType) => {
      saveError.value = null
      let status
      switch (actionType) {
        case 'accept':
          status = 'accepted'
          break
        case 'submit':
          status = 'submitted'
          break
        case 'unsubmit':
          status = 'saved'
          break
        default:
          return null
      }

      const result = await patchReview(collectionId.value, assetId.value, ruleId, { status })

      upsertReview(ruleId, result)

      if (ruleId === selectedRuleId.value) {
        currentReview.value = result
      }

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
