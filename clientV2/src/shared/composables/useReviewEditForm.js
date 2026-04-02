import { computed, ref, watch } from 'vue'
import { escapeHtml } from '../lib/htmlUtils.js'
import { getReviewButtonStates } from '../lib/reviewButtonStates.js'
import { formatReviewDate, isFieldEnabled, isFieldRequired } from '../lib/reviewFormUtils.js'

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
    if (!s) {
      return ''
    }
    return s?.label ?? s
  })

  const editable = computed(() => {
    const s = statusLabel.value
    return accessMode.value === 'rw' && (s === '' || s === 'saved' || s === 'rejected')
  })

  // --- Dirty tracking ---
  const isDirty = computed(() => {
    if (!rowData.value) {
      return false
    }
    return formResult.value !== (rowData.value.result ?? '')
      || formDetail.value !== (rowData.value.detail ?? '')
      || formComment.value !== (rowData.value.comment ?? '')
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
    if (!s || s === '' || s === 'rejected') {
      return false
    }
    if (s === 'saved' && (actionType === 'save' || actionType === 'save and unsubmit')) {
      return true
    }
    if (s === 'submitted' && (actionType === 'submit' || actionType === 'save and submit')) {
      return true
    }
    if (s === 'accepted' && actionType === 'accept') {
      return true
    }
    return false
  }

  // --- Engine/Override tooltip HTML ---
  const engineTooltipHtml = computed(() => {
    const re = rowData.value?.resultEngine
    if (!re) {
      return ''
    }
    const lines = []
    if (re.version) {
      lines.push(`<b>Version</b><br>${escapeHtml(re.version)}`)
    }
    if (re.time) {
      lines.push(`<b>Time</b><br>${escapeHtml(formatReviewDate(re.time))}`)
    }
    if (re.checkContent?.location) {
      lines.push(`<b>Check content</b><br>${escapeHtml(re.checkContent.location)}`)
    }
    return lines.join('<br>')
  })

  const overrideTooltipHtml = computed(() => {
    const overrides = rowData.value?.resultEngine?.overrides
    if (!overrides?.length) {
      return ''
    }
    return overrides.map((o) => {
      const lines = []
      if (o.authority) {
        lines.push(`<b>Authority</b><br>${escapeHtml(o.authority)}`)
      }
      if (o.remark) {
        lines.push(`<b>Remark</b><br>${escapeHtml(o.remark)}`)
      }
      lines.push(`<b>Old result</b>: ${escapeHtml(o.oldResult || '\u2014')} \u2192 <b>New result</b>: ${escapeHtml(o.newResult || '\u2014')}`)
      return lines.join('<br>')
    }).join('<hr style="margin: 0.3rem 0; opacity: 0.3">')
  })

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

    // Tooltips
    engineTooltipHtml,
    overrideTooltipHtml,

    // Actions
    selectResult,
    applyReviewData,
    discardChanges,
  }
}
