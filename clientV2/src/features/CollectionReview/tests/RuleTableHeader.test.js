import { userEvent } from '@testing-library/user-event'
import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import RuleTableHeader from '../components/RuleTableHeader.vue'

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: vi.fn(),
}))

describe('ruleTableHeader.vue', () => {
  let mockDensityState

  beforeEach(() => {
    mockDensityState = {
      canIncrease: true,
      canDecrease: true,
      increaseRowHeight: vi.fn(),
      decreaseRowHeight: vi.fn(),
    }
    useGridDensity.mockReturnValue(mockDensityState)
    vi.clearAllMocks()
  })

  const defaultProps = {
    selectedRuleId: 'V-12345',
    toggleableColumns: [{ field: 'col1', header: 'Col 1' }],
    actionStates: {
      accept: true,
      reject: true,
      submit: true,
      unsubmit: true,
      batchEdit: true,
    },
    canAccept: true,
    selectedColumns: [{ field: 'col1', header: 'Col 1' }],
  }

  function createWrapper(props = {}) {
    return renderWithProviders(RuleTableHeader, {
      props: {
        ...defaultProps,
        ...props,
        'onUpdate:selectedColumns': (e) => {},
      },
    })
  }

  describe('rendering & Props', () => {
    it('renders the correct title when selectedRuleId is provided', () => {
      createWrapper()
      expect(screen.getByText('Reviews of V-12345')).toBeInTheDocument()
    })

    it('renders fallback title when selectedRuleId is missing', () => {
      createWrapper({ selectedRuleId: undefined })
      expect(screen.getByText('Reviews of —')).toBeInTheDocument()
    })

    it('shows Accept and Reject buttons when canAccept is true', () => {
      createWrapper({ canAccept: true })
      expect(screen.getByText('Accept')).toBeInTheDocument()
      expect(screen.getByText('Reject')).toBeInTheDocument()
    })

    it('hides Accept and Reject buttons when canAccept is false', () => {
      createWrapper({ canAccept: false })
      expect(screen.queryByText('Accept')).not.toBeInTheDocument()
      expect(screen.queryByText('Reject')).not.toBeInTheDocument()
    })

    it('disables buttons correctly based on actionStates', () => {
      createWrapper({
        actionStates: {
          accept: false,
          reject: false,
          submit: false,
          unsubmit: false,
          batchEdit: false,
        },
      })

      const acceptBtn = screen.getByText('Accept').closest('button')
      const rejectBtn = screen.getByText('Reject').closest('button')
      const submitBtn = screen.getByText('Submit').closest('button')
      const unsubmitBtn = screen.getByText('Unsubmit').closest('button')
      const batchEditBtn = screen.getByText('Batch edit').closest('button')

      expect(acceptBtn).toBeDisabled()
      expect(rejectBtn).toBeDisabled()
      expect(submitBtn).toBeDisabled()
      expect(unsubmitBtn).toBeDisabled()
      expect(batchEditBtn).toBeDisabled()
    })
  })

  describe('user Interactions & Emits', () => {
    it('emits "bulk-action" with "accept" when Accept button is clicked', async () => {
      const { emitted } = createWrapper()
      const user = userEvent.setup()
      await user.click(screen.getByText('Accept').closest('button'))
      expect(emitted()['bulk-action']).toBeTruthy()
      expect(emitted()['bulk-action'][0]).toEqual(['accept'])
    })

    it('emits "bulk-action" with "reject" when Reject button is clicked', async () => {
      const { emitted } = createWrapper()
      const user = userEvent.setup()
      await user.click(screen.getByText('Reject').closest('button'))
      expect(emitted()['bulk-action']).toBeTruthy()
      expect(emitted()['bulk-action'][0]).toEqual(['reject'])
    })

    it('emits "bulk-action" with "submit" when Submit button is clicked', async () => {
      const { emitted } = createWrapper()
      const user = userEvent.setup()
      await user.click(screen.getByText('Submit').closest('button'))
      expect(emitted()['bulk-action']).toBeTruthy()
      expect(emitted()['bulk-action'][0]).toEqual(['submit'])
    })

    it('emits "bulk-action" with "unsubmit" when Unsubmit button is clicked', async () => {
      const { emitted } = createWrapper()
      const user = userEvent.setup()
      await user.click(screen.getByText('Unsubmit').closest('button'))
      expect(emitted()['bulk-action']).toBeTruthy()
      expect(emitted()['bulk-action'][0]).toEqual(['unsubmit'])
    })

    it('emits "bulk-action" with "batchEdit" when Batch edit button is clicked', async () => {
      const { emitted } = createWrapper()
      const user = userEvent.setup()
      await user.click(screen.getByText('Batch edit').closest('button'))
      expect(emitted()['bulk-action']).toBeTruthy()
      expect(emitted()['bulk-action'][0]).toEqual(['batchEdit'])
    })
  })

  describe('search (Debounce & Clear)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('emits update:searchFilter only after the 250ms debounce', async () => {
      const { emitted } = createWrapper()
      const input = screen.getByPlaceholderText('Search...')

      await fireEvent.update(input, 'asset')

      expect(input).toHaveValue('asset')
      expect(emitted()['update:searchFilter']).toBeFalsy()

      vi.advanceTimersByTime(250)

      const emits = emitted()['update:searchFilter']
      expect(emits[emits.length - 1]).toEqual(['asset'])
    })

    it('shows the clear button only while there is a term and clears on click', async () => {
      const { emitted } = createWrapper()
      const input = screen.getByPlaceholderText('Search...')

      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()

      await fireEvent.update(input, 'asset')
      await vi.advanceTimersByTimeAsync(250)
      await fireEvent.click(screen.getByLabelText('Clear search'))

      expect(input).toHaveValue('')
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
      const emits = emitted()['update:searchFilter']
      expect(emits[emits.length - 1]).toEqual([''])
    })

    it('reflects an externally changed searchFilter prop', async () => {
      const { rerender } = createWrapper({ searchFilter: 'one' })
      expect(screen.getByPlaceholderText('Search...')).toHaveValue('one')

      await rerender({ ...defaultProps, searchFilter: 'two' })
      expect(screen.getByPlaceholderText('Search...')).toHaveValue('two')
    })
  })

  describe('density Controls (Composable Integration)', () => {
    it('calls decreaseRowHeight when decrease button is clicked', async () => {
      createWrapper()
      const user = userEvent.setup()
      const decreaseBtn = screen.getByTitle('Decrease row height')
      await user.click(decreaseBtn)
      expect(mockDensityState.decreaseRowHeight).toHaveBeenCalledOnce()
    })

    it('calls increaseRowHeight when increase button is clicked', async () => {
      createWrapper()
      const user = userEvent.setup()
      const increaseBtn = screen.getByTitle('Increase row height')
      await user.click(increaseBtn)
      expect(mockDensityState.increaseRowHeight).toHaveBeenCalledOnce()
    })

    it('disables decrease button at the grid minimum', () => {
      mockDensityState.canDecrease = false
      useGridDensity.mockReturnValue(mockDensityState)
      createWrapper()
      const decreaseBtn = screen.getByTitle('Decrease row height')
      expect(decreaseBtn).toBeDisabled()
    })

    it('disables increase button at the maximum', () => {
      mockDensityState.canIncrease = false
      useGridDensity.mockReturnValue(mockDensityState)
      createWrapper()
      const increaseBtn = screen.getByTitle('Increase row height')
      expect(increaseBtn).toBeDisabled()
    })
  })
})
