import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import AssetChecklistGridTable from '../components/AssetChecklistGridTable.vue'

// Mock PrimeVue components to avoid JSDOM virtual scrolling issues
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    props: ['value', 'selection', 'filters', 'loading'],
    template: `
      <div data-testid="mock-datatable">
        <slot></slot> <!-- Renders the Column components -->
        <slot name="header"></slot>
        <slot name="footer"></slot>
        <slot name="empty"></slot>
        <button data-testid="mock-row-click" @click="$emit('update:selection', value[0])">Select First Row</button>
      </div>
    `,
  },
}))

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    props: ['field', 'header'],
    template: '<div data-testid="mock-column" :data-field="field"></div>',
  },
}))

describe('AssetChecklistGridTable', () => {
  const defaultProps = {
    gridData: [],
    isLoading: false,
    selectedRow: null,
    searchFilter: '',
    visibleFields: new Set(['groupId', 'ruleId', 'result', 'status', 'severity']),
    itemSize: 30,
  }

  function createWrapper(props = {}) {
    return renderWithProviders(AssetChecklistGridTable, {
      props: { ...defaultProps, ...props },
    })
  }

  describe('column Visibility', () => {
    it('renders only the columns specified in visibleFields', () => {
      const visibleFields = new Set(['ruleId', 'result'])
      createWrapper({ visibleFields })

      const columns = screen.getAllByTestId('mock-column')
      const fields = columns.map(c => c.getAttribute('data-field'))

      expect(fields).toContain('ruleId')
      expect(fields).toContain('result')

      // Ensure other columns are NOT rendered
      expect(fields).not.toContain('groupId')
      expect(fields).not.toContain('status')
    })
  })

  describe('empty State', () => {
    it('renders empty state message when gridData is empty', () => {
      createWrapper({ gridData: [] })
      expect(screen.getByText('No checklist items found.')).toBeInTheDocument()
    })
  })

  describe('footer Statistics & Metrics', () => {
    it('calculates aggregate counts correctly for badges', () => {
      const gridData = [
        { ruleId: 'V-1', result: 'fail', status: 'submitted' },
        { ruleId: 'V-2', result: 'fail', status: 'submitted' },
        { ruleId: 'V-3', result: 'pass', status: 'accepted' },
        { ruleId: 'V-4', result: 'notapplicable', status: 'saved' },
        { ruleId: 'V-5', result: 'informational', status: 'saved' },
      ]

      createWrapper({ gridData })

      const footer = document.querySelector('.status-footer')
      const getBadgeCountByTitle = (title) => {
        const badge = footer.querySelector(`[title="${title}"]`)
        return badge?.querySelector('.status-count')?.textContent
      }

      expect(getBadgeCountByTitle('Open/Fail')).toBe('2')
      expect(getBadgeCountByTitle('Not A Finding/Pass')).toBe('1')
      expect(getBadgeCountByTitle('Not Applicable')).toBe('1')
      expect(getBadgeCountByTitle('Not Reviewed or has a non-compliance result such as informational.')).toBe('1')

      expect(getBadgeCountByTitle('Submitted')).toBe('2')
      expect(getBadgeCountByTitle('Accepted')).toBe('1')
      expect(getBadgeCountByTitle('Rejected')).toBe('0')
    })
  })

  describe('interactions & Emits', () => {
    it('emits update:selectedRow when a row is clicked via datatable selection update', async () => {
      const gridData = [{ ruleId: 'V-1' }, { ruleId: 'V-2' }]
      const { emitted } = createWrapper({ gridData })

      const rowClicker = screen.getByTestId('mock-row-click')
      rowClicker.click()

      expect(emitted()['update:selectedRow']).toBeTruthy()
      expect(emitted()['update:selectedRow'][0][0]).toEqual(expect.objectContaining({ ruleId: 'V-1' }))
    })

    it('emits refresh when footer refresh action is triggered', async () => {
      const { emitted } = createWrapper()

      // The refresh button doesn't have a label or aria-label in the template, so we find it by icon
      const refreshBtn = document.querySelector('.pi-refresh').closest('button')
      refreshBtn.click()

      expect(emitted()['refresh']).toBeTruthy()
    })
  })
})
