import { computed, ref } from 'vue'
import { fieldMatches } from '../../shared/lib/searchUtils.js'

// State and behaviour shared by the `[source, target]` v-model pickers
// (PickList, PickListTable): per-pane search text and selection, the built-in
// text filter, and the four move operations. `onSourceReset` / `onTargetReset`
// run after a move clears that pane's selection, for callers that keep extra
// selection state.
export function usePickListModel(props, emit, { onSourceReset, onTargetReset } = {}) {
  const sourceSearch = ref('')
  const targetSearch = ref('')

  const selectionSource = ref([])
  const selectionTarget = ref([])

  const sourceList = computed(() => props.modelValue[0] || [])
  const targetList = computed(() => props.modelValue[1] || [])

  function applyFilters(list, searchText, useTextFilter) {
    const trimmed = searchText?.trim() ?? ''
    if (!useTextFilter || trimmed.length === 0) {
      return list
    }
    if (props.textFilterFn) {
      return list.filter(item => props.textFilterFn(item, trimmed))
    }
    if (!props.filterBy) {
      return list
    }
    const lowerSearch = trimmed.toLowerCase()
    return list.filter((item) => {
      const val = item[props.filterBy]
      return val && fieldMatches(String(val), lowerSearch)
    })
  }

  const filteredSource = computed(() =>
    applyFilters(sourceList.value, sourceSearch.value, props.showSourceFilter),
  )

  const filteredTarget = computed(() =>
    applyFilters(targetList.value, targetSearch.value, props.showTargetFilter),
  )

  function moveToTarget(items) {
    const newSource = sourceList.value.filter(item => !items.includes(item))
    emit('update:modelValue', [newSource, [...targetList.value, ...items]])
    selectionSource.value = []
    onSourceReset?.()
  }

  function moveToSource(items) {
    const newTarget = targetList.value.filter(item => !items.includes(item))
    emit('update:modelValue', [[...sourceList.value, ...items], newTarget])
    selectionTarget.value = []
    onTargetReset?.()
  }

  const onMoveRight = () => {
    if (selectionSource.value.length > 0) {
      moveToTarget([...selectionSource.value])
    }
  }

  const onMoveLeft = () => {
    if (selectionTarget.value.length > 0) {
      moveToSource([...selectionTarget.value])
    }
  }

  // "All" moves only the rows matching the active filter.
  const onMoveAllRight = () => moveToTarget(filteredSource.value)
  const onMoveAllLeft = () => moveToSource(filteredTarget.value)

  return {
    sourceSearch,
    targetSearch,
    selectionSource,
    selectionTarget,
    sourceList,
    targetList,
    filteredSource,
    filteredTarget,
    onMoveRight,
    onMoveLeft,
    onMoveAllRight,
    onMoveAllLeft,
  }
}
