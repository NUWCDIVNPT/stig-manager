import { computed, ref } from 'vue'
import { normalizeColor } from '../../../shared/lib/colorUtils.js'

/**
 * Label multi-select: a filterable checklist with bulk ("select all visible")
 * and shift-click range selection. `selectedIds` is the source of truth and is
 * owned by the caller; this composable reads/writes it against the full
 * `collectionLabels` list.
 *
 * @param {import('vue').Ref<Array>} collectionLabels - All labels in the collection.
 * @param {import('vue').WritableComputedRef<Array>} selectedIds - Selected labelIds.
 */
export function useLabelSelection(collectionLabels, selectedIds) {
  const labelFilter = ref('')

  const filteredLabels = computed(() => {
    const q = labelFilter.value.trim().toLowerCase()
    if (!q) {
      return collectionLabels.value
    }
    return collectionLabels.value.filter(l => l.name.toLowerCase().includes(q))
  })

  // True only when every currently-filtered label is selected (and there's at
  // least one), so the "select all" toggle reflects the visible subset.
  const allFilteredSelected = computed(() =>
    filteredLabels.value.length > 0
    && filteredLabels.value.every(l => selectedIds.value.includes(l.labelId)),
  )

  function getLabelById(id) {
    return collectionLabels.value.find(l => l.labelId === id)
  }

  function labelColor(label) {
    return normalizeColor(label?.color, '#888888')
  }

  function isLabelSelected(id) {
    return selectedIds.value.includes(id)
  }

  function toggleLabel(id) {
    selectedIds.value = isLabelSelected(id)
      ? selectedIds.value.filter(x => x !== id)
      : [...selectedIds.value, id]
  }

  function selectAllFiltered() {
    const ids = new Set(selectedIds.value)
    for (const l of filteredLabels.value) {
      ids.add(l.labelId)
    }
    selectedIds.value = [...ids]
  }

  function clearFiltered() {
    const filteredIds = new Set(filteredLabels.value.map(l => l.labelId))
    selectedIds.value = selectedIds.value.filter(id => !filteredIds.has(id))
  }

  function toggleAllFiltered() {
    if (allFilteredSelected.value) {
      clearFiltered()
    }
    else {
      selectAllFiltered()
    }
  }

  // Apply a single selection state across a contiguous slice of filteredLabels
  // (used by shift-click range select/deselect).
  function setLabelRange(fromIndex, toIndex, selected) {
    const start = Math.min(fromIndex, toIndex)
    const end = Math.max(fromIndex, toIndex)
    const rangeIds = filteredLabels.value.slice(start, end + 1).map(l => l.labelId)
    const ids = new Set(selectedIds.value)
    for (const id of rangeIds) {
      if (selected) {
        ids.add(id)
      }
      else {
        ids.delete(id)
      }
    }
    selectedIds.value = [...ids]
  }

  return {
    labelFilter,
    filteredLabels,
    allFilteredSelected,
    getLabelById,
    labelColor,
    isLabelSelected,
    toggleLabel,
    toggleAllFiltered,
    setLabelRange,
  }
}
