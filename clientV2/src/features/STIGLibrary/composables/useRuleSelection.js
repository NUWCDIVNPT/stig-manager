import { watch } from 'vue'
import { fetchRule } from '../../../shared/api/stigsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'

/**
 * Library-scoped rule-detail fetch. Stripped copy of AssetReview's useRuleDetail:
 * no review state, no ruleLookupMap, no upsert handling.
 */
export function useRuleSelection({ benchmarkId, viewRev, selectedRuleId }) {
  const {
    state: ruleContent,
    isLoading: isRuleLoading,
    error: ruleContentError,
    execute: loadRuleContent,
  } = useAsyncState(
    ruleId => fetchRule(benchmarkId.value, viewRev.value, ruleId),
    { immediate: false, initialState: null, onError: null },
  )

  watch(
    [benchmarkId, viewRev, selectedRuleId],
    ([bm, rev, ruleId]) => {
      if (!bm || !rev || !ruleId) {
        ruleContent.value = null
        return
      }
      ruleContent.value = null
      loadRuleContent(ruleId)
    },
    { immediate: true },
  )

  function retry() {
    if (selectedRuleId.value && benchmarkId.value && viewRev.value) {
      loadRuleContent(selectedRuleId.value)
    }
  }

  return {
    ruleContent,
    isRuleLoading,
    ruleContentError,
    retry,
  }
}
