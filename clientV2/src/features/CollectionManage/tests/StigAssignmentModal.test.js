import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { renderWithProviders } from '../../../testUtils/utils'
import {
  fetchAssetsByCollectionStig,
  fetchCollectionAssetsWithStigs,
  fetchInstalledStigsWithRevisions,
  writeStigProps,
} from '../api/stigManageApi.js'
import StigAssignmentModal from '../components/Stig/StigAssignmentModal.vue'

vi.mock('../api/stigManageApi.js', () => ({
  fetchAssetsByCollectionStig: vi.fn(),
  fetchCollectionAssetsWithStigs: vi.fn(),
  fetchInstalledStigsWithRevisions: vi.fn(),
  writeStigProps: vi.fn(),
}))

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionLabels: vi.fn(() => Promise.resolve([])),
}))

const { triggerError } = vi.hoisted(() => ({ triggerError: vi.fn() }))
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError }),
}))

// Only the header slots matter: they show how the assets were partitioned.
vi.mock('../../../components/common/PickList.vue', () => ({
  default: {
    name: 'PickList',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `<div>
      <slot name="sourceheader" /><slot name="targetheader" />
      <button type="button" @click="$emit('update:modelValue', [[...modelValue[0], modelValue[1][0]], modelValue[1].slice(1)])">move one to available</button>
      <span>labels: {{ modelValue[1][0]?.labels.length ?? 0 }}</span>
    </div>`,
  },
}))

// Stand-in that lets a test make a pick and see whether the control is disabled.
vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    props: ['disabled', 'placeholder', 'options'],
    emits: ['update:modelValue'],
    template: `<button type="button" :disabled="disabled" :data-options="options?.length" @click="$emit('update:modelValue', 'X')">{{ placeholder ?? 'revision' }}</button>`,
  },
}))

const stigX = { benchmarkId: 'X', revisions: [] }
const stigY = { benchmarkId: 'Y', revisions: [] }
const assets = [
  { assetId: 1, name: 'alpha', labelIds: [], stigs: [] },
  { assetId: 2, name: 'bravo', labelIds: [], stigs: [] },
  { assetId: 3, name: 'charlie', labelIds: [], stigs: [] },
]

