import { ref, computed } from 'vue'

/**
 * Composable for managing table selection with shift-click support.
 * 
 * @param {import('vue').Ref<Array>} items - The list of all items in the table.
 * @param {import('vue').Ref<Array>} selectedItems - The list of selected items.
 * @param {Function} onUpdate - Callback function to update the selected items.
 * @param {string} idKey - The key to use as ID (default: 'id').
 */
export function useTableSelection(items, selectedItems, onUpdate, idKey = 'id') {
  const lastClickedIndex = ref(null)
  // Tracks whether the most recent (non-shift) click selected or deselected its
  // row, so a following shift-click can apply the same action across the range.
  const lastAction = ref('select')

  const selectedIdSet = computed(() => {
    const sel = selectedItems.value || []
    return new Set(sel.map(item => item[idKey]))
  })

  const isAllSelected = computed(() => {
    const its = items.value || []
    const sel = selectedIdSet.value
    return its.length > 0 && its.every(item => sel.has(item[idKey]))
  })

  function toggleRow(item) {
    const sel = selectedItems.value || []
    let next
    if (selectedIdSet.value.has(item[idKey])) {
      next = sel.filter(i => i[idKey] !== item[idKey])
    } else {
      next = [...sel, item]
    }
    onUpdate(next)
  }

  function selectAll(checked) {
    const its = items.value || []
    onUpdate(checked ? [...its] : [])
  }

  function handleCheckboxClick(event, item, index) {
    if (event.shiftKey && lastClickedIndex.value !== null) {
      const its = items.value || []
      const sel = selectedItems.value || []

      const start = Math.min(lastClickedIndex.value, index)
      const end = Math.max(lastClickedIndex.value, index)
      const rangeItems = its.slice(start, end + 1)
      const rangeIds = new Set(rangeItems.map(i => i[idKey]))
      const currentIds = selectedIdSet.value

      let next
      if (lastAction.value === 'deselect') {
        // Remove every row in the range from the selection.
        next = sel.filter(i => !rangeIds.has(i[idKey]))
      } else {
        // Add every row in the range that isn't already selected.
        next = [...sel]
        for (const i of rangeItems) {
          if (!currentIds.has(i[idKey])) {
            next.push(i)
          }
        }
      }
      onUpdate(next)
    } else {
      lastClickedIndex.value = index
      // Record the resulting state so a subsequent shift-click repeats it.
      lastAction.value = selectedIdSet.value.has(item[idKey]) ? 'deselect' : 'select'
      toggleRow(item)
    }
  }

  return {
    selectedIdSet,
    isAllSelected,
    selectAll,
    handleCheckboxClick
  }
}
