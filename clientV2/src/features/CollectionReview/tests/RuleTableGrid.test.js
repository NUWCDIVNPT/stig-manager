import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { patchReview, putReview } from '../../../shared/api/reviewsApi.js'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import RuleTableGrid from '../components/RuleTableGrid.vue'

vi.mock('../../../shared/api/reviewsApi.js', () => ({
  putReview: vi.fn(),
  patchReview: vi.fn(),
}))

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: vi.fn(),
}))

// need to mock because datatable does not render rows in JSDOM due to VirtualScroller relying on physical layout heights (which are 0 in a headless environment).
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    props: ['value', 'selection', 'selectAll'],
    template: `
      <table data-testid="mock-datatable">
        <thead>
          <tr>
            <th>
              <input type="checkbox" aria-label="select-all" :checked="selectAll" @change="$emit('select-all-change', { checked: $event.target.checked })" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in value" :key="row.assetId" @click="$emit('row-click', { data: row, originalEvent: $event })">
            <td>{{ row.assetName }}</td>
            <td>
              <input type="checkbox" aria-label="select-row" :checked="selection.some(s => s.assetId === row.assetId)" @click.stop="$emit('update:selection', selection.some(s => s.assetId === row.assetId) ? selection.filter(s => s.assetId !== row.assetId) : [...selection, row])" />
            </td>
          </tr>
        </tbody>
      </table>
    `,
  },
}))

vi.mock('primevue/column', () => ({
  default: { name: 'Column', template: '<td><slot></slot></td>' },
}))

vi.mock('../../../components/common/ReviewEditPopover.vue', () => ({
  default: {
    name: 'ReviewEditPopover',
    props: ['currentReview', 'selectedRuleId', 'collectionId', 'assetId', 'fieldSettings', 'accessMode', 'canAccept', 'isSaving', 'saveError', 'clearSaveError', 'enabledTabs', 'subjectLabel'],
    setup(props, { expose }) {
      expose({
        openForRow: vi.fn(),
        hide: vi.fn(),
        isDirty: false,
        triggerUnsavedWarning: vi.fn(),
      })
      return {}
    },
    template: `
      <div data-testid="mock-popover">
        <button data-testid="trigger-save" @click="$emit('save', { ruleId: 'V-123', result: 'pass', detail: 'test detail', comment: 'test comment', status: 'saved' })">Save</button>
        <button data-testid="trigger-status" @click="$emit('status-action', { ruleId: 'V-123', actionType: 'submit' })">Status</button>
        <div data-testid="popover-save-error" v-if="saveError">{{ saveError }}</div>
        <div data-testid="popover-asset-id" v-if="assetId">{{ assetId }}</div>
      </div>
    `,
  },
}))

const mockGridData = [
  { assetId: 'asset-1', assetName: 'Asset 1', access: 'rw', ruleId: 'V-123', result: 'fail', status: 'saved' },
  { assetId: 'asset-2', assetName: 'Asset 2', access: 'r', ruleId: 'V-123', result: 'pass', status: 'saved' },
  { assetId: 'asset-3', assetName: 'Asset 3', access: 'rw', ruleId: 'V-123', result: 'pass', status: 'saved' },
]

const searchGridData = [
  { assetId: 'asset-1', assetName: 'web-01', access: 'rw', ruleId: 'V-123', result: 'fail', status: 'saved', assetLabels: [{ name: 'prod', color: '#fff' }], detail: 'Port 22 open', comment: 'ticket 4711', username: 'alice' },
  { assetId: 'asset-2', assetName: 'db-01', access: 'rw', ruleId: 'V-123', result: 'pass', status: 'saved', assetLabels: [{ name: 'test', color: '#fff' }], detail: 'Compliant', comment: '', username: 'bob' },
  { assetId: 'asset-3', assetName: 'web-02', access: 'rw', ruleId: 'V-123', result: 'pass', status: 'saved', assetLabels: [], detail: '', comment: 'see web-01', username: 'alice' },
]

function renderedAssetNames() {
  return screen.getAllByRole('row').slice(1).map(tr => tr.querySelector('td').textContent.trim())
}

