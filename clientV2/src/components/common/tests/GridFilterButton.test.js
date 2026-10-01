import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import GridFilterButton from '../GridFilterButton.vue'

const columns = [
  { field: 'name', header: 'Name', kind: 'text' },
  { field: 'os', header: 'OS', kind: 'text' },
]

async function openPanel() {
  renderWithProviders(GridFilterButton, { props: { modelValue: [], columns } })
  await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
  await screen.findByText('Rows must match every rule')
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
      props: { modelValue: [], columns: [{ field: 'os', header: 'OS', kind: 'values' }], valueOptions: { os: [{ value: 'linux', name: 'linux', color: null }] } },
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await fireEvent.mouseDown(await screen.findByText('Rows must match every rule'))
    await fireEvent.click(screen.getByRole('combobox', { name: 'Column' }))
    await fireEvent.mouseDown(await screen.findByRole('option', { name: 'OS' }))
    await fireEvent.click(await screen.findByText('Pick values'))
    await fireEvent.mouseDown(await screen.findByRole('option', { name: 'linux' }))
    expect(screen.getByText('Rows must match every rule')).toBeTruthy()
  })
})
