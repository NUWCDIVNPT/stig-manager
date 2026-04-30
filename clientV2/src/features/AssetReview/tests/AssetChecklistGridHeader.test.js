import { userEvent } from '@testing-library/user-event'
import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import AssetChecklistGridHeader from '../components/AssetChecklistGridHeader.vue'

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: vi.fn(),
}))

vi.mock('primevue/tieredmenu', () => ({
  default: {
    name: 'TieredMenu',
    props: ['model'],
    setup(props, { expose }) {
      expose({ toggle: vi.fn() })
      return {}
    },
    template: `
      <div>
        <div v-for="group in model" :key="group.label">
          <button v-for="item in group.items" :key="item.label" @click="item.command && item.command()">
            {{ item.label }}
          </button>
        </div>
      </div>
    `,
  },
}))

describe('checklistGridHeader.vue', () => {
  let mockDensityState

  beforeEach(() => {
    mockDensityState = {
      lineClamp: 2,
      increaseRowHeight: vi.fn(),
      decreaseRowHeight: vi.fn(),
    }
    useGridDensity.mockReturnValue(mockDensityState)
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const defaultProps = {
    searchFilter: '',
    toggleableColumns: [{ field: 'col1', header: 'Col 1' }],
    selectedColumns: [{ field: 'col1', header: 'Col 1' }],
    displayMode: 'groupRule',
  }

  function createWrapper(props = {}) {
    return renderWithProviders(AssetChecklistGridHeader, {
      props: {
        ...defaultProps,
        ...props,
      },
    })
  }

  describe('rendering & Titles', () => {
    it('renders fallback title when revisionInfo display does not exist', () => {
      createWrapper()
      const titleElements = screen.getAllByText('Checklist')
      expect(titleElements[0]).toBeInTheDocument()
    })

    it('renders revision display when it exists', () => {
      createWrapper({ revisionInfo: { display: 'V1R2' } })
      expect(screen.getByText('V1R2')).toBeInTheDocument()
    })

    it('renders asset info when provided', () => {
      createWrapper({
        asset: { name: 'Test Asset', assetId: 'A123', ip: '10.0.0.1' },
      })
      expect(screen.getByText('Test Asset')).toBeInTheDocument()
      expect(screen.getByText('ID: A123')).toBeInTheDocument()
      expect(screen.getByText('IP: 10.0.0.1')).toBeInTheDocument()
    })

    it('renders Writable access mode', () => {
      createWrapper({ accessMode: 'rw' })
      expect(screen.getByText('Writable')).toBeInTheDocument()
    })

    it('renders Read only access mode', () => {
      createWrapper({ accessMode: 'r' })
      expect(screen.getByText('Read only')).toBeInTheDocument()
    })
  })

  describe('search Functionality', () => {
    it('emits update:searchFilter immediately on input', async () => {
      const { emitted } = createWrapper()
      const input = screen.getByPlaceholderText('Search reviews...')

      await fireEvent.update(input, 'test')

      expect(input).toHaveValue('test')
      expect(emitted()['update:searchFilter']).toBeTruthy()
      const emits = emitted()['update:searchFilter']
      expect(emits[emits.length - 1]).toEqual(['test'])
    })

    it('shows clear button conditionally and clears input when clicked', async () => {
      const { emitted } = createWrapper()
      const input = screen.getByPlaceholderText('Search reviews...')

      expect(screen.queryByLabelText('Clear review search')).not.toBeInTheDocument()

      await fireEvent.update(input, 'test')

      const clearBtn = screen.getByLabelText('Clear review search')
      expect(clearBtn).toBeInTheDocument()

      await fireEvent.click(clearBtn)

      // Vue Test Utils update cycle might need flushPromises or vi.advanceTimersByTime(0) for DOM updates if it's asynchronous, but typically click triggers it right away.
      expect(emitted()['update:searchFilter']).toBeTruthy()
      const emits = emitted()['update:searchFilter']
      expect(emits[emits.length - 1]).toEqual([''])
    })
  })

  describe('checklist Menu (Display Mode)', () => {
    it('updates displayMode when menu items are clicked', async () => {
      const { emitted } = createWrapper()

      const menuBtn = screen.getByRole('button', { name: /Checklist/i })
      await fireEvent.click(menuBtn)

      const groupGroupItem = screen.getByText('Group ID and Group Title')
      await fireEvent.click(groupGroupItem)

      expect(emitted()['update:displayMode']).toBeTruthy()
      expect(emitted()['update:displayMode'][0]).toEqual(['groupGroup'])

      const ruleRuleItem = screen.getByText('Rule ID and Rule Title')
      await fireEvent.click(ruleRuleItem)

      expect(emitted()['update:displayMode'][1]).toEqual(['ruleRule'])
    })
  })

  describe('density Controls', () => {
    it('calls decreaseRowHeight when decrease button is clicked', async () => {
      createWrapper()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const decreaseBtn = screen.getByTitle('Decrease row height')
      await user.click(decreaseBtn)
      expect(mockDensityState.decreaseRowHeight).toHaveBeenCalledOnce()
    })

    it('calls increaseRowHeight when increase button is clicked', async () => {
      createWrapper()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const increaseBtn = screen.getByTitle('Increase row height')
      await user.click(increaseBtn)
      expect(mockDensityState.increaseRowHeight).toHaveBeenCalledOnce()
    })

    it('disables decrease button when lineClamp is <= 1', () => {
      mockDensityState.lineClamp = 1
      useGridDensity.mockReturnValue(mockDensityState)
      createWrapper()
      const decreaseBtn = screen.getByTitle('Decrease row height')
      expect(decreaseBtn).toBeDisabled()
    })

    it('disables increase button when lineClamp is >= 10', () => {
      mockDensityState.lineClamp = 10
      useGridDensity.mockReturnValue(mockDensityState)
      createWrapper()
      const increaseBtn = screen.getByTitle('Increase row height')
      expect(increaseBtn).toBeDisabled()
    })
  })
})
