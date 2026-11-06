import { computed, ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchRule } from '../api/assetReviewApi.js'

// selectedRuleId: optional ref to hold the selection (Asset Review passes one kept in ?ruleId)
export function useRuleDetail({ ruleLookupMap, benchmarkId, revisionStr, selectedRuleId = ref(null) }) {
  const selectedChecklistItem = computed(() => {
    if (!selectedRuleId.value || !ruleLookupMap.value) {
      return null
    }
    return ruleLookupMap.value.get(selectedRuleId.value) ?? null
  })

  const {
    state: ruleContent,
    isLoading: isRuleLoading,
    error: ruleContentError,
    execute: loadRuleContent,
  } = useAsyncState(
    ruleId => fetchRule(benchmarkId.value, revisionStr.value, ruleId),
    { immediate: false, initialState: null, onError: null },
  )

  // Content depends on the STIG and revision too, so the same rule id on another revision reloads;
  // immediate so a rule restored from the URL loads without having to "change"
  watch([selectedRuleId, () => benchmarkId?.value, () => revisionStr?.value], ([ruleId]) => {
    ruleContent.value = null
    if (ruleId && benchmarkId?.value && revisionStr?.value) {
      loadRuleContent(ruleId)
    }
  }, { immediate: true })

  function selectRule(ruleId) {
    if (ruleId === selectedRuleId.value) {
      return
    }
    selectedRuleId.value = ruleId
  }

  function clearSelectedRule() {
    selectedRuleId.value = null
  }

  return {
    selectedRuleId,
    selectedChecklistItem,
    ruleContent,
    isRuleLoading,
    ruleContentError,
    selectRule,
    clearSelectedRule,
  }
}
