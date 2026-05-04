import { userEvent } from '@testing-library/user-event'
import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoute } from 'vue-router'
import * as stigsApi from '../../../shared/api/stigsApi.js'

import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import * as checklistUtils from '../../../shared/lib/checklistUtils.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import CollectionChecklistGridHeader from '../components/CollectionChecklistGridHeader.vue'

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: vi.fn(),
}))

vi.mock('../../../shared/api/stigsApi.js', () => ({
  fetchStigRevisions: vi.fn(),
}))

vi.mock('../../../shared/lib/checklistUtils.js', () => ({
  getRevisionInfo: vi.fn(),
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

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
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
    useRoute.mockReturnValue({ params: {} })
    checklistUtils.getRevisionInfo.mockReturnValue(null)
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
    return renderWithProviders(CollectionChecklistGridHeader, {
      props: {
        ...defaultProps,
        ...props,
      },
    })
  }

  describe('rendering & Titles', () => {
    it('renders fallback title when neither benchmarkId nor revision display exist', () => {
      createWrapper()
      expect(screen.getByText('Collection Checklist')).toBeInTheDocument()
    })

    it('renders benchmarkId when revision display does not exist', () => {
      useRoute.mockReturnValue({ params: { benchmarkId: 'RHEL_8' } })
      createWrapper()
      expect(screen.getByText('RHEL_8')).toBeInTheDocument()
    })

    it('renders benchmarkId + revision display when both exist', () => {
      useRoute.mockReturnValue({ params: { benchmarkId: 'RHEL_8', revisionStr: 'V1R2' } })
      checklistUtils.getRevisionInfo.mockReturnValue({ display: 'V1R2' })
      createWrapper()
      expect(screen.getByText('RHEL_8 - V1R2')).toBeInTheDocument()
    })

    it('calls fetchStigRevisions on mount if benchmarkId is present', () => {
      useRoute.mockReturnValue({ params: { benchmarkId: 'RHEL_8' } })
      createWrapper()
      expect(stigsApi.fetchStigRevisions).toHaveBeenCalledWith('RHEL_8')
    })

    it('does not call fetchStigRevisions on mount if benchmarkId is missing', () => {
      createWrapper()
      expect(stigsApi.fetchStigRevisions).not.toHaveBeenCalled()
    })
  })

  describe('search Functionality (Debounce & Clear)', () => {
    it('updates search but does not emit immediately', async () => {
      const { emitted } = createWrapper()
      const input = screen.getByPlaceholderText('Search...')

      await fireEvent.update(input, 'test')

      expect(input).toHaveValue('test')
      expect(emitted()['update:searchFilter']).toBeFalsy()
    })

    it('emits update:searchFilter after 250ms debounce', async () => {
      const { emitted } = createWrapper()
      const input = screen.getByPlaceholderText('Search...')

      await fireEvent.update(input, 'test')

      vi.advanceTimersByTime(250)

      expect(emitted()['update:searchFilter']).toBeTruthy()
      const emits = emitted()['update:searchFilter']
      expect(emits[emits.length - 1]).toEqual(['test'])
    })

    it('shows clear button conditionally and clears input when clicked', async () => {
      const { emitted } = createWrapper()
      const input = screen.getByPlaceholderText('Search...')

      expect(screen.queryByLabelText('Clear review search')).not.toBeInTheDocument()

      await fireEvent.update(input, 'test')

      const clearBtn = screen.getByLabelText('Clear review search')
      expect(clearBtn).toBeInTheDocument()

      await fireEvent.click(clearBtn)

      expect(input).toHaveValue('')

      vi.advanceTimersByTime(250)
      const emits = emitted()['update:searchFilter']
      expect(emits[emits.length - 1]).toEqual([''])
    })
  })

  describe('checklist Menu (Display Mode)', () => {
    it('updates displayMode when menu items are clicked', async () => {
      const { emitted } = createWrapper()

      const menuBtn = screen.getByRole('button', { name: /Checklist/i })
      await fireEvent.click(menuBtn)

      vi.advanceTimersByTime(500)

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
