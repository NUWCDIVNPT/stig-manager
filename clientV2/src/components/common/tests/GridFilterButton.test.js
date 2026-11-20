import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { searchFilter } from '../../../shared/lib/gridSearch.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import GridFilterButton from '../GridFilterButton.vue'

const columns = [
  { field: 'name', header: 'Name', kind: 'text' },
  { field: 'os', header: 'OS', kind: 'text' },
]

const osColumn = { field: 'os', header: 'OS', kind: 'values' }
const osOptions = { os: [{ value: 'linux', name: 'linux', color: null }, { value: 'windows', name: 'windows', color: null }] }

// The button opens the column menu; "Add rule" swaps it for the rule builder
async function openRules() {
  await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
  await fireEvent.click(await screen.findByRole('button', { name: 'Add rule' }))
  await screen.findByText('Rows must match every rule')
}

async function openPanel() {
  renderWithProviders(GridFilterButton, { props: { modelValue: [], columns } })
  await openRules()
}

function lastModel(emitted) {
  return emitted()['update:modelValue'].at(-1)[0]
}

describe('gridFilterButton.vue', () => {
  it('closes on an outside click', async () => {
    await openPanel()
    await fireEvent.mouseDown(document.body)
    await waitFor(() => expect(screen.queryByText('Rows must match every rule')).toBeNull())
  })

  it('stays open when picking from a select inside the panel', async () => {
    await openPanel()
    await fireEvent.click(screen.getByRole('combobox', { name: 'Column' }))
    const option = await screen.findByRole('option', { name: 'OS' })
    // Select picks on mousedown and drops its overlay; the click then lands on a detached node
    await fireEvent.mouseDown(option)
    option.remove()
    await fireEvent.click(option)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Column' })).toHaveTextContent('OS'))
    expect(screen.getByText('Rows must match every rule')).toBeTruthy()
  })

  it('stays open when clicking inside the panel or picking from a multiselect', async () => {
    renderWithProviders(GridFilterButton, {
      props: { modelValue: [], columns: [osColumn], valueOptions: osOptions },
    })
    await openRules()
    await fireEvent.mouseDown(screen.getByText('Rows must match every rule'))
    await fireEvent.click(screen.getByRole('combobox', { name: 'Column' }))
    await fireEvent.mouseDown(await screen.findByRole('option', { name: 'OS' }))
    await fireEvent.click(await screen.findByText('Pick values'))
    await fireEvent.mouseDown(await screen.findByRole('option', { name: 'linux' }))
    expect(screen.getByText('Rows must match every rule')).toBeTruthy()
  })

  it('clears applied filters from the X without opening the panel', async () => {
    const { emitted } = renderWithProviders(GridFilterButton, {
      props: { modelValue: [searchFilter('name', 'text', { value: 'web' })], columns },
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(emitted()['update:modelValue'].at(-1)).toEqual([[]])
    expect(screen.queryByText('Rows must match every rule')).toBeNull()
  })

  it('lists the columns in the order given, leaving out hidden ones without a rule', async () => {
    const cols = [
      { field: 'ip', header: 'IP', kind: 'text' },
      { field: 'name', header: 'Name', kind: 'text', hidden: true },
      { field: 'fqdn', header: 'FQDN', kind: 'text', hidden: true },
      { field: 'mac', header: 'MAC', kind: 'text' },
    ]
    renderWithProviders(GridFilterButton, { props: { modelValue: [searchFilter('fqdn', 'text', { value: 'lab' })], columns: cols } })
    await fireEvent.click(screen.getByRole('button', { name: 'Filters, 1 applied' }))
    const items = await screen.findAllByRole('menuitem')
    expect(items.map(i => i.querySelector('.grid-filter__menu-label').textContent)).toEqual(['IP', 'FQDN', 'MAC'])
  })

  it('applies a picked value at once and toggles it off again', async () => {
    const { emitted, rerender } = renderWithProviders(GridFilterButton, {
      props: { modelValue: [], columns: [osColumn], valueOptions: osOptions },
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await fireEvent.click(await screen.findByRole('menuitem', { name: 'OS' }))
    await fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'linux' }))
    expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['linux'] })])

    await rerender({ modelValue: lastModel(emitted) })
    await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'windows' }))
    expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['linux', 'windows'] })])

    await rerender({ modelValue: [searchFilter('os', 'values', { value: ['linux'] })] })
    await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'linux' }))
    expect(lastModel(emitted)).toEqual([])
  })

  it('filters a text column as its box is typed in', async () => {
    const { emitted } = renderWithProviders(GridFilterButton, { props: { modelValue: [], columns } })
    await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await fireEvent.click(await screen.findByRole('menuitem', { name: 'Name' }))
    await fireEvent.update(await screen.findByRole('textbox', { name: 'Name contains' }), 'web')
    expect(lastModel(emitted)).toEqual([searchFilter('name', 'text', { value: 'web' })])
  })

  it('leaves a rule the builder made alone and adds its own beside it', async () => {
    const excluded = searchFilter('os', 'values', { value: ['windows'], exclude: true })
    const { emitted } = renderWithProviders(GridFilterButton, {
      props: { modelValue: [excluded], columns: [osColumn], valueOptions: osOptions },
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Filters, 1 applied' }))
    await fireEvent.click(await screen.findByRole('menuitem', { name: /OS/ }))
    await fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'linux' }))
    expect(lastModel(emitted)).toEqual([excluded, searchFilter('os', 'values', { value: ['linux'] })])
  })
})
