import { computed, ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { defaultFieldSettings } from '../../../shared/lib/reviewFormUtils.js'
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

  const fieldSettings = computed(() => collection.value?.settings?.fields ?? defaultFieldSettings)

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
    execute: loadReview,
  } = useAsyncState(
    () => fetchReview(
      collectionId.value,
      assetId.value,
      selectedRuleId.value,
    ),
    { immediate: false, onError: null },
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

  // --- Save state ---
  const isSaving = ref(false)

  // --- Full review save (for grid popover) ---
  async function saveFullReview(ruleId, { result: newResult, detail, comment, status }) {
    isSaving.value = true
    try {
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
    }
    finally {
      isSaving.value = false
    }
  }

  // --- Status action (for grid mode) ---
  async function saveStatusAction(ruleId, actionType) {
    isSaving.value = true
    try {
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
    }
    finally {
      isSaving.value = false
    }
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
    reviewHistory,

    // Grid mode
    isSaving,
    gridData,
    saveFullReview,
    saveStatusAction,

    // Initialization
    loadWorkspace,
    loadChecklist,
    loadAllReviews,
  }
}
