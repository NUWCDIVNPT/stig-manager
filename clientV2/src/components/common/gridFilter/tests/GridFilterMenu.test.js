import { fireEvent, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { searchFilter } from '../../../../shared/lib/gridSearch.js'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import GridFilterMenu from '../GridFilterMenu.vue'

const os = { field: 'os', header: 'OS', kind: 'values' }
const osOptions = { os: [{ value: 'linux', name: 'Linux', color: null }, { value: 'windows', name: 'Windows', color: null }] }

function renderMenu(props) {
  return renderWithProviders(GridFilterMenu, { props: { modelValue: [], ...props } })
}

describe('gridFilterMenu.vue', () => {
  it('lists shown columns in the order given, then the hidden ones, marked', () => {
    const columns = [
      { field: 'ip', header: 'IP', kind: 'text' },
      { field: 'name', header: 'Name', kind: 'text', hidden: true },
      { field: 'fqdn', header: 'FQDN', kind: 'text', hidden: true },
      { field: 'mac', header: 'MAC', kind: 'text' },
    ]
    renderMenu({ columns })
    const items = screen.getAllByRole('menuitem')
    expect(items.map(i => i.querySelector('.grid-filter-menu__label').textContent)).toEqual(['IP', 'MAC', 'Name', 'FQDN'])
    expect(items.map(i => Boolean(i.querySelector('[aria-label="hidden column"]')))).toEqual([false, false, true, true])
  })

  it('opens a hidden column\'s quick filter like any other', async () => {
    const fqdn = { field: 'fqdn', header: 'FQDN', kind: 'text', hidden: true }
    renderMenu({ columns: [fqdn] })
    await fireEvent.click(screen.getByRole('menuitem', { name: /FQDN/ }))
    expect(screen.getByRole('textbox', { name: 'FQDN contains' })).toBeTruthy()
  })

  it('shows a column\'s picks on its row by option name, with the full rule as its title', () => {
    renderMenu({ columns: [os], valueOptions: osOptions, modelValue: [searchFilter('os', 'values', { value: ['linux'], exclude: true })] })
    const row = screen.getByRole('menuitem', { name: /OS/ })
    expect(row).toHaveTextContent('not Linux')
    expect(row).toHaveAttribute('title', 'OS is none of linux')
  })

  it('offers Add rule with no rules, and names the shared list once there are some', async () => {
    const { emitted, rerender } = renderMenu({ columns: [os] })
    await fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    expect(emitted()['open-rule-builder']).toEqual([[null]])

    await rerender({ modelValue: [searchFilter('os', 'values', { value: ['linux'] }), searchFilter('os', 'values', { value: ['a'], match: 'all' })] })
    expect(screen.getByText('2 rules')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Edit rules (2)' })).toBeTruthy()
  })

  it('opens a column\'s quick filter on click and passes its picks through', async () => {
    const { emitted } = renderMenu({ columns: [os], valueOptions: osOptions })
    await fireEvent.click(screen.getByRole('menuitem', { name: 'OS' }))
    expect(screen.getByRole('menuitem', { name: 'OS' })).toHaveAttribute('aria-expanded', 'true')
    await fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Linux' }))
    expect(emitted()['update:modelValue'].at(-1)[0]).toEqual([searchFilter('os', 'values', { value: ['linux'] })])
  })

  it('asks for the rule builder seeded with the column from its quick filter', async () => {
    const { emitted } = renderMenu({ columns: [os], valueOptions: osOptions })
    await fireEvent.click(screen.getByRole('menuitem', { name: 'OS' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'More options…' }))
    expect(emitted()['open-rule-builder']).toEqual([[os]])
  })

  it('clear all closes an open quick filter', async () => {
    renderMenu({ columns: [os], valueOptions: osOptions, modelValue: [searchFilter('os', 'values', { value: ['linux'] })] })
    await fireEvent.click(screen.getByRole('menuitem', { name: /OS/ }))
    await screen.findByRole('menuitemcheckbox', { name: 'Linux' })
    await fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Linux' })).toBeNull()
  })

  it('clear all empties the rules', async () => {
    const { emitted } = renderMenu({ columns: [os], modelValue: [searchFilter('os', 'values', { value: ['linux'] })] })
    await fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(emitted()['update:modelValue']).toEqual([[[]]])
  })
})
