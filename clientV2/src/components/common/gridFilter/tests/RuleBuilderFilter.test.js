import { fireEvent, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { searchFilter } from '../../../../shared/lib/gridSearch.js'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import RuleBuilderFilter from '../RuleBuilderFilter.vue'

const name = { field: 'name', header: 'Name', kind: 'text' }
const os = { field: 'os', header: 'OS', kind: 'values' }
const osOptions = { os: [{ value: 'linux', name: 'linux', color: null }] }
const columns = [name, os]

function renderBuilder(props) {
  return renderWithProviders(RuleBuilderFilter, { props: { modelValue: [], columns, valueOptions: osOptions, ...props } })
}

describe('ruleBuilderFilter.vue', () => {
  it('starts with one blank Any column rule when nothing is applied', () => {
    renderBuilder()
    expect(screen.getAllByRole('combobox', { name: 'Column' })).toHaveLength(1)
    expect(screen.getByRole('combobox', { name: 'Column' })).toHaveTextContent('Any column')
  })

  it('lists hidden columns last in the column picker, marked', async () => {
    renderBuilder({ columns: [{ ...name, hidden: true }, os] })
    await fireEvent.click(screen.getByRole('combobox', { name: 'Column' }))
    const options = await screen.findAllByRole('option')
    expect(options.map(o => o.textContent.trim())).toEqual(['Any column', 'OS', 'Name'])
    expect(options.map(o => Boolean(o.querySelector('[aria-label="hidden column"]')))).toEqual([false, false, true])
  })

  it('starts with the applied rules and no blank one', () => {
    renderBuilder({ modelValue: [searchFilter('name', 'text', { value: 'web' }), searchFilter('os', 'values', { value: ['linux'] })] })
    expect(screen.getAllByRole('combobox', { name: 'Column' }).map(c => c.textContent)).toEqual(['Name', 'OS'])
  })

  it('adds a rule for the column it was opened from when that column has none', () => {
    renderBuilder({ seedColumn: os })
    expect(screen.getAllByRole('combobox', { name: 'Column' })).toHaveLength(1)
    expect(screen.getByText('Pick values')).toBeTruthy()
  })

  it('hands its draft back on Back and picks up a kept draft', async () => {
    const { emitted } = renderBuilder()
    await fireEvent.update(screen.getByRole('textbox', { name: 'Value' }), 'web')
    await fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    const [draft] = emitted().back[0]
    expect(draft).toEqual([expect.objectContaining({ key: 'all', value: 'web' })])

    const { container } = renderBuilder({ keptDraft: draft })
    const kept = within(container)
    expect(kept.getByRole('textbox', { name: 'Value' })).toHaveValue('web')
    expect(kept.getByText('Changes not applied')).toBeTruthy()
  })

  it('applies on Apply without the draft ids, and asks to close', async () => {
    const { emitted } = renderBuilder()
    await fireEvent.update(screen.getByRole('textbox', { name: 'Value' }), 'web')
    expect(emitted()['update:modelValue']).toBeUndefined()
    expect(screen.getByText('Changes not applied')).toBeTruthy()
    await fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(emitted()['update:modelValue']).toEqual([[[searchFilter('all', 'text', { value: 'web' })]]])
    expect(emitted().close).toHaveLength(1)
  })

  it('applies on Enter in a text value', async () => {
    const { emitted } = renderBuilder()
    const input = screen.getByRole('textbox', { name: 'Value' })
    await fireEvent.update(input, 'web')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(emitted()['update:modelValue']).toHaveLength(1)
  })

  it('cancel and back leave the rules as they were', async () => {
    const { emitted } = renderBuilder()
    await fireEvent.update(screen.getByRole('textbox', { name: 'Value' }), 'web')
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(emitted().close).toHaveLength(1)
    expect(emitted().back).toHaveLength(1)
    expect(emitted()['update:modelValue']).toBeUndefined()
  })

  it('adds and removes rules', async () => {
    renderBuilder()
    await fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    expect(screen.getAllByRole('combobox', { name: 'Column' })).toHaveLength(2)
    await fireEvent.click(screen.getAllByRole('button', { name: 'Remove rule' })[0])
    await fireEvent.click(screen.getByRole('button', { name: 'Remove rule' }))
    expect(screen.getByText('No rules. Add one to filter the rows.')).toBeTruthy()
  })

  it('toggles whole-word matching on a text rule', async () => {
    renderBuilder()
    const toggle = screen.getByRole('button', { name: 'ab' })
    await fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('clear all empties the applied rules and resets the draft', async () => {
    const { emitted } = renderBuilder({ modelValue: [searchFilter('name', 'text', { value: 'web' })] })
    await fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(emitted()['update:modelValue']).toEqual([[[]]])
    expect(screen.getByRole('combobox', { name: 'Column' })).toHaveTextContent('Any column')
  })

  it('offers has all of and is exactly only for multi-value columns', async () => {
    renderBuilder({ modelValue: [searchFilter('os', 'values', { value: ['linux'] })] })
    await fireEvent.click(screen.getByRole('combobox', { name: 'Operator' }))
    await screen.findByRole('option', { name: 'Is none of' })
    expect(screen.queryByRole('option', { name: 'Has all of' })).toBeNull()
  })
})
