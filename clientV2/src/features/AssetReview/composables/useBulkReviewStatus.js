import { computed, ref } from 'vue'
import { postReviewBatch } from '../../../shared/api/reviewsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { planAcceptAll, planSubmitAll } from '../lib/bulkReviewStatus.js'

// Owns the "current view" row set, the derived submit/accept plans, and the
// batch write. The batch targets one asset across many rules with a status-only
// source, so existing result/detail/comment are left untouched.
export function useBulkReviewStatus({ collectionId, assetId, fieldSettings, onApplied }) {
  const { triggerError } = useGlobalError()
  const visibleRows = ref([])

  const submitPlan = computed(() => planSubmitAll(visibleRows.value, fieldSettings.value))
  const acceptPlan = computed(() => planAcceptAll(visibleRows.value))

  const { isLoading: isApplying, execute } = useAsyncState(
    async ({ status, ruleIds }) => {
      const response = await postReviewBatch(collectionId.value, {
        source: { review: { status } },
        assets: { assetIds: [assetId.value] },
        rules: { ruleIds },
      })
      if (response?.failedValidation > 0) {
        triggerError(`${response.failedValidation} review(s) could not be set to ${status}.`)
      }
      await onApplied?.()
      return response
    },
    { immediate: false },
  )

  function applySubmit() {
    const ruleIds = submitPlan.value.eligible.map(r => r.ruleId)
    if (!ruleIds.length) {
      return Promise.resolve(null)
    }
    return execute({ status: 'submitted', ruleIds })
  }

  function applyAccept() {
    const ruleIds = acceptPlan.value.eligible.map(r => r.ruleId)
    if (!ruleIds.length) {
      return Promise.resolve(null)
    }
    return execute({ status: 'accepted', ruleIds })
  }

  return {
    visibleRows,
    submitPlan,
    acceptPlan,
    isApplying,
    applySubmit,
    applyAccept,
  }
}
