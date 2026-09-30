import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import BenchmarkListTable from '../components/BenchmarkListTable.vue'

// The table echoes the key of each row it is given, plus its column headers
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    props: ['value', 'dataKey'],
    template: `
      <div>
        <table><thead><tr><slot /></tr></thead></table>
        <ul><li v-for="row in value" :key="row[dataKey]" data-row>{{ row[dataKey] }}</li></ul>
        <slot name="empty" v-if="!value.length" />
      </div>
    `,
  },
}))

vi.mock('primevue/column', () => ({
  default: { name: 'Column', props: ['field', 'header'], template: '<th :data-field="field">{{ header }}</th>' },
}))

const rowKeys = container => [...container.querySelectorAll('[data-row]')].map(li => li.textContent)
const headerFields = container => [...container.querySelectorAll('th[data-field]')].map(th => th.dataset.field)

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('stig library benchmark list search and columns', () => {
  const benchmarks = [
    { benchmarkId: 'RHEL_9_STIG', title: 'Red Hat Enterprise Linux 9', lastRevisionStr: 'V2R1', revisionStrs: ['V2R1', 'V1R3'] },
    { benchmarkId: 'MS_Windows_11_STIG', title: 'Microsoft Windows 11', lastRevisionStr: 'V1R6', revisionStrs: ['V1R6'] },
  ]

  it('searches ID, title and revisions; hidden columns drop out', async () => {
    localStorage.setItem('stigLibrary.columns', JSON.stringify({ benchmarkId: false, title: false }))
    const { container } = renderWithProviders(BenchmarkListTable, { props: { benchmarks } })
    expect(headerFields(container)).toContain('benchmarkId')
    expect(headerFields(container)).not.toContain('title')

    const input = screen.getByRole('textbox', { name: 'Search benchmarks' })
    await fireEvent.update(input, 'V1R3')
    await vi.advanceTimersByTimeAsync(250)
    expect(rowKeys(container)).toEqual(['RHEL_9_STIG'])

    await fireEvent.update(input, 'Microsoft')
    await vi.advanceTimersByTimeAsync(250)
    expect(rowKeys(container)).toEqual([])
    expect(screen.getByText('No benchmarks match the search.')).toBeTruthy()
  })
})
