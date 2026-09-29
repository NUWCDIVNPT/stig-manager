import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchFilter } from '../../../shared/lib/gridSearch.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import RuleTable from '../components/RuleTable.vue'

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: () => ({ gridStyle: {} }),
}))

// Stubs: the header re-emits search text and filter rules; the grid echoes its rows
vi.mock('../components/RuleTableHeader.vue', () => ({
  default: {
    name: 'RuleTableHeader',
    props: ['filterColumns'],
    emits: ['update:searchFilter', 'update:filters'],
    template: `
      <div>
        <span data-testid="filter-columns">{{ filterColumns.map(c => c.field).join(',') }}</span>
        <input data-testid="search" @input="$emit('update:searchFilter', $event.target.value)">
        <button data-testid="filter-fail" @click="$emit('update:filters', [failRule])">fail</button>
      </div>
    `,
    setup: () => ({ failRule: searchFilter('result', 'values', { value: ['O'] }) }),
  },
}))

vi.mock('../components/RuleTableGrid.vue', () => ({
  default: {
    name: 'RuleTableGrid',
    props: ['rows', 'isFiltered'],
    template: `<div data-testid="grid">{{ rows.map(r => r.assetName).join(',') }}</div>`,
  },
}))

const gridData = [
  { assetId: '1', assetName: 'web-01', result: 'fail', status: 'saved', assetLabels: [{ name: 'prod' }], detail: 'Port 22 open', comment: 'ticket 4711', username: 'alice' },
  { assetId: '2', assetName: 'db-01', result: 'pass', status: 'saved', assetLabels: [{ name: 'test' }], detail: 'Compliant', comment: '', username: 'bob' },
  { assetId: '3', assetName: 'web-02', result: 'pass', status: 'saved', assetLabels: [], detail: '', comment: 'see web-01', username: 'alice' },
]

async function search(text) {
  await fireEvent.update(screen.getByTestId('search'), text)
  return screen.getByTestId('grid').textContent
}

describe('ruleTable search and filters', () => {
  beforeEach(() => localStorage.clear())

  it('offers every column to the Filter button', () => {
    renderWithProviders(RuleTable, { props: { gridData } })
    expect(screen.getByTestId('filter-columns').textContent).toBe('assetName,labels,detail,comment,user,engine,status,result')
  })

  it('matches asset name, labels, detail, comment and user, ignoring case', async () => {
    renderWithProviders(RuleTable, { props: { gridData } })
    expect(await search('WEB')).toBe('web-01,web-02')
    expect(await search('prod')).toBe('web-01')
    expect(await search('compliant')).toBe('db-01')
    expect(await search('4711')).toBe('web-01')
    expect(await search('bob')).toBe('db-01')
  })

  it('skips hidden columns but always searches the asset name', async () => {
    localStorage.setItem('ruleTable.columns', JSON.stringify({ labels: false, detail: false, comment: false, user: false }))
    renderWithProviders(RuleTable, { props: { gridData } })
    expect(await search('alice')).toBe('')
    expect(await search('db-')).toBe('db-01')
  })

  it('filters by result from the Filter button', async () => {
    renderWithProviders(RuleTable, { props: { gridData } })
    await fireEvent.click(screen.getByTestId('filter-fail'))
    expect(screen.getByTestId('grid').textContent).toBe('web-01')
  })
})
