import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import ReviewTextCell from '../ReviewTextCell.vue'

const mount = props => render(ReviewTextCell, { props }).container

describe('reviewTextCell.vue', () => {
  it('shows the text without blank lines and keeps the text as entered in the tooltip', () => {
    const text = '\nFinding details:\n\n  value'
    const cell = mount({ text }).querySelector('.review-text-cell')

    expect(cell.textContent).toBe('Finding details:\n  value')
    expect(cell.getAttribute('title')).toBe(text)
  })

  it('highlights the search term', () => {
    const container = mount({ text: 'Registry value\n\nis set', term: 'value' })

    expect([...container.querySelectorAll('mark')].map(m => m.textContent)).toEqual(['value'])
    expect(container.textContent).toBe('Registry value\nis set')
  })

  it('shows the placeholder when there is no text', () => {
    for (const text of [null, undefined, '', ' \n\t\n']) {
      const container = mount({ text, placeholder: 'Add review...' })

      expect(container.querySelector('.review-text-cell__placeholder').textContent).toBe('Add review...')
      expect(container.querySelector('.review-text-cell')).toBeNull()
    }
  })

  it('shows an empty cell when there is no text and no placeholder', () => {
    const container = mount({ text: null })

    expect(container.querySelector('.review-text-cell').textContent).toBe('')
    expect(container.querySelector('.review-text-cell__placeholder')).toBeNull()
  })

  it('does not show the placeholder beside text', () => {
    const container = mount({ text: 'Compliant', placeholder: '—' })

    expect(container.textContent).toBe('Compliant')
  })
})
