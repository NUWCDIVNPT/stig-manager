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

export function formatReviewDate(dateStr) {
  if (!dateStr) {
    return '--'
  }
  return new Date(dateStr).toLocaleString()
}
