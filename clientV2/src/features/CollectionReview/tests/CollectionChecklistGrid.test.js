import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchFilter } from '../../../shared/lib/gridSearch.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import CollectionChecklistGrid from '../components/CollectionChecklistGrid.vue'

// Stubs: the header re-emits what the search box and Filter button would; the table echoes its rows
vi.mock('../components/CollectionChecklistGridHeader.vue', () => ({
  default: {
    name: 'CollectionChecklistGridHeader',
    props: ['filterColumns', 'filterValueOptions'],
    emits: ['update:searchFilter', 'update:filters'],
    template: `
      <div>
        <span data-testid="filter-columns">{{ filterColumns.map(c => c.field).join(',') }}</span>
        <button data-testid="search" @click="$emit('update:searchFilter', 'audit')">search</button>
        <button data-testid="filter-cat" @click="$emit('update:filters', [catRule])">cat</button>
      </div>
    `,
    setup: () => ({ catRule: searchFilter('severity', 'values', { value: ['CAT 1'] }) }),
  },
}))

vi.mock('../components/CollectionChecklistGridTable.vue', () => ({
  default: {
    name: 'CollectionChecklistGridTable',
    props: ['gridData', 'totalCount', 'isFiltered'],
    template: `<div data-testid="table" :data-total="totalCount" :data-filtered="isFiltered">{{ gridData.map(r => r.ruleId).join(',') }}</div>`,
  },
}))

const gridData = [
  { ruleId: 'R1', groupId: 'V-1', ruleTitle: 'Audit logs', severity: 'high' },
  { ruleId: 'R2', groupId: 'V-2', ruleTitle: 'Banner', severity: 'medium' },
  { ruleId: 'R3', groupId: 'V-3', ruleTitle: 'Audit records', severity: 'medium' },
]

describe('collectionChecklistGrid search and filters', () => {
  beforeEach(() => localStorage.clear())

  it('offers CAT and the text columns to the Filter button', () => {
    renderWithProviders(CollectionChecklistGrid, { props: { gridData } })
    expect(screen.getByTestId('filter-columns').textContent).toBe('severity,groupId,groupTitle,version,ruleId,ruleTitle')
  })

  it('passes searched and filtered rows to the table, with the unfiltered total', async () => {
    renderWithProviders(CollectionChecklistGrid, { props: { gridData } })
    const table = screen.getByTestId('table')
    expect(table.textContent).toBe('R1,R2,R3')

    await fireEvent.click(screen.getByTestId('search'))
    expect(table.textContent).toBe('R1,R3')

    await fireEvent.click(screen.getByTestId('filter-cat'))
    expect(table.textContent).toBe('R1')
    expect(table.dataset.total).toBe('3')
    expect(table.dataset.filtered).toBe('true')
  })
})
