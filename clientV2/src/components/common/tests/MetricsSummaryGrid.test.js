import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import MetricsSummaryGrid from '../MetricsSummaryGrid.vue'

// The VirtualScroller measures nothing in JSDOM, so the real DataTable renders
// no body. Headers are what these tests check, so the mock renders the column
// children (each of which yields a mocked Column).
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    props: ['value'],
    template: `
      <div data-testid="mock-datatable">
        <table>
          <thead><tr><slot /></tr></thead>
          <tbody><tr v-for="row in value" :key="row.benchmarkId ?? row.assetId"><td>{{ row.benchmarkId ?? row.assetName }}</td></tr></tbody>
        </table>
      </div>
    `,
  },
}))

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    props: ['field', 'header'],
    template: '<th :data-field="field">{{ header }}</th>',
  },
}))

vi.mock('../ColumnToggle.vue', () => ({
  default: {
    name: 'ColumnToggle',
    props: ['modelValue', 'columns'],
    emits: ['update:modelValue'],
    template: `
      <div data-testid="column-toggle">
        <button
          v-for="c in columns"
          :key="c.field"
          type="button"
          :data-option="c.field"
          @click="$emit('update:modelValue', modelValue.some(s => s.field === c.field)
            ? modelValue.filter(s => s.field !== c.field)
            : [...modelValue, c])"
        >{{ c.header }}</button>
      </div>
    `,
  },
}))

const metrics = {
  assessments: 10,
  assessed: 5,
  minTs: '2026-01-01T00:00:00Z',
  maxTs: '2026-02-01T00:00:00Z',
  maxTouchTs: '2026-02-01T00:00:00Z',
  statuses: { submitted: 1, accepted: 1, rejected: 0 },
  findings: { low: 1, medium: 1, high: 1 },
  assessmentsBySeverity: { low: 3, medium: 4, high: 3 },
  assessedBySeverity: { low: 2, medium: 2, high: 1 },
}

const stigRows = [
  { benchmarkId: 'RHEL_9_STIG', title: 'Red Hat Enterprise Linux 9', revisionStr: 'V1R2', assets: 3, metrics },
  { benchmarkId: 'MS_Windows_11_STIG', title: 'Microsoft Windows 11', revisionStr: 'V2R8', assets: 3, metrics },
]
const checklistRows = [{ assetId: '1', name: 'host-1', labels: [], benchmarkId: 'RHEL_9_STIG', revisionStr: 'V1R2', metrics }]

function bodyRows(container) {
  return [...container.querySelectorAll('tbody td')].map(td => td.textContent)
}

function headerFields(container) {
  return [...container.querySelectorAll('th[data-field]')].map(th => th.dataset.field)
}

function toggleOptions() {
  return [...screen.getByTestId('column-toggle').querySelectorAll('button')].map(b => b.dataset.option)
}

describe('metricsSummaryGrid column toggle', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('offers every column except the identity column', () => {
    const { container } = renderWithProviders(MetricsSummaryGrid, {
      props: { apiMetricsSummary: stigRows, aggType: 'stig', dataKey: 'benchmarkId' },
    })

    expect(headerFields(container)[0]).toBe('benchmarkId')
    expect(toggleOptions()).not.toContain('benchmarkId')
    expect(toggleOptions()).toEqual(headerFields(container).slice(1))
  })

  it('hides a deselected column and remembers it per column set', async () => {
    const { container } = renderWithProviders(MetricsSummaryGrid, {
      props: { apiMetricsSummary: stigRows, aggType: 'stig', dataKey: 'benchmarkId' },
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Oldest' }))

    expect(headerFields(container)).not.toContain('oldest')
    expect(headerFields(container)).toContain('newest')
    expect(JSON.parse(localStorage.getItem('metricsGrid.hiddenColumns.stig'))).toEqual(['oldest'])

    await fireEvent.click(screen.getByRole('button', { name: 'Oldest' }))

    expect(headerFields(container)).toContain('oldest')
    expect(JSON.parse(localStorage.getItem('metricsGrid.hiddenColumns.stig'))).toEqual([])
  })

  it('applies stored hidden columns on mount', () => {
    localStorage.setItem('metricsGrid.hiddenColumns.stig', JSON.stringify(['cat3', 'cat2']))

    const { container } = renderWithProviders(MetricsSummaryGrid, {
      props: { apiMetricsSummary: stigRows, aggType: 'stig', dataKey: 'benchmarkId' },
    })

    expect(headerFields(container)).not.toContain('cat3')
    expect(headerFields(container)).not.toContain('cat2')
    expect(headerFields(container)).toContain('cat1')
  })

  it('never hides the identity column even if stored as hidden', () => {
    localStorage.setItem('metricsGrid.hiddenColumns.stig', JSON.stringify(['benchmarkId']))

    const { container } = renderWithProviders(MetricsSummaryGrid, {
      props: { apiMetricsSummary: stigRows, aggType: 'stig', dataKey: 'benchmarkId' },
    })

    expect(headerFields(container)[0]).toBe('benchmarkId')
  })

  it('keys the checklist grid under its parent so it does not share the parent grid choices', () => {
    localStorage.setItem('metricsGrid.hiddenColumns.stig', JSON.stringify(['oldest']))

    const { container } = renderWithProviders(MetricsSummaryGrid, {
      props: { apiMetricsSummary: checklistRows, aggType: 'unagg', parentAggType: 'stig', dataKey: 'assetId' },
    })

    expect(headerFields(container)).toContain('oldest')
    expect(headerFields(container)[0]).toBe('assetName')
  })

  it('shows the title and badge in the header bar', () => {
    renderWithProviders(MetricsSummaryGrid, {
      props: { apiMetricsSummary: checklistRows, aggType: 'unagg', parentAggType: 'stig', title: 'Checklists', badge: 'Asset 7' },
    })

    expect(screen.getByRole('heading', { name: 'Checklists' })).toBeInTheDocument()
    expect(screen.getByText('Asset 7')).toBeInTheDocument()
  })

  it('filters rows on the searchable columns after the debounce', async () => {
    vi.useFakeTimers()
    try {
      const { container } = renderWithProviders(MetricsSummaryGrid, {
        props: { apiMetricsSummary: stigRows, aggType: 'stig', dataKey: 'benchmarkId' },
      })
      expect(bodyRows(container)).toHaveLength(2)

      await fireEvent.update(screen.getByRole('textbox', { name: 'Search rows' }), 'windows')
      expect(bodyRows(container)).toHaveLength(2)

      await vi.advanceTimersByTimeAsync(200)
      expect(bodyRows(container)).toEqual(['MS_Windows_11_STIG'])

      // Title text is searchable through the Benchmark column
      await fireEvent.update(screen.getByRole('textbox', { name: 'Search rows' }), 'red hat')
      await vi.advanceTimersByTimeAsync(200)
      expect(bodyRows(container)).toEqual(['RHEL_9_STIG'])

      await fireEvent.click(screen.getByRole('button', { name: 'Clear row search' }))
      await vi.advanceTimersByTimeAsync(200)
      expect(bodyRows(container)).toHaveLength(2)
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('ignores unreadable stored values', () => {
    localStorage.setItem('metricsGrid.hiddenColumns.stig', '{not json')

    const { container } = renderWithProviders(MetricsSummaryGrid, {
      props: { apiMetricsSummary: stigRows, aggType: 'stig', dataKey: 'benchmarkId' },
    })

    expect(headerFields(container)).toContain('oldest')
  })
})
