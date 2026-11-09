import { TOOLTIPS } from './tooltips.js'

export const defaultFieldSettings = {
  detail: { enabled: 'always', required: 'always' },
  comment: { enabled: 'always', required: 'findings' },
}

export const resultOptions = [
  { value: 'pass', label: 'Not a Finding', display: 'NF' },
  { value: 'fail', label: 'Open', display: 'O' },
  { value: 'notapplicable', label: 'Not Applicable', display: 'NA' },
  { value: 'informational', label: 'Informational', display: 'I' },
  { value: 'notchecked', label: 'Not Reviewed', display: 'NR' },
]

// Results that represent a real assessment (vs. notchecked/informational).
export const assessedResults = ['pass', 'fail', 'notapplicable']

export function isFieldEnabled(fieldSetting, result, editable) {
  if (!editable) {
    return false
  }
  if (!result) {
    return false
  }
  if (fieldSetting?.enabled === 'always') {
    return true
  }
  if (fieldSetting?.enabled === 'findings') {
    return result === 'fail'
  }
  return false
}

export function isFieldRequired(fieldSetting, result) {
  if (fieldSetting?.required === 'always') {
    return true
  }
  if (fieldSetting?.required === 'findings' && result === 'fail') {
    return true
  }
  return false
}

/**
 * Help-icon HTML for the Detail or Comment review field: static field copy
 * from TOOLTIPS.reviewFields plus the Collection's field settings.
 * @param {'detail'|'comment'} field
 * @param {{enabled?: string, required?: string}} [fieldSetting]
 */
export function getReviewFieldTooltipHtml(field, fieldSetting) {
  const { title, desc, ckl, xccdf } = TOOLTIPS.reviewFields[field]
  const enabledText = fieldSetting?.enabled === 'findings' ? 'for findings only.' : 'for any result.'
  let requiredText = 'optional.'
  if (fieldSetting?.required === 'always') {
    requiredText = 'required to submit a review.'
  }
  else if (fieldSetting?.required === 'findings') {
    requiredText = 'required to submit a finding.'
  }
  return `<b>${title}</b><br>${desc}<br><br><b>Collection Settings</b><br>This field is enabled ${enabledText}<br>Content in this field is ${requiredText}<br><br><b>Export Mappings</b><br><b>CKL:</b> ${ckl}<br><b>XCCDF:</b> ${xccdf}`
}

export function getTimeZone() {
  return Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find(part => part.type === 'timeZoneName')
    ?.value || ''
}

export function formatReviewDate(dateStr) {
  if (!dateStr) {
    return '--'
  }
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short',
  })
}

export function statusPayloadForAction(actionType, rejectText) {
  switch (actionType) {
    case 'accept': return 'accepted'
    case 'submit': return 'submitted'
    case 'unsubmit': return 'saved'
    case 'reject': return { label: 'rejected', text: rejectText ?? '' }
    default: return null
  }
}

export function isReviewComplete(review, fieldSettings = defaultFieldSettings) {
  const result = review?.result
  if (!result) {
    return false
  }

  if (!assessedResults.includes(result)) {
    return false
  }

  if (isFieldRequired(fieldSettings?.detail, result) && !review?.detail) {
    return false
  }

  if (isFieldRequired(fieldSettings?.comment, result) && !review?.comment) {
    return false
  }

  return true
}
