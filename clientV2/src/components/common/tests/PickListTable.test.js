import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../testUtils/utils'
import PickListTable from '../PickListTable.vue'

const apple = { id: 'a1', name: 'Apple' }
const banana = { id: 'b1', name: 'Banana' }
const cherry = { id: 'c1', name: 'Cherry' }

function renderPicker(props = {}) {
  return renderWithProviders(PickListTable, {
    props: {
      modelValue: [[apple, banana], [cherry]],
      dataKey: 'id',
      ...props,
    },
  })
}

// The move buttons are icon-only PrimeVue Buttons; find them by their icon class.
function moveButton(container, iconClass) {
  return container.querySelector(`.${iconClass}`)?.closest('button')
}

// Reads the [newSource, newTarget] payload from the most recent update:modelValue,
// mapped down to ids for easy comparison.
function lastEmittedIds(emitted) {
  const [newSource, newTarget] = emitted()['update:modelValue'].at(-1)[0]
  return [newSource.map(i => i.id), newTarget.map(i => i.id)]
}

describe('pickListTable', () => {
  it('renders the items in both panes', () => {
    renderPicker()
    expect(screen.getByText('a1')).toBeInTheDocument()
    expect(screen.getByText('b1')).toBeInTheDocument()
    expect(screen.getByText('c1')).toBeInTheDocument()
  })

  it('moves all source items to the target with move-all-right', async () => {
    const user = userEvent.setup()
    const { container, emitted } = renderPicker()

    await user.click(moveButton(container, 'pi-angle-double-right'))

    expect(lastEmittedIds(emitted)).toEqual([[], ['c1', 'a1', 'b1']])
  })

  it('moves all target items back to the source with move-all-left', async () => {
    const user = userEvent.setup()
    const { container, emitted } = renderPicker()

    await user.click(moveButton(container, 'pi-angle-double-left'))

    expect(lastEmittedIds(emitted)).toEqual([['a1', 'b1', 'c1'], []])
  })

  it('disables the single-move buttons when nothing is selected', () => {
    const { container } = renderPicker()
    expect(moveButton(container, 'pi-angle-right')).toBeDisabled()
    expect(moveButton(container, 'pi-angle-left')).toBeDisabled()
  })

  it('filters the source pane by the filterBy field', async () => {
    const user = userEvent.setup()
    renderPicker({ showSourceFilter: true, filterBy: 'name', sourceFilterPlaceholder: 'Search available' })

    await user.type(screen.getByPlaceholderText('Search available'), 'App')

    expect(screen.getByText('a1')).toBeInTheDocument()
    expect(screen.queryByText('b1')).not.toBeInTheDocument()
  })

  it('move-all-right only moves the items matching the active filter', async () => {
    const user = userEvent.setup()
    const { container, emitted } = renderPicker({
      showSourceFilter: true,
      filterBy: 'name',
      sourceFilterPlaceholder: 'Search available',
    })

    await user.type(screen.getByPlaceholderText('Search available'), 'App')
    await user.click(moveButton(container, 'pi-angle-double-right'))

    // Apple moves to target; Banana (filtered out) stays in source.
    expect(lastEmittedIds(emitted)).toEqual([['b1'], ['c1', 'a1']])
  })
})
