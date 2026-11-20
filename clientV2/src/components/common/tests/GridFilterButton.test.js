import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { searchFilter } from '../../../shared/lib/gridSearch.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import GridFilterButton from '../GridFilterButton.vue'

// The menu, quick filter and rule builder have their own tests in gridFilter/tests; these cover
// the popover around them and switching between them.
const columns = [
  { field: 'name', header: 'Name', kind: 'text' },
  { field: 'os', header: 'OS', kind: 'text' },
]

const osColumn = { field: 'os', header: 'OS', kind: 'values' }
const osOptions = { os: [{ value: 'linux', name: 'linux', color: null }, { value: 'windows', name: 'windows', color: null }] }

async function openRules() {
  await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
  await fireEvent.click(await screen.findByRole('button', { name: 'Add rule' }))
  await screen.findByText('Rows must match every rule')
}

async function openPanel() {
  renderWithProviders(GridFilterButton, { props: { modelValue: [], columns } })
  await openRules()
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

  it('opens on the column menu, goes to the builder and back', async () => {
    await openPanel()
    await fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('menuitem', { name: 'Name' })).toBeTruthy()
    expect(screen.queryByText('Rows must match every rule')).toBeNull()
  })

  it('keeps unapplied builder rules across Back, until the popover closes', async () => {
    await openPanel()
    await fireEvent.update(screen.getByRole('textbox', { name: 'Value' }), 'web')
    await fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Add rule' }))
    expect(await screen.findByRole('textbox', { name: 'Value' })).toHaveValue('web')

    await fireEvent.mouseDown(document.body)
    await waitFor(() => expect(screen.queryByText('Rows must match every rule')).toBeNull())
    await openRules()
    expect(screen.getByRole('textbox', { name: 'Value' }).value).toBe('')
  })

  it('drops kept builder rules once the menu changes the applied rules', async () => {
    const { emitted, rerender } = renderWithProviders(GridFilterButton, {
      props: { modelValue: [], columns: [{ field: 'name', header: 'Name', kind: 'text' }, osColumn], valueOptions: osOptions },
    })
    await openRules()
    await fireEvent.update(screen.getByRole('textbox', { name: 'Value' }), 'web')
    await fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await fireEvent.click(await screen.findByRole('menuitem', { name: 'OS' }))
    await fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'linux' }))
    await rerender({ modelValue: emitted()['update:modelValue'].at(-1)[0] })
    await fireEvent.click(screen.getByRole('button', { name: 'Edit rules (1)' }))
    await screen.findByText('Rows must match every rule')
    expect(screen.getAllByRole('combobox', { name: 'Column' }).map(c => c.textContent)).toEqual(['OS'])
  })

  it('reopens on the column menu after closing in the builder', async () => {
    await openPanel()
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Rows must match every rule')).toBeNull())
    await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    expect(await screen.findByRole('menuitem', { name: 'Name' })).toBeTruthy()
  })

  it('applies a quick pick from the menu straight to the model', async () => {
    const { emitted } = renderWithProviders(GridFilterButton, {
      props: { modelValue: [], columns: [osColumn], valueOptions: osOptions },
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await fireEvent.click(await screen.findByRole('menuitem', { name: 'OS' }))
    await fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'linux' }))
    expect(emitted()['update:modelValue'].at(-1)[0]).toEqual([searchFilter('os', 'values', { value: ['linux'] })])
  })

  it('opens the builder from a column\'s quick filter with a rule for that column', async () => {
    renderWithProviders(GridFilterButton, { props: { modelValue: [], columns: [osColumn], valueOptions: osOptions } })
    await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await fireEvent.click(await screen.findByRole('menuitem', { name: 'OS' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'More options…' }))
    await screen.findByText('Rows must match every rule')
    expect(screen.getAllByRole('combobox', { name: 'Column' })).toHaveLength(1)
    expect(screen.getByText('Pick values')).toBeTruthy()
  })

  it('closes after Apply', async () => {
    await openPanel()
    await fireEvent.update(screen.getByRole('textbox', { name: 'Value' }), 'web')
    await fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(screen.queryByText('Rows must match every rule')).toBeNull())
  })
})
