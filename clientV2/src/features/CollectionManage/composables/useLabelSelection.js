import { computed, ref } from 'vue'
import { normalizeColor } from '../../../shared/lib/colorUtils.js'

/**
 * Label multi-select: a filterable checklist with bulk ("select all visible").
 * `selectedIds` is the source of truth and is owned by the caller; this
 * composable reads/writes it against the full `collectionLabels` list.
 *
 * @param {import('vue').Ref<Array>} collectionLabels - All labels in the collection.
 * @param {import('vue').WritableComputedRef<Array>} selectedIds - Selected labelIds.
 */
export function useLabelSelection(collectionLabels, selectedIds) {
  const labelFilter = ref('')

  const filteredLabels = computed(() => {
    const q = labelFilter.value.trim().toLowerCase()
    const list = q
      ? collectionLabels.value.filter(l => l.name.toLowerCase().includes(q))
      : collectionLabels.value
    const selectedSet = new Set(selectedIds.value)
    return [
      ...list.filter(l => selectedSet.has(l.labelId)),
      ...list.filter(l => !selectedSet.has(l.labelId)),
    ]
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

  return {
    labelFilter,
    filteredLabels,
    allFilteredSelected,
    getLabelById,
    labelColor,
    isLabelSelected,
    toggleLabel,
    toggleAllFiltered,
  }
}