describe('ruleTableGrid.vue', () => {
  let mockDensityState

  beforeEach(() => {
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 1000,
      height: 1000,
      top: 0,
      left: 0,
      bottom: 1000,
      right: 1000,
    }))
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1000 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 1000 })

    mockDensityState = { itemSize: null, lineClamp: 1 }
    useGridDensity.mockReturnValue(mockDensityState)
    putReview.mockResolvedValue({ id: 'review-1' })
    patchReview.mockResolvedValue({ id: 'review-1' })
    vi.clearAllMocks()
  })

  const defaultProps = {
    gridData: mockGridData,
    visibleFields: new Set(['labels', 'detail', 'comment', 'user', 'time']),
    collectionId: 'coll-1',
    selectedRuleId: 'V-123',
  }

  function createWrapper(props = {}) {
    return renderWithProviders(RuleTableGrid, {
      props: {
        ...defaultProps,
        ...props,
      },
    })
  }

  describe('rendering & Selection Logic', () => {
    it('renders checkbox for rw rows', () => {
      createWrapper()
      const checkboxes = screen.getAllByRole('checkbox', { name: 'select-row' })
      expect(checkboxes).toHaveLength(3)
    })

    it('emits update:selection with row when clicking checkbox', async () => {
      const { emitted } = createWrapper()
      const checkboxes = screen.getAllByRole('checkbox', { name: 'select-row' })
      // first row is asset-1
      await fireEvent.click(checkboxes[0])

      expect(emitted()['update:selection']).toBeTruthy()
      expect(emitted()['update:selection'][0][0]).toEqual([mockGridData[0]])
    })

    it('emits update:selection with only rw rows when Select All is clicked', async () => {
      const { emitted } = createWrapper()
      const selectAllCheckbox = screen.getByRole('checkbox', { name: 'select-all' })
      await fireEvent.click(selectAllCheckbox)

      expect(emitted()['update:selection']).toBeTruthy()
      // RuleTableGrid's onSelectAllChange filters isDataSelectable (access === 'rw')
      // asset-1 and asset-3 have access: rw
      expect(emitted()['update:selection'][0][0]).toEqual([mockGridData[0], mockGridData[2]])
    })

    it('shows checkboxes as checked when passed in selection prop', () => {
      createWrapper({ selection: [mockGridData[0]] })
      const checkboxes = screen.getAllByRole('checkbox', { name: 'select-row' })
      expect(checkboxes[0]).toBeChecked()
      expect(checkboxes[1]).not.toBeChecked()
    })
  })

  describe('shift-click range selection', () => {
    const rangeGridData = [
      { assetId: 'asset-1', assetName: 'Asset 1', access: 'rw', ruleId: 'V-123', result: 'fail', status: 'saved' },
      { assetId: 'asset-2', assetName: 'Asset 2', access: 'r', ruleId: 'V-123', result: 'pass', status: 'saved' },
      { assetId: 'asset-3', assetName: 'Asset 3', access: 'rw', ruleId: 'V-123', result: 'pass', status: 'saved' },
      { assetId: 'asset-4', assetName: 'Asset 4', access: 'rw', ruleId: 'V-123', result: 'pass', status: 'saved' },
      { assetId: 'asset-5', assetName: 'Asset 5', access: 'rw', ruleId: 'V-123', result: 'pass', status: 'saved' },
    ]
    const [row1, , row3, row4, row5] = rangeGridData

    function shiftClickRow(name) {
      return fireEvent.click(screen.getByText(name).closest('tr'), { shiftKey: true })
    }

    function lastSelection(emitted) {
      const calls = emitted()['update:selection']
      return calls[calls.length - 1][0]
    }

    // Feeds the last emitted selection back in, as the parent's v-model does
    async function syncSelection(emitted, rerender) {
      await rerender({ selection: lastSelection(emitted) })
    }

    it('shift-click with an empty selection is a single toggle and does not open the editor', async () => {
      const { emitted } = createWrapper({ gridData: rangeGridData })
      await shiftClickRow('Asset 3')

      expect(lastSelection(emitted)).toEqual([row3])
      expect(screen.queryByTestId('popover-asset-id')).not.toBeInTheDocument()
    })

    it('selects every rw row between the anchor and the target', async () => {
      const { emitted, rerender } = createWrapper({ gridData: rangeGridData })
      await shiftClickRow('Asset 1')
      await syncSelection(emitted, rerender)
      await shiftClickRow('Asset 4')

      // asset-2 is read-only and is skipped
      expect(lastSelection(emitted)).toEqual([row1, row3, row4])
    })

    it('ranges in either direction', async () => {
      const { emitted, rerender } = createWrapper({ gridData: rangeGridData })
      await shiftClickRow('Asset 5')
      await syncSelection(emitted, rerender)
      await shiftClickRow('Asset 3')

      expect(lastSelection(emitted)).toEqual([row3, row4, row5])
    })

    it('deselects the range when the target is already selected', async () => {
      const { emitted, rerender } = createWrapper({ gridData: rangeGridData, selection: [row1, row3, row4, row5] })
      // anchor on asset-5 (toggles it off)
      await shiftClickRow('Asset 5')
      expect(lastSelection(emitted)).toEqual([row1, row3, row4])
      await syncSelection(emitted, rerender)
      await shiftClickRow('Asset 3')

      expect(lastSelection(emitted)).toEqual([row1])
    })

    it('keeps rows outside the range selected', async () => {
      const { emitted, rerender } = createWrapper({ gridData: rangeGridData, selection: [row1] })
      await shiftClickRow('Asset 3')
      await syncSelection(emitted, rerender)
      await shiftClickRow('Asset 5')

      expect(lastSelection(emitted)).toEqual([row1, row3, row4, row5])
    })

    it('drops the anchor once the selection is cleared', async () => {
      const { emitted, rerender } = createWrapper({ gridData: rangeGridData })
      await shiftClickRow('Asset 1')
      await syncSelection(emitted, rerender)
      // parent clears (rule change / header clear), then select-all
      await rerender({ selection: [] })
      await fireEvent.click(screen.getByRole('checkbox', { name: 'select-all' }))
      await syncSelection(emitted, rerender)
      await shiftClickRow('Asset 3')

      // single toggle: only asset-3 comes off, not asset-1..asset-3
      expect(lastSelection(emitted)).toEqual([row1, row4, row5])
    })

    it('falls back to a single toggle when the anchor is not in the displayed rows', async () => {
      const { emitted, rerender } = createWrapper({ gridData: rangeGridData })
      await shiftClickRow('Asset 1')
      await syncSelection(emitted, rerender)
      await rerender({ rows: [row3, row4, row5], isFiltered: true })
      await shiftClickRow('Asset 4')

      expect(lastSelection(emitted)).toEqual([row1, row4])
    })
  })

  describe('filtered rows', () => {
    it('shows every row when no rows are passed', () => {
      createWrapper({ gridData: searchGridData })
      expect(renderedAssetNames()).toEqual(['web-01', 'db-01', 'web-02'])
    })

    it('shows the rows search and filters left', () => {
      createWrapper({ gridData: searchGridData, rows: [searchGridData[1]], isFiltered: true })
      expect(renderedAssetNames()).toEqual(['db-01'])
    })
  })

  describe('row Interactions & Editor State', () => {
    it('clicking rw row sets editingRow and opens popover', async () => {
      createWrapper()
      // Click row 1
      const row1 = screen.getByText('Asset 1').closest('tr')
      await fireEvent.click(row1)

      // Verify popover mock received the assetId
      const popoverAssetId = screen.getByTestId('popover-asset-id')
      expect(popoverAssetId).toHaveTextContent('asset-1')
    })

    it('clicking read-only row does not open editor', async () => {
      createWrapper()
      const row2 = screen.getByText('Asset 2').closest('tr') // access: r
      await fireEvent.click(row2)

      expect(screen.queryByTestId('popover-asset-id')).not.toBeInTheDocument()
    })
  })

  describe('saving Reviews (API Integrations)', () => {
    it('emitting @save calls putReview and emits review-saved', async () => {
      const { emitted } = createWrapper()

      // Select a row first so popover has editingRow
      const row1 = screen.getByText('Asset 1').closest('tr')
      await fireEvent.click(row1)

      // Trigger save from popover
      const saveBtn = screen.getByTestId('trigger-save')
      await fireEvent.click(saveBtn)

      await flushPromises()

      expect(putReview).toHaveBeenCalledWith('coll-1', 'asset-1', 'V-123', {
        result: 'pass',
        detail: 'test detail',
        comment: 'test comment',
        resultEngine: null, // Since result changed from fail to pass, engine should be null?
        status: 'saved',
      })

      expect(emitted()['review-saved']).toBeTruthy()
      expect(emitted()['review-saved'][0][0]).toEqual({ id: 'review-1', assetId: 'asset-1' })
    })

    it('emitting @status-action calls patchReview and emits review submission', async () => {
      const { emitted } = createWrapper()

      const row1 = screen.getByText('Asset 1').closest('tr')
      await fireEvent.click(row1)

      const statusBtn = screen.getByTestId('trigger-status')
      await fireEvent.click(statusBtn)

      await flushPromises()

      expect(patchReview).toHaveBeenCalledWith('coll-1', 'asset-1', 'V-123', {
        status: 'submitted',
      })

      expect(emitted()['review-saved']).toBeTruthy()
      expect(emitted()['review-saved'][0][0]).toEqual({ id: 'review-1', assetId: 'asset-1' })
    })
  })
})
