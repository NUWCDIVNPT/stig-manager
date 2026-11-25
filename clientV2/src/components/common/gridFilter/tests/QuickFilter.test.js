import { fireEvent, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { searchFilter } from '../../../../shared/lib/gridSearch.js'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import QuickFilter from '../QuickFilter.vue'

const os = { field: 'os', header: 'OS', kind: 'values' }
const name = { field: 'name', header: 'Name', kind: 'text' }
const opts = (...values) => values.map(v => ({ value: v, name: v, color: null }))

function renderPanel(props) {
  return renderWithProviders(QuickFilter, { props: { modelValue: [], ...props } })
}

function lastModel(emitted) {
  return emitted()['update:modelValue'].at(-1)[0]
}

describe('quickFilter.vue', () => {
  describe('list columns', () => {
    it('picks a value at once and toggles it off again', async () => {
      const { emitted, rerender } = renderPanel({ column: os, options: opts('linux', 'windows') })
      await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'linux' }))
      expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['linux'] })])

      await rerender({ modelValue: lastModel(emitted) })
      expect(screen.getByRole('menuitemcheckbox', { name: 'linux' })).toHaveAttribute('aria-checked', 'true')
      await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'linux' }))
      expect(lastModel(emitted)).toEqual([])
    })

    it('shift+click sets the values between the last click and this one', async () => {
      const { emitted, rerender } = renderPanel({ column: os, options: opts('aix', 'bsd', 'linux', 'mac', 'windows') })
      await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'bsd' }))
      await rerender({ modelValue: lastModel(emitted) })
      await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'mac' }), { shiftKey: true })
      expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['bsd', 'linux', 'mac'] })])

      await rerender({ modelValue: lastModel(emitted) })
      await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'linux' }))
      await rerender({ modelValue: lastModel(emitted) })
      await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'aix' }), { shiftKey: true })
      expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['mac'] })])
    })

    it('a first shift+click is a plain click', async () => {
      const { emitted } = renderPanel({ column: os, options: opts('aix', 'bsd') })
      await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'bsd' }), { shiftKey: true })
      expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['bsd'] })])
    })

    it('none of makes the next pick an exclude, and flips an existing rule', async () => {
      const { emitted, rerender } = renderPanel({ column: os, options: opts('linux') })
      await fireEvent.click(screen.getByRole('button', { name: 'None of' }))
      expect(emitted()['update:modelValue']).toBeUndefined()
      await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'linux' }))
      expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['linux'], exclude: true })])

      await rerender({ modelValue: lastModel(emitted) })
      await fireEvent.click(screen.getByRole('button', { name: 'Any of' }))
      expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['linux'] })])
    })

    it('clear resets the switch to Any of', async () => {
      renderPanel({ column: os, options: opts('linux'), modelValue: [searchFilter('os', 'values', { value: ['linux'], exclude: true })] })
      await fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
      expect(screen.getByRole('button', { name: 'Any of' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('follows the rule when it changes from outside', async () => {
      const { rerender } = renderPanel({ column: os, options: opts('linux'), modelValue: [searchFilter('os', 'values', { value: ['linux'] })] })
      await rerender({ modelValue: [searchFilter('os', 'values', { value: ['linux'], exclude: true })] })
      expect(screen.getByRole('button', { name: 'None of' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('starts on None of for a column with an exclude rule', () => {
      renderPanel({ column: os, options: opts('linux'), modelValue: [searchFilter('os', 'values', { value: ['linux'], exclude: true })] })
      expect(screen.getByRole('button', { name: 'None of' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('all picks every listed value, honoring the search, and disables once all are picked', async () => {
      const values = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'd1', 'd2']
      const { emitted, rerender } = renderPanel({ column: os, options: opts(...values) })
      await fireEvent.update(screen.getByRole('textbox', { name: 'Find a value' }), 'a')
      expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(2)
      await fireEvent.click(screen.getByRole('button', { name: 'All' }))
      expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['a1', 'a2'] })])

      await rerender({ modelValue: lastModel(emitted) })
      expect(screen.getByRole('button', { name: 'All' })).toBeDisabled()
    })

    it('all keeps picks the search hides', async () => {
      const values = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'd1', 'd2']
      const { emitted } = renderPanel({ column: os, options: opts(...values), modelValue: [searchFilter('os', 'values', { value: ['d1'] })] })
      await fireEvent.update(screen.getByRole('textbox', { name: 'Find a value' }), 'a')
      await fireEvent.click(screen.getByRole('button', { name: 'All' }))
      expect(lastModel(emitted)).toEqual([searchFilter('os', 'values', { value: ['d1', 'a1', 'a2'] })])
    })

    it('shows the search box only past seven values', () => {
      renderPanel({ column: os, options: opts('a', 'b', 'c', 'd', 'e', 'f', 'g') })
      expect(screen.queryByRole('textbox', { name: 'Find a value' })).toBeNull()
    })

    it('clear drops every rule on the column and is disabled without one', async () => {
      const hasAll = searchFilter('os', 'values', { value: ['a'], match: 'all' })
      const other = searchFilter('name', 'text', { value: 'web' })
      const { emitted } = renderPanel({ column: os, options: opts('a'), modelValue: [hasAll, other] })
      await fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
      expect(lastModel(emitted)).toEqual([other])

      renderPanel({ column: os, options: opts('a') })
      expect(screen.getAllByRole('button', { name: 'Clear' }).at(-1)).toBeDisabled()
    })

    it('shows each value\'s row count', () => {
      renderPanel({ column: os, options: [{ value: 'linux', name: 'linux', color: null, count: 42 }] })
      expect(screen.getByRole('menuitemcheckbox', { name: 'linux' })).toHaveTextContent('42')
    })
  })

  describe('text columns', () => {
    it('applies as typed, with no All link', async () => {
      const { emitted } = renderPanel({ column: name })
      expect(screen.queryByRole('button', { name: 'All' })).toBeNull()
      await fireEvent.update(screen.getByRole('textbox', { name: 'Name contains' }), 'web')
      expect(lastModel(emitted)).toEqual([searchFilter('name', 'text', { value: 'web' })])
    })

    it('excludes writes a does-not-contain rule', async () => {
      const { emitted } = renderPanel({ column: name })
      await fireEvent.click(screen.getByRole('button', { name: 'Excludes' }))
      await fireEvent.update(screen.getByRole('textbox', { name: 'Name contains' }), 'web')
      expect(lastModel(emitted)).toEqual([searchFilter('name', 'text', { value: 'web', mode: 'notContains' })])
    })

    it('shows the current text and emits done on Enter', async () => {
      const { emitted } = renderPanel({ column: name, modelValue: [searchFilter('name', 'text', { value: 'web' })] })
      const input = screen.getByRole('textbox', { name: 'Name contains' })
      expect(input).toHaveValue('web')
      await fireEvent.keyDown(input, { key: 'Enter' })
      expect(emitted().done).toHaveLength(1)
    })
  })

  it('more options asks for the rule builder', async () => {
    const { emitted } = renderPanel({ column: os, options: opts('a') })
    await fireEvent.click(screen.getByRole('button', { name: 'More options…' }))
    expect(emitted().more).toHaveLength(1)
  })
})
