import { computed } from 'vue'
import { isReviewComplete } from '../../../shared/lib/reviewFormUtils.js'

/**
 * Determines which bulk review actions are available for the current row selection.
 *
 * Counts each row's status (unsaved, saved-complete, saved-incomplete, submitted,
 * accepted, rejected) and applies per-action eligibility rules. Single-row
 * selections follow the legacy single-row rules; multi-row selections use the
 * broader bulk rules.
 *
 * @param {import('vue').Ref<Array>} selection - Reactive array of selected review rows.
 * @param {import('vue').Ref<Object>} fieldSettings - Reactive collection field settings used to
 *   determine whether a saved review is considered complete.
 * @returns {{ actionStates: import('vue').ComputedRef<{
 *   accept: boolean,
 *   reject: boolean,
 *   submit: boolean,
 *   unsubmit: boolean,
 *   batchEdit: boolean,
 * }> }} Object whose `actionStates` ref contains a boolean flag for each action.
 */
export function useReviewActionAvailability(selection, fieldSettings) {
  const counts = computed(() => {
    const s = selection.value || []
    const res = {
      total: s.length,
      unsaved: 0,
      savedComplete: 0,
      savedIncomplete: 0,
      submitted: 0,
      accepted: 0,
      rejected: 0,
    }

    s.forEach((row) => {
      const status = (row.status?.label || row.status || '').toLowerCase()
      if (!status) {
        res.unsaved++
      }
      else if (status === 'saved') {
        if (isReviewComplete(row, fieldSettings.value)) {
          res.savedComplete++
        }
        else {
          res.savedIncomplete++
        }
      }
      else if (status === 'submitted') {
        res.submitted++
      }
      else if (status === 'accepted') {
        res.accepted++
      }
      else if (status === 'rejected') {
        res.rejected++
      }
    })

    return res
  })

  const actionStates = computed(() => {
    const c = counts.value
    const total = c.total

    if (total === 0) {
      return {
        accept: false,
        reject: false,
        submit: false,
        unsubmit: false,
        batchEdit: false,
      }
    }

    // Special case for single row to match explicit legacy single-row rules
    if (total === 1) {
      const row = selection.value[0]
      const status = (row.status?.label || row.status || '').toLowerCase()

      if (!status) {
        return { accept: false, reject: false, submit: false, unsubmit: false, batchEdit: false }
      }

      if (status === 'saved') {
        const complete = isReviewComplete(row, fieldSettings.value)
        return {
          accept: false,
          reject: false,
          submit: complete,
          unsubmit: false,
          batchEdit: false,
        }
      }
      if (status === 'submitted') {
        return {
          accept: true,
          reject: true,
          submit: false,
          unsubmit: true,
          batchEdit: false,
        }
      }
      if (status === 'rejected') {
        return {
          accept: true,
          reject: true,
          submit: true,
          unsubmit: true,
          batchEdit: false,
        }
      }
      if (status === 'accepted') {
        return {
          accept: false,
          reject: false,
          submit: false,
          unsubmit: true,
          batchEdit: false,
        }
      }
    }

    // Multi-row rules
    return {
      accept: (c.submitted > 0 || c.rejected > 0)
              && (c.unsaved === 0 && c.savedIncomplete === 0 && c.savedComplete === 0)
              && (c.accepted < total),

      reject: (c.submitted > 0)
              && (c.unsaved === 0 && c.savedIncomplete === 0 && c.savedComplete === 0 && c.accepted === 0 && c.rejected === 0),

      submit: (c.savedComplete > 0 || c.submitted > 0 || c.accepted > 0 || c.rejected > 0)
              && (c.unsaved === 0 && c.savedIncomplete === 0)
              && (c.submitted < total),

      unsubmit: (c.submitted > 0 || c.accepted > 0 || c.rejected > 0)
                && (c.unsaved === 0),

      batchEdit: total >= 2,
    }
  })

  return {
    actionStates,
  }
}
