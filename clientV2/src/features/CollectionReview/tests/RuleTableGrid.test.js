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
        show: vi.fn(),
        hide: vi.fn(),
        toggle: vi.fn(),
        reposition: vi.fn(),
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
