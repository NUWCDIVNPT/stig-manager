import { computed, ref, watch } from 'vue'
import { REVIEW_STATUS } from '../lib/reviewConstants.js'
import { getReviewButtonStates } from '../lib/reviewButtonStates.js'
import { isFieldEnabled, isFieldRequired } from '../lib/reviewFormUtils.js'

/**
 * Manages form state, dirty tracking, submittability, and button states
 * for the ReviewEditPopover component.
 *
 * @param {object} params
 * @param {import('vue').Ref<object>} params.rowData - The review row data
 * @param {import('vue').Ref<object>} params.fieldSettings - Collection field settings
 * @param {import('vue').Ref<string>} params.accessMode - 'r' or 'rw'
 * @param {import('vue').Ref<boolean>} params.canAccept - Whether user can accept reviews
 */
export function useReviewEditForm({ rowData, fieldSettings, accessMode, canAccept }) {
  // --- Local form state ---
  const formResult = ref('')
  const formDetail = ref('')
  const formComment = ref('')

  function syncFormFromRow(row) {
    formResult.value = row?.result ?? ''
    formDetail.value = row?.detail ?? ''
    formComment.value = row?.comment ?? ''
  }

  // Sync when rowData changes (popover opens with new row)
  watch(rowData, row => syncFormFromRow(row))

  // --- Status / editability ---
  const statusLabel = computed(() => {
    const s = rowData.value?.status
    if (!s) return ''
    return typeof s === 'string' ? s : (s?.label ?? '')
  })

  const editable = computed(() => {
    const s = statusLabel.value
    return accessMode.value === 'rw' && (s === '' || s === REVIEW_STATUS.SAVED || s === REVIEW_STATUS.REJECTED)
  })

  // --- Dirty tracking ---
  const isDirty = computed(() => {
    const row = rowData.value
    return formResult.value !== (row?.result ?? '')
      || formDetail.value !== (row?.detail ?? '')
      || formComment.value !== (row?.comment ?? '')
  })

  const showResultEmphasis = computed(() => editable.value && !formResult.value)

  // --- Field enable/require ---
  const detailEnabled = computed(() => isFieldEnabled(fieldSettings.value.detail, formResult.value, editable.value))
  const commentEnabled = computed(() => isFieldEnabled(fieldSettings.value.comment, formResult.value, editable.value))
  const detailRequired = computed(() => isFieldRequired(fieldSettings.value.detail, formResult.value))
  const commentRequired = computed(() => isFieldRequired(fieldSettings.value.comment, formResult.value))

  // --- Submittability (reuses detailRequired/commentRequired) ---
  const isSubmittable = computed(() => {
    const result = formResult.value
    if (!result || (result !== 'pass' && result !== 'fail' && result !== 'notapplicable')) {
      return false
    }
    if (detailRequired.value && !formDetail.value?.trim()) {
      return false
    }
    if (commentRequired.value && !formComment.value?.trim()) {
      return false
    }
    return true
  })

  // --- Button states ---
  const buttonStates = computed(() => {
    return getReviewButtonStates({
      accessMode: accessMode.value,
      statusLabel: statusLabel.value,
      isDirty: isDirty.value,
      isSubmittable: isSubmittable.value,
      canAccept: canAccept.value,
    })
  })

  function isActionActive(actionType) {
    const s = statusLabel.value
    if (!s || s === '' || s === REVIEW_STATUS.REJECTED) {
      return false
    }
    if (s === REVIEW_STATUS.SAVED && (actionType === 'save' || actionType === 'save and unsubmit')) {
      return true
    }
    if (s === REVIEW_STATUS.SUBMITTED && (actionType === 'submit' || actionType === 'save and submit')) {
      return true
    }
    if (s === REVIEW_STATUS.ACCEPTED && actionType === 'accept') {
      return true
    }
    return false
  }

  // --- Actions ---
  function selectResult(value) {
    if (!editable.value) {
      return
    }
    formResult.value = value
  }

  function applyReviewData(data) {
    if (!editable.value) {
      return
    }
    formResult.value = data.result ?? ''
    formDetail.value = data.detail ?? ''
    formComment.value = data.comment ?? ''
  }

  function discardChanges() {
    syncFormFromRow(rowData.value)
  }

  return {
    // Form state
    formResult,
    formDetail,
    formComment,

    // Derived state
    statusLabel,
    editable,
    isDirty,
    showResultEmphasis,
    detailEnabled,
    commentEnabled,
    detailRequired,
    commentRequired,
    isSubmittable,
    buttonStates,
    isActionActive,

    // Actions
    selectResult,
    applyReviewData,
    discardChanges,
  }
}
