/**
 * Determines the state of the two action buttons in the review form.
 *
 * Ported from the old client's SM/Review.js setReviewFormItemStates().
 *
 * @param {object} params
 * @param {string} params.accessMode - 'rw' or 'r'
 * @param {string} params.statusLabel - current review status: '', 'saved', 'submitted', 'accepted', 'rejected'
 * @param {boolean} params.isDirty - whether the form has unsaved changes
 * @param {boolean} params.isSubmittable - whether the review meets submission requirements
 * @param {boolean} params.canAccept - whether the user can accept reviews
 * @returns {{ btn1: ButtonState, btn2: ButtonState }} The visibility, enabled state, text, tooltip, and action type for each button
 */
export function getReviewButtonStates({ accessMode, statusLabel, isDirty, isSubmittable, canAccept }) {
  const status = statusLabel || ''

  if (accessMode !== 'rw') {
    return {
      btn1: { text: 'Save without submitting', enabled: false, visible: false, actionType: '', tooltip: '' },
      btn2: { text: 'Read only', enabled: false, visible: true, actionType: '', tooltip: '' },
    }
  }

  const editable = status === '' || status === 'saved' || status === 'rejected'

  if (!editable) {
    // Status is submitted or accepted — fields are disabled but buttons may still work
    if (isSubmittable) {
      // Clean + submitted or accepted
      if (status === 'submitted') {
        return {
          btn1: { text: 'Unsubmit', enabled: true, visible: true, actionType: 'unsubmit', tooltip: '' },
          btn2: canAccept
            ? { text: 'Accept', enabled: true, visible: true, actionType: 'accept', tooltip: '' }
            : { text: 'Submit', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review has already been submitted.' },
        }
      }
      if (status === 'accepted') {
        return {
          btn1: { text: 'Unsubmit', enabled: true, visible: true, actionType: 'unsubmit', tooltip: '' },
          btn2: { text: 'Accept', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review has already been accepted.' },
        }
      }
    }
    else {
      // Not submittable + submitted (field requirements changed after submission)
      if (status === 'submitted') {
        return {
          btn1: { text: 'Unsubmit', enabled: true, visible: true, actionType: 'unsubmit', tooltip: '' },
          btn2: { text: 'Save and Submit', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review is not complete and cannot be submitted.' },
        }
      }
    }
  }

  // Editable states (saved, rejected, or empty)
  if (isSubmittable) {
    if (isDirty) {
      const btn2Text = status === 'rejected' ? 'Save and Resubmit' : 'Save and Submit'
      return {
        btn1: { text: 'Save without submitting', enabled: true, visible: true, actionType: 'save', tooltip: '' },
        btn2: { text: btn2Text, enabled: true, visible: true, actionType: 'save and submit', tooltip: '' },
      }
    }
    else {
      // Clean + editable + submittable
      if (status === 'rejected') {
        return {
          btn1: { text: 'Save without submitting', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review has not been modified.' },
          btn2: { text: 'Save and Resubmit', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review has not been modified.' },
        }
      }
      return {
        btn1: { text: 'Save without submitting', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review has not been modified.' },
        btn2: { text: 'Submit', enabled: true, visible: true, actionType: 'submit', tooltip: '' },
      }
    }
  }
  else {
    // Not submittable
    if (isDirty) {
      return {
        btn1: { text: 'Save without submitting', enabled: true, visible: true, actionType: 'save and unsubmit', tooltip: '' },
        btn2: { text: 'Save and Submit', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review is not complete and cannot be submitted.' },
      }
    }
    else {
      // Clean + not submittable
      if (status === 'submitted') {
        return {
          btn1: { text: 'Unsubmit', enabled: true, visible: true, actionType: 'unsubmit', tooltip: '' },
          btn2: { text: 'Save and Submit', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review is not complete and cannot be submitted.' },
        }
      }
      return {
        btn1: { text: 'Save without submitting', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review has not been modified.' },
        btn2: { text: 'Save and Submit', enabled: false, visible: true, actionType: '', tooltip: 'This button is disabled because the review is not complete and cannot be submitted.' },
      }
    }
  }
}
