import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import GridFilterOption from '../GridFilterOption.vue'

describe('gridFilterOption.vue', () => {
  it('draws the value with the column\'s optionComponent, passing option and field', () => {
    const Custom = props => h('b', `${props.field}:${props.option.name}`)
    Custom.props = ['option', 'field']
    renderWithProviders(GridFilterOption, {
      props: { option: { value: 'O', name: 'O', color: null }, column: { field: 'result', optionComponent: Custom } },
    })
    expect(screen.getByText('result:O').tagName).toBe('B')
  })

  it('draws a colored value as a label chip', () => {
    const { container } = renderWithProviders(GridFilterOption, { props: { option: { value: 'prod', name: 'prod', color: 'ff0000' } } })
    expect(container.querySelector('.label-tag')).toHaveTextContent('prod')
  })

  it('draws plain text otherwise, dimming the empty option', () => {
    renderWithProviders(GridFilterOption, { props: { option: { value: '', name: '(no labels)', color: null } } })
    expect(screen.getByText('(no labels)')).toHaveClass('grid-filter-option--empty')
  })
})
