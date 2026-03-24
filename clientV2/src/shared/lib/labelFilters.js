export function buildLabelFilterParams(selectedLabelIds = []) {
  if (!Array.isArray(selectedLabelIds) || selectedLabelIds.length === 0) {
    return {}
  }

  const hasNoLabel = selectedLabelIds.includes(null) || selectedLabelIds.includes('null')
  const labelIds = selectedLabelIds.filter(id => id !== null && id !== 'null')

  if (hasNoLabel && labelIds.length === 0) {
    return { labelMatch: 'null' }
  }

  if (!hasNoLabel && labelIds.length > 0) {
    return { labelId: labelIds }
  }

  // Allow mixed filtering: unlabeled OR one of selected labels.
  return { labelMatch: 'null', labelId: labelIds }
}
