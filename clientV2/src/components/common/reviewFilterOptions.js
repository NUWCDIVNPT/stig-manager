import { h } from 'vue'
import ReviewFilterOption from './ReviewFilterOption.vue'

function optionOf(kind) {
  const component = ({ option }) => h(ReviewFilterOption, { option, kind })
  component.props = ['option', 'field']
  return component
}

// optionComponent values for useGridSearch columns: Filter button values drawn as the
// checklist grids draw the cell
export const REVIEW_FILTER_OPTIONS = Object.freeze({
  cat: optionOf('cat'),
  result: optionOf('result'),
  engine: optionOf('engine'),
  status: optionOf('status'),
})
