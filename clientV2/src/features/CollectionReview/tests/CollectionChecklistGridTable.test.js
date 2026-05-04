import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/testUtils/utils.js'
import CollectionChecklistGridTable from '../components/CollectionChecklistGridTable.vue'

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



describe('CollectionChecklistGridTable', () => {
  const defaultProps = {
    gridData: [],
    isLoading: false,
    selectedRow: null,
    searchFilter: '',
    assetCount: 2,
    visibleFields: new Set(['groupId', 'ruleId', 'fail', 'pass', 'submitted', 'oldest']),
    itemSize: 30,
  }

  function createWrapper(props = {}) {
    return renderWithProviders(CollectionChecklistGridTable, {
      props: { ...defaultProps, ...props },
    })
  }

  describe('column Visibility', () => {
    it('renders only the columns specified in visibleFields', () => {
      const visibleFields = new Set(['ruleId', 'fail', 'submitted'])
      createWrapper({ visibleFields })

      const columns = screen.getAllByTestId('mock-column')
      const fields = columns.map(c => c.getAttribute('data-field'))

      // 'severity' is always visible in the template (no v-if)
      expect(fields).toContain('severity')
      expect(fields).toContain('ruleId')
      expect(fields).toContain('counts.results.fail')
      expect(fields).toContain('counts.statuses.submitted')

      // Ensure other columns are NOT rendered
      expect(fields).not.toContain('groupId')
      expect(fields).not.toContain('counts.results.pass')
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
        {
          ruleId: 'V-1',
          counts: {
            results: { fail: 2, pass: 1 },
            statuses: { submitted: 1 },
          },
        },
        {
          ruleId: 'V-2',
          counts: {
            results: { fail: 1, notapplicable: 3 },
            statuses: { submitted: 2, accepted: 1 },
          },
        },
      ]

      createWrapper({ gridData })

      const footer = document.querySelector('.status-footer')
      const getBadgeCountByTitle = (title) => {
        const badge = footer.querySelector(`[title="${title}"]`)
        return badge?.querySelector('.status-count')?.textContent
      }

      expect(getBadgeCountByTitle('Open/Fail')).toBe('3') // fail: 2 + 1
      expect(getBadgeCountByTitle('Not A Finding/Pass')).toBe('1') // pass: 1 + 0
      expect(getBadgeCountByTitle('Not Applicable')).toBe('3') // notapplicable: 0 + 3
      expect(getBadgeCountByTitle('Not Reviewed or has a non-compliance result such as informational.')).toBe('0') // other: undefined

      expect(getBadgeCountByTitle('Submitted')).toBe('3') // 1 + 2
      expect(getBadgeCountByTitle('Accepted')).toBe('1') // 0 + 1
      expect(getBadgeCountByTitle('Rejected')).toBe('0')
    })

    it('calculates footer metrics based on assetCount and gridData length', () => {
      const gridData = [{ ruleId: 'V-1' }, { ruleId: 'V-2' }, { ruleId: 'V-3' }]
      const assetCount = 4
      createWrapper({ gridData, assetCount })

      // Required assessments = 3 rules * 4 assets = 12
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('assets')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('assessments')).toBeInTheDocument()

      const footerTotal = document.querySelector('.status-footer__metric-total')
      expect(footerTotal.textContent).toContain('3')
      expect(footerTotal.textContent).toContain('rules')
    })
  })

  describe('interactions & Emits', () => {
    it('emits update:selectedRow when a row is clicked', async () => {
      const gridData = [{ ruleId: 'V-1' }, { ruleId: 'V-2' }]
      const { emitted } = createWrapper({ gridData })

      const rowClicker = screen.getByTestId('mock-row-click')
      rowClicker.click()

      expect(emitted()['update:selectedRow']).toBeTruthy()
      expect(emitted()['update:selectedRow'][0][0]).toEqual({ ruleId: 'V-1' })
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
