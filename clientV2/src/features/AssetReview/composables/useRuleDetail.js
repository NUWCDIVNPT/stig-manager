import { computed, ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchRule } from '../api/assetReviewApi.js'

export function useRuleDetail({ ruleLookupMap, collectionId, assetId, benchmarkId, revisionStr }) {
  const selectedRuleId = ref(null)

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

  watch(selectedRuleId, (ruleId) => {
    if (!ruleId) {
      ruleContent.value = null
      return
    }

    ruleContent.value = null

    if (benchmarkId?.value && revisionStr?.value) {
      loadRuleContent(ruleId)
    }
  })

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
