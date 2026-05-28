import { userEvent } from '@testing-library/user-event'
import { screen, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import PickList from '../PickList.vue'

function getListboxes() {
  return screen.getAllByRole('listbox')
}

function getOption(listbox, name) {
  return within(listbox).getByRole('option', { name })
}

describe('pickList.vue', () => {
  const sourceItems = [
    { id: 'a', name: 'Apple' },
    { id: 'b', name: 'Banana' },
    { id: 'c', name: 'Cherry' },
  ]
  const targetItems = [
    { id: 'd', name: 'Date' },
    { id: 'e', name: 'Elderberry' },
  ]

  const defaultProps = {
    modelValue: [sourceItems, targetItems],
    dataKey: 'name',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders default Available and Selected headers', () => {
      renderWithProviders(PickList, { props: defaultProps })

      expect(screen.getByText('Available')).toBeInTheDocument()
      expect(screen.getByText('Selected')).toBeInTheDocument()
    })

    it('renders custom header slots', () => {
      renderWithProviders(PickList, {
        props: defaultProps,
        slots: {
          sourceheader: '<span>Source List</span>',
          targetheader: '<span>Target List</span>',
        },
      })

      expect(screen.getByText('Source List')).toBeInTheDocument()
      expect(screen.getByText('Target List')).toBeInTheDocument()
    })

    it('renders items in source and target using dataKey', () => {
      renderWithProviders(PickList, { props: defaultProps })

      const [sourceLb, targetLb] = getListboxes()
      expect(within(sourceLb).getByRole('option', { name: 'Apple' })).toBeInTheDocument()
      expect(within(sourceLb).getByRole('option', { name: 'Banana' })).toBeInTheDocument()
      expect(within(sourceLb).getByRole('option', { name: 'Cherry' })).toBeInTheDocument()
      expect(within(targetLb).getByRole('option', { name: 'Date' })).toBeInTheDocument()
      expect(within(targetLb).getByRole('option', { name: 'Elderberry' })).toBeInTheDocument()
    })

    it('renders items via custom item slot', () => {
      renderWithProviders(PickList, {
        props: defaultProps,
        slots: {
          item: '<span class="custom-item">CUSTOM-{{ params.item.id }}</span>',
        },
      })

      expect(screen.getByText('CUSTOM-a')).toBeInTheDocument()
      expect(screen.getByText('CUSTOM-d')).toBeInTheDocument()
    })

    it('handles an empty modelValue gracefully', () => {
      renderWithProviders(PickList, {
        props: {
          modelValue: [[], []],
          dataKey: 'name',
        },
      })

      expect(screen.getByText('Available')).toBeInTheDocument()
      expect(screen.getByText('Selected')).toBeInTheDocument()
      // Both listboxes render an "empty" status option but no real items
      expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument()
    })

    it('does not render filters by default', () => {
      renderWithProviders(PickList, { props: defaultProps })

      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
    })

    it('renders source/target filters with custom placeholders when enabled', () => {
      renderWithProviders(PickList, {
        props: {
          ...defaultProps,
          showSourceFilter: true,
          showTargetFilter: true,
          sourceFilterPlaceholder: 'Filter source',
          targetFilterPlaceholder: 'Filter target',
        },
      })

      expect(screen.getByPlaceholderText('Filter source')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Filter target')).toBeInTheDocument()
    })
  })

  describe('button disabled state', () => {
    it('disables single-move buttons when nothing is selected', () => {
      const { container } = renderWithProviders(PickList, { props: defaultProps })

      const moveRight = container.querySelector('.pi-angle-right').closest('button')
      const moveLeft = container.querySelector('.pi-angle-left').closest('button')

      expect(moveRight).toBeDisabled()
      expect(moveLeft).toBeDisabled()
    })

    it('move-all buttons are always enabled', () => {
      const { container } = renderWithProviders(PickList, { props: defaultProps })

      const moveAllRight = container.querySelector('.pi-angle-double-right').closest('button')
      const moveAllLeft = container.querySelector('.pi-angle-double-left').closest('button')

      expect(moveAllRight).not.toBeDisabled()
      expect(moveAllLeft).not.toBeDisabled()
    })
  })

  describe('move actions', () => {
    it('emits update:modelValue moving selected source items right', async () => {
      const user = userEvent.setup()
      const { container, emitted } = renderWithProviders(PickList, {
        props: defaultProps,
      })

      const [sourceLb] = getListboxes()
      await user.click(getOption(sourceLb, 'Apple'))

      const moveRight = container.querySelector('.pi-angle-right').closest('button')
      expect(moveRight).not.toBeDisabled()
      await user.click(moveRight)

      expect(emitted()['update:modelValue']).toBeTruthy()
      const [newSource, newTarget] = emitted()['update:modelValue'].at(-1)[0]
      expect(newSource).toEqual([sourceItems[1], sourceItems[2]])
      expect(newTarget).toEqual([...targetItems, sourceItems[0]])
    })

    it('emits update:modelValue moving selected target items left', async () => {
      const user = userEvent.setup()
      const { container, emitted } = renderWithProviders(PickList, {
        props: defaultProps,
      })

      const [, targetLb] = getListboxes()
      await user.click(getOption(targetLb, 'Elderberry'))

      const moveLeft = container.querySelector('.pi-angle-left').closest('button')
      expect(moveLeft).not.toBeDisabled()
      await user.click(moveLeft)

      const [newSource, newTarget] = emitted()['update:modelValue'].at(-1)[0]
      expect(newSource).toEqual([...sourceItems, targetItems[1]])
      expect(newTarget).toEqual([targetItems[0]])
    })

    it('moves all source items right when move-all-right is clicked', async () => {
      const user = userEvent.setup()
      const { container, emitted } = renderWithProviders(PickList, {
        props: defaultProps,
      })

      const moveAllRight = container.querySelector('.pi-angle-double-right').closest('button')
      await user.click(moveAllRight)

      const [newSource, newTarget] = emitted()['update:modelValue'].at(-1)[0]
      expect(newSource).toEqual([])
      expect(newTarget).toEqual([...targetItems, ...sourceItems])
    })

    it('moves all target items left when move-all-left is clicked', async () => {
      const user = userEvent.setup()
      const { container, emitted } = renderWithProviders(PickList, {
        props: defaultProps,
      })

      const moveAllLeft = container.querySelector('.pi-angle-double-left').closest('button')
      await user.click(moveAllLeft)

      const [newSource, newTarget] = emitted()['update:modelValue'].at(-1)[0]
      expect(newSource).toEqual([...sourceItems, ...targetItems])
      expect(newTarget).toEqual([])
    })
  })

  describe('filtering', () => {
    it('filters source items by the filterBy field', async () => {
      const user = userEvent.setup()
      renderWithProviders(PickList, {
        props: {
          ...defaultProps,
          showSourceFilter: true,
          filterBy: 'name',
        },
      })

      const input = screen.getByPlaceholderText('Search...')
      await user.type(input, 'an')

      const [sourceLb] = getListboxes()
      // "Banana" contains "an"; "Apple" and "Cherry" do not
      expect(within(sourceLb).getByRole('option', { name: 'Banana' })).toBeInTheDocument()
      expect(within(sourceLb).queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument()
      expect(within(sourceLb).queryByRole('option', { name: 'Cherry' })).not.toBeInTheDocument()
    })

    it('filters target items by the filterBy field', async () => {
      const user = userEvent.setup()
      renderWithProviders(PickList, {
        props: {
          ...defaultProps,
          showTargetFilter: true,
          filterBy: 'name',
        },
      })

      const input = screen.getByPlaceholderText('Search...')
      await user.type(input, 'elder')

      const [, targetLb] = getListboxes()
      expect(within(targetLb).getByRole('option', { name: 'Elderberry' })).toBeInTheDocument()
      expect(within(targetLb).queryByRole('option', { name: 'Date' })).not.toBeInTheDocument()
    })

    it('ignores the filter input when filterBy is not provided', async () => {
      const user = userEvent.setup()
      renderWithProviders(PickList, {
        props: {
          ...defaultProps,
          showSourceFilter: true,
        },
      })

      const input = screen.getByPlaceholderText('Search...')
      await user.type(input, 'zzz')

      const [sourceLb] = getListboxes()
      expect(within(sourceLb).getByRole('option', { name: 'Apple' })).toBeInTheDocument()
      expect(within(sourceLb).getByRole('option', { name: 'Banana' })).toBeInTheDocument()
      expect(within(sourceLb).getByRole('option', { name: 'Cherry' })).toBeInTheDocument()
    })

    it('move-all-right only moves the currently filtered source items', async () => {
      const user = userEvent.setup()
      const { container, emitted } = renderWithProviders(PickList, {
        props: {
          ...defaultProps,
          showSourceFilter: true,
          filterBy: 'name',
        },
      })

      const input = screen.getByPlaceholderText('Search...')
      await user.type(input, 'an') // matches only "Banana"

      const moveAllRight = container.querySelector('.pi-angle-double-right').closest('button')
      await user.click(moveAllRight)

      const [newSource, newTarget] = emitted()['update:modelValue'].at(-1)[0]
      expect(newSource).toEqual([sourceItems[0], sourceItems[2]])
      expect(newTarget).toEqual([...targetItems, sourceItems[1]])
    })
  })
})
