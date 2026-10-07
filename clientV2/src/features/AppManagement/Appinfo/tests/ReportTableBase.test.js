import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import ReportTableBase from '../components/common/ReportTableBase.vue'

// The table echoes the key of each row it is given
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    props: ['value', 'dataKey'],
    template: '<ul><li v-for="row in value" :key="row[dataKey]" data-row>{{ row[dataKey] }}</li></ul>',
  },
}))

const rows = [
  { name: 'alpha', count: 5, enabled: true, owner: 'bob' },
  { name: 'beta', count: 7, enabled: false, owner: 'ann' },
]
const columns = [
  { field: 'count', header: 'Count', type: 'number' },
  { field: 'enabled', header: 'Enabled', type: 'boolean' },
  { field: 'owner', header: 'Owner' },
]
const rowKeys = container => [...container.querySelectorAll('[data-row]')].map(li => li.textContent)

function renderTable() {
  return renderWithProviders(ReportTableBase, {
    props: { rows, columns, keyColumn: { field: 'name', header: 'Name' }, searchable: true, noun: 'item' },
  })
}

describe('reportTableBase.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('searches text columns but not number columns', async () => {
    const { container } = renderTable()
    const input = screen.getByRole('textbox', { name: 'Search items' })
    await fireEvent.update(input, 'bob')
    await vi.advanceTimersByTimeAsync(300)
    expect(rowKeys(container)).toEqual(['alpha'])

    await fireEvent.update(input, '7')
    await vi.advanceTimersByTimeAsync(300)
    expect(rowKeys(container)).toEqual([])
  })

  it('filters a boolean column by Yes/No', async () => {
    vi.useRealTimers()
    const { container } = renderTable()
    await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await fireEvent.click(await screen.findByRole('combobox', { name: 'Column' }))
    await fireEvent.mouseDown(await screen.findByRole('option', { name: 'Enabled' }))
    await fireEvent.click(await screen.findByText('Pick values'))
    expect(await screen.findByRole('option', { name: 'Yes' })).toBeTruthy()
    await fireEvent.click(screen.getByRole('option', { name: 'No' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(rowKeys(container)).toEqual(['beta'])
  })
})
