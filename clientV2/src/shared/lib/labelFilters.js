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

// Inverse of buildLabelFilterParams for values read back from a route query,
// where a repeated key may arrive as a string or an array. `null` in the
// result means "assets with no label".
export function parseLabelFilterParams(query = {}) {
  const raw = query.labelId === undefined ? [] : [].concat(query.labelId)
  const ids = raw.filter(id => typeof id === 'string' && id)
  if (query.labelMatch === 'null') {
    ids.push(null)
  }
  return ids
}
