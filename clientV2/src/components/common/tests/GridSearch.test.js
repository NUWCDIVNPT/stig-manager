import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import GridSearch from '../GridSearch.vue'

describe('gridSearch.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createWrapper(props = {}) {
    return renderWithProviders(GridSearch, { props: { modelValue: '', ...props } })
  }

  it('labels the input and uses the placeholder', () => {
    createWrapper({ label: 'Search rows', placeholder: 'Find...' })
    expect(screen.getByRole('textbox', { name: 'Search rows' })).toHaveAttribute('placeholder', 'Find...')
  })

  it('updates the model only after the debounce', async () => {
    const { emitted } = createWrapper()
    await fireEvent.update(screen.getByRole('textbox'), 'web')

    expect(emitted()['update:modelValue']).toBeFalsy()
    vi.advanceTimersByTime(249)
    expect(emitted()['update:modelValue']).toBeFalsy()
    vi.advanceTimersByTime(1)
    expect(emitted()['update:modelValue']).toEqual([['web']])
  })

  it('honours a custom debounce', async () => {
    const { emitted } = createWrapper({ debounce: 50 })
    await fireEvent.update(screen.getByRole('textbox'), 'web')
    vi.advanceTimersByTime(50)
    expect(emitted()['update:modelValue']).toEqual([['web']])
  })

  it('clears at once and shows the clear button only while there is text', async () => {
    const { emitted, rerender } = createWrapper()
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()

    await fireEvent.update(screen.getByRole('textbox'), 'web')
    vi.advanceTimersByTime(250)
    await rerender({ modelValue: 'web' })

    await fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
    expect(emitted()['update:modelValue']).toEqual([['web'], ['']])
    vi.advanceTimersByTime(250)
    expect(emitted()['update:modelValue']).toEqual([['web'], ['']])
  })

  it('reflects an external model change without re-emitting it', async () => {
    const { emitted, rerender } = createWrapper({ modelValue: 'one' })
    expect(screen.getByRole('textbox')).toHaveValue('one')

    await rerender({ modelValue: 'two' })
    expect(screen.getByRole('textbox')).toHaveValue('two')
    vi.advanceTimersByTime(250)
    expect(emitted()['update:modelValue']).toBeFalsy()
  })

  it('offers the hidden-columns toggle only when bound, and flips it', async () => {
    createWrapper()
    expect(screen.queryByRole('button', { name: 'Search hidden columns' })).toBeNull()

    const { emitted } = createWrapper({ searchHidden: true })
    const toggle = screen.getByRole('button', { name: 'Search hidden columns' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await fireEvent.click(toggle)
    expect(emitted()['update:searchHidden']).toEqual([[false]])
  })

  it('counts results from hidden columns beside the toggle while it is on and there is a term', async () => {
    const hiddenMatches = { count: 3, columns: ['Rule Id'] }
    const { rerender } = createWrapper({ modelValue: 'sv', searchHidden: true, hiddenMatches })
    expect(screen.getByRole('status', { name: '3 results from hidden columns' })).toHaveTextContent('3')

    await rerender({ searchHidden: false })
    expect(screen.queryByRole('status')).toBeNull()
  })
})
