import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import ManageAssetsTable from '../components/Asset/ManageAssetsTable.vue'
import LabelsTable from '../components/Label/LabelsTable.vue'
import ManageStigsTable from '../components/Stig/ManageStigsTable.vue'

const { assetSummary, stigSummary } = vi.hoisted(() => ({ assetSummary: vi.fn(), stigSummary: vi.fn() }))

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionAssetSummary: assetSummary,
  fetchCollectionStigSummary: stigSummary,
}))

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

const stubs = { AssetsToolbar: true, AssetFormModal: true, DeleteModal: true, StigToolbar: true }

const rowKeys = container => [...container.querySelectorAll('[data-row]')].map(li => li.textContent)
const headerFields = container => [...container.querySelectorAll('th[data-field]')].map(th => th.dataset.field)

async function search(label, text) {
  await fireEvent.update(screen.getByRole('textbox', { name: label }), text)
  await vi.advanceTimersByTimeAsync(250)
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('collection manage grid search and columns', () => {
  it('assets: searches name and label names; hidden labels drop out', async () => {
    assetSummary.mockResolvedValue([
      { assetId: '1', name: 'web-01', labels: [{ labelId: 'L1', name: 'prod', color: '00ff00' }], benchmarkIds: [] },
      { assetId: '2', name: 'db-01', labels: [{ labelId: 'L2', name: 'staging', color: 'ff0000' }], benchmarkIds: [] },
    ])
    const { container } = renderWithProviders(ManageAssetsTable, { props: { collectionId: '1' }, global: { stubs } })
    await vi.advanceTimersByTimeAsync(0)

    await search('Search assets', 'staging')
    expect(rowKeys(container)).toEqual(['2'])

    localStorage.setItem('manageAssets.columns', JSON.stringify({ labels: false }))
    const hidden = renderWithProviders(ManageAssetsTable, { props: { collectionId: '1' }, global: { stubs } })
    await vi.advanceTimersByTimeAsync(0)
    expect(headerFields(hidden.container)).not.toContain('labels')
  })

  it('stigs: searches benchmark ID and title, keeping the ID column locked on', async () => {
    stigSummary.mockResolvedValue([
      { benchmarkId: 'RHEL_9_STIG', title: 'Red Hat Enterprise Linux 9' },
      { benchmarkId: 'MS_Windows_11_STIG', title: 'Microsoft Windows 11' },
    ])
    localStorage.setItem('manageStigs.columns', JSON.stringify({ benchmarkId: false, ruleCount: false }))
    const { container } = renderWithProviders(ManageStigsTable, { props: { collectionId: '1' }, global: { stubs } })
    await vi.advanceTimersByTimeAsync(0)
    expect(headerFields(container)).toContain('benchmarkId')
    expect(headerFields(container)).not.toContain('ruleCount')

    await search('Search STIGs', 'windows')
    expect(rowKeys(container)).toEqual(['MS_Windows_11_STIG'])
  })

  it('labels: searches name and description', async () => {
    const labels = [
      { labelId: '1', name: 'prod', description: 'Production hosts', color: '00ff00' },
      { labelId: '2', name: 'dev', description: 'Developer sandboxes', color: 'ff0000' },
    ]
    const { container } = renderWithProviders(LabelsTable, { props: { labels } })
    await search('Search labels', 'sandbox')
    expect(rowKeys(container)).toEqual(['2'])
    await search('Search labels', 'nope')
    expect(screen.getByText('No labels match the search.')).toBeTruthy()
  })
})
