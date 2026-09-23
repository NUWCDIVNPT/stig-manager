/**
 * Free-text row filter for grids whose column definitions carry a
 * `searchText(row)` extractor. Columns without one (counts, percentages,
 * badges) are not searched. Pass only the visible columns so what the user
 * sees is what the search covers.
 *
 * Extension points when the search grows controls: match modes (include or
 * exclude), an "all columns" switch that falls back to String(row[field]) for
 * columns without an extractor, and a per-column pick list.
 *
 * @param {object[]} rows
 * @param {{ field: string, searchText?: (row: object) => string }[]} columns
 * @param {string} term
 * @returns {object[]} the same array when the term is blank, otherwise a filtered copy
 */
export function filterRows(rows, columns, term) {
  const query = (term ?? '').trim().toLowerCase()
  if (!query) {
    return rows
  }
  const extractors = columns.filter(c => typeof c.searchText === 'function').map(c => c.searchText)
  if (extractors.length === 0) {
    return []
  }
  return rows.filter(row => extractors.some(get => String(get(row) ?? '').toLowerCase().includes(query)))
}

/** Space-joined label names, for label chip columns. */
export function labelNames(labels) {
  return Array.isArray(labels) ? labels.map(l => l?.name ?? '').join(' ') : ''
}
