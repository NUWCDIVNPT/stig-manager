import { REVIEW_STATUS } from './reviewConstants.js'
import { TOOLTIPS } from './tooltips.js'

/**
 * Determines the state of the three action buttons (save, submit, accept)
 * in the review form.
 *
 * @param {object} params
 * @param {string} params.accessMode - 'rw' or 'r'
 * @param {string} params.statusLabel - current review status: '', 'saved', 'submitted', 'accepted', 'rejected'
 * @param {boolean} params.isDirty - whether the form has unsaved changes
 * @param {boolean} params.isSubmittable - whether the review meets submission requirements
 * @param {boolean} params.canAccept - whether the user can accept reviews
 * @returns {{ save: ButtonState, submit: ButtonState, accept: ButtonState }}
 */
export function getReviewButtonStates({ accessMode, statusLabel, isDirty, isSubmittable, canAccept }) {
  const status = statusLabel || ''
  const editable = status === '' || status === REVIEW_STATUS.SAVED || status === REVIEW_STATUS.REJECTED

  if (accessMode !== 'rw') {
    return {
      save: { text: 'Save', enabled: false, visible: true, actionType: '', tooltip: TOOLTIPS.reviewButtons.readOnly },
      submit: { text: 'Submit', enabled: false, visible: true, actionType: '', tooltip: TOOLTIPS.reviewButtons.readOnly },
      accept: { text: 'Accept', enabled: false, visible: canAccept, actionType: '', tooltip: TOOLTIPS.reviewButtons.readOnly },
    }
  }

  // Save / Unsubmit button
  const save = editable
    ? {
        text: 'Save',
        enabled: isDirty,
        visible: true,
        actionType: isDirty ? 'save' : '',
        tooltip: isDirty ? '' : TOOLTIPS.reviewButtons.notModified,
      }
    : {
        text: 'Unsubmit',
        enabled: true,
        visible: true,
        actionType: 'unsubmit',
        tooltip: '',
      }

  // Submit button
  const submit = (() => {
    if (status === REVIEW_STATUS.SUBMITTED || status === REVIEW_STATUS.ACCEPTED) {
      return {
        text: 'Submit',
        enabled: false,
        visible: true,
        actionType: '',
        tooltip: status === REVIEW_STATUS.SUBMITTED
          ? TOOLTIPS.reviewButtons.alreadySubmitted
          : TOOLTIPS.reviewButtons.alreadyAccepted,
      }
    }
    if (!isSubmittable) {
      return {
        text: 'Submit',
        enabled: false,
        visible: true,
        actionType: '',
        tooltip: TOOLTIPS.reviewButtons.notComplete,
      }
    }
    if (isDirty) {
      return {
        text: 'Submit',
        enabled: true,
        visible: true,
        actionType: 'save and submit',
        tooltip: '',
      }
    }
    // Clean + submittable + editable (saved or empty)
    if (status === REVIEW_STATUS.SAVED || status === '') {
      return {
        text: 'Submit',
        enabled: true,
        visible: true,
        actionType: 'submit',
        tooltip: '',
      }
    }
    // Clean + submittable + rejected
    return {
      text: 'Submit',
      enabled: false,
      visible: true,
      actionType: '',
      tooltip: TOOLTIPS.reviewButtons.notModified,
    }
  })()

  // Accept button
  const accept = {
    text: 'Accept',
    enabled: status === REVIEW_STATUS.SUBMITTED,
    visible: canAccept,
    actionType: status === REVIEW_STATUS.SUBMITTED ? 'accept' : '',
    tooltip: status === REVIEW_STATUS.ACCEPTED
      ? TOOLTIPS.reviewButtons.alreadyAccepted
      : status !== REVIEW_STATUS.SUBMITTED
        ? TOOLTIPS.reviewButtons.mustSubmitBeforeAccept
        : '',
  }

  return { save, submit, accept }
}
