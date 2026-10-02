import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import RuleTable from '../components/RuleTable.vue'

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: () => ({ gridStyle: {} }),
}))

// Stubs: the header re-emits search text; the grid echoes its rows
vi.mock('../components/RuleTableHeader.vue', () => ({
  default: {
    name: 'RuleTableHeader',
    emits: ['update:searchFilter'],
    template: `<input data-testid="search" @input="$emit('update:searchFilter', $event.target.value)">`,
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

describe('ruleTable search', () => {
  beforeEach(() => localStorage.clear())

  it('skips hidden columns but always searches the asset name', async () => {
    localStorage.setItem('ruleTable.columns', JSON.stringify({ labels: false, detail: false, comment: false, user: false }))
    renderWithProviders(RuleTable, { props: { gridData } })
    expect(await search('alice')).toBe('')
    expect(await search('db-')).toBe('db-01')
  })
})
