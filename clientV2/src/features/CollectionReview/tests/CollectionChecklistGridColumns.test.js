import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import CollectionChecklistGrid from '../components/CollectionChecklistGrid.vue'

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: () => ({ itemSize: 30, gridStyle: {} }),
}))

// Header stub: shows the picker list and active preset, and drives presets and picker edits
vi.mock('../components/CollectionChecklistGridHeader.vue', () => ({
  default: {
    name: 'CollectionChecklistGridHeader',
    props: ['toggleableColumns', 'selectedColumns', 'activePreset'],
    emits: ['apply-preset', 'update:selectedColumns'],
    template: `
      <div>
        <div data-testid="picker">{{ toggleableColumns.map(c => c.field).join(',') }}</div>
        <div data-testid="active">{{ activePreset ?? '' }}</div>
        <button v-for="k in ['groupRule', 'groupGroup', 'ruleRule']" :key="k" @click="$emit('apply-preset', k)">{{ k }}</button>
        <button @click="$emit('update:selectedColumns', [...selectedColumns, toggleableColumns.find(c => c.field === 'groupId')])">add-group</button>
        <button @click="$emit('update:selectedColumns', selectedColumns.filter(c => c.field !== 'fail'))">hide-fail</button>
      </div>
    `,
  },
}))

vi.mock('../components/CollectionChecklistGridTable.vue', () => ({
  default: {
    name: 'CollectionChecklistGridTable',
    props: ['visibleFields'],
    template: '<div data-testid="fields">{{ [...visibleFields].sort().join(",") }}</div>',
  },
}))

function render() {
  return renderWithProviders(CollectionChecklistGrid, { props: { gridData: [] } })
}

const fields = () => screen.getByTestId('fields').textContent.split(',')
const active = () => screen.getByTestId('active').textContent

beforeEach(() => {
  localStorage.clear()
})

describe('collectionChecklistGrid columns', () => {
  it('lists the Group and Rule columns in the picker in grid order', () => {
    render()
    expect(screen.getByTestId('picker').textContent)
      .toBe('groupId,groupTitle,version,ruleId,ruleTitle,fail,pass,notapplicable,other,submitted,rejected,accepted,oldest,newest')
  })

  it('defaults to Group ID and Rule Title', () => {
    render()
    expect(fields()).toEqual(['accepted', 'fail', 'groupId', 'notapplicable', 'other', 'pass', 'rejected', 'ruleTitle', 'submitted'])
    expect(active()).toBe('groupRule')
  })

  it('applies a preset to the Group/Rule columns only', async () => {
    render()
    await fireEvent.click(screen.getByText('hide-fail'))
    await fireEvent.click(screen.getByText('ruleRule'))
    expect(fields()).toContain('ruleId')
    expect(fields()).toContain('ruleTitle')
    expect(fields()).not.toContain('groupId')
    expect(fields()).not.toContain('fail')
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
