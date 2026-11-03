// Label filter selections hold label names; a `null` entry means "assets with
// no label". Names (not ids) so a selection kept in a route query is readable.

// LabelName maxLength in the API spec; a longer value fails request validation
export const LABEL_NAME_MAX_LENGTH = 16

const isValidLabelName = name => typeof name === 'string' && name.length > 0 && name.length <= LABEL_NAME_MAX_LENGTH

export function buildLabelFilterParams(selectedLabelNames = []) {
  if (!Array.isArray(selectedLabelNames) || selectedLabelNames.length === 0) {
    return {}
  }

  const hasNoLabel = selectedLabelNames.includes(null)
  const labelNames = selectedLabelNames.filter(name => name !== null)

  if (hasNoLabel && labelNames.length === 0) {
    return { labelMatch: 'null' }
  }

  if (!hasNoLabel && labelNames.length > 0) {
    return { labelName: labelNames }
  }

  // Allow mixed filtering: unlabeled OR one of selected labels.
  return { labelMatch: 'null', labelName: labelNames }
}

// Inverse of buildLabelFilterParams for values read back from a route query,
// where a repeated key may arrive as a string or an array. Duplicates and over-long
// names are dropped here (LabelNameQuery is uniqueItems; LabelName has maxLength) so
// a hand-edited or stale URL cannot fail validation on every fetch.
export function parseLabelFilterParams(query = {}) {
  const names = [...new Set([].concat(query.labelName ?? []).filter(isValidLabelName))]
  if (query.labelMatch === 'null') {
    names.push(null)
  }
  return names
}

// The label filter keys of a route query, for carrying the filter to another route.
export function pickLabelFilterQuery(query = {}) {
  return buildLabelFilterParams(parseLabelFilterParams(query))
}
