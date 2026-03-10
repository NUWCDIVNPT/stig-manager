import { computed, ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import {
  fetchChecklist,
  fetchCollection,
  fetchReview,
  fetchReviewsByAsset,
  fetchRuleContent,
  fetchStigRevisions,
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

  // --- STIG revision info (for checklist header) ---
  const { state: stigRevisions, execute: loadStigRevisions } = useAsyncState(
    () => fetchStigRevisions(benchmarkId.value),
    { immediate: false, initialState: [], onError: null },
  )

  const revisionInfo = computed(() => {
    const rs = revisionStr.value
    if (!rs) {
      return null
    }

    // Parse "V2R3" format
    const match = rs.match(/^V(\d+)R(\d+)$/)
    if (!match) {
      return { display: rs }
    }

    const version = match[1]
    const release = match[2]

    // Find matching revision from fetched data to get the date
    const rev = stigRevisions.value?.find(r => r.revisionStr === rs)
    const benchmarkDate = rev?.benchmarkDate
      ? new Date(rev.benchmarkDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : null

    return {
      display: benchmarkDate
        ? `Version ${version} Release ${release} (${benchmarkDate})`
        : `Version ${version} Release ${release}`,
      version,
      release,
      benchmarkDate,
    }
  })

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

  // --- All reviews (for grid mode) ---
  const {
    state: allReviews,
    execute: loadAllReviews,
  } = useAsyncState(
    () => fetchReviewsByAsset(collectionId.value, assetId.value, benchmarkId.value),
    { immediate: false, initialState: [], onError: null },
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
        detail: review?.detail ?? '',
        comment: review?.comment ?? '',
        username: review?.username ?? item.username ?? '',
      }
    })
  })

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

    // Sort descending by touchTs (newest first)
    history.sort((a, b) => new Date(b.touchTs) - new Date(a.touchTs))

    return history
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

  // --- Cell edit save (for grid mode) ---
  async function saveCellEdit(ruleId, field, newValue) {
    const row = gridData.value.find(r => r.ruleId === ruleId)
    if (!row) {
      return null
    }

    const body = {
      result: field === 'result' ? newValue : row.result,
      detail: field === 'detail' ? newValue : (row.detail ?? ''),
      comment: field === 'comment' ? newValue : (row.comment ?? ''),
      resultEngine: field === 'result' ? null : row.resultEngine,
      status: 'saved',
    }

    const result = await putReview(collectionId.value, assetId.value, ruleId, body)

    // Update allReviews in place
    const reviewIdx = allReviews.value.findIndex(r => r.ruleId === ruleId)
    if (reviewIdx !== -1) {
      allReviews.value = [
        ...allReviews.value.slice(0, reviewIdx),
        result,
        ...allReviews.value.slice(reviewIdx + 1),
      ]
    }
    else {
      allReviews.value = [...allReviews.value, result]
    }

    // Update checklist row
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

    // Update current review if this is the selected rule
    if (ruleId === selectedRuleId.value) {
      currentReview.value = result
      loadReviewIntoForm(result)
    }

    return result
  }

  // --- Status action (for grid mode toolbar) ---
  async function saveStatusAction(ruleId, actionType) {
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

    // Update allReviews
    const reviewIdx = allReviews.value.findIndex(r => r.ruleId === ruleId)
    if (reviewIdx !== -1) {
      allReviews.value = [
        ...allReviews.value.slice(0, reviewIdx),
        result,
        ...allReviews.value.slice(reviewIdx + 1),
      ]
    }

    // Update checklist row
    if (checklistData.value?.length) {
      const idx = checklistData.value.findIndex(item => item.ruleId === ruleId)
      if (idx !== -1) {
        const updated = { ...checklistData.value[idx] }
        updated.status = result.status?.label ?? result.status
        updated.touchTs = result.touchTs
        checklistData.value = [
          ...checklistData.value.slice(0, idx),
          updated,
          ...checklistData.value.slice(idx + 1),
        ]
      }
    }

    // Update current review if selected
    if (ruleId === selectedRuleId.value) {
      currentReview.value = result
      loadReviewIntoForm(result)
    }

    return result
  }

  // --- Initial loading ---
  function loadWorkspace() {
    loadCollection()
    if (benchmarkId.value) {
      loadStigRevisions()
    }
    if (benchmarkId.value && revisionStr.value) {
      loadChecklist()
      loadAllReviews()
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
      loadAllReviews()
    }
  })

  return {
    // Collection settings
    collection,
    fieldSettings,
    statusSettings,
    canAccept,
    roleId,

    // Revision info
    revisionInfo,

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
    reviewHistory,
    formValues,
    savedValues,
    isDirty,
    resultChanged,
    isSubmittable,

    // Save
    isSaving,
    saveReview,

    // Grid mode
    gridData,
    saveCellEdit,
    saveStatusAction,

    // Initialization
    loadWorkspace,
    loadChecklist,
    loadAllReviews,
  }
}