function deferred() {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const closedProps = { visible: false, mode: 'modify', collectionId: 'c1' }

beforeEach(() => {
  vi.clearAllMocks()
  fetchInstalledStigsWithRevisions.mockResolvedValue([stigX, stigY])
  fetchCollectionAssetsWithStigs.mockResolvedValue(assets)
  fetchCollectionLabels.mockResolvedValue([])
})

describe('stigAssignmentModal', () => {
  async function reopenOverPendingLoad(utils) {
    await utils.rerender({ ...closedProps, selectedStig: stigX, visible: true })
    await utils.rerender({ ...closedProps, selectedStig: stigX, visible: false })
    await utils.rerender({ ...closedProps, selectedStig: stigY, visible: true })
    await waitFor(() => expect(screen.getByText('(2)')).toBeInTheDocument())
  }

  function assignments(benchmarkId) {
    return Promise.resolve(benchmarkId === 'Y' ? [{ assetId: 1 }, { assetId: 2 }] : [])
  }

  function flush() {
    return new Promise(r => setTimeout(r))
  }

  it.each([
    ['stig list', fetchInstalledStigsWithRevisions],
    ['asset list', fetchCollectionAssetsWithStigs],
  ])('ignores a superseded %s response', async (_name, fetcher) => {
    const slow = deferred()
    fetcher.mockReturnValueOnce(slow.promise)
    fetchAssetsByCollectionStig.mockResolvedValue([{ assetId: 1 }, { assetId: 2 }])
    const assignProps = { ...closedProps, mode: 'assign' }

    const utils = renderWithProviders(StigAssignmentModal, { props: assignProps })
    await utils.rerender({ ...assignProps, visible: true })
    await utils.rerender({ ...assignProps, visible: false })
    await utils.rerender({ ...assignProps, visible: true })
    const benchmarkSelect = await screen.findByRole('button', { name: 'Assign a STIG...' })
    await waitFor(() => expect(benchmarkSelect).toHaveAttribute('data-options', '2'))

    slow.resolve([])
    await flush()

    // Only the next pick reads the lists, so a wiped list shows up here.
    expect(benchmarkSelect).toHaveAttribute('data-options', '2')
    await userEvent.click(benchmarkSelect)
    await waitFor(() => expect(screen.getByText('(2)')).toBeInTheDocument())
    expect(screen.getByText('(1)')).toBeInTheDocument()
  })

  it('does not discard picker moves when a superseded open finishes', async () => {
    const slowStigs = deferred()
    fetchInstalledStigsWithRevisions.mockReturnValueOnce(slowStigs.promise)
    fetchAssetsByCollectionStig.mockImplementation((_c, id) => assignments(id))

    const utils = renderWithProviders(StigAssignmentModal, { props: closedProps })
    await reopenOverPendingLoad(utils)
    await userEvent.click(screen.getByRole('button', { name: 'move one to available' }))
    expect(screen.getAllByText('(2)')).toHaveLength(1)
    expect(screen.queryByText('(1)')).toBeInTheDocument()

    slowStigs.resolve([stigX, stigY])
    await flush()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(writeStigProps).toHaveBeenCalled())
    expect(writeStigProps.mock.calls[0][2].assetIds).toEqual(['2'])
  })

  it('keeps the asset labels when a superseded label load finishes last', async () => {
    const slowLabels = deferred()
    fetchCollectionLabels.mockReturnValueOnce(slowLabels.promise)
    fetchCollectionLabels.mockResolvedValue([{ labelId: 'l1', name: 'Production', color: '000000' }])
    fetchCollectionAssetsWithStigs.mockResolvedValue([{ assetId: 1, name: 'alpha', labelIds: ['l1'], stigs: [] }])
    fetchAssetsByCollectionStig.mockResolvedValue([{ assetId: 1 }])

    const utils = renderWithProviders(StigAssignmentModal, { props: closedProps })
    await utils.rerender({ ...closedProps, selectedStig: stigX, visible: true })
    await utils.rerender({ ...closedProps, selectedStig: stigX, visible: false })
    await utils.rerender({ ...closedProps, selectedStig: stigY, visible: true })
    await screen.findByText('labels: 1')

    slowLabels.resolve([])
    await flush()

    expect(screen.getByText('labels: 1')).toBeInTheDocument()
  })

  it('disables the benchmark picker while the benchmark assets load', async () => {
    const pending = deferred()
    fetchAssetsByCollectionStig.mockReturnValue(pending.promise)
    const utils = renderWithProviders(StigAssignmentModal, { props: { ...closedProps, mode: 'assign' } })
    await utils.rerender({ ...closedProps, mode: 'assign', visible: true })
    const benchmarkSelect = await screen.findByRole('button', { name: 'Assign a STIG...' })
    expect(benchmarkSelect).toBeEnabled()

    await userEvent.click(benchmarkSelect)

    await waitFor(() => expect(benchmarkSelect).toBeDisabled())
    pending.resolve([])
    await waitFor(() => expect(benchmarkSelect).toBeEnabled())
  })

  it('keeps the current assignment when a superseded load finishes last', async () => {
    const slowX = deferred()
    fetchAssetsByCollectionStig.mockImplementation((_c, benchmarkId) =>
      benchmarkId === 'X' ? slowX.promise : Promise.resolve([{ assetId: 1 }, { assetId: 2 }]),
    )

    const utils = renderWithProviders(StigAssignmentModal, { props: closedProps })
    await utils.rerender({ ...closedProps, selectedStig: stigX, visible: true })
    await utils.rerender({ ...closedProps, selectedStig: stigX, visible: false })
    await utils.rerender({ ...closedProps, selectedStig: stigY, visible: true })
    await waitFor(() => expect(screen.getByText('(2)')).toBeInTheDocument())

    slowX.resolve([{ assetId: 3 }])
    await slowX.promise
    await new Promise(r => setTimeout(r))

    expect(screen.getByText('(2)')).toBeInTheDocument()
    expect(screen.getByText('(1)')).toBeInTheDocument()
    expect(writeStigProps).not.toHaveBeenCalled()
  })

  it('loads when it is mounted already visible', async () => {
    fetchAssetsByCollectionStig.mockResolvedValue([{ assetId: 1 }, { assetId: 2 }])

    renderWithProviders(StigAssignmentModal, {
      props: { ...closedProps, selectedStig: stigX, visible: true },
    })

    await waitFor(() => expect(screen.getByText('(2)')).toBeInTheDocument())
    expect(screen.getByText('(1)')).toBeInTheDocument()
  })

  it('blocks Save after the asset list fails to load, so the assignment is not emptied', async () => {
    fetchCollectionAssetsWithStigs.mockRejectedValue(new Error('boom'))
    fetchAssetsByCollectionStig.mockResolvedValue([{ assetId: 1 }])

    const utils = renderWithProviders(StigAssignmentModal, { props: closedProps })
    await utils.rerender({ ...closedProps, selectedStig: stigX, visible: true })

    await waitFor(() => expect(triggerError).toHaveBeenCalled())
    await waitFor(() => expect(fetchAssetsByCollectionStig).toHaveBeenCalled())
    await new Promise(r => setTimeout(r))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})
