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
  const editable = status === '' || status === 'saved' || status === 'rejected'

  if (accessMode !== 'rw') {
    return {
      save: { text: 'Save', enabled: false, visible: true, actionType: '', tooltip: 'Read-only access' },
      submit: { text: 'Submit', enabled: false, visible: true, actionType: '', tooltip: 'Read-only access' },
      accept: { text: 'Accept', enabled: false, visible: canAccept, actionType: '', tooltip: 'Read-only access' },
    }
  }

  // Save / Unsubmit button
  const save = editable
    ? {
        text: 'Save',
        enabled: isDirty,
        visible: true,
        actionType: isDirty ? 'save' : '',
        tooltip: isDirty ? '' : 'Review has not been modified',
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
    if (status === 'submitted' || status === 'accepted') {
      return {
        text: 'Submit',
        enabled: false,
        visible: true,
        actionType: '',
        tooltip: status === 'submitted'
          ? 'Review has already been submitted'
          : 'Review has already been accepted',
      }
    }
    if (!isSubmittable) {
      return {
        text: 'Submit',
        enabled: false,
        visible: true,
        actionType: '',
        tooltip: 'Review is not complete and cannot be submitted',
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
    if (status === 'saved' || status === '') {
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
      tooltip: 'Review has not been modified',
    }
  })()

  // Accept button
  const accept = {
    text: 'Accept',
    enabled: status === 'submitted',
    visible: canAccept,
    actionType: status === 'submitted' ? 'accept' : '',
    tooltip: status === 'accepted'
      ? 'Review has already been accepted'
      : status !== 'submitted'
        ? 'Review must be submitted before it can be accepted'
        : '',
  }

  return { save, submit, accept }
}
