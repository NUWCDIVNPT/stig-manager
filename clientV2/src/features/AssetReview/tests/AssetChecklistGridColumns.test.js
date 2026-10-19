import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import AssetChecklistGrid from '../components/AssetChecklistGrid.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {} }),
}))

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: () => ({ itemSize: 30, gridStyle: {} }),
}))

vi.mock('../../../shared/api/reviewsApi.js', () => ({
  postReviewBatch: vi.fn(),
  patchReview: vi.fn(),
  putReview: vi.fn(),
}))

// Header stub: shows the picker list and active preset, and drives presets and picker edits
vi.mock('../components/AssetChecklistGridHeader.vue', () => ({
  default: {
    name: 'AssetChecklistGridHeader',
    props: ['toggleableColumns', 'selectedColumns', 'activePreset'],
    emits: ['apply-preset', 'update:selectedColumns'],
    template: `
      <div>
        <div data-testid="picker">{{ toggleableColumns.map(c => c.field).join(',') }}</div>
        <div data-testid="active">{{ activePreset ?? '' }}</div>
        <button v-for="k in ['groupRule', 'groupGroup', 'ruleRule']" :key="k" @click="$emit('apply-preset', k)">{{ k }}</button>
        <button @click="$emit('update:selectedColumns', [...selectedColumns, toggleableColumns.find(c => c.field === 'groupId')])">add-group</button>
        <button @click="$emit('update:selectedColumns', selectedColumns.filter(c => c.field !== 'detail'))">hide-detail</button>
      </div>
    `,
  },
}))

vi.mock('../components/AssetChecklistGridTable.vue', () => ({
  default: {
    name: 'AssetChecklistGridTable',
    props: ['visibleFields'],
    template: '<div data-testid="fields">{{ [...visibleFields].sort().join(",") }}</div>',
  },
}))

vi.mock('../../../components/common/ReviewEditPopover.vue', () => ({
  default: { name: 'ReviewEditPopover', template: '<div />' },
}))

function render() {
  return renderWithProviders(AssetChecklistGrid, {
    props: { gridData: [], selectRule: () => {}, collectionId: 'c1', assetId: 'a1' },
  })
}

const fields = () => screen.getByTestId('fields').textContent.split(',')
const active = () => screen.getByTestId('active').textContent

beforeEach(() => {
  localStorage.clear()
})

describe('assetChecklistGrid columns', () => {
  it('lists Group and Rule Id in the picker alongside the other toggleable columns', () => {
    render()
    expect(screen.getByTestId('picker').textContent)
      .toBe('groupId,ruleId,ruleTitle,groupTitle,detail,comment,touchTs')
  })

  it('defaults to Group ID and Rule Title with the fixed columns always shown', () => {
    render()
    expect(fields()).toEqual(['comment', 'detail', 'groupId', 'result', 'resultEngine', 'ruleTitle', 'severity', 'status', 'touchTs'])
    expect(active()).toBe('groupRule')
  })

  it('applies a preset to the Group/Rule columns only', async () => {
    render()
    await fireEvent.click(screen.getByText('hide-detail'))
    await fireEvent.click(screen.getByText('ruleRule'))
    expect(fields()).toContain('ruleId')
    expect(fields()).toContain('ruleTitle')
    expect(fields()).not.toContain('groupId')
    expect(fields()).not.toContain('detail')
    expect(active()).toBe('ruleRule')
  })

  it('shows Group Title for the Group ID and Group Title preset', async () => {
    render()
    await fireEvent.click(screen.getByText('groupGroup'))
    expect(fields()).toContain('groupId')
    expect(fields()).toContain('groupTitle')
    expect(fields()).not.toContain('ruleTitle')
    expect(active()).toBe('groupGroup')
  })

  it('lets the picker add Group back after the Rule ID preset, leaving no active preset', async () => {
    render()
    await fireEvent.click(screen.getByText('ruleRule'))
    await fireEvent.click(screen.getByText('add-group'))
    expect(fields()).toContain('groupId')
    expect(fields()).toContain('ruleId')
    expect(active()).toBe('')
  })

  it('keeps the chosen preset after a remount', async () => {
    const { unmount } = render()
    await fireEvent.click(screen.getByText('ruleRule'))
    unmount()
    render()
    expect(fields()).toContain('ruleId')
    expect(fields()).not.toContain('groupId')
    expect(active()).toBe('ruleRule')
  })
})
