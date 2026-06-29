import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useLabelSelection } from '../composables/useLabelSelection.js'

function makeLabels() {
  return [
    { labelId: 'l1', name: 'Production', color: 'ff0000' },
    { labelId: 'l2', name: 'Staging', color: '00ff00' },
    { labelId: 'l3', name: 'Prod-DB', color: null },
  ]
}

describe('useLabelSelection — filtering', () => {
  it('returns all labels when the filter is empty', () => {
    const labels = ref(makeLabels())
    const selectedIds = ref([])
    const { filteredLabels } = useLabelSelection(labels, selectedIds)
    expect(filteredLabels.value.map(l => l.labelId)).toEqual(['l1', 'l2', 'l3'])
  })

  it('filters by name case-insensitively', () => {
    const labels = ref(makeLabels())
    const selectedIds = ref([])
    const { labelFilter, filteredLabels } = useLabelSelection(labels, selectedIds)
    labelFilter.value = 'prod'
    expect(filteredLabels.value.map(l => l.name)).toEqual(['Production', 'Prod-DB'])
  })

  it('floats selected labels to the top of the filtered list', () => {
    const labels = ref(makeLabels())
    const selectedIds = ref(['l3'])
    const { filteredLabels } = useLabelSelection(labels, selectedIds)
    expect(filteredLabels.value.map(l => l.labelId)).toEqual(['l3', 'l1', 'l2'])
  })
})

describe('useLabelSelection — toggling', () => {
  it('toggleLabel adds then removes an id', () => {
    const labels = ref(makeLabels())
    const selectedIds = ref([])
    const { toggleLabel, isLabelSelected } = useLabelSelection(labels, selectedIds)

    toggleLabel('l1')
    expect(selectedIds.value).toEqual(['l1'])
    expect(isLabelSelected('l1')).toBe(true)

    toggleLabel('l1')
    expect(selectedIds.value).toEqual([])
    expect(isLabelSelected('l1')).toBe(false)
  })

  it('toggleLabel replaces the array immutably rather than mutating it', () => {
    const labels = ref(makeLabels())
    const original = []
    const selectedIds = ref(original)
    const { toggleLabel } = useLabelSelection(labels, selectedIds)

    toggleLabel('l1')
    expect(selectedIds.value).not.toBe(original)
  })
})

describe('useLabelSelection — select-all behavior', () => {
  it('allFilteredSelected is false when nothing is selected', () => {
    const labels = ref(makeLabels())
    const selectedIds = ref([])
    const { allFilteredSelected } = useLabelSelection(labels, selectedIds)
    expect(allFilteredSelected.value).toBe(false)
  })

  it('toggleAllFiltered selects only the visible (filtered) labels', () => {
    const labels = ref(makeLabels())
    const selectedIds = ref([])
    const { labelFilter, toggleAllFiltered, allFilteredSelected } = useLabelSelection(labels, selectedIds)

    labelFilter.value = 'prod'
    toggleAllFiltered()
    expect(selectedIds.value.sort()).toEqual(['l1', 'l3'])
    expect(allFilteredSelected.value).toBe(true)
  })

  it('toggleAllFiltered clears only the filtered labels, keeping the rest', () => {
    const labels = ref(makeLabels())
    const selectedIds = ref(['l1', 'l2', 'l3'])
    const { labelFilter, toggleAllFiltered } = useLabelSelection(labels, selectedIds)

    labelFilter.value = 'prod' // matches l1 + l3
    toggleAllFiltered() // all filtered are selected, so this clears them
    expect(selectedIds.value).toEqual(['l2'])
  })
})

describe('useLabelSelection — helpers', () => {
  it('getLabelById returns the matching label or undefined', () => {
    const labels = ref(makeLabels())
    const selectedIds = ref([])
    const { getLabelById } = useLabelSelection(labels, selectedIds)
    expect(getLabelById('l2').name).toBe('Staging')
    expect(getLabelById('nope')).toBeUndefined()
  })

  it('labelColor falls back to a default when color is missing', () => {
    const labels = ref(makeLabels())
    const selectedIds = ref([])
    const { labelColor } = useLabelSelection(labels, selectedIds)
    expect(labelColor({ color: null })).toBe('#888888')
    expect(labelColor(undefined)).toBe('#888888')
  })
})
