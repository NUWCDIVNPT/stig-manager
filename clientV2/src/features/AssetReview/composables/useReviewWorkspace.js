import { computed, ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import {
  fetchChecklist,
  fetchCollection,
  fetchReview,
  fetchRuleContent,
  patchReview,
  putReview,
} from '../api/assetReviewApi.js'

/**
 * Central state manager for the Asset Review workspace.
 * Created in AssetReview.vue, returned values are passed as props to children.
 *
 * @param {object} params - Reactive refs for route params
 * @param {import('vue').Ref<string>} params.collectionId
 * @param {import('vue').Ref<string>} params.assetId
 * @param {import('vue').Ref<string>} params.benchmarkId
 * @param {import('vue').Ref<string>} params.revisionStr
 */
export function useReviewWorkspace({ collectionId, assetId, benchmarkId, revisionStr }) {
  const { getCollectionRoleId } = useCurrentUser()

  // --- Collection settings ---
  const { state: collection, execute: loadCollection } = useAsyncState(
    () => fetchCollection(collectionId.value),
    { immediate: false },
  )

  const fieldSettings = computed(() => collection.value?.settings?.fields ?? {
    detail: { enabled: 'always', required: 'always' },
    comment: { enabled: 'always', required: 'findings' },
  })

  const statusSettings = computed(() => collection.value?.settings?.status ?? {
    canAccept: false,
    minAcceptGrant: 4,
    resetCriteria: 'result',
  })

  const roleId = computed(() => getCollectionRoleId(collectionId.value))

  const canAccept = computed(() =>
    statusSettings.value.canAccept && roleId.value >= statusSettings.value.minAcceptGrant,
  )

  // --- Checklist data ---
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
      )
      accessMode.value = response.access ?? 'r'
      return response.checklist ?? []
    },
    { immediate: false, initialState: [] },
  )

  // --- Selected rule ---
  const selectedRuleId = ref(null)

  const selectedChecklistItem = computed(() => {
    if (!selectedRuleId.value || !checklistData.value?.length) {
      return null
    }
    return checklistData.value.find(item => item.ruleId === selectedRuleId.value) ?? null
  })

  // --- Rule content ---
  const {
    state: ruleContent,
    isLoading: isRuleLoading,
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
  const {
    state: currentReview,
    isLoading: isReviewLoading,
    execute: loadReview,
  } = useAsyncState(
    () => fetchReview(
      collectionId.value,
      assetId.value,
      selectedRuleId.value,
    ),
    { immediate: false, onError: null },
  )

  // --- Form state (dirty tracking) ---
  const formValues = ref({
    result: '',
    detail: '',
    comment: '',
    resultEngine: null,
  })

  const savedValues = ref({
    result: '',
    detail: '',
    comment: '',
    resultEngine: null,
  })

  const isDirty = computed(() => {
    return formValues.value.result !== savedValues.value.result
      || formValues.value.detail !== savedValues.value.detail
      || formValues.value.comment !== savedValues.value.comment
  })

  const resultChanged = computed(() => {
    return formValues.value.result !== savedValues.value.result
  })

  // --- Submittability logic ---
  const isSubmittable = computed(() => {
    if (accessMode.value !== 'rw') {
      return false
    }
    const result = formValues.value.result
    if (!result || (result !== 'pass' && result !== 'fail' && result !== 'notapplicable')) {
      return false
    }

    const fs = fieldSettings.value
    if (fs.detail?.required === 'always' && !formValues.value.detail?.trim()) {
      return false
    }
    if (fs.detail?.required === 'findings' && result === 'fail' && !formValues.value.detail?.trim()) {
      return false
    }
    if (fs.comment?.required === 'always' && !formValues.value.comment?.trim()) {
      return false
    }
    if (fs.comment?.required === 'findings' && result === 'fail' && !formValues.value.comment?.trim()) {
      return false
    }

    return true
  })

  // --- Load review data into form ---
  function loadReviewIntoForm(review) {
    const vals = {
      result: review?.result ?? '',
      detail: review?.detail ?? '',
      comment: review?.comment ?? '',
      resultEngine: review?.resultEngine ?? null,
    }
    formValues.value = { ...vals }
    savedValues.value = { ...vals }
  }

  // --- Handle rule selection ---
  async function selectRule(ruleId) {
    if (ruleId === selectedRuleId.value) {
      return
    }
    selectedRuleId.value = ruleId
    if (!ruleId) {
      ruleContent.value = null
      currentReview.value = null
      loadReviewIntoForm(null)
      return
    }

    // Load rule content and review in parallel
    loadRuleContent()
    const review = await loadReview()
    loadReviewIntoForm(review)
  }

  // --- Save operations ---
  const { isLoading: isSaving, execute: executeSave } = useAsyncState(
    async (actionType) => {
      const ruleId = selectedRuleId.value
      if (!ruleId) {
        return null
      }

      let status
      let method
      switch (actionType) {
        case 'accept':
          status = 'accepted'
          method = 'PATCH'
          break
        case 'submit':
          status = 'submitted'
          method = 'PATCH'
          break
        case 'unsubmit':
          status = 'saved'
          method = 'PATCH'
          break
        case 'save':
        case 'save and unsubmit':
          status = 'saved'
          method = 'PUT'
          break
        case 'save and submit':
          status = 'submitted'
          method = 'PUT'
          break
        default:
          return null
      }

      let result
      if (method === 'PUT') {
        const body = {
          result: formValues.value.result,
          detail: formValues.value.detail,
          comment: formValues.value.comment,
          resultEngine: resultChanged.value ? null : formValues.value.resultEngine,
          status,
        }
        result = await putReview(collectionId.value, assetId.value, ruleId, body)
      }
      else {
        result = await patchReview(collectionId.value, assetId.value, ruleId, { status })
      }

      // Update checklist row in-place
      if (checklistData.value?.length) {
        const idx = checklistData.value.findIndex(item => item.ruleId === ruleId)
        if (idx !== -1) {
          const updated = { ...checklistData.value[idx] }
          updated.result = result.result
          updated.status = result.status?.label ?? result.status
          updated.touchTs = result.touchTs
          updated.resultEngine = result.resultEngine
          checklistData.value = [
            ...checklistData.value.slice(0, idx),
            updated,
            ...checklistData.value.slice(idx + 1),
          ]
        }
      }

      // Update current review and reset form
      currentReview.value = result
      loadReviewIntoForm(result)

      return result
    },
    { immediate: false },
  )

  async function saveReview(actionType) {
    return executeSave(actionType)
  }

  // --- Initial loading ---
  function loadWorkspace() {
    loadCollection()
    if (benchmarkId.value && revisionStr.value) {
      loadChecklist()
    }
  }

  // --- Watch for STIG/revision changes ---
  watch([benchmarkId, revisionStr], () => {
    selectedRuleId.value = null
    ruleContent.value = null
    currentReview.value = null
    loadReviewIntoForm(null)
    if (benchmarkId.value && revisionStr.value) {
      loadChecklist()
    }
  })

  return {
    // Collection settings
    collection,
    fieldSettings,
    statusSettings,
    canAccept,
    roleId,

    // Checklist
    checklistData,
    isChecklistLoading,
    checklistError,
    accessMode,

    // Selected rule
    selectedRuleId,
    selectedChecklistItem,
    selectRule,

    // Rule content
    ruleContent,
    isRuleLoading,

    // Review
    currentReview,
    isReviewLoading,
    formValues,
    savedValues,
    isDirty,
    resultChanged,
    isSubmittable,

    // Save
    isSaving,
    saveReview,

    // Initialization
    loadWorkspace,
    loadChecklist,
  }
}
