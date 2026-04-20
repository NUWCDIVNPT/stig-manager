import { computed, inject, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ENGINE_TYPE, REVIEW_STATUS } from '../../../shared/lib/reviewConstants.js'
import { calculateChecklistStats, getEngineDisplay, getResultDisplay } from '../lib/checklistUtils.js'
import { buildEngineOptions } from '../lib/reviewFilterOptions.js'

const EMPTY_STATS = {
  total: 0,
  results: { pass: 0, fail: 0, notapplicable: 0, other: 0 },
  engine: { [ENGINE_TYPE.MANUAL]: 0, [ENGINE_TYPE.ENGINE]: 0, [ENGINE_TYPE.OVERRIDE]: 0 },
  statuses: {
    [REVIEW_STATUS.SAVED]: 0,
    [REVIEW_STATUS.SUBMITTED]: 0,
    [REVIEW_STATUS.ACCEPTED]: 0,
    [REVIEW_STATUS.REJECTED]: 0,
  },
}

export function useReviewTabTable(dataRef, filterSchema) {
  const { accessMode, currentReview } = inject('assetReviewContext')

  const reviewEditForm = inject('reviewEditForm', null)

  const editable = computed(() =>
    accessMode.value === 'rw' && (
      !currentReview.value?.status?.label
      || currentReview.value.status.label === REVIEW_STATUS.SAVED
      || currentReview.value.status.label === REVIEW_STATUS.REJECTED
    ),
  )

  const isAlreadyApplied = reviewEditForm
    ? data =>
      data.result === reviewEditForm.formResult.value
      && (data.detail ?? '') === reviewEditForm.formDetail.value
      && (data.comment ?? '') === reviewEditForm.formComment.value
    : () => false

  const getApplyTooltip = (data) => {
    if (!editable.value) {
      return 'Cannot apply review while submitted or accepted'
    }
    if (isAlreadyApplied(data)) {
      return 'Review is already applied'
    }
    return 'Apply this review'
  }

  const filters = ref(
    Object.fromEntries(
      Object.entries(filterSchema).map(([key, matchMode]) => [key, { value: null, matchMode }]),
    ),
  )

  const resetFilters = () => {
    for (const key of Object.keys(filters.value)) {
      filters.value[key].value = null
    }
  }

  const route = useRoute()
  watch([
    () => route.params.collectionId,
    () => route.params.assetId,
    () => route.params.benchmarkId,
    () => route.params.revisionStr,
  ], () => {
    resetFilters()
  })

  const processedData = computed(() =>
    (dataRef.value ?? []).map(item => ({
      ...item,
      _engineDisplay: getEngineDisplay(item),
      _statusLabel: item.status?.label ?? '',
    })),
  )

  const stats = computed(() => calculateChecklistStats(dataRef.value) ?? EMPTY_STATS)

  const resultOptions = computed(() => {
    const results = new Set((dataRef.value ?? []).map(item => item.result).filter(Boolean))
    return Array.from(results).map(val => ({
      value: val,
      label: getResultDisplay(val),
    })).sort((a, b) => a.label.localeCompare(b.label))
  })

  const engineOptions = computed(() => buildEngineOptions(dataRef.value ?? []))

  return {
    editable,
    isAlreadyApplied,
    getApplyTooltip,
    filters,
    resetFilters,
    processedData,
    stats,
    resultOptions,
    engineOptions,
  }
}
