import { computed, ref } from 'vue'
import { getHttpStatus } from '../../../shared/api/apiClient.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchReview, fetchRuleContent } from '../api/assetReviewApi.js'

export function useRuleDetail({ collectionId, assetId, benchmarkId, revisionStr, checklistData }) {
  // --- Selected rule ---
  const selectedRuleId = ref(null)

  const selectedChecklistItem = computed(() => {
    if (!selectedRuleId.value || !checklistData.value?.length) {
      return null
    }
    return checklistData.value.find(item => item.ruleId === selectedRuleId.value) ?? null
  })

  // --- Rule content ---
  // Panel-level error: expose ruleContentError so RuleInfo can show an inline
  // retry message. A 404 here means the rule doesn't exist in this revision;
  // it should never redirect the whole page.
  const {
    state: ruleContent,
    isLoading: isRuleLoading,
    error: ruleContentError,
    execute: loadRuleContent,
  } = useAsyncState(
    () => fetchRuleContent(
      benchmarkId.value,
      revisionStr.value,
      selectedRuleId.value,
    ),
    { immediate: false, onError: null },
  )

  // --- Current review ---
  // A 404 here is completely normal — it means no review exists yet for this rule.
  // Any other error goes to the global modal (default behaviour after re-throw).
  const {
    state: currentReview,
    execute: loadReview,
  } = useAsyncState(
    async () => {
      try {
        return await fetchReview(
          collectionId.value,
          assetId.value,
          selectedRuleId.value,
        )
      }
      catch (err) {
        if (getHttpStatus(err) === 404) {
          return null // No review yet — totally normal, not an error
        }
        throw err // Re-throw; default onError will trigger global modal
      }
    },
    { immediate: false },
  )

  // --- Review history (for ReviewResources History tab) ---
  const reviewHistory = computed(() => {
    const review = currentReview.value
    if (!review) {
      return []
    }

    const history = [...(review.history || [])]

    // Append current state as the most recent entry (mirrors old client behavior)
    history.push({
      ruleId: review.ruleId,
      result: review.result,
      detail: review.detail,
      comment: review.comment,
      resultEngine: review.resultEngine,
      status: review.status,
      ts: review.ts,
      touchTs: review.touchTs,
      userId: review.userId,
      username: review.username,
    })

    // Sort descending by touchTs (newest first) — ISO strings sort lexicographically
    history.sort((a, b) => (b.touchTs || '').localeCompare(a.touchTs || ''))

    return history
  })

  // --- Handle rule selection ---
  function selectRule(ruleId) {
    if (ruleId === selectedRuleId.value) {
      return
    }
    selectedRuleId.value = ruleId
    if (!ruleId) {
      ruleContent.value = null
      currentReview.value = null
      return
    }

    // Load rule content and review in parallel
    loadRuleContent()
    loadReview()
  }

  function clearSelectedRule() {
    selectedRuleId.value = null
    ruleContent.value = null
    currentReview.value = null
  }

  return {
    selectedRuleId,
    selectedChecklistItem,
    ruleContent,
    isRuleLoading,
    ruleContentError,
    currentReview,
    reviewHistory,
    selectRule,
    clearSelectedRule,
  }
}
