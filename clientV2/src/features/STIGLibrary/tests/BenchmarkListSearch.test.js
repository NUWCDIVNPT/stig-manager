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

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('stig library benchmark list search', () => {
  const benchmarks = [
    { benchmarkId: 'RHEL_9_STIG', title: 'Red Hat Enterprise Linux 9', lastRevisionStr: 'V2R1', revisionStrs: ['V2R1', 'V1R3'] },
    { benchmarkId: 'MS_Windows_11_STIG', title: 'Microsoft Windows 11', lastRevisionStr: 'V1R6', revisionStrs: ['V1R6'] },
  ]

  it('searches older revisions, not just the latest', async () => {
    const { container } = renderWithProviders(BenchmarkListTable, { props: { benchmarks } })
    await fireEvent.update(screen.getByRole('textbox', { name: 'Search benchmarks' }), 'V1R3')
    await vi.advanceTimersByTimeAsync(250)
    expect(rowKeys(container)).toEqual(['RHEL_9_STIG'])
  })
})
